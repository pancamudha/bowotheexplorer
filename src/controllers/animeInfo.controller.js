import extractAnimeInfo from "../extractors/animeInfo.extractor.js";
import extractSeasons from "../extractors/seasons.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";
import { fetchAnilistId } from "../helper/anilist.helper.js";

export const getAnimeInfo = async (req, res) => {
  const { id } = req.query;
  // const cacheKey = `animeInfo_${id}`;

  try {
    // const cachedResponse = await getCachedData(cacheKey);
    // if (cachedResponse && Object.keys(cachedResponse).length > 0) {
    //   return cachedResponse;
    // }
    
    const [seasons, data, anilistData] = await Promise.all([
      extractSeasons(id),
      extractAnimeInfo(id),
      fetchAnilistId(id)
    ]);
    
    const enhancedData = {
      ...data,
      anilist_id: anilistData.anilistId,
      mal_id: anilistData.malId
    };

    const responseData = { data: enhancedData, seasons: seasons };
    
    // setCachedData(cacheKey, responseData).catch((err) => {
    //   console.error("Failed to set cache:", err);
    // });
    
    return responseData;
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An error occurred" });
  }
};