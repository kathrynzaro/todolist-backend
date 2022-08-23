const pool = require('../utils/pool');

module.exports = class Task {
  id;
  description;
  user_id;
  complete;

  constructor(row) {
    this.id = row.id;
    this.description = row.description;
    this.user_id = row.user_id;
    this.complete = row.complete;
  }

  static async insert({ description, user_id }) {
    const { rows } = await pool.query(
      `
      INSERT INTO todo_tasks (description, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
      [description, user_id]
    );

    return new Task(rows[0]);
  }
};
