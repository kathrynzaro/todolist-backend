const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');
// const Task = require('../lib/models/Task');

const mockUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: '123456',
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  // Create an "agent" that gives us the ability
  // to store cookies between requests in a test
  const agent = request.agent(app);

  // Create a user to sign in with
  const user = await UserService.create({ ...mockUser, ...userProps });

  // ...then sign in
  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
};

describe('tasks', () => {
  beforeEach(() => {
    return setup(pool);
  });
  afterAll(() => {
    pool.end();
  });

  it('#POST /api/v1/tasks creates a new task', async () => {
    const [agent, user] = await registerAndLogin();
    const task = { description: 'vacuum' };
    const res = await agent.post('/api/v1/tasks').send(task);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: expect.any(String),
      description: task.description,
      user_id: user.id,
      complete: false,
    });
  });

  it('#POST /api/v1/tasks should return a 401 if not authenticated', async () => {
    const agent = request.agent(app);
    const task = { description: 'vacuum' };
    const res = await agent.post('/api/v1/tasks').send(task);
    expect(res.status).toBe(401);
  });

  it('#GET/api/v1/tasks lists all tasks for authenticated user', async () => {
    const [agent, user] = await registerAndLogin();
    const task = { description: 'sweep' };
    const res = await agent.post('/api/v1/tasks').send(task);
    expect(res.status).toBe(200);

    const resp = await agent.get('/api/v1/tasks');
    expect(resp.body.length).toBe(1);
    expect(resp.body[0]).toEqual({
      id: expect.any(String),
      description: 'sweep',
      user_id: user.id,
      complete: false,
    });
  });

  it('#GET /api/v1/tasks should return a 401 if not authenticated', async () => {
    const agent = request.agent(app);
    const res = await agent.get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('#PUT /api/v1/tasks/:id allows an auth user to complete a task', async () => {
    const [agent, user] = await registerAndLogin();
    const task = { description: 'sweep' };
    const res = await agent.post('/api/v1/tasks').send(task);
    expect(res.status).toBe(200);

    const resp = await agent.put('/api/v1/tasks/1').send({ complete: true });
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      id: expect.any(String),
      description: 'sweep',
      user_id: user.id,
      complete: true,
    });
  });

  it('#PUT /api/v1/tasks/:id returns a 403 if unauthorized user', async () => {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'mock@example.com',
      password: '123456',
    };

    const agent = request.agent(app);
    await agent.post('/api/v1/users').send(mockUser);

    const task = { description: 'sweep' };
    const res = await agent.post('/api/v1/tasks').send(task);
    expect(res.status).toBe(200);

    const newAgent = request.agent(app);
    await newAgent.post('/api/v1/users').send(testUser);

    const resp = await newAgent.put('/api/v1/tasks/1').send({ complete: true });
    expect(resp.status).toBe(403);
  });

  it('#PUT /api/v1/tasks/:id returns a 401 if user is not logged in', async () => {
    const resp = await request(app)
      .put('/api/v1/tasks/1')
      .send({ complete: true });
    expect(resp.status).toBe(401);
  });

  it('#DELETE /api/v1/tasks/:id user can delete a task', async () => {
    const task = { description: 'laundry' };
    const agent = request.agent(app);
    await agent.post('/api/v1/users').send(mockUser);

    const response = await agent.post('/api/v1/tasks').send(task);
    expect(response.status).toBe(200);

    const res = await agent.delete('/api/v1/tasks/1');
    expect(res.status).toBe(200);

    const resp = await agent.get('/api/v1/tasks/1');
    expect(resp.status).toBe(404);
  });

  it('#DELETE /api/v1/tasks/:id returns a 403 if unauthorized user', async () => {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'mock@example.com',
      password: '123456',
    };

    const agent = request.agent(app);
    await agent.post('/api/v1/users').send(mockUser);

    const task = { description: 'sweep' };
    const res = await agent.post('/api/v1/tasks').send(task);
    expect(res.status).toBe(200);

    const newAgent = request.agent(app);
    await newAgent.post('/api/v1/users').send(testUser);

    const resp = await newAgent.delete('/api/v1/tasks/1');
    expect(resp.status).toBe(403);
  });
});
