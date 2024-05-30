const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

async function getByCode(id) {
  try {
    const response = await axios.get(`https://nhentai.to/g/${id}/`);
    const $ = cheerio.load(response.data);

    const cover = $("noscript").eq(0).text().match(/src="([^"]+)"/)[1];
    const title = $("h1").text().trim();
    const pages = $("div.thumb-container noscript")
      .map((index, element) => $(element).text().match(/src="([^"]+)"/)[1].replace(/\/([^\/]+)t(\.[^\/]+)$/, '/$1$2'))
      .get();
    const about = $("div.tag-container").map((i, element) => {
      const container = $(element);
      const name = container.contents().first().text().trim();
      if (name === "Pages:") {
        return {
          name: "Pages",
          value: parseInt(container.find("span.tags a span").text(), 10)
        };
      } else if (name === "Uploaded:") {
        return {
          name: "Uploaded",
          value: container.find("span.tags").text().trim()
        };
      } else {
        const tags = container.find("span.tags a").map((index, el) => {
          const tagElement = $(el);
          return {
            name: tagElement.find("span:eq(0)").text().trim(),
            count: tagElement.find("span:eq(1)").text().trim()
          };
        }).get();
        return { name, value: tags };
      }
    }).get();
    const doc = {
      code: parseInt(id, 10),
      title,
      cover,
      pages,
      about
    };
    return doc;
  } catch (error) {
    console.error(error);
    if (error.name === "AxiosError") {
      throw new Error("Invalid code: " + id);
    }
    throw error;
  }
}

module.exports = getByCode;