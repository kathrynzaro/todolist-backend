const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const Task = require('../models/Task');

module.exports = Router()
  .post('/', authenticate, async (req, res, next) => {
    try {
      const tasks = await Task.insert({
        user_id: req.user.id,
        ...req.body,
      });
      res.json(tasks);
    } catch (e) {
      next(e);
    }
  })
  .get('/', authenticate, async (req, res, next) => {
    try {
      const tasks = await Task.getAll(req.user.id);
      res.json(tasks);
    } catch (e) {
      next(e);
    }
  });
