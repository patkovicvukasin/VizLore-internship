import express from 'express';
import { check } from 'express-validator';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

router.post(
  '/register',
  [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 6 }).withMessage('Password too short'),
    check('confirmPassword')
      .exists().withMessage('Confirm your password')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords must match'),
  ],
  register
);

router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').exists().withMessage('Password required'),
  ],
  login
);

export default router;
