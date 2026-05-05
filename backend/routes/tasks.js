const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const isAdmin = async (projectId, userId) => !!(await db.members.findOneAsync({ projectId, userId, role: 'Admin' }));
const isMember = async (projectId, userId) => !!(await db.members.findOneAsync({ projectId, userId }));

const enrichTask = async (task) => {
  const assignee = task.assignedTo ? await db.users.findOneAsync({ _id: task.assignedTo }) : null;
  const creator = await db.users.findOneAsync({ _id: task.createdBy });
  return {
    ...task,
    id: task._id,
    assignee: assignee ? { id: assignee._id, name: assignee.name, email: assignee.email } : null,
    creator: creator ? { id: creator._id, name: creator.name, email: creator.email } : null,
  };
};

// Get tasks for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    if (!(await isMember(req.params.projectId, req.user._id))) return res.status(403).json({ error: 'Access denied' });
    const tasks = await db.tasks.findAsync({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    const enriched = await Promise.all(tasks.map(enrichTask));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post('/', auth, [
  body('title').trim().notEmpty(),
  body('projectId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, description, dueDate, priority, projectId, assignedTo } = req.body;
    if (!(await isAdmin(projectId, req.user._id))) return res.status(403).json({ error: 'Admin required' });
    const task = await db.tasks.insertAsync({
      title, description, dueDate: dueDate || null, priority: priority || 'Medium',
      status: 'To Do', projectId, assignedTo: assignedTo || null,
      createdBy: req.user._id, createdAt: new Date()
    });
    res.status(201).json(await enrichTask(task));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await db.tasks.findOneAsync({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (!(await isMember(task.projectId, req.user._id))) return res.status(403).json({ error: 'Access denied' });

    const admin = await isAdmin(task.projectId, req.user._id);
    const isAssignee = task.assignedTo === req.user._id;
    if (!admin && !isAssignee) return res.status(403).json({ error: 'You can only update tasks assigned to you' });

    let updates;
    if (admin) {
      const { title, description, dueDate, priority, status, assignedTo } = req.body;
      updates = { title, description, dueDate, priority, status, assignedTo };
    } else {
      updates = { status: req.body.status };
    }

    await db.tasks.updateAsync({ _id: task._id }, { $set: updates });
    const updated = await db.tasks.findOneAsync({ _id: task._id });
    res.json(await enrichTask(updated));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await db.tasks.findOneAsync({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (!(await isAdmin(task.projectId, req.user._id))) return res.status(403).json({ error: 'Admin required' });
    await db.tasks.removeAsync({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notes for a task
router.get('/:id/notes', auth, async (req, res) => {
  try {
    const task = await db.tasks.findOneAsync({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (!(await isMember(task.projectId, req.user._id))) return res.status(403).json({ error: 'Access denied' });
    const notes = await db.notes.findAsync({ taskId: req.params.id }).sort({ createdAt: -1 });
    const enriched = await Promise.all(notes.map(async n => {
      const author = await db.users.findOneAsync({ _id: n.authorId });
      return { ...n, id: n._id, author: author ? { id: author._id, name: author.name } : null };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a note to a task
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const task = await db.tasks.findOneAsync({ _id: req.params.id });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (!(await isMember(task.projectId, req.user._id))) return res.status(403).json({ error: 'Access denied' });

    const { text, attachment } = req.body; // attachment: { name, type, data (base64) }
    if (!text && !attachment) return res.status(400).json({ error: 'Note must have text or attachment' });

    // Validate attachment size (~15MB base64 limit = ~10MB raw file)
    if (attachment?.data && attachment.data.length > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'Attachment too large (max 10MB)' });
    }

    const note = await db.notes.insertAsync({
      taskId: req.params.id,
      projectId: task.projectId,
      authorId: req.user._id,
      text: text || '',
      attachment: attachment || null,
      createdAt: new Date(),
    });

    // Update noteCount on task
    const noteCount = await db.notes.countAsync({ taskId: req.params.id });
    await db.tasks.updateAsync({ _id: req.params.id }, { $set: { noteCount } });

    const author = await db.users.findOneAsync({ _id: req.user._id });
    res.status(201).json({ ...note, id: note._id, author: { id: author._id, name: author.name } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a note (author or admin)
router.delete('/:taskId/notes/:noteId', auth, async (req, res) => {
  try {
    const note = await db.notes.findOneAsync({ _id: req.params.noteId });
    if (!note) return res.status(404).json({ error: 'Not found' });
    const admin = await isAdmin(note.projectId, req.user._id);
    if (!admin && note.authorId !== req.user._id) return res.status(403).json({ error: 'Not allowed' });
    await db.notes.removeAsync({ _id: req.params.noteId });
    const noteCount = await db.notes.countAsync({ taskId: req.params.taskId });
    await db.tasks.updateAsync({ _id: req.params.taskId }, { $set: { noteCount } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', auth, async (req, res) => {  try {
    const memberships = await db.members.findAsync({ userId: req.user._id });
    const projectIds = memberships.map(m => m.projectId);
    if (!projectIds.length) return res.json({ total: 0, byStatus: { 'To Do': 0, 'In Progress': 0, 'Done': 0 }, byUser: [], overdue: 0 });

    const tasks = await db.tasks.findAsync({ projectId: { $in: projectIds } });
    const total = tasks.length;
    const byStatus = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
    const userMap = {};
    const today = new Date().toISOString().split('T')[0];
    let overdue = 0;

    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      if (t.dueDate && t.dueDate < today && t.status !== 'Done') overdue++;
      if (t.assignedTo) {
        if (!userMap[t.assignedTo]) {
          const u = await db.users.findOneAsync({ _id: t.assignedTo });
          userMap[t.assignedTo] = { id: t.assignedTo, name: u?.name || 'Unknown', count: 0 };
        }
        userMap[t.assignedTo].count++;
      }
    }

    const byUser = Object.values(userMap).sort((a, b) => b.count - a.count);
    res.json({ total, byStatus, byUser, overdue });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
