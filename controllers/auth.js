const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
  const { email, name, password } = req.body;

  const errors = validationResult(req);
  if (!errors) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw errors;
  }
  try {
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPw,
      name,
    });
    const result = await user.save();
    res.status(201).json({
      message: 'User created',
      userId: result._id,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('A user with this email is not defained');
      error.statusCode = 404;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Wrong password');
      error.statusCode = 404;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      'secret',
      {
        expiresIn: '1h',
      },
    );

    res.status(201).json({
      token,
      userId: user._id.toString(),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found!');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      status: user.status,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};

exports.patchUserStatus = async (req, res, next) => {
  const { status } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found!');
      error.statusCode = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    res.status(201).json({ message: 'User updated' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};
