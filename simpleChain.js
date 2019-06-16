/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const Block = require('./block');

// levelDB to persist data
const levelSandbox = require('./levelSandbox');

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor(){
    this.chain = [];
    this.getBlockHeight().then((height) => {
        if (height === -1) {
          let newBlock = new Block("First block in the chain - This is the Genesis block");
          console.log('===> Added genesis block to the chain');
          this.addBlock(newBlock, true); // true because isGenesis block
        }
      });
  }

  // Add new block
  async addBlock(newBlock, isGenesis) {
    let prevBlockHash = 'none';
    let hash;

    if (!isGenesis) {
      // Block height
      const height = await this.getBlockHeight();
      newBlock.height = height;
      // previous block hash
      if (newBlock.height > 0) {
        const prevBlock = await this.getBlock(height-1);
        newBlock.previousBlockHash = prevBlock.hash;
        prevBlockHash = newBlock.previousBlockHash;
      }
    } else {
      newBlock.height = 0;
    }

    // UTC timestamp
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);

    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    // Adding block object to level DB chain
    await levelSandbox.addBlockToDB(newBlock.height, JSON.stringify(newBlock));

    return newBlock;
  }

  async getBlock(blockHeight) {
    const block = JSON.parse(await levelSandbox.getBlockFromDB(blockHeight));
    return block;
  }

  //  Modified Get block height
  async getBlockHeight() {
    const height = await levelSandbox.getBlockHeightFromDB();
    return height;
  }

  // Get block by address
  async getBlockByAddress(address) {
    let blocks = await levelSandbox.getBlockByAddressFromDB(address);
    return blocks;
  }

  // Get block by Hash
  async getBlockByHash(hash) {
    let block = await levelSandbox.getBlockByHashFromDB(hash);
    return block;
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = JSON.parse(await this.getBlock(blockHeight));
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      console.log('Block is valid!');
      return true;
    } else {
      console.log(
        'Block #' +
          blockHeight +
          ' invalid hash:\n' +
          blockHash +
          '<>' +
          validBlockHash,
      );
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [];

    for (var i = 0; i < (await this.getBlockHeight()) - 1; i++) {
      // validate block
      if (await !this.validateBlock(i)) errorLog.push(i);
      // compare blocks hash link
      let blockHash = JSON.parse(await this.getBlock(i)).hash;
      let previousHash = JSON.parse(await this.getBlock(i + 1))
        .previousBlockHash;

      if (blockHash !== previousHash) {
        errorLog.push(i);
      }
    }

    if (errorLog.length > 0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: ' + errorLog);
    } else {
      console.log('No errors detected');
    }
  }
}

module.exports = Blockchain;