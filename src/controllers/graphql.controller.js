import axios from "axios";

export const proxyGraphQL = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Pass through Authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await axios.post('https://graphql.anilist.co', req.body, {
      headers,
      validateStatus: () => true // Don't throw on any status
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
