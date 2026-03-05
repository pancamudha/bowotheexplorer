import axios from "axios";

export const exchangeToken = async (req, res) => {
  console.log('[MAL OAuth] Received token exchange request');
  console.log('[MAL OAuth] Method:', req.method);
  console.log('[MAL OAuth] Request body keys:', Object.keys(req.body));
  console.log('[MAL OAuth] Grant type:', req.body.grant_type);
  
  if (req.method !== 'POST') {
    console.log('[MAL OAuth] ERROR: Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if client secret is available
    if (!process.env.MAL_CLIENT_SECRET) {
      console.error('[MAL OAuth] CRITICAL ERROR: MAL_CLIENT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    console.log('[MAL OAuth] Client secret is present:', !!process.env.MAL_CLIENT_SECRET);
    console.log('[MAL OAuth] Client secret length:', process.env.MAL_CLIENT_SECRET?.length || 0);
    
    // Inject client_secret from backend environment
    const requestBody = {
      ...req.body,
      client_secret: process.env.MAL_CLIENT_SECRET
    };
    
    console.log('[MAL OAuth] Request body prepared with keys:', Object.keys(requestBody));

    // Convert JSON body to URLSearchParams format for MAL API
    const formData = new URLSearchParams();
    Object.keys(requestBody).forEach(key => {
      formData.append(key, requestBody[key]);
    });
    
    console.log('[MAL OAuth] Sending request to MAL API...');
    console.log('[MAL OAuth] Form data keys:', Array.from(formData.keys()));
    console.log('[MAL OAuth] Redirect URI:', requestBody.redirect_uri);
    
    const response = await axios.post('https://myanimelist.net/v1/oauth2/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('[MAL OAuth] Received response from MAL API');
    console.log('[MAL OAuth] Response status:', response.status);
    console.log('[MAL OAuth] Response status text:', response.statusText);

    const data = response.data;
    
    if (!response.status || response.status >= 400) {
      console.error('[MAL OAuth] ERROR: MAL API returned error status:', response.status);
      console.error('[MAL OAuth] ERROR response data:', JSON.stringify(data, null, 2));
      return res.status(response.status || 500).json(data);
    }
    
    console.log('[MAL OAuth] SUCCESS: Token exchange completed');
    console.log('[MAL OAuth] Response data keys:', Object.keys(data));
    console.log('[MAL OAuth] Has access_token:', !!data.access_token);
    console.log('[MAL OAuth] Has refresh_token:', !!data.refresh_token);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('[MAL OAuth] EXCEPTION:', error.message);
    console.error('[MAL OAuth] Stack trace:', error.stack);
    if (error.response) {
      console.error('[MAL OAuth] Error response status:', error.response.status);
      console.error('[MAL OAuth] Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
