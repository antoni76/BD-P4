/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const DBLayer = require('./db-layer');
const DB = new DBLayer();
const db = DB.getDB();

const levelSandbox = {
  // Add data to levelDB with key/value pair
  addBlockToDB: async (key, value) => {
     await db.open();
     await db.put(key, value, (error) => {
      if (error) {
        const message = `====> Error adding block to DB of key ${key} and value ${value} with error ${error.message}`;
        console.error(message);
        return new Error(message);
      }
      return value;
    });  
  },
  // Get data from levelDB with key
  getBlockFromDB: async (key) => {
     await db.open();
    
    return new Promise(function(resolve, reject) {
      db.get(key, (error, value) => {
      if (error) {
        const message = `===> Error getting block from DB of key ${key} with error ${error.message}`;
        console.error(message);
        reject(message);
      }

      resolve(value);        
      });
    });
  },
  // Add data to levelDB with value
  getBlockHeightFromDB: async () => {
    let height = -1;
    await db.open();
    
    return new Promise(function(resolve, reject) {
      db.createReadStream().on('data', (data) => {
            height = height + 1;
          }).on('error', (error) => {
              const message = `===> Error getting block height from DB with error ${error.message}`;
              console.error(message);
              reject(message);
          }).on('close', () => {
           resolve(height);
      });
    });
  },
  getBlockByHashFromDB: async (requestedHash) => {
    await db.open();
    
    return new Promise(function(resolve, reject) {
      let found = false;
      db.createReadStream().on('data', (data) => {
            const currentHash = JSON.parse(data.value).hash;
            if (currentHash === requestedHash) {
              found = true;
              resolve(JSON.parse(data.value));
            }
          }).on('error', (error) => {
              console.error(message);
              reject(message);
          }).on('close', () => {
           if (!found) reject('Sorry, no block found');
      });
    });    
  },
  getBlockByAddressFromDB: async (requestedAddress) => {
    await db.open();
    
    return new Promise(function(resolve, reject) {
      let blocks  = [];

      db.createReadStream().on('data', (data) => {
            const currentAddress = JSON.parse(data.value).address;
            if (currentAddress === requestedAddress) {
              blocks.push(JSON.parse(data.value));
            }
          }).on('error', (error) => {
              const message = `===> Error getting star by address from DB with error ${error.message}`;
              console.error(message);
              reject(message);
          }).on('close', () => {
           resolve(blocks);
      });
    });  
  },
};
module.exports = levelSandbox;