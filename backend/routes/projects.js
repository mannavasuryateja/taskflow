const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const isAdmin = async (projectId, userId) => {
  const m = await db.members.findOneAsync({ projectId, userId, role: 'Admin' });
  return !!m;
};
const isMember = async (projectId, userId) => {
  const m = await db.members.findOneAsync({ projectId, userId });
  return !!m;
};

const enrichProject = async (project, userId) => {
  const creator = await db.users.findOneAsync({ _id: project.creatorId });
  const memberships = await db.members.findAsync({ projectId: project._id });
  const members = await Promise.all(memberships.map(async m => {
    const u = await db.users.findOneAsync({ _id: m.userId });
    return u ? { id: u._id, name: u.name, email: u.email, ProjectMember: { role: m.role } } : null;
  }));
  const myMembership = memberships.find(m => m.userId === userId);
  return {
    ...project,
    id: project._id,
    creator: creator ? { id: creator._id, name: creator.name, email: creator.email } : null,
    members: members.filter(Boolean),
    currentUserRole: myMembership?.role,
  };
};

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await db.members.findAsync({ userId: req.user._id });
    const projects = await Promise.all(memberships.map(async m => {
      const p = await db.projects.findOneAsync({ _id: m.projectId });
      if (!p) return null;
      const creator = await db.users.findOneAsync({ _id: p.creatorId });
      return { ...p, id: p._id, role: m.role, creator: creator ? { id: creator._id, name: creator.name } : null };
    }));
    res.json(projects.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Name required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, description } = req.body;
    const project = await db.projects.insertAsync({ name, description, creatorId: req.user._id, createdAt: new Date() });
    await db.members.insertAsync({ projectId: project._id, userId: req.user._id, role: 'Admin' });
    res.status(201).json({ ...project, id: project._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    if (!(await isMember(req.params.id, req.user._id))) return res.status(403).json({ error: 'Access denied' });
    const project = await db.projects.findOneAsync({ _id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Not found' });
    const enriched = await enrichProject(project, req.user._id);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member
router.post('/:id/members', auth, async (req, res) => {
  try {
    if (!(await isAdmin(req.params.id, req.user._id))) return res.status(403).json({ error: 'Admin required' });
    const { email, role } = req.body;
    const user = await db.users.findOneAsync({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = await db.members.findOneAsync({ projectId: req.params.id, userId: user._id });
    if (existing) return res.status(400).json({ error: 'Already a member' });
    await db.members.insertAsync({ projectId: req.params.id, userId: user._id, role: role || 'Member' });
    res.json({ message: 'Added', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    if (!(await isAdmin(req.params.id, req.user._id))) return res.status(403).json({ error: 'Admin required' });
    await db.members.removeAsync({ projectId: req.params.id, userId: req.params.userId });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!(await isAdmin(req.params.id, req.user._id))) return res.status(403).json({ error: 'Admin required' });
    await db.tasks.removeAsync({ projectId: req.params.id }, { multi: true });
    await db.members.removeAsync({ projectId: req.params.id }, { multi: true });
    await db.projects.removeAsync({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
