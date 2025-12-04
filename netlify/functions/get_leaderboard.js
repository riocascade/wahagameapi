exports.handler = async (event, context) => {
  console.log("TOKEN IN NETLIFY:", process.env.NOTION_TOKEN);

  // Handle preflight CORS
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
        method: "POST",
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
              property: "Score",
              direction: "descending"
            }
          ]
        })
      }
    );

    const result = await response.json();

    if (!result.results) {
      throw new Error("Notion query failed: " + (result.message || "no results field"));
    }

    // ----------------------------------------------------
    // FILTER sebelum mapping
    // ----------------------------------------------------
    const leaderboard = result.results
      .filter(item => {
        const props = item.properties || {};

        const phone = props["Mobile Phone"]?.phone_number || "";
        const firstName = props["First Name"]?.title?.[0]?.plain_text || "";
        const lastName = props["Last Name"]?.rich_text?.[0]?.plain_text || "";
        const score =
          typeof props.Score?.number === "number" ? props.Score.number : null;

        // 1) Exclude jika nomor EXACT match
        if (phone === "088888888888") return false;

        // 2) Exclude jika baris tampak dikosongkan (semua field kosong)
        if (
          phone === "" &&
          firstName === "" &&
          lastName === "" &&
          (score === null || score === 0)
        ) {
          return false;
        }

        return true;
      })

      // ----------------------------------------------------
      // MAP hasil data yang sudah bersih
      // ----------------------------------------------------
      .map(item => {
        const props = item.properties;
        return {
          score: props.Score?.number || 0,
          mobilePhone: props["Mobile Phone"]?.phone_number || "",
          firstName: props["First Name"]?.title?.[0]?.plain_text || "",
          lastName: props["Last Name"]?.rich_text?.[0]?.plain_text || ""
        };
      });

    // ----------------------------------------------------
    // RETURN RESPONSE
    // ----------------------------------------------------
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leaderboard)
    };

  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
