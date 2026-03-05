import axios from "axios";

export const proxyMALAPI = async (req, res) => {
  const { method, headers, body } = req;
  
  console.log('[MAL Proxy] Received request');
  console.log('[MAL Proxy] Method:', method);
  console.log('[MAL Proxy] Original path:', req.path);
  
  // Extract the path after /api/mal/
  // e.g., /api/mal/users/@me/animelist -> /users/@me/animelist
  const apiPath = req.path.replace('/api/mal', '');
  
  console.log('[MAL Proxy] Extracted API path:', apiPath);
  console.log('[MAL Proxy] Query params:', req.query);
  
  // Construct the full MAL API URL with query parameters
  const queryString = new URLSearchParams(req.query).toString();
  const malApiUrl = `https://api.myanimelist.net/v2${apiPath}${queryString ? `?${queryString}` : ''}`;
  
  console.log('[MAL Proxy] Target MAL API URL:', malApiUrl);
  
  try {
    const authHeader = headers.authorization || headers.Authorization;
    console.log('[MAL Proxy] Auth header present:', !!authHeader);
    if (authHeader) {
      console.log('[MAL Proxy] Auth header prefix:', authHeader.substring(0, 20) + '...');
    }
    
    const fetchOptions = {
      method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JustAnime/1.0',
      },
      validateStatus: () => true // Don't throw on any status
    };

    // Add authorization header if present
    if (authHeader) {
      fetchOptions.headers['Authorization'] = authHeader;
    }
    
    // Handle different HTTP methods and body formats
    if (method === 'PATCH' || method === 'PUT') {
      console.log('[MAL Proxy] Handling PATCH/PUT request with body');
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      if (body && typeof body === 'object') {
        fetchOptions.data = new URLSearchParams(body).toString();
      } else if (body && typeof body === 'string') {
        fetchOptions.data = body;
      }
    } else if (method === 'POST' && body) {
      console.log('[MAL Proxy] Handling POST request with body');
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.data = body;
    }

    console.log('[MAL Proxy] Sending request to MAL API...');
    const response = await axios(malApiUrl, fetchOptions);
    
    console.log('[MAL Proxy] Received response from MAL API');
    console.log('[MAL Proxy] Response status:', response.status);
    console.log('[MAL Proxy] Response status text:', response.statusText);
    
    let data;
    try {
      data = response.data;
    } catch {
      data = {};
    }
    
    if (!response.status || response.status >= 400) {
      console.error('[MAL Proxy] ERROR: MAL API returned error status:', response.status);
      console.error('[MAL Proxy] ERROR response data:', JSON.stringify(data, null, 2));
      return res.status(response.status || 500).json({
        error: `MAL API Error: ${response.statusText || 'Unknown error'}`,
        status: response.status,
        details: data
      });
    }
    
    console.log('[MAL Proxy] SUCCESS: Request completed');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[MAL Proxy] EXCEPTION:', error.message);
    console.error('[MAL Proxy] Stack trace:', error.stack);
    if (error.response) {
      console.error('[MAL Proxy] Error response status:', error.response.status);
      console.error('[MAL Proxy] Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
