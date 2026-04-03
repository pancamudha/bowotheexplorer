import extractAnimeInfo from "../extractors/animeInfo.extractor.js";
import extractSeasons from "../extractors/seasons.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";
import { fetchAnilistId } from "../helper/anilist.helper.js";

export const getAnimeInfo = async (req, res) => {
  const { id } = req.query;

  try {
    const [seasons, data] = await Promise.all([
      extractSeasons(id),
      extractAnimeInfo(id)
    ]);
    
    // 1. GUNAKAN DATA BAWAAN SCRAPER (Mencegah Overwrite dengan ID salah)
    let anilist_id = data?.anilistId;
    let mal_id = data?.malId;

    // 2. Jika scraper gagal dapat ID, cari manual menggunakan JAPANESE TITLE
    if (!anilist_id) {
       const searchQuery = data?.japanese_title || data?.title || id;
       const anilistData = await fetchAnilistId(searchQuery);
       anilist_id = anilistData.anilistId;
       mal_id = anilistData.malId;
    }

    const enhancedData = {
      ...data,
      anilist_id: anilist_id ? Number(anilist_id) : null,
      mal_id: mal_id ? Number(mal_id) : null
    };

    const responseData = { data: enhancedData, seasons: seasons };
    
    return responseData;
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An error occurred" });
  }
};