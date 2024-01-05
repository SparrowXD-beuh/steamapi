/*
f0c60022f72ffce88ec90eab
*/

const headers = require("../public/headers.json")
const { MongoClient } = require("mongodb")
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const database = new MongoClient(`mongodb+srv://admin:${process.env.PASS}@freecluster.7xu0m7g.mongodb.net/?retryWrites=true&w=majority`);
async function connectToDatabase() {
  try {
    await database.connect();
    console.log("Connected to the database");
  } catch (error) {
    console.error("Database Error: ", error.message);
  }
}

async function searchByAppId(id) {
  try {
    const exists = await database.db("steam").collection("apps").findOne({_id: id});
    if (exists) return exists;
    const cookies = await database.db("steam").collection("cookies").findOne({_id: "cookies"});
    if (cookies && cookies.cookies) {
      cookies.cookies.forEach(cookie => {
        cookie.secure = true;
      });
    }
    // console.log(cookies);
    const response = await axios.get(
      `https://store.steampowered.com/app/${id}/`,
      {
        headers: {
          headers,
          Cookie: cookies
        },
      }
    );
    // console.log(response);
    const $ = cheerio.load(response.data);
    const title = $("#appHubAppName").text().trim();
    const image = $("img.game_header_image_full").attr("src");
    const releaseDate = $("div.date").text();
    const developers = [];
    const previews = [];
    const images = [];
    const genres = [];
    const features = [];
    const tags = [];
    const content = [];
    const languages = [];
    $("div#developers_list")
      .find("a")
      .each((index, element) => {
        const href = $(element).attr("href");
        const name = $(element).text().trim();
        developers.push({ name, href });
      });
    const description = $("#game_area_description")
      .text()
      .replace(/\t+/g, "")
      .trim();
    const matureContentDescription = $("#game_area_content_descriptors")
      .text()
      .replace(/\t+/g, "")
      .trim();
    const minimumSysReq = [];
    $("div.game_area_sys_req_leftCol")
      .find("li")
      .each((index, element) => {
        minimumSysReq.push($(element).text().trim());
      });
    const recommendedSysReq = [];
    $("div.game_area_sys_req_rightCol")
      .find("li")
      .each((index, element) => {
        recommendedSysReq.push($(element).text().trim());
      });
    $("div.highlight_movie").each((index, element) => {
      previews.push($(element).attr("data-mp4-hd-source"));
    });
    $("a.highlight_screenshot_link").each((index, element) => {
      images.push($(element).attr("href"));
    });
    $("#genresAndManufacturer b:contains(Genre:)").next("span").find("a").each((index, element) => {
      genres.push($(element).text().trim());
    });
    $(".game_area_details_specs_ctn").each((index, element) => {
      features.push($(element).find(".label").text().trim());
    });
    $('.app_tag').each((index, element) => {
      tags.push($(element).text().trim());
    });
    $('.tableView').find('a.game_area_dlc_row').each((index, element) => {
      content.push({content: $(element).find('.game_area_dlc_name').text().trim(), price: $(element).find('.game_area_dlc_price').text().trim()})
    });
    $('#languageTable table.game_language_options tbody').find('tr').each((index, element) => {
      languages.push($(element).find('td.ellipsis').text().trim());
    });
    const doc = {
      _id: id,
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
        content,
        languages
      }
    }
    if (doc.data.title.length <= 0) return
    await database.db("steam").collection("apps").createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 604800 });
    doc.expiresAt = new Date();
    doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + 604800);
    await database.db("steam").collection("apps").insertOne(doc);;
    return doc;
  } catch (error) {
    console.error(error)
    throw error
  }
}

module.exports = { searchByAppId, connectToDatabase, database }