'use strict';

const jwt = require('jsonwebtoken');
const { User, Role } = require('../modules/index');
// path is correct from middleware/ -> modules/index

/**
 * Authenticate JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Access token expired' });
      }
      return res.status(401).json({ success: false, message: 'Invalid access token' });
    }

    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    req.userRoles = user.roles.map((r) => r.name);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Authorize by roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRoles) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const hasRole = roles.some((role) => req.userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Enforce branch-level data isolation
 */
const enforceBranchAccess = (req, res, next) => {
  const isSuperAdmin = req.userRoles.includes('SUPER_ADMIN');
  const isAdmin = req.userRoles.includes('ADMIN');

  if (!isSuperAdmin && !isAdmin) {
    // Branch-scoped users can only access their own hub's data
    if (req.query.hubId && req.query.hubId !== req.user.hubId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own branch data',
      });
    }

    if (!req.query.hubId && req.user.hubId) {
      req.query.hubId = req.user.hubId;
    }
  }

  next();
};

module.exports = { authenticate, authorize, enforceBranchAccess };
