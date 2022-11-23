const express = require("express");
const router = express.Router();
const axios = require("axios");
const {Genre } = require("../db");
const { API_KEY } = process.env;



router.get("/", async (req, res) => {
  const genreApi = await axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`);
  const genre = genreApi.data.results.map((e) => e.name);

  genre.forEach((e) => {
    Genre.findOrCreate({
      where: { name: e },
    });
  });

  const allGenres = await Genre.findAll();
  res.send(allGenres);
});

module.exports = router;
