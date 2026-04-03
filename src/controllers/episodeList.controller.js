import extractEpisodesList from "../extractors/episodeList.extractor.js";
import extractAnimeInfo from "../extractors/animeInfo.extractor.js"; // Ditambahkan untuk akses ID & Romaji Title
import { getCachedData, setCachedData } from "../helper/cache.helper.js";
import { fetchAnilistId } from "../helper/anilist.helper.js";

export const getEpisodes = async (req,res) => {
  const { id } = req.params;

  try {
    // Jalankan extractor AnimeInfo secara paralel untuk mendapatkan ID akurat
    const [episodesData, animeInfo] = await Promise.all([
      extractEpisodesList(encodeURIComponent(id)),
      extractAnimeInfo(id)
    ]);

    let anilist_id = animeInfo?.anilistId;
    let mal_id = animeInfo?.malId;

    // Fallback menggunakan japanese_title jika ID tidak ada di source
    if (!anilist_id) {
       const searchQuery = animeInfo?.japanese_title || animeInfo?.title || id;
       const anilistData = await fetchAnilistId(searchQuery);
       anilist_id = anilistData.anilistId;
       mal_id = anilistData.malId;
    }

    let data = episodesData;
    if (data && data.results) {
       data.results.anilist_id = anilist_id ? Number(anilist_id) : null;
       data.results.mal_id = mal_id ? Number(mal_id) : null;
    } else if (data) {
       data.anilist_id = anilist_id ? Number(anilist_id) : null;
       data.mal_id = mal_id ? Number(mal_id) : null;
    }
    
    return data;
  } catch (e) {
    console.error("Error fetching episodes:", e);
    return e;
  }
};