const { validationResult } = require('express-validator');
const { clearImage } = require('../utils/clearImage');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const { page = 1 } = req.query;
  const perPage = 2;
  try {
    const count = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);
    res.status(200).json({
      message: 'Fetched posts success',
      posts,
      totalItems: count,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};

exports.postCreatePost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorect');
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error('No images provided');
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path;
  const { title, content } = req.body;

  const post = new Post({
    title,
    content,
    creator: req.userId,
    imageUrl,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: 'Post created successfully',
      post,
      creator: {
        _id: user._id,
        name: user.name,
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Post fetched',
      post,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorect');
    error.statusCode = 422;
    throw error;
  }

  const { postId } = req.params;
  const { title, content } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();
    res.status(200).json({
      message: 'Post updated',
      post: result,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }
    // check log in user
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    res.status(200).json({ message: 'Post was deleted' });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 404;
    }
    next(error);
  }
};
