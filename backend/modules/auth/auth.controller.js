'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Role, RefreshToken, AuditLog } = require('../index');

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      hubId: user.hubId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await AuditLog.create({
        userId: user.id,
        organizationId: user.organizationId,
        action: 'LOGIN_FAILED',
        resource: 'Auth',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshTokenValue = generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    await AuditLog.create({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'LOGIN_SUCCESS',
      resource: 'Auth',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.cookie('refreshToken', refreshTokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          organizationId: user.organizationId,
          hubId: user.hubId,
          language: user.language,
          roles: user.roles.map((r) => r.name),
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /auth/refresh
 */
const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Find token in DB
    const storedToken = await RefreshToken.findOne({
      where: { token, isRevoked: false },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      return res.status(401).json({ success: false, message: 'Refresh token expired or revoked' });
    }

    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Rotate refresh token
    await storedToken.update({ isRevoked: true });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (token) {
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token } }
      );
    }

    res.clearCookie('refreshToken');

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id, isActive: true },
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findByPk(req.user.id);
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash: hash, passwordChangedAt: new Date() });

    // Revoke all refresh tokens
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id } }
    );

    await AuditLog.create({
      userId: user.id,
      organizationId: user.organizationId,
      action: 'PASSWORD_CHANGED',
      resource: 'Auth',
      ipAddress: req.ip,
    });

    res.clearCookie('refreshToken');

    return res.status(200).json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login, refresh, logout, getMe, changePassword };
