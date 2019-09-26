const bycript = require('bcryptjs');
const User = require('../models/user');

module.exports = {
  async createUser({ userInput }) {
    const { email, name, password } = userInput;
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
