const axios = require("axios");
const cheerio = require("cheerio");
const headers = require("../public/headers.json");
const searchByImdbId = require("./getInfoByImdbId");

const searchByTitle = async (titleName) => {
    try {
        if (!titleName) throw new Error("Invalid title name: " + titleName);
        const response = await axios.get(`https://www.imdb.com/find/?q=${titleName}&s=tt&exact=true`, {headers: headers});
        const $ = cheerio.load(response.data);
        const imdb_id = await $("a.ipc-metadata-list-summary-item__t").map((index, element) => {
            return ($(element).attr("href").match(/\/title\/(tt\d+)\/\?/)[1]);
        }).get();
        const results = await Promise.all(imdb_id.slice(0, 8).map(async (id, index) => {
            return await searchByImdbId(id);
        }));
        if (results.length <= 0) throw new Error("No results found.")
        return results
    } catch (error) {
        console.error("Error:", error.message);
        throw error.message
    }
}

module.exports = searchByTitle;