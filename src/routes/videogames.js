const express = require("express");
const sequelize = require('sequelize')
const Op = sequelize.Op
const router = express.Router();
const axios = require("axios");
const { Videogame, Genre } = require("../db");
const { API_KEY } = process.env;

let suplente = "https://thumbs.dreamstime.com/z/vector-de-perfil-avatar-predeterminado-foto-usuario-medios-sociales-icono-183042379.jpg"

router.get("/", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    let ALL_GAMES = []; //Declaro un ARRAY vacio donde vamos a tener TODOS los juegos

    let DATABASE_GAMES = await Videogame.findAll({ //Busco TODOS los juegos en la BD
      attributes: ['id', 'name', 'image', 'rating', 'platforms'],
      include: [{
        model: Genre,
        attributes: ['id', 'name'],
        through: {
          attributes: []
        }
      }]
     }); 

    let API_GAMES = []; //Declaro un ARRAY vacio donde voy a guardar lo primeros 100 juegos de la API
    let next_page, current_page; //Dos variables auxiliares que me ayudan a pararme sobre y la siguiente página

    for (let i = 0; i < 5; i++) {
      //Itero 5 veces, ya que (5 * 20) === 100)
      if (i === 0) {
        current_page = await axios.get(
          `https://api.rawg.io/api/games?key=${API_KEY}`
        ); //Si es la primera vez que entramos al ciclo, hago el GET a la API
        next_page = current_page.data.next; //Me guardo el .next que contiene la página siguiente
      } else {
        current_page = await axios.get(next_page); //Si no es la primera vez que entramos, iteramos sobre la siguiente pagina y así sucesivamente
        next_page = current_page.data.next;
      }
      current_page = current_page.data.results.map((game) => {
        //Luego de cada iteración mapeamos para obtener sólo los datos que necesitamos
        return {
          id: game.id,
          name: game.name,
          image: game.background_image || suplente,
          rating: game.rating,
          genres: game.genres.map((genre) => {
            //Mapeamos también los géneros ya que no necesitamos toda la información que viene dentro
            return {
              id: genre.id,
              name: genre.name,
            };
          }),
          platforms: game.platforms.map((plat => {
            return {
              name: plat.platform.name
            }
          }))
        };
      });

      API_GAMES = API_GAMES.concat(current_page); //Concatenamos los juegos de las distintas páginas
    }
    ALL_GAMES = DATABASE_GAMES.concat(API_GAMES); //Concatenamos al final, los juegos en la BD y los juegos de la API
    res.json(ALL_GAMES);

  } else {
      let GAMES_FOUND_API, GAMES_FOUND_DB, GAMES_NEEDED //Variables que voy a necesitar para obtener los juegos

      GAMES_FOUND_DB = await Videogame.findAll({
        attributes: ['id', 'name', 'image', 'rating', 'platforms'],
        where: {
          name: {
            [Op.like]:  `%${name}%`
          }
          
        },
        include: [{
          model: Genre,
          attributes: ['id', 'name'],
          through: {
            attributes: []
          }
        }]
      })

      GAMES_FOUND_DB = GAMES_FOUND_DB.map((dbGame) => {
        return {
          id: dbGame.dataValues.id,
          name: dbGame.dataValues.name,
          image: dbGame.dataValues.image,
          rating: dbGame.dataValues.rating,
          platforms: dbGame.dataValues.platforms,
          genres: dbGame.dataValues.genres
        }
      })

      GAMES_FOUND_API = await axios.get(`https://api.rawg.io/api/games?search=${name}&key=${API_KEY}`) //Busco los juegos segun lo que me pasan por query
      GAMES_FOUND_API = GAMES_FOUND_API.data.results.map((apiGame) => {
        return {
          id: apiGame.id,
          name: apiGame.name,
          rating: apiGame.rating,
          image: apiGame.background_image,
          platforms: apiGame.platforms.map((plat) => {
            return{
              name: plat.platform.name
            }
          }),
          genres: apiGame.genres.map((genre) => {
            return {
              id: genre.id,
              name: genre.name,
            }
          }),
        }
      })
      
      GAMES_FOUND_API = GAMES_FOUND_DB.concat(GAMES_FOUND_API)

      GAMES_FOUND_API.splice( //Si tengo juegos, la API me trae 20 y solo necesito 15
        GAMES_FOUND_API.length - 5 - GAMES_FOUND_DB.length ,
         5 + GAMES_FOUND_DB.length) 
      GAMES_NEEDED = GAMES_FOUND_API
      return GAMES_NEEDED.length ? res.json(GAMES_NEEDED) : res.status(404).send([{msg: "error"}])
  }
});

router.get('/details/:idVideogame', async (req, res) => {
    const {idVideogame} = req.params
    let GAME_SEARCH_FOUND, GAME_SEARCH

    if (idVideogame.length > 10) {
      const DB_GAME = await Videogame.findOne({
        where: {
          id: idVideogame
        },
        attributes: ['id', 'name', 'image', 'description', 'released_date', 'rating', 'platforms'],
        include: [{
          model: Genre,
          attributes: ['id', 'name'],
          through: {
            attributes: []
          }
        }]
      })
      return DB_GAME ? res.json(DB_GAME) : res.status(404).send({msg: "Juego no encontrado"})
    }
    
    GAME_SEARCH = await axios.get(`https://api.rawg.io/api/games/${idVideogame}?key=${API_KEY}`)

    const {id, name, description, released, rating, platforms, genres, background_image, background_image_additional} = GAME_SEARCH.data

    GAME_SEARCH_FOUND = {
        id,
        name,
        image: background_image,
        description: description.replace(/<p>/g, "").replace(/<\/p>/g, "").replace(/<br\s*[\/]?>/gi, ""),
        released_date: released,
        rating: rating,
        platforms: platforms.map((plat) => {
            return plat ? {
                id: plat.platform.id,
                name: plat.platform.name,
            } : []
        }),
        genres: genres.map((genre) => {
            return genre ? {
                id: genre.id,
                name: genre.name,
            } : []
        })
    }
    res.json(GAME_SEARCH_FOUND)
})

router.post('/creategame', async (req, res, next) => {
  const { name, image, genres, released_date, rating, platforms, description } = req.body
  try {
      let newVideogame = await Videogame.create({   
          name,
          image,
          released_date,
          rating,
          platforms,
          description
      })
      const relation = await Genre.findAll({   
          where: {
              name: genres
          }
      })
      await newVideogame.addGenres(relation)  
      res.json(newVideogame)
  } catch (e) {
      next(e)
  }
})

router.get('/platforms', async (req, res, next) => {
  let videogames = []
  try {
      const all = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}`)
      all.data.results.map(e => {     
        videogames.push({            
            id: e.id,
            name: e.name,
            image: e.background_image,
            rating: e.rating,
            platforms: e.platforms?.map(el => el.platform.name),
            genres: e.genres?.map(el => el.name)
        })
    })
      const allPlatforms = [];
      videogames.map(e => e.platforms.map(p => { 
          if (!allPlatforms.includes(p)) {
              allPlatforms.push(p)    
          }
      }))

      allPlatforms.length ? res.status(200).json(allPlatforms) : res.status(404).send('Error')    //We send the platforms if there are any           
  } catch (e) {
      next(e)
  }
})
module.exports = router;