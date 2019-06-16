/* Criteria: Configure private blockchain project to include a REST API with node.js framework running on port 8000.
*/
const express = require('express');
const http = require('http');
const app = express();
const morgan = require('morgan')
const bodyParser = require('body-parser');
const hex2ascii = require('hex2ascii')

const Block = require('./block');
const Blockchain = require('./simpleChain');
const MemPool = require('./memPool');

const memPool = new MemPool();
const chain = new Blockchain();

// Logging incoming requests
app.use(morgan('combined'));

// Parse incoming requests
app.use(bodyParser.json({ type: '*/*' }));

// middlewares to validate parameters in the different API Calls

// validate that address has sent
validateAddressParameter = async (req, res, next) => {
  if (!req.body.address) {
    res.status(400).json({
      status: 400,
      message: 'Error: Fill the address parameter'
    });
  }
  else next();
};

// validate that a signature has sent
validateSignatureParameter = async (req, res, next) => {
  if (!req.body.signature) {
    res.status(400).json({
      status: 400,
      message: 'Error: Fill the signature parameter'
    });
  }
  else next();  
};

// check that only sent 1 star
validateStarsNumber = async (req, res, next) => {
  let stars = 0;
  Object.keys(req.body).forEach(function(el){ 
    if (el==='star') stars=stars+1;
  })

  if (stars === 1) next();
  else {
    res.status(400).json({
      status: 400,
      message: 'Error: wrong number of stars. Please, send only one'
    })
  }
};

// format of some responses
formatStar = (blockAdded) => {
  return {
        "hash":  blockAdded.hash,
        "height": blockAdded.height,
        "body": {
          "address": blockAdded.address,
          "star": {
            "ra": blockAdded.star.ra,
            "dec": blockAdded.star.dec,
            "story": blockAdded.star.story,
            "storyDecoded": hex2ascii(blockAdded.star.story)
          }
        },
        "time": blockAdded.time,
        "previousBlockHash": blockAdded.prevBlockHash
  };
};

// Requesting routes

/////////
// POST /
/////////
app.post(
  '/requestValidation',
  [validateAddressParameter],
  async (req, res) => {
    try {
      const data = await memPool.addARequestValidation(req.body.address);
      res.json(data);
    } catch (error) {
        res.status(400).json({
          status: 400,
          message: error.message,
      });
      return;  
    }
});

app.post(
  '/message-signature/validate',
  [validateAddressParameter, validateSignatureParameter],
  async (req, res) => {
     try {
      const response = await memPool.validateRequestByWallet(
        req.body.address,
        req.body.signature,
      );
      if (response.registerStar) {
        res.json(response);
      } else {
        res.status(401).json(response);
      }
    } catch (error) {
      res.status(404).json({
        status: 404,
        message: error.message,
      });
    }
  },
);

app.post('/block', [validateStarsNumber], async (req, res) => {
  //check if request is valid
  try {
    const isValid = memPool.verifyAddressRequest(req.body.address, req.body.star);

    if (isValid) { // encode
      const {ra, dec, story } = req.body.star;
      const body = {
        address: req.body.address,
        star: {
          ra,
          dec,
          story: Buffer(story).toString('hex'),
        }
      }
      let blockAdded = await chain.addBlock(body);
      const data = formatStar(blockAdded);
      const requestRemoved = memPool.removeRequest(req.body.address);

      if (blockAdded && data && requestRemoved) {
        res.json(data);
      } else {
        throw new Error('Block could not be saved in the blockchain. Please, try again.')
      }
    }
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
    });
    return;
  }
});

////////
// GET /
////////
app.get('/block/:block', async (req, res) => {
  try {
    let response = await chain.getBlock(req.params.block);
    const formatedBlock = formatStar(response);

    res.json(formatedBlock);
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
    });
    return;
  }
});

app.get('/stars/address:address', async (req, res) => {
  try {
    const response = await chain.getBlockByAddress(req.params.address.slice(1));
    const formatedBlocks = response.map(star => formatStar(star));

    res.json(formatedBlocks);    
  } catch (error) {
      res.status(400).json({
      status: 400,
      message: error.message,
    });
    return;  
  }

});

app.get('/stars/hash:hash', async (req, res) => {
  try {
    const response = await chain.getBlockByHash(req.params.hash.slice(1));
    const formatedBlock = formatStar(response);

    res.json(formatedBlock); 
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
    });
    return;     
  }

});



// Server setup
const port = process.env.PORT || 8000;
const server = http.createServer(app);
server.listen(port);
console.log('Server listening on port ', port);