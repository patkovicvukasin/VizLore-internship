process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { GenericContainer } from 'testcontainers';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import waitOn from 'wait-on';

jest.setTimeout(3 * 60_000);

let mongoContainer;
let serverProcess;

beforeAll(async () => {
  mongoContainer = await new GenericContainer('mongo:latest')
    .withExposedPorts(27017)
    .start();
  const host = mongoContainer.getHost();
  const port = mongoContainer.getMappedPort(27017);
  const mongoUri = `mongodb://${host}:${port}/authdb`;

  process.env.MONGO_URI_AUTH = mongoUri;
  process.env.MONGO_URI_DATA = mongoUri;
  process.env.ORION_URL = 'http://localhost:12345';

  serverProcess = spawn('node', ['src/index.js'], {
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      PORT: '4000' 
    },
    stdio: 'ignore'
  });

  await waitOn({
    resources: ['http://localhost:4000/'],
    timeout: 30_000
  });
});

afterAll(async () => {
  serverProcess.kill('SIGTERM');
  await mongoContainer.stop();
});

describe('Integration: Auth endpoints', () => {
  it('should register and login a new user end-to-end', async () => {
    const registerRes = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'Test1234',
        confirmPassword: 'Test1234'
      }),
    });
    expect(registerRes.status).toBe(201);
    const registerBody = await registerRes.json();
    expect(registerBody.message).toBe('User registered successfully');

    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'Test1234'
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.token).toBeDefined();
  });
});
