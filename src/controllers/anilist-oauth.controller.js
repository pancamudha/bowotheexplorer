import axios from "axios";

export const exchangeToken = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Inject client_secret from backend environment
    const requestBody = {
      ...req.body,
      client_secret: process.env.ANILIST_CLIENT_SECRET
    };

    const response = await axios.post('https://anilist.co/api/v2/oauth/token', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('AniList OAuth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
