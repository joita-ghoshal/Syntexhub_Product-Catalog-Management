const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * @desc    Register a new user (admin/manager)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'manager',
  });

  const token = signToken(user._id);

  return sendSuccess(res, 201, 'User registered successfully', {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

/**
 * @desc    Login and receive a JWT
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }

  const token = signToken(user._id);

  return sendSuccess(res, 200, 'Login successful', {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
  return sendSuccess(res, 200, 'Current user fetched successfully', {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = { register, login, getMe };
