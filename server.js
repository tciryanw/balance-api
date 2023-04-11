const express = require("express");
const redis = require("redis");
const crypto = require('crypto');
const { type } = require("os");

const app = express();
const port = process.env.PORT || 3000;

const defaultUser = [
  {
    "user_id": "",
    "privkey": "",
    "balance": 10000,
    "currency": "USD",
  }
];

const secret_key = "OH-NO-LOL";

let redisClient;

function isUUID ( uuid ) {
  let s = "" + uuid;
  s = s.match('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
  if (s === null) {
    return false;
  }
  return true;
}

function encryptString(string) {
  var mykey = crypto.createCipher('aes-128-cbc', secret_key);
  var mystr = mykey.update(string, 'utf8', 'hex')
  return mystr += mykey.final('hex');
}

function decryptString(string) {
  var mykey = crypto.createDecipher('aes-128-cbc', secret_key);
  var mystr = mykey.update(string, 'hex', 'utf8')
  return mystr += mykey.final('utf8');
}


(async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

function getCurrentDateTimeString() {
  const date = new Date();
  return date.getFullYear() + '-' +
      (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
      date.getDate().toString().padStart(2, '0') + ' ' +
      date.getHours().toString().padStart(2, '0') + ':' +
      date.getMinutes().toString().padStart(2, '0') + ':' +
      date.getSeconds().toString().padStart(2, '0');
}

function isInt(value) {
  var x;
  return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}
async function getBalance(req, res) {
  const user_id = req.params.user_id;
  if(!isUUID(user_id)) {
    res.status(400).send({
      success: false,
      error: "User ID needs to be UUID v4 format like " + crypto.randomUUID(),
    });
    return;
  }
  let results;
  let fromRedis = false;


  try {
    const cacheResults = await redisClient.get(user_id);
    if (cacheResults) {
      fromRedis = true;
      results = JSON.parse(cacheResults);
      results.privkey = "hidden";
    } else {
      fromRedis = false;
      results = defaultUser[0];
      results.user_id = user_id;
      results.privkey = encryptString(user_id);
      results.created_at = getCurrentDateTimeString();
      await redisClient.set(user_id, JSON.stringify(results));
    }

    res.send({
      success: true,
      data: results,
      current_time: getCurrentDateTimeString(),
      fromRedis: fromRedis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Data unavailable");
  }
}

async function transaction(req, res) {
  const user_id = req.params.user_id;
  const debitAmount = parseInt(req.params.debit);
  const creditAmount = parseInt(req.params.credit);

  if(debitAmount < 0) {
    res.status(400).send({
      success: false,
      error: "Debit needs to be integer value greater then 0"
    });
    return;
  }
  if(creditAmount < 0) {
    res.status(400).send({
      success: false,
      error: "Credit needs to be integer value greater then 0"
    });
    return;
  }

  if(!isInt(debitAmount)) {
    res.status(400).send({
      success: false,
      error: "Debit needs to be integer value"
    });
    return;
  }
  if(!isInt(creditAmount)) {
    res.status(400).send({
      success: false,
      error: "Credit needs to be integer value"
    });
    return;
  }
  if(!isUUID(user_id)) {
    res.status(400).send({
      success: false,
      error: "User ID needs to be UUID v4 format like " + crypto.randomUUID(),
    });
    return;
  }

  let results;
  let fromRedis = false;

  try {
    const cacheResults = await redisClient.get(user_id);
    if (cacheResults) {
      fromRedis = true;
      results = JSON.parse(cacheResults);
      results.privkey = "hidden";
    } else {
      fromRedis = false;
      results = defaultUser[0];
      results.user_id = user_id;
      results.privkey = encryptString(user_id);
      results.created_at = getCurrentDateTimeString();
      await redisClient.set(user_id, JSON.stringify(results));
    }
    var currentBalance = parseInt(results.balance);
    var debitedBalance = parseInt(currentBalance - debitAmount);
    if(debitedBalance < 0) {
      res.status(402).send({
        success: false,
        error: "Too little balance: " + results.balance
      });
      return;
    }
    results.balance = parseInt(debitedBalance + creditAmount);

    redisClient.set(user_id, JSON.stringify(results));

    res.send({
      success: true,
      data: results,
      current_time: getCurrentDateTimeString(),
      fromRedis: fromRedis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Data unavailable");
  }
}
app.get("/api/balance/:user_id", getBalance);
app.get("/api/transaction/:user_id/:debit/:credit", transaction);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});