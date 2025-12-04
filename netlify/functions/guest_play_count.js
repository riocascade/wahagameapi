exports.handler = async (event, context) => {
  // === SUPER LOGGING ===
  console.log("====== REQUEST RECEIVED ======");
  console.log("METHOD:", event.httpMethod);
  console.log("BODY RAW:", event.body);
  console.log("HEADERS:", JSON.stringify(event.headers, null, 2));

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS REQUEST HANDLED");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: ""
    };
  }

  try {
    const targetPhone = "088888888888";

    // === SAFE PARSE event.body ===
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        const maybeNumber = Number(event.body);
        body = isNaN(maybeNumber)
          ? { raw: event.body }
          : { time: maybeNumber };
      }
    }

    // Ambil time dengan fallback 0
    const time =
      typeof body.time === "number"
        ? body.time
        : typeof body === "number"
        ? body
        : body.time
        ? Number(body.time)
        : 0;

    console.log("PARSED time:", time, "FROM BODY:", body);

    console.log("Querying Notion for phone:", targetPhone);

    const queryPayload = {
      filter: {
        property: "Mobile Phone",
        phone_number: { equals: targetPhone }
      }
    };

    const queryRes = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`
        },
        body: JSON.stringify(queryPayload)
      }
    );

    console.log("QUERY STATUS:", queryRes.status, "OK?:", queryRes.ok);

    const queryRaw = await queryRes.text();
    console.log("QUERY RAW RESPONSE:", queryRaw);

    if (!queryRes.ok) {
      return {
        statusCode: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Notion query failed", detail: queryRaw })
      };
    }

    const queryData = JSON.parse(queryRaw);

    if (!queryData.results || queryData.results.length === 0) {
      console.log("Phone number NOT FOUND in Notion.");
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Phone number not found" })
      };
    }

    const page = queryData.results[0];
    const pageId = page.id;

    // === SAFE PLAY COUNT ===
    const oldPlayCountRaw = page.properties["Play Count"]?.number;
    console.log("OLD PLAY COUNT RAW:", oldPlayCountRaw);

    const safePlayCount =
      oldPlayCountRaw === null || oldPlayCountRaw === undefined
        ? 0
        : oldPlayCountRaw;

    const newPlayCount = safePlayCount + 1;
    console.log("NEW PLAY COUNT:", newPlayCount);

    // === SAFE PLAY TIME (AKUMULATIF) ===
    const oldPlayTimeRaw = page.properties["Play Time"]?.number;
    console.log("OLD PLAY TIME RAW:", oldPlayTimeRaw);

    const safePlayTime =
      oldPlayTimeRaw === null || oldPlayTimeRaw === undefined
        ? 0
        : oldPlayTimeRaw;

    const newPlayTime = safePlayTime + (Number.isFinite(time) ? time : 0);
    console.log("NEW PLAY TIME:", newPlayTime);

    // === UPDATE PAYLOAD ===
    const updatePayload = {
      properties: {
        "Play Count": { number: newPlayCount },
        "Play Time": { number: newPlayTime },
        "Last updated score": { date: { start: new Date().toISOString() } }
      }
    };

    const updateRes = await fetch(
      `https://api.notion.com/v1/pages/${pageId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`
        },
        body: JSON.stringify(updatePayload)
      }
    );

    console.log("UPDATE STATUS:", updateRes.status, "OK?:", updateRes.ok);

    const updateRaw = await updateRes.text();
    console.log("UPDATE RAW RESPONSE:", updateRaw);

    if (!updateRes.ok) {
      return {
        statusCode: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Notion update failed", detail: updateRaw })
      };
    }

    console.log("====== DONE SUCCESSFULLY ======");

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: `Play Count + Play Time accumulated + Last updated score updated for ${targetPhone}`,
        oldPlayCount: safePlayCount,
        newPlayCount,
        oldPlayTime: safePlayTime,
        newPlayTime
      })
    };

  } catch (err) {
    console.error("FULL ERROR OBJECT:", err);
    console.error("STACK:", err.stack);

    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || String(err) })
    };
  }
};
