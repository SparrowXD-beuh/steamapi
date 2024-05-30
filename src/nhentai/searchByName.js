const axios = require("axios");
const cheerio = require("cheerio");
const headers = require("../public/headers.json");
const getByCode = require("./getByCode");

async function searchByName(titleName) {
    try {
        if (!titleName) throw new Error("Invalid title name: " + titleName);
        const response = await axios.get(`https://nhentai.to/search?q=${titleName}`);
        const $ = cheerio.load(response.data);
        const codes = await $("div.gallery a").map((index, element) => {
            return ($(element).attr("href").match(/\/g\/(\d+)\//))[1];
        }).get();
        // console.log(codes);
        const results = await Promise.all(codes.map(async (id, i) => {
            return await getByCode(id);
        }));
        if (results.length <= 0) throw new Error("No results found.")
        return results;
    } catch (error) {
        console.error("Error:", error);
        throw error.message
    }
}

module.exports = searchByName;