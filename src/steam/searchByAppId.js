const headers = require("../public/headers.json")
const axios = require('axios');
const cheerio = require('cheerio');
const { apps, cookies } = require("../database");
require('dotenv').config();

async function searchByAppId(id) {
  try {
    const exists = await apps.findOne({_id: parseInt(id)});
    if (exists) return exists;
    const response = await axios.get(
      `https://store.steampowered.com/app/${id}/`,
      {
        headers: {
          Cookie: (await cookies()).cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
          headers: headers
        },
      }
    );
    // console.log(response);
    const $ = cheerio.load(response.data);
    const title = $("#appHubAppName").text().trim();
    const image = $("img.game_header_image_full").attr("src");
    const releaseDate = $("div.date").text();
    const developers = $("div#developers_list")
      .find("a")
      .map((index, element) => {
        const href = $(element).attr("href");
        const name = $(element).text().trim();
        return ({ name, href });
      }).get();
    const description = $("#game_area_description")
      .text()
      .replace(/\t+/g, "")
      .trim();
    const matureContentDescription = $("#game_area_content_descriptors")
      .text()
      .replace(/\t+/g, "")
      .trim();
    const minimumSysReq = $("div.game_area_sys_req_leftCol")
      .find("li")
      .map((index, element) => {
        return ($(element).text().trim());
      }).get();
    const recommendedSysReq = $("div.game_area_sys_req_rightCol")
      .find("li")
      .map((index, element) => {
        return ($(element).text().trim());
      }).get();
    const previews = $("div.highlight_movie").map((index, element) => {
      return ($(element).attr("data-mp4-hd-source"));
    }).get();
    const images = $("a.highlight_screenshot_link").map((index, element) => {
      return ($(element).attr("href"));
    }).get();
    const genres = $("#genresAndManufacturer b:contains(Genre:)").next("span").find("a").map((index, element) => {
      return ($(element).text().trim());
    }).get();
    const features = $(".game_area_details_specs_ctn").map((index, element) => {
      return ($(element).find(".label").text().trim());
    }).get();
    const tags = $('.app_tag').map((index, element) => {
      return ($(element).text().trim());
    }).get();
    const content = $('.tableView').find('a.game_area_dlc_row').map((index, element) => {
      const content = $(element).find('.game_area_dlc_name').text().trim();
      const price = $(element).find('.game_area_dlc_price').text().trim();
      return ({ content, price });
    }).get();
    const languages = $('#languageTable table.game_language_options tbody').find('tr').map((index, element) => {
      return ($(element).find('td.ellipsis').text().trim());
    }).get();
    const price = $('div.game_area_purchase_game_wrapper').map((index, element) => {
      const contentName = $(element).find('h1').text();
      const contentPrice = $(element).find('div.game_purchase_price').text().trim();
      if (contentPrice) return ({name: contentName, price: contentPrice});
    }).get();
    const doc = {
      _id: parseInt(id),
      data: {
        appid: parseInt(id),
        title,
        image,
        images,
        previews,
        developers,
        description,
        releaseDate,
        matureContentDescription,
        system_requirements: {
          minimum: minimumSysReq,
          recommended: recommendedSysReq,
        },
        features,
        genres,
        tags,
        price,
        content,
        languages
      }
    }
    if (doc.data.title.length <= 0) return;
    await apps.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 604800 });
    doc.expiresAt = new Date();
    doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + 604800);
    await apps.insertOne(doc);
    return doc;
  } catch (error) {
    console.error(error)
    if (error.name == "AxiosError") error.message = "Invalid app_id: " + id;
    throw error.message
  }
}

module.exports = searchByAppId