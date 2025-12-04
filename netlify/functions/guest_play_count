exports.handler = async (event, context) => {
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

    const queryData = await queryRes.json();

    if (!queryData.results || queryData.results.length === 0) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Phone number not found" })
      };
    }

    const page = queryData.results[0];
    const pageId = page.id;

    // 2. Ambil Play Count lama
    const oldPlayCount = page.properties["Play Count"].number || 0;
    const newPlayCount = oldPlayCount + 1;

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

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: `Play Count updated for ${targetPhone}`,
        oldPlayCount,
        newPlayCount
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
