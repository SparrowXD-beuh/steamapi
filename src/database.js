const { MongoClient } = require("mongodb");

const client = new MongoClient(`mongodb+srv://user1:${process.env.PASS_DB}@freecluster.7xu0m7g.mongodb.net/?retryWrites=true&w=majority`);
const apps = client.db("steam").collection("apps");
const titles = client.db("imdb").collection("titles");
const cast = client.db("imdb").collection("cast");
const seasons = client.db("imdb").collection("episodes");
const developers = client.db("steam").collection("developers");
const cookies = async() => await client.db("steam").collection("cookies").findOne({_id: "cookies"});
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to the database");
    } catch (error) {
        console.error("Database Error: ", error.message);
    }
};

module.exports = {
    apps,
    cast,
    titles,
    cookies,
    seasons,
    developers,
    connectToDatabase
};