exports.handler = async (event, context) => {

  // 💥 Tambahkan ini dulu: respon untuk preflight CORS OPTIONS
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

    // 1) QUERY existing data
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

    // 2) Ambil pageId dan score lama
    const page = queryData.results[0];
    const pageId = page.id;

    const oldScore = page.properties["Score"].number;

    // 3) Cek apakah skor baru > skor lama
    if (score <= oldScore) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({
          message: "Score not updated — new score is not higher",
          oldScore: oldScore,
          newScore: score
        })
      };
    }

    // 4) Update karena skor lebih tinggi
    const updatePayload = {
      properties: {
        "Score": { number: score },
        "Date": { date: { start: new Date().toISOString() } }
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

    const updateData = await updateRes.text();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: updateData
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
