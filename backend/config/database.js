const Datastore = require('@seald-io/nedb');
const path = require('path');

const dbPath = path.join(__dirname, '../data');

const db = {
  users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  projects: new Datastore({ filename: path.join(dbPath, 'projects.db'), autoload: true }),
  members: new Datastore({ filename: path.join(dbPath, 'members.db'), autoload: true }),
  tasks: new Datastore({ filename: path.join(dbPath, 'tasks.db'), autoload: true }),
  notes: new Datastore({ filename: path.join(dbPath, 'notes.db'), autoload: true }),
};

db.users.ensureIndex({ fieldName: 'email', unique: true });

module.exports = db;
