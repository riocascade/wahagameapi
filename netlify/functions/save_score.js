exports.handler = async (event, context) => {

  console.log("RAW REQUEST BODY:", event.body);

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
    const { phone, score, time } = JSON.parse(event.body);

    // Filter berdasarkan Mobile Phone
    const queryPayload = {
      filter: {
        property: "Mobile Phone",
        phone_number: { equals: phone }
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

    const queryData = await queryRes.json();

    if (!queryData.results || queryData.results.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({ error: "Mobile Phone not found in database" })
      };
    }

    const page = queryData.results[0];
    const pageId = page.id;

    // ----- OLD VALUES -----
    const oldScore = page.properties["Score"].number || 0;
    const oldPlayCount = page.properties["Play Count"].number || 0;
    const oldPlayTime = page.properties["Play Time"].number || 0;

    // ----- NEW ACCUMULATED VALUES -----
    const newScore = oldScore + score;
    const newPlayCount = oldPlayCount + 1;
    const newPlayTime = oldPlayTime + time;

    // Update semua nilai
    const updatePayload = {
      properties: {
        "Score": { number: newScore },
        "Play Time": { number: newPlayTime },
        "Play Count": { number: newPlayCount },
        "Last updated score": { date: { start: new Date().toISOString() } },

        // optional
        "Mobile Phone": { 
          phone_number: phone 
        }
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

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Score accumulated + play time accumulated + play count incremented",
        oldScore,
        addedScore: score,
        newScore,
        oldPlayTime,
        addedPlayTime: time,
        newPlayTime,
        oldPlayCount,
        newPlayCount
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
