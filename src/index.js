const cron = require("node-cron");
const express = require("express");
const fetchCookies = require("./cookies");
const { connectToDatabase } = require("./database");

const searchByTitle = require("./imdb/searchByTitle");
const getCastByImdbId = require("./imdb/getCastByImdbId");
const getInfoByImdbId = require("./imdb/getInfoByImdbId");
const getEpisodesByImdbId = require("./imdb/getEpisodesByImdbId");

const searchByAppId = require("./steam/searchByAppId");
const searchByQuery = require("./steam/searchByQuery");
const searchPublisher = require("./steam/searchPublisher");


const app = express();
connectToDatabase().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`API is online`);
  });
})

const imdbRoutes = express.Router();
const steamRoutes = express.Router();
app.use("/imdb", imdbRoutes);
app.use("/steam", steamRoutes);

app.get(`/api/cookies`, async (req, res) => {
  if (req.query.key != process.env.KEY) return res.send({
    statusCode: 404,
    error: "invalid request. cannot get /api/cookies",
    docs: "/docs"
  });
  const response = await fetchCookies();
  res.send({cookies: response});
});

steamRoutes.get("/app/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await searchByAppId(id);
    res.send({
      statusCode: res.statusCode,
      data: response.data
    });
  } catch (error) {
    res.status(404).send({
      statusCode: 404,
      error: error
    })
  }
})

steamRoutes.get("/search", async (req, res) => {
  try {
    const { q, query } = req.query;
    const response = await searchByQuery(q || query);
    if (response.length <= 0) throw new Error("No results for: " + (q || query))
    res.send({
      statusCode: res.statusCode,
      data: response
    });
  } catch (error) {
    res.status(404).send({
      statusCode: 404,
      error: error.message
    })
  }
})

steamRoutes.get("/developer/:q", async (req, res) => {
  try {
    const response = await searchPublisher((req.params.q).replace(' ','+'));
    if (!response) throw new Error();
    const featuredGames = await Promise.all(response.temp.map(async (listItem, i) => {
      const app = await Promise.all(listItem.games.map(async (appId) => {
        return (await searchByAppId(appId)).data;
      }));
      // console.log(app)
      return { name: response.temp[i].name, games: app };
    }));
    response.data.list = featuredGames;
    res.send({
      statusCode: res.statusCode,
      data: response.data
    });
  } catch (error) {
    console.error(error);
    res.status(404).send({
      statusCode: res.statusCode,
      error: "Couldnt find the developer for this name"
    })
  }
})

imdbRoutes.get("/:imdb_id/episodes", async (req, res) => {
  try {
    const response = await getEpisodesByImdbId(req.params.imdb_id, req.query.season || req.query.s);
    res.send({
      statusCode: res.statusCode,
      body: response
    })
  } catch (error) {
    res.status(404).send({
      statusCode: 404,
      error: error
    })
  }
})

imdbRoutes.get("/search", async (req, res) => {
  try {
    const response = await searchByTitle(req.query.query || req.query.q);
    res.send({
      statusCode: res.statusCode,
      body: response
    })
  } catch (error) {
    res.status(404).send({
      statusCode: 404,
      error: error
    })
  }
})

imdbRoutes.get("/:imdb_id/cast", async (req, res) => {
  try {
    const response = await getCastByImdbId(req.params.imdb_id, req.query.query || req.query.q);
    res.send({
      statusCode: res.statusCode,
      body: response
    })
  } catch (error) {
    res.status(404).send({
      statusCode: 404,
      error: error
    })
  }
})

imdbRoutes.get("/:imdb_id", async (req, res) => {
  try {
    const response = await getInfoByImdbId(req.params.imdb_id);
    res.send({
      statusCode: res.statusCode,
      body: response
    })
  } catch (error) {
    res.status(404).send({
      statusCode: 404,
      error: error
    })
  }
})

cron.schedule('0 */6 * * *', async() => {
  await fetchCookies();
});