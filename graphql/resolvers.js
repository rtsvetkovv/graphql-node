const bycript = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

module.exports = {
  async createUser({ userInput }) {
    const { email, name, password } = userInput;
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' });
    }
    if (
      validator.isEmpty(userInput.password)
      || !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password is too short! ' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid intput');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Users exists already!');
      throw error;
    }
    const hashedPassword = await bycript.hash(password, 12);
    const user = new User({
      email,
      name,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User not found!');
      error.code = 404;
      throw error;
    }
    const isEqual = await bycript.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect!');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      'supersecret',
      {
        expiresIn: '1h',
      },
    );
    return {
      token,
      userId: user._id.toString(),
    };
  },
};
