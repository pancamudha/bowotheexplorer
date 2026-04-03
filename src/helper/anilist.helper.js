export const fetchAnilistId = async (queryInput) => {
  try {
    if (!queryInput) return { anilistId: null, malId: null };

    // Cek apakah input berupa slug (mengandung strip dan diakhiri angka)
    let searchQuery = queryInput;
    if (typeof queryInput === 'string' && queryInput.includes('-') && /\d+$/.test(queryInput)) {
      searchQuery = queryInput.replace(/-\d+$/, '').replace(/-/g, ' ');
    }

    const query = `
      query ($search: String) {
        Media (search: $search, type: ANIME) {
          id
          idMal
        }
      }
    `;

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables: { search: searchQuery } })
    });

    const data = await response.json();
    return {
      anilistId: data?.data?.Media?.id || null,
      malId: data?.data?.Media?.idMal || null
    };
  } catch (error) {
    console.error("Gagal fetch dari AniList:", error.message);
    return { anilistId: null, malId: null };
  }
};