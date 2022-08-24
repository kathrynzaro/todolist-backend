const Task = require('../models/Task');

module.exports = async (req, res, next) => {
  try {
    const task = await Task.getById(req.params.id);
    if (req.user.id !== task.user_id)
      throw new Error('You are not authorized to complete this action');

    next();
  } catch (err) {
    err.status = 403;
    next(err);
  }
};
