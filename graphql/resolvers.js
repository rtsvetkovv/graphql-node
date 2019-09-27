const bycript = require('bcryptjs');
const validator = require('validator');

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
};
