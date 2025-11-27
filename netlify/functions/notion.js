exports.handler = async (event, context) => {
  try {
    const response = await fetch(
      "https://api.notion.com/v1/databases/2b2fef65a2c18086a3fffc774b6e7aeb/query",
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
          "User-Agent": "WahahaGame/1.0"   
        },
        body: event.body || "{}"
      }
    );

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: data
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
