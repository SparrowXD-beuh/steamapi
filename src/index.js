const express = require("express");
const searchByQuery = require('./modules/searchByQuery')
const { searchByAppId, connectToDatabase } = require("./modules/searchByAppId");
const searchPublisher = require("./modules/searchPublisher");

const app = express();
connectToDatabase().then(() => {
  app.listen(process.env.PORT || 3000, async () => {
    console.log(`API is online`);
  });
})

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.get("/search", async (req, res) => {
  console.time();
  try {
    const response = await searchByQuery((req.query.q).replace('%20','+'));
    if (response.length <= 0) throw new Error("Empty response");
    res.send({
      status: res.statusCode,
      data: response
    });
  } catch (error) {
    console.error(error);
    res.status(404).send({
      status: res.statusCode,
      error: "Couldnt find any games for this search"
    })
  } finally {
    console.timeEnd();
  }
});

app.get("/app/:id", async (req, res) => {
  console.time();
  try {
    const response = await searchByAppId(req.params.id);
    // console.log(response);
    if (!response) throw new Error();
    res.send({
      status: res.statusCode,
      data: response.data
    });
  } catch (error) {
    console.error(error);
    res.status(404).send({
      status: res.statusCode,
      error: "Couldnt find the game for this appid"
    })
  } finally {
    console.timeEnd();
  }
})

app.get("/developer/:q", async (req, res) => {
  console.time();
  try {
    const response = await searchPublisher((req.params.q).replace(' ','+'));
    if (!response) throw new Error();
    res.send({
      status: res.statusCode,
      data: response.data
    });
  } catch (error) {
    console.error(error);
    res.status(404).send({
      status: res.statusCode,
      error: "Couldnt find the developer for this name"
    })
  } finally {
    console.timeEnd();
  }
});