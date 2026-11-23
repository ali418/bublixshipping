'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPagination, buildPaginationMeta } = require('../../middleware/response.middleware');
const { User, Role, UserRole, Hub, AuditLog } = require('../index');

// ─── List Users ────────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, hubId, role, status } = req.query;

    const where = { organizationId: req.user.organizationId };

    if (hubId) where.hubId = hubId;
    if (status !== undefined) where.isActive = status === 'active';
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
      include: [
        { model: Role, as: 'roles', through: { attributes: [] }, attributes: ['id', 'name'] },
        { model: Hub, as: 'hub', attributes: ['id', 'name', 'code'] },
      ],
    });

    return res.paginated(rows, buildPaginationMeta(count, page, limit));
  } catch (err) {
    console.error(err);
    return res.error('Failed to list users', 500);
  }
});

// ─── Create User ───────────────────────────────────────────────────────────────
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, hubId, roleNames, language } = req.body;

    if (!firstName || !email || !password) {
      return res.error('firstName, email and password are required', 400);
    }
    if (password.length < 8) return res.error('Password must be at least 8 characters', 400);

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) return res.error('Email already in use', 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      organizationId: req.user.organizationId,
      hubId: hubId || req.user.hubId,
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash,
      language: language || 'en',
      isActive: true,
    });

    // Assign roles
    if (roleNames && roleNames.length > 0) {
      const roles = await Role.findAll({ where: { name: roleNames } });
      await Promise.all(
        roles.map((r) =>
          UserRole.findOrCreate({ where: { userId: user.id, roleId: r.id } })
        )
      );
    }

    await AuditLog.create({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'CREATE_USER',
      resource: 'User',
      resourceId: user.id,
      newValues: { email, firstName, lastName, hubId },
      ipAddress: req.ip,
    });

    const created = await User.findByPk(user.id, {
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
      include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
    });

    return res.success({ user: created }, 'User created successfully', 201);
  } catch (err) {
    console.error(err);
    return res.error(err.message || 'Failed to create user', 500);
  }
});

// ─── Get User ──────────────────────────────────────────────────────────────────
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
      include: [
        { model: Role, as: 'roles', through: { attributes: [] } },
        { model: Hub, as: 'hub', attributes: ['id', 'name', 'code'] },
      ],
    });
    if (!user) return res.error('User not found', 404);
    return res.success({ user });
  } catch (err) {
    console.error(err);
    return res.error('Failed to get user', 500);
  }
});

// ─── Update User ───────────────────────────────────────────────────────────────
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!user) return res.error('User not found', 404);

    const { firstName, lastName, phone, hubId, language, roleNames } = req.body;
    const oldValues = { firstName: user.firstName, lastName: user.lastName, hubId: user.hubId };

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      hubId: hubId || user.hubId,
      language: language || user.language,
    });

    if (roleNames && roleNames.length > 0) {
      await UserRole.destroy({ where: { userId: user.id } });
      const roles = await Role.findAll({ where: { name: roleNames } });
      await Promise.all(
        roles.map((r) => UserRole.create({ userId: user.id, roleId: r.id }))
      );
    }

    await AuditLog.create({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'UPDATE_USER',
      resource: 'User',
      resourceId: user.id,
      oldValues,
      newValues: req.body,
      ipAddress: req.ip,
    });

    return res.success(null, 'User updated successfully');
  } catch (err) {
    console.error(err);
    return res.error('Failed to update user', 500);
  }
});

// ─── Activate / Deactivate ─────────────────────────────────────────────────────
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findOne({
      where: { id: req.params.id, organizationId: req.user.organizationId },
    });
    if (!user) return res.error('User not found', 404);
    if (user.id === req.user.id) return res.error('Cannot change your own status', 400);

    await user.update({ isActive });

    return res.success(null, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    console.error(err);
    return res.error('Failed to update user status', 500);
  }
});

// ─── List Roles ────────────────────────────────────────────────────────────────
router.get('/meta/roles', authenticate, async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    return res.success({ roles });
  } catch (err) {
    return res.error('Failed to get roles', 500);
  }
});

module.exports = router;
