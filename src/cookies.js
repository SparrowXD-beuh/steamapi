require('dotenv').config();
const puppeteer = require("puppeteer-core");
const { MongoClient } = require("mongodb");

async function fetchCookies() {
    try {
        const client = new MongoClient(`mongodb+srv://user1:${process.env.PASS_DB}@freecluster.7xu0m7g.mongodb.net/?retryWrites=true&w=majority`);
        const browser = await puppeteer.connect({ browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.TOKEN}` });
        const page = await browser.newPage();
        await page.goto(
        "https://store.steampowered.com/agecheck/app/1938090/",
        { timeout: 180000 }
        );
        await page.select("#ageYear", "1980");
        await page.click("#view_product_page_btn");
        await page.waitForNavigation("https://store.steampowered.com/app/1938090/Call_of_Duty/",{ timeout: 180000 })
        const storedCookies = await page.cookies();
        // console.log({storedCookies});
        await client.db("steam").collection("cookies").deleteMany({});
        await client.db("steam").collection("cookies").insertOne({_id: "cookies", cookies: storedCookies, timestamp: new Date()});
        await browser.close();
        return storedCookies;
    } catch (error) {
        console.error(error);
    };
};

module.exports = fetchCookies;