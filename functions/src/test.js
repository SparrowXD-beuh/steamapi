const{ getInfo } = require("../src/imdb/getInfoByImdbId");
const fetchCookies = require("./cookies");
const getCastByImdbId = require("./imdb/getCastByImdbId");
const getEpisodesByImdbId = require("./imdb/getEpisodesByImdbId");
const searchByTitle = require("./imdb/searchByTitle");


(async () => {
    console.time()
    console.log(await fetchCookies("tt1520211", 1));
    console.timeEnd()
})();