exports.handler = async (event, context) => {
  const NOTION_TOKEN = (process.env.NOTION_TOKEN || "").trim();

  console.log("TOKEN PREFIX:", NOTION_TOKEN);  // cuma buat cek

  try {
    const response = await fetch(
      "https://api.notion.com/v1/databases/2b2fef65a2c18086a3fffc774b6e7aeb/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
          "Authorization": `Bearer ${NOTION_TOKEN}`,
          "User-Agent": "WahahaGame/1.0"
        },
        // untuk tes, kirim body paling sederhana dulu
        body: JSON.stringify({
          page_size: 1
        })
      }
    );

    const text = await response.text();

    console.log("NOTION STATUS:", response.status);
    console.log("NOTION BODY:", text);

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: text
    };
  } catch (err) {
    console.error("FUNCTION ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};