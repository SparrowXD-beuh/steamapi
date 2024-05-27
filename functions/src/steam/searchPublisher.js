const axios = require("axios");
const cheerio = require("cheerio");
const { developers, cookies } = require("../database");
const headers = require("../public/headers.json")

const searchPublisher = async function (name) { 
  try {
    const exists = await developers.findOne({_id: name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(' ', '+')});
    if (exists) return exists;
    const response = await axios.get(
      `https://store.steampowered.com/publisher/${name}/`,
      {
        headers: {
          Cookie: (await cookies()).cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
          headers: headers
        },
      }
    );
    const $ = cheerio.load(response.data);
    const curatorAvtar = $("img.curator_avatar").attr("src");
    const curatorBanner = $("div.background_header_ctn").attr("style").match(/url\(([^)]+)\)/)[1];
    const curatorName = $("h2.curator_name > a").text().trim();
    const list = [];
    const listNames = [];
    for (let index = 0; index < 10; index++) {
      if ($(`div#featured_list_${index}`).length === 0) break
      const appids = [];
      $(`div#featured_list_${index}`).find('div.capsule > a').each(async(index, element) => {
        appids.push($(element).attr('data-ds-appid'))
      });
      listNames.push($(`div#featured_list_${index}`).find('h2').text().trim());
      if (appids.length !== 0) {
        list.push(appids)
      };
    };
    const featured = await Promise.all(list.map(async (listItem, i) => {
      const app = await Promise.all(listItem.map(async (appId) => {
        return appId; //await searchByAppId(appId);
      }));
      return { name: listNames[i], games: app };
    }));
    const doc ={
      _id: curatorName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace(' ', '+'),
      data: {
        name: curatorName,
        avtar: curatorAvtar,
        banner: curatorBanner,
      },
      temp: featured
    }
    if (doc.data.name.length <= 0) throw new Error("Invalid app_id")
    await developers.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 604800 });
    doc.expiresAt = new Date();
    doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + 604800);
    await developers.insertOne(doc);
    return doc;
  } catch (error) {
    console.error(error)
    throw error
  }
};

module.exports = searchPublisher;