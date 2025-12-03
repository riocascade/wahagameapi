exports.handler = async (event, context) => {
  console.log("TOKEN IN NETLIFY:", process.env.NOTION_TOKEN);

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
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
          "User-Agent": "WahahaGame/1.0"
        },
        body: JSON.stringify({
          page_size: 20,
          sorts: [
            {
              "property": "score",
              "direction": "descending"
            }
          ]
        })
      }
    );

    const result = await response.json();

    const leaderboard = result.results.map(item => {
      const props = item.properties;
      return {
		  score: props.Score?.number || 0,
		  mobilePhone: props["Mobile Phone"]?.phone_number || "",
		  firstName: props["First Name"]?.rich_text?.[0]?.plain_text || "",
		  lastName: props["Last Name"]?.rich_text?.[0]?.plain_text || "",
		};
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leaderboard)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
