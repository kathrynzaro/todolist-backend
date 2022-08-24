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

  static async getAll(user_id) {
    const { rows } = await pool.query(
      `SELECT * FROM todo_tasks
      WHERE user_id = $1`,
      [user_id]
    );

    return rows.map((row) => new Task(row));
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * from todo_tasks
      WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return new Task(rows[0]);
  }

  static async updateById(id, newAttributes) {
    const task = await Task.getById(id);
    if (!task) return null;
    const updatedData = { ...task, ...newAttributes };
    const { rows } = await pool.query(
      `UPDATE todo_tasks
      SET description = $2, complete = $3
      WHERE id = $1
      RETURNING *`,
      [id, updatedData.description, updatedData.complete]
    );
    return new Task(rows[0]);
  }
};
