process.env.NODE_ENV = 'test';

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
  });

  it('should login a registered user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@example.com',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Test1234',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
