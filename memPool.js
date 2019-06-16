
const bitcoinMessage = require('bitcoinjs-message');
const DBLayer = require('./db-layer');
// levelDB to persist data
const levelSandbox = require('./levelSandbox');

const TimeoutRequestsWindowTime = 60*5; // 5 minutes, 300 seconds

class MemPool {
  constructor() {
    const DB = new DBLayer();
    this.db =  DB.getDB();
    this.memPool = new Map();
    this.memPoolValid = new Map();
    this.timeoutRequests = new Map();
    this.registerStar = false;
    this.status = {};
  }

  // triggered when time window has elapsed, so set the flag of the request as expired and remove from timeoutRequests map
  _removeValidationRequest(walletAddress) {
    const expiredRequest = this.memPool.get(walletAddress);
    if (expiredRequest) expiredRequest.isExpired = true;
    this.memPool.delete(walletAddress);
    this.memPool.set(walletAddress, expiredRequest);
    this.timeoutRequests.delete(walletAddress);
  }

  // calculate the time left of a validation request
  _timeLeftInSeconds(requestTimeStamp) {
    const originalTime = new Date(requestTimeStamp);
    const now = new Date();

    return TimeoutRequestsWindowTime - Math.floor((now.getTime() - originalTime.getTime())/1000);
  }

  async _addValidationRequest(walletAddress) {
      const requestTimeStamp = Date.now();
      const data = {
        walletAddress,
        message: `${walletAddress}:${requestTimeStamp}:starRegistry`,
        requestTimeStamp,
        isExpired: false,
      };

      try {
        const self = this;
        await this.db.open();
        const height = await levelSandbox.getBlockHeightFromDB();
        await this.db.put(height+1, JSON.stringify(data))
          .then(function(res){
            self.memPool.set(walletAddress, data);
            self.timeoutRequests.set(
              walletAddress,
              setTimeout(function(){ self._removeValidationRequest(walletAddress)}, TimeoutRequestsWindowTime*1000));
          });

        data.validationWindow = TimeoutRequestsWindowTime; // set to 5 minutes since is first time for this validation

        return data;
      } catch (error) {
        const message = `[addARequestValidation] Error saving new request validation of address ${walletAddress}: ${error.message}`;

        console.error(message);
        throw new Error(message);
      } 
  }

  async addARequestValidation(walletAddress) {
    if (!this.memPool.get(walletAddress)) { // if a new request (not in the mem pool)
      return this._addValidationRequest(walletAddress);
    } else if (!this.memPool.get(walletAddress).isExpired){ // re-submitting validation in the window time, so retrieve it from the mem pool and not put it the db
      const requestTimeStamp = this.memPool.get(walletAddress).requestTimeStamp;

      return {
        walletAddress,
        message: `${walletAddress}:${requestTimeStamp}:starRegistry`,
        requestTimeStamp,
        validationWindow: this._timeLeftInSeconds(requestTimeStamp),
      };
    } else if(this.memPool.get(walletAddress).isExpired) { // validation with time expired
      this.memPool.delete(walletAddress);
      this.timeoutRequests.delete(walletAddress);
    }
  }

  removeRequest(walletAddress) {
    try {
      this.memPool.delete(walletAddress);
      this.timeoutRequests.delete(walletAddress);
      this.memPoolValid.delete(walletAddress);
      return true;
    } catch (err) {
      return false;
    }


  }

  async validateRequestByWallet(walletAddress, signature) {
    const request = this.memPool.get(walletAddress);
    const timeLeft = this._timeLeftInSeconds(request.requestTimeStamp);

    if (request && !request.isExpired) {
      let isValid = bitcoinMessage.verify(request.message, walletAddress, signature);
      
      // if not valid throw an error
      if (!isValid)
        throw new Error(`Error: we are sorry. Could not be verified the wallet with address ${walletAddress} with the signature ${signature}`);

      this.registerStar = true;
      this.status = {
        address: walletAddress,
        requestTimeStamp: request.requestTimeStamp,
        message: request.message,
        validationWindow: timeLeft,
        messageSignature: true
      };

      // saved it to the memPool valid array
      if (!this.memPoolValid.get(walletAddress)) this.memPoolValid.set(walletAddress, this.status);

      //clean it up from the timeout requests
      if (this.timeoutRequests.get(walletAddress)) this.timeoutRequests.delete(walletAddress);

      return {
        registerStar: this.registerStar,
        status: this.status,
      }
    } else {
      throw new Error('Error: We are sorry, your request is expired or has not been validated yet.');
    }
  }

  verifyAddressRequest(walletAddress, star) {
    if (this.memPoolValid.get(walletAddress)){
      const { dec, ra, story } = star;

      // Check if star information is valid
      if (
        typeof dec !== 'string' ||
        dec.length === 0 ||
        typeof ra !== 'string' ||
        ra.length === 0 ||
        typeof story !== 'string' ||
        story.length === 0 ||
        story.length > 500
      ) {
        throw new Error('Error: Your star information is not valid');
      }

       // Check if story is ascii
      const isASCII = (function (str){
        return /^[\x00-\x7F]*$/.test(str) 
      });

      if (!isASCII(story)) throw new Error('Error: Your story is not ASCII, please fix it'); 

      // is valid
      return true;  
    }
    else {
      throw new Error(`Error: Request of the wallet with address ${walletAddress} is not valid`);
    }
  }  
}

module.exports = MemPool;