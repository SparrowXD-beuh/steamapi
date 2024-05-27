const axios = require("axios");
const cheerio = require("cheerio");
const headers = require("../public/headers.json");
const { seasons } = require("../database");

const getEpisodesByImdbId = async (imdb_id, season) => {
    try {
        if (!imdb_id) throw new Error("Invalid imdb_id: " + imdb_id);
        if (!season) throw new Error("Invalid season: " + season);
        const exists = await seasons.findOne({_id: `${imdb_id}-${season}`});
        if (exists) return exists.data;
        const response = await axios.get(`https://www.imdb.com/title/${imdb_id}/episodes/?season=${season}`, {headers: headers});
        const $ = cheerio.load(response.data);
        const episodesArray = await Promise.all($("article.episode-item-wrapper").map((index, element) => {
            return ({
                episode: $(element).find("div.ipc-title__text").text().trim(),
                overview: $(element).find("div.ipc-html-content-inner-div").text().trim(),
                image: $(element).find("img").attr("src").replace(/UX.*\.jpg/, "UX3000.jpg"),
                date: $(element).find("span").eq(0).text().trim(),
                rating: $(element).find("span").eq(1).text().trim(),
            })
        }).get());
        const doc = {
            _id: `${imdb_id}-${season}`,
            data: {
                imdb_id,
                season,
                episodes: episodesArray
            }
        }
        if (episodesArray.length <= 0) throw new Error("No episodes found.");
        await seasons.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 604800 });
        doc.expiresAt = new Date();
        doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + 604800);
        await seasons.insertOne(doc);
        return doc.data;
    } catch (error) {
        console.error("Error: ", error);
        if (error.name == "AxiosError") error.message = imdb_id + " does not have any seasons/episodes.";
        throw error.message
    }
};

module.exports = getEpisodesByImdbId;