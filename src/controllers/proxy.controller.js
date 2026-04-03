export const hlsProxy = async (req, res) => {
  // 1. Handle Preflight CORS agar browser tidak ngambek
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(200).end();
  }

  const { url: targetUrl, referer } = req.query;
  if (!targetUrl) return res.status(400).send("Missing URL");

  const targetReferer = referer || "https://megacloud.blog/";

  try {
    const clientUserAgent = req.headers['user-agent'] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
    const clientLanguage = req.headers['accept-language'] || "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7";

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": clientUserAgent,
        "Referer": targetReferer,
        "Origin": new URL(targetReferer).origin,
        "Accept": "*/*",
        "Accept-Language": clientLanguage,
        "Connection": "keep-alive",
        "X-Requested-With": "XMLHttpRequest" 
      },
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    if (!response.ok) {
       return res.status(response.status).send(await response.text());
    }

    if (targetUrl.includes(".m3u8") || (contentType && contentType.includes("mpegurl"))) {
      let text = await response.text();
      
      const targetUrlObj = new URL(targetUrl);
      const targetBase = targetUrlObj.origin + targetUrlObj.pathname.substring(0, targetUrlObj.pathname.lastIndexOf("/") + 1);

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const proxyBaseUrl = `${protocol}://${host}/api/proxy`; 

      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#EXT-X-KEY:') && trimmed.includes('URI=')) {
            return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                const absoluteUrl = uri.startsWith("http") ? uri : (uri.startsWith("/") ? targetUrlObj.origin + uri : targetBase + uri);
                const proxiedUrl = `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(targetReferer)}`;
                return `URI="${proxiedUrl}"`;
            });
        }

        if (trimmed.startsWith('#')) {
            return line;
        }

        const absoluteUrl = trimmed.startsWith("http") ? trimmed : (trimmed.startsWith("/") ? targetUrlObj.origin + trimmed : targetBase + trimmed);
        return `${proxyBaseUrl}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(targetReferer)}`;
      });

      return res.send(rewrittenLines.join('\n'));
    }

    const arrayBuffer = await response.arrayBuffer();
    return res.end(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).send("Proxy Error");
  }
};