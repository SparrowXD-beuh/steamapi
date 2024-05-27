const axios = require("axios");
const cheerio = require("cheerio");
const headers = require("../public/headers.json");
const { cast } = require("../database");

const getCastByImdbId = async (imdb_id) => {
    try {
        if (!imdb_id) throw new Error("Invalid imdb_id: " + imdb_id);
        const exists = await cast.findOne({_id: imdb_id});
        if (exists) return exists.data;
        const response = await axios.get(`https://www.imdb.com/title/${imdb_id}/fullcredits`, {headers: headers});
        const $ = cheerio.load(response.data);
        const castArray = await Promise.all($("tr.odd, tr.even").map((index, element) => {
            if ($(element).find("td:eq(1) a").text().trim()) {
                return ({
                    name: $(element).find("td:eq(1) a").text().trim(),
                    profile: $(element).find("td:eq(1) a").attr("href"),
                    character: $(element).find("td.character a:eq(0)").text().trim(),
                });
            }
        }).get());
        if (castArray.length <= 0) throw new Error("No cast found.");
        const doc = {
            _id: imdb_id,
            data: {
                imdb_id,
                cast: castArray
            }
        }
        await cast.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 604800 });
        doc.expiresAt = new Date();
        doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + 604800);
        await cast.insertOne(doc);
        return doc.data;
    } catch (error) {
        console.error("Error fetching cast data:", error.message);
        if (error.name == "AxiosError") error.message = "Couldnt find any cast for imdb_id: " + imdb_id;
        throw error.message
    }
};

module.exports = getCastByImdbId