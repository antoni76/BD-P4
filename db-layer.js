const level = require('level');
const chainDB = './db';

let instance = null;

/**
 Class to get one entry point to all instances of the application.
 If already DB instantiated , return the opened, if not, we can have a LOCK error from the DB.
 */
class DBLayer {
  constructor() {
    if (!instance) {
      this.db = level(chainDB, { valueEncoding: 'json' });
      instance = this;
    }

    return instance;
  }

  getDB() {
    return this.db;
  }
}

module.exports = DBLayer;
