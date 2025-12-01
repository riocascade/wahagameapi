exports.handler = async (event, context) => {

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS"
      },
      body: ""
    };
  }

  try {
    const { phone, score } = JSON.parse(event.body);

    // 1) QUERY existing data berdasarkan nomor HP
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

    // score lama
    const oldScore = page.properties["Score"].number;

    // Play count lama
    const oldPlayCount = page.properties["Play Count"].number || 0;
    const newPlayCount = oldPlayCount + 1;

    // 3) jika skor baru tidak lebih tinggi → cuma update Play Count saja
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

    // 4) jika score baru lebih tinggi → update score + update play count
    const updatePayload = {
      properties: {
        "Score": { number: score },
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({
        message: "Score updated & play count incremented",
        oldScore: oldScore,
        updatedScore: score,
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
