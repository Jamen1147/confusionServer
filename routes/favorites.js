const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');
const Dishes = require('../models/dishes');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route('/')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ author: req.user._id })
      .populate('author')
      .populate('dishes')
      .then(
        favorite => {
          if (favorite) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          } else {
            err = new Error('User Not Found');
            err.status = 404;
            return next(err);
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ author: req.user._id }).then(favorite => {
      if (favorite) {
        // User exists, update distinct dishes
        favorite.dishes = [
          ...new Set([
            ...favorite.dishes.map(d => d._id.toString()),
            ...req.body.map(b => b._id)
          ])
        ];
        favorite
          .save()
          .then(
            favorite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            },
            e => next(e)
          )
          .catch(e => next(e));
      } else {
        // User not exists, create new doc
        Favorites.create({ author: req.user._id, dishes: req.body })
          .then(
            favorite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            },
            e => next(e)
          )
          .catch(e => next(e));
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ author: req.user._id }).then(favorite => {
      if (favorite) {
        favorite
          .remove()
          .then(
            resp => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(resp);
            },
            e => next(e)
          )
          .catch(e => next(e));
      } else {
        err = new Error('User Not Found');
        err.status = 404;
        return next(err);
      }
    });
  });

favoriteRouter
  .route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // Find user's fav list
    Favorites.findOne({ author: req.user._id }).then(favorite => {
      // Check if user has a fav list
      if (favorite) {
        Dishes.findById(req.params.dishId).then(dish => {
          // Check if dishId is in dishes
          if (dish) {
            // Add dish to the list and return distinct dishes
            favorite.dishes = [
              ...new Set([
                ...favorite.dishes.map(d => d._id.toString()),
                dish._id.toString()
              ])
            ];
            favorite
              .save()
              .then(
                favorite => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorite);
                },
                e => next(e)
              )
              .catch(e => next(e));
          } else {
            err = new Error('Dish Not Found');
            err.status = 404;
            return next(err);
          }
        });
      } else {
        // Create a fav list for the user and add the dish to the list
        Favorites.create({ author: req.user._id, dishes: [req.params.dishId] })
          .then(
            favorite => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            },
            e => next(e)
          )
          .catch(e => next(e));
      }
    });
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // Find user's fav list
    Favorites.findOne({ author: req.user._id }).then(favorite => {
      // Check if user has a fav list
      if (favorite) {
        favorite.dishes = favorite.dishes.map(d => d._id);
        // Check if dishId is in user's fav list
        if (favorite.dishes.some(x => x == req.params.dishId)) {
          // Remove the dish
          favorite.dishes.splice(favorite.dishes.indexOf(req.params.dishId), 1);
          favorite
            .save()
            .then(
              favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
              },
              e => next(e)
            )
            .catch(e => next(e));
        } else {
          err = new Error('Dish Not Found');
          err.status = 404;
          return next(err);
        }
      } else {
        err = new Error('User Not Found');
        err.status = 404;
        return next(err);
      }
    });
  });

module.exports = favoriteRouter;
