const { check, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
};

const signupValidator = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email'),

  check('password')
    .notEmpty()
    .withMessage('Password is required'),

  validate,
];

const loginValidator = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email'),

  check('password')
    .notEmpty()
    .withMessage('Password is required'),

  validate,
];

module.exports = { signupValidator, loginValidator };

