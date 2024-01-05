const axios = require("axios");
const cheerio = require("cheerio");
const { searchByAppId } = require("./searchByAppId");

async function searchByQuery(query) {
  const appIds = [];
  const results = [];
  await axios
    .get(`https://store.steampowered.com/search/?term=${query}`)
    .then(async (res) => {
      const resource = cheerio.load(res.data);
      resource("div#search_result_container")
        .find("a.search_result_row")
        .each((index, element) => {
          appIds.push(parseInt(resource(element).attr("href").match(/\d+/)[0]));
        });
      // console.log(appIds);
      await Promise.all(
        appIds.slice(0,15).map(async (appId) => {
          const res = await searchByAppId(appId);
          if (res !== 0) results.push(res.data);
          // console.log(res)
        })
      );
    });
    results.sort((a, b) => {
      const indexA = appIds.indexOf(a.id);
      const indexB = appIds.indexOf(b.id);
      return indexA - indexB;
    })
  // console.log(results);
  return results;
}

module.exports = searchByQuery;