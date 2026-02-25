// netlify/functions/instagram.js
// This function runs server-side so your access token is NEVER exposed to the browser.

exports.handler = async (event, context) => {
  const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const FIELDS =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const LIMIT = 20;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (!INSTAGRAM_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Instagram token not configured in environment variables.",
      }),
    };
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${LIMIT}&access_token=${INSTAGRAM_TOKEN}`;
    console.log("url", url);
    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.json();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: err.error?.message || "Instagram API error",
        }),
      };
    }

    const data = await response.json();

    // Filter out videos that have no thumbnail (unsupported formats)
    const media = (data.data || []).map((item) => ({
      id: item.id,
      caption: item.caption || "",
      type: item.media_type, // IMAGE | VIDEO | CAROUSEL_ALBUM
      url: item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url,
      permalink: item.permalink,
      timestamp: item.timestamp,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ media }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
