const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

const mockUser = {
  firstName: 'Jack',
  lastName: 'Skellington',
  email: 'pumpkinking@halloween.com',
  password: 'ilovezero',
};

const registerAndLogin = async (userProps = {}) => {
  // eslint-disable-next-line no-unused-vars
  const password = userProps.password ?? mockUser.password;

  // Create an "agent" that gives us the ability
  // to store cookies between requests in a test
  const agent = request.agent(app);

  // Create a user to sign in with
  // const user = await UserService.create({ ...mockUser, ...userProps });

  // ...then sign in
  // const { email } = user;
  const resp = await agent
    .post('/api/v1/users')
    .send({ ...mockUser, ...userProps });
  const user = resp.body;
  return [agent, user];
};

describe('user routes', () => {
  beforeEach(() => {
    return setup(pool);
  });
  afterAll(() => {
    pool.end();
  });

  it('#POST /api/v1/users/ creates a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(mockUser);
    const { firstName, lastName, email } = mockUser;

    expect(res.body).toEqual({
      id: expect.any(String),
      firstName,
      lastName,
      email,
    });
  });

  it('#GET /me should return the currently logged in user', async () => {
    const [agent, user] = await registerAndLogin();
    const res = await agent.get('/api/v1/users/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ...user,
      exp: expect.any(Number),
      iat: expect.any(Number),
    });
  });

  it('#GET /me should return a 401 if not logged in', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('#POST /sessions should sign in existing user', async () => {
    await UserService.create(mockUser);
    const { email, password } = mockUser;

    const res = await request(app)
      .post('/api/v1/users/sessions')
      .send({ email, password });
    expect(res.status).toBe(200);
  });

  it('#DELETE /api/v1/users/sessions should logout a user', async () => {
    const [agent] = await registerAndLogin();
    const deleteRes = await agent.delete('/api/v1/users/sessions');
    expect(deleteRes.status).toBe(204);
    const res = await agent.get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});
