import { jest } from '@jest/globals';

await jest.unstable_mockModule('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
}));

await jest.unstable_mockModule('../src/models/User.js', () => {
  const MockUser  = function (data) {
    Object.assign(this, data);
  };

  MockUser.findOne = jest.fn();
  MockUser.prototype.save = jest.fn();

  return { default: MockUser };
});

await jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn(),
  },
}));

const { register } = await import('../src/controllers/authController.js');
const User = (await import('../src/models/User.js')).default;
const bcrypt = (await import('bcrypt')).default;

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('register controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers user when data is fine', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    User.prototype.save.mockResolvedValue(true);

    const req = mockReq({
      email: 'user@example.com',
      password: 'user123',
      confirmPassword: 'user123',
    });
    const res = mockRes();

    await register(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('user123', 10);
    expect(User.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
  });

  it('fails when passwords dont match', async () => {
    const req = mockReq({
      email: 'user@example.com',
      password: 'user123',
      confirmPassword: 'user1234',
    });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Passwords do not match' });
  });

  it('fails if email is already used', async () => {
    User.findOne.mockResolvedValue({ email: 'user@example.com' });

    const req = mockReq({
      email: 'user@example.com',
      password: 'user123',
      confirmPassword: 'user123',
    });
    const res = mockRes();

    await register(req, res);

    expect(User.findOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
  });
});
