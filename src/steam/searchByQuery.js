const axios = require("axios");
const cheerio = require("cheerio");
const searchByAppId = require("./searchByAppId");

async function searchByQuery(query, category1, category2, category3, tags, os, lang) {
  const appIds = await axios.get(`https://store.steampowered.com/search/?term=${query}&os=${os}&category1=${category1}&category2=${category2}&category3=${category3}&supportedlang=${lang}&tags=${tags}`)
    .then(async (res) => {
      const resource = cheerio.load(res.data);
      return resource("div#search_result_container")
        .find("a.search_result_row")
        .map((index, element) => {
          return (resource(element).attr("href").match(/\d+/)[0]);
        }).get();
    });
    // console.log(appIds);
    const results = await Promise.all(
      appIds?.slice(0, 15).map(async (appId) => {
        const res = await searchByAppId(appId);
        if (res) return res.data;
      })
    );
    results.sort((a, b) => {
      const indexA = appIds.indexOf(a.id);
      const indexB = appIds.indexOf(b.id);
      return indexA - indexB;
    })
  return results;
}

module.exports = searchByQuery;