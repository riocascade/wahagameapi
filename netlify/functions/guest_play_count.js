exports.handler = async (event, context) => {

  // === FIX 1: CORS untuk AJAX Construct 3 ===
  if (event.httpMethod === "OPTIONS") {
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

    // 1. Query row Notion berdasarkan Mobile Phone
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

    const queryText = await queryRes.text();
    console.log("QUERY RAW:", queryText);   // Debug tambahan bila gagal
    const queryData = JSON.parse(queryText);

    if (!queryData.results || queryData.results.length === 0) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Phone number not found" })
      };
    }

    const page = queryData.results[0];
    const pageId = page.id;

    // === FIX 2: Tangani Play Count kosong/null ===
    const oldPlayCountRaw = page.properties["Play Count"].number;
    const safePlayCount =
      oldPlayCountRaw === null || oldPlayCountRaw === undefined
        ? 0
        : oldPlayCountRaw;

    const newPlayCount = safePlayCount + 1;

    // 3. Update Play Count pada row tersebut
    const updatePayload = {
      properties: {
        "Play Count": { number: newPlayCount }
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

    const updateText = await updateRes.text();
    console.log("UPDATE RAW:", updateText); // Debug bila gagal

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: `Play Count updated for ${targetPhone}`,
        oldPlayCount: safePlayCount,
        newPlayCount
      })
    };

  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
