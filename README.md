# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

## Configuring your project

```
npm install
```
- Start API server, with the port 8000
```
npm run start
```

## Testing

Open browser to http://localhost:8000/block/0 to see the 0th block information. 
Postman can be used to send GET or POST requests to test the API's functionality.

## API

All data is in JSON format, and expects body for POST to be in JSON as well.

## Requirements
- When fetching details on a block, the index must be included.
- When adding a new block, you must pass a JSON object using the key, data, with a string value.

## Built With

- NodeJS - Serverside JavaScript (among other uses)
- CryptoJS - JavaScript library of cryptography standards
- ExpressJS - NodeJS Framework

## Endpoints

## ID Validation Request
Submit a validation request. If not was done before, a new window time of validation of 5 minutes is started. Onces is over, user can not do more requests with the same address.
### Method
POST
### Endpoint
http://localhost:8000/requestValidation
### Paramaters
address - a valid bitcoin address
#Returns
Object with information and an extra field pointing out if time expired. I.e.:
{
    "walletAddress": "13389RuzeEYkUkAMuUoXWuNEm2DZStQ1ty",
    "message": "13389RuzeEYkUkAMuUoXWuNEm2DZStQ1ty:1548012233164:starRegistry",
    "requestTimeStamp": 1548012233164,
    "isExpired": false,
    "validationWindow": 300
}

## ID Signature Validation
Request of validation of the message retrieved in the POST call of validation request. User sends the signature.
### Method
POST
### Endpoint
http://localhost:8000/message-signature/validate
### Paramaters
address - a valid bitcoin address
signature - a valid signed message using address and message from last step
#Return
Object with this information (i.e.):
{
    "registerStar": true,
    "status": {
        "address": "13389RuzeEYkUkAMuUoXWuNEm2DZStQ1ty",
        "requestTimeStamp": 1548012233164,
        "message": "13389RuzeEYkUkAMuUoXWuNEm2DZStQ1ty:1548012233164:starRegistry",
        "validationWindow": 268,
        "messageSignature": true
    }
}

## Star Registration
Retrieve from the blockhain the last star stored.
### Method
POST
### Endpoint
http://localhost:8000/block
### Paramaters
address - a valid bitcoin address
star - Containing dec, ra and story (max 500 bytes)
### Result
Object with information regarding last block and previous. I.e.:
{
    "hash": "9776ed86d5cc2c57f44206de935ff94dbc5a9c9e806d7336c91f31e505630c24",
    "height": 1,
    "body": {
        "address": "13389RuzeEYkUkAMuUoXWuNEm2DZStQ1ty",
        "star": {
            "ra": "16h 29m 1.0s",
            "dec": "68 52 569",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
        }
    },
    "time": "1548012269",
    "previousBlockHash": "2ea9eaa8ca2c18ec782125fbb20fe2a4aeeef2477b127317cde2f8300f1d7029"
}

## Get block by height
### Method
GET
### Endpoint
http://localhost:8000/block/:height
### Paramaters
height- block height
### Result
Object with the block in the requested height (if not a 400 error), i.e.:
{
    "hash": "61958d39a51b9946ea2258e9779652b4ffffb5314e9f2dd709641562e35c64d0",
    "height": 1,
    "body": {
        "address": "1AAkCMUPEWbMKjwDdyKbSAeTZhx8zStL33",
        "star": {
            "ra": "1h 29m 1.0s",
            "dec": "9° 52' 56.9",
            "story": "415241434f4e20414c454d414e4941204265726c696e",
            "storyDecoded": "ARACON ALEMANIA Berlin"
        }
    },
    "time": "1548511902"
}

## Get block by address
### Method
GET
### Endpoint
http://localhost:8000/stars/address:address
### Paramaters
address - address used for registration
### Result
An array of objects, each element is one block/star of the blockchain, i.e.:

[
    {
        "hash": "61958d39a51b9946ea2258e9779652b4ffffb5314e9f2dd709641562e35c64d0",
        "height": 1,
        "body": {
            "address": "1AAkCMUPEWbMKjwDdyKbSAeTZhx8zStL33",
            "star": {
                "ra": "1h 29m 1.0s",
                "dec": "9° 52' 56.9",
                "story": "415241434f4e20414c454d414e4941204265726c696e",
                "storyDecoded": "ARACON ALEMANIA Berlin"
            }
        },
        "time": "1548511902"
    },
    {
        "hash": "c7d3246d627f7fd56d60c5615bc1ad6cbbb706bfb113682f002bb49cb9fc8460",
        "height": 2,
        "body": {
            "address": "1AAkCMUPEWbMKjwDdyKbSAeTZhx8zStL33",
            "star": {
                "ra": "13h 29m 1.0s",
                "dec": "9° 52' 56.9",
                "story": "4a6f7264692068612065737461646f20656e205461696c616e646961",
                "storyDecoded": "Jordi ha estado en Tailandia"
            }
        },
        "time": "1548511965"
    }
]
## Get block by hash
### Method
GET
### Endpoint
http://localhost:8000/stars/hash:hash
### Paramaters
hash - hash of the block
### Result
Object with the block in the requested hash (if not a 400 error), i.e.:
{
    "hash": "c7d3246d627f7fd56d60c5615bc1ad6cbbb706bfb113682f002bb49cb9fc8460",
    "height": 2,
    "body": {
        "address": "1AAkCMUPEWbMKjwDdyKbSAeTZhx8zStL33",
        "star": {
            "ra": "13h 29m 1.0s",
            "dec": "9° 52' 56.9",
            "story": "4a6f7264692068612065737461646f20656e205461696c616e646961",
            "storyDecoded": "Jordi ha estado en Tailandia"
        }
    },
    "time": "1548511965"
}
## Author

Antoni Martin

## Aknowledgment

Udacity