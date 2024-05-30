const axios = require("axios");
const cheerio = require("cheerio");
const headers = require("../public/headers.json");
const { titles } = require("../database");

const getInfoByImdbId = async (imdb_id) => {
    try {
        if (!imdb_id) throw new Error("Invalid imdb_id: " + imdb_id);
        const exists = await titles.findOne({_id: imdb_id});
        if (exists) return exists.data;
        const response = await axios.get(`https://www.imdb.com/title/${imdb_id}`, { headers: headers });
        const $ = cheerio.load(response.data);
        const title = $("span.hero__primary-text").text().trim();
        const poster = $("img.ipc-image").attr("src").trim().replace(/UX.*\.jpg/, "UX3000.jpg");
        const genres = $("div.ipc-chip-list__scroller").find("a").map((index, element) => {
            return ($(element).text().trim());
        }).get();
        const producers = $("a:contains('Production companies')").next("div").find("a").map((index, element) => {
            return ($(element).text().trim());
        }).get();
        const scored = {score: $("div[data-testid='hero-rating-bar__aggregate-rating__score']").eq(0).find("span").text(), scored_by: $("div.sc-bde20123-3").first().text()};
        const creator = $("a.ipc-metadata-list-item__list-content-item").eq(0).text().trim();
        const seasons = $("select#browse-episodes-season").find("option").length - 2;
        const episodes = parseInt($("span.ipc-title__subtext").eq(0).text().trim());
        const storyline = $('span.sc-7193fc79-0').text().trim();
        const year = $(`a[href='/title/${imdb_id}/releaseinfo?ref_=tt_ov_rdat']`).text();
        const rating = $(`a[href='/title/${imdb_id}/parentalguide/certificates?ref_=tt_ov_pg']`).text();
        const runtime = $("ul.sc-d8941411-2 li").last().text();
        const doc = {
            _id: imdb_id,
            data: {
                imdb_id,
                title,
                type: seasons <= 0 ? "Movie" : "TV show",
                poster,
                storyline,
                genres,
                creator,
                producers,
                seasons: seasons <= 0 ? null : seasons,
                episodes: seasons <= 0 ? null : episodes,
                rating,
                scored,
                year,
                runtime
            }
        };
        if (doc.data.title.length <= 0) return;
        await titles.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 604800 });
        doc.expiresAt = new Date();
        doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + 604800);
        await titles.insertOne(doc);
        return doc.data;
    } catch (error) {
        console.error("Error:", error);
        if (error.name == "AxiosError") error.message = "Coudnt find any info for imdb_id: " + imdb_id;
        throw error.message
    }
};

module.exports = getInfoByImdbId;