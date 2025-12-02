exports.handler = async (event, context) => {
	
	console.log("hello");
	
  try {
    const { phone, score } = JSON.parse(event.body);

    const payload = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        "Phone": { 
          rich_text: [{ text: { content: phone }}]
        },
        "Score": { 
          number: score 
        },
        "Date": { 
          date: { start: new Date().toISOString() }
        }
      }
    };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
        "Authorization": `Bearer ${process.env.NOTION_TOKEN}`
      },
      body: JSON.stringify(payload),
    });

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
