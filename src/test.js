const{ getInfo } = require("../src/imdb/getInfoByImdbId");
const fetchCookies = require("./cookies");
const getCastByImdbId = require("./imdb/getCastByImdbId");
const getEpisodesByImdbId = require("./imdb/getEpisodesByImdbId");
const searchByTitle = require("./imdb/searchByTitle");
const getByCode = require("./nhentai/getByCode");
const searchByName = require("./nhentai/searchByName");


// (async () => {
//     console.time()
//     console.log(await searchByName("metamorphosis"));
//     console.timeEnd()
// })();