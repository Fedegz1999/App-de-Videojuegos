const { Router } = require('express');
const videogames = require('./videogames')
const genres = require('./genres')
const axios = require("axios");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');


const router = Router();

router.use('/videogames', videogames)
router.use('/genres', genres)

module.exports = router;