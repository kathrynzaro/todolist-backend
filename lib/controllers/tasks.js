const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
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
  })
  .put('/:id', [authenticate, authorize], async (req, res, next) => {
    try {
      const data = await Task.updateById(req.params.id, req.body);
      res.json(data);
    } catch (e) {
      next(e);
    }
  })
  .delete('/:id', [authenticate, authorize], async (req, res, next) => {
    try {
      const data = await Task.deleteById(req.params.id, req.body);
      res.json(data);
    } catch (e) {
      next(e);
    }
  });
