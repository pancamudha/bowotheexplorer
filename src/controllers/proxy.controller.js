// src/controllers/proxy.controller.js

const { Readable } = require('stream');

/**
 * Streaming Proxy Controller
 * Bypasses 403 Forbidden by spoofing browser headers and rewrites m3u8 playlists.
 */
const getProxyStream = async (req, res) => {
    const targetUrl = req.query.url;
    const refererUrl = req.query.referer || 'https://megacloud.blog/';

    // 1. Validate Target Parameter
    if (!targetUrl) {
        return res.status(400).json({ 
            success: false,
            error: 'Target "url" parameter is required.' 
        });
    }

    try {
        const parsedTargetUrl = new URL(targetUrl);

        // 2. Comprehensive Header Spoofing
        const customHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': refererUrl,
            'Origin': new URL(refererUrl).origin,
            'Connection': 'keep-alive',
            // 'Sec-Fetch-Dest': 'empty',
            // 'Sec-Fetch-Mode': 'cors',
            // 'Sec-Fetch-Site': 'cross-site'
        };

        // 3. Fetch Data from Target Server
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: customHeaders,
        });

        // 4. Handle Target Server Rejections
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: `Access denied by target server (${response.status})`,
                details: response.statusText
            });
        }

        // 5. Forward Necessary Headers to Client
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*'); // Ensure CORS is open for your frontend player

        // 6. Special Handling for M3U8 Playlists (Relative to Absolute URL Rewrite)
        if (contentType.includes('mpegurl') || contentType.includes('mpegURL') || targetUrl.includes('.m3u8')) {
            let text = await response.text();
            
            // Extract base URL to append to relative segment paths
            const targetBaseUrl = parsedTargetUrl.href.substring(0, parsedTargetUrl.href.lastIndexOf('/') + 1);

            // Rewrite the playlist content
            text = text.split('\n').map(line => {
                const trimmedLine = line.trim();
                // If it's a valid path (not empty, not a comment, not already an absolute URL)
                if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('http')) {
                    return targetBaseUrl + trimmedLine;
                }
                return line;
            }).join('\n');

            return res.status(200).send(text);
        }

        // 7. Handle Video Segments (.ts) or Regular Files via Data Piping
        // This is crucial for performance to avoid loading large video chunks into RAM
        if (response.body) {
            // Convert Web Streams API (from fetch) to Node.js Readable Stream
            const nodeStream = Readable.fromWeb(response.body);
            
            // Pipe the data directly to the Express response
            nodeStream.pipe(res);
            
            // Handle premature client disconnections
            req.on('close', () => {
                nodeStream.destroy();
            });
        } else {
            // Fallback if response.body is not available as a stream
            const arrayBuffer = await response.arrayBuffer();
            return res.status(200).send(Buffer.from(arrayBuffer));
        }

    } catch (error) {
        console.error('[ProxyController] Proxy execution failed:', error.message);
        return res.status(500).json({ 
            success: false,
            error: 'Internal Server Error during proxy execution.', 
            details: error.message 
        });
    }
};

module.exports = {
    getProxyStream
};