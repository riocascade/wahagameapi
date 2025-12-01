exports.handler = async (event, context) => {

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

    const queryPayload = {
      filter: {
        property: "Mobile Phone",
        number: { equals: phone }
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
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: "Mobile Phone not found in database" })
      };
    }

    const page = queryData.results[0];
    const pageId = page.id;

    const oldScore = page.properties["Score"].number;
    const oldPlayCount = page.properties["Play Count"].number || 0;
    const newPlayCount = oldPlayCount + 1;

    // ❗ IF score tidak lebih tinggi:
    // update Play Count saja — time tidak diupdate!
    if (score <= oldScore) {
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

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({
          message: "Score not updated — new score is not higher",
          oldScore: oldScore,
          newScore: score,
          playCount: newPlayCount
        })
      };
    }

    // ✔ Score lebih tinggi
    // Update Score + Play Count + Play Time
    const updatePayload = {
      properties: {
        "Score": { number: score },
        "Play Time": { number: time },
        "Last updated score": { date: { start: new Date().toISOString() } },
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

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        message: "Score updated + time updated + play count incremented",
        oldScore: oldScore,
        updatedScore: score,
        playTime: time,
        playCount: newPlayCount
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
