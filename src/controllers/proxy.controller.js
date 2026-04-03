export const hlsProxy = async (req, res) => {
  const { url: targetUrl, referer } = req.query;

  if (!targetUrl) return res.status(400).send("Missing URL");

  const targetReferer = referer || "https://megacloud.blog/";

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": targetReferer,
        "Origin": new URL(targetReferer).origin,
      },
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    if (targetUrl.includes(".m3u8") || (contentType && contentType.includes("mpegurl"))) {
      let text = await response.text();
      const targetBase = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      text = text.replace(/^(?!https?:\/\/|#)(.+)$/gm, (match) => {
        const absoluteUrl = match.startsWith("/") ? new URL(targetUrl).origin + match : targetBase + match;
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(targetReferer)}`;
      });

      return res.send(text);
    }

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).send("Proxy Error");
  }
};