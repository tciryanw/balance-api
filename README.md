# balance-api
Mock balance API using redis as database for development purposes.

# Prerequisites
- Redis > `docker run -p 6379:6379 -it redis/redis-stack-server:latest`
- Brain

# Start
- `npm install`
- `npm run start:balance-api`

# API Routes
User ID needs to be a valid [v4 unique user identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier).

## Get Balance
Get the balance of a user. If user is non-existant, a user is created for the corresponding ID. Default balance (start balance) can be changed in `defaultUser` within `server.js`.

### Request
**URL** : `/api/balance/:user_id`
**Example** : `/api/balance/6f556d77-4a89-46bc-80ae-db7a4758fc8c`
**Method** : `GET`
**Auth required** : NO
**Permissions required** : None

### Success Response
**Code** : `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "6f556d77-4a89-46bc-80ae-db7a4758fc8c",
    "privkey": "f6e35ed357514d2597e2c705688b753e5bf7e428a852a3ed0a03685ce0ab85d0cd4d537fcd76e26097ec78fab87c90af",
    "balance": 10000,
    "currency": "USD",
    "created_at": "2023-04-11 01:38:38"
  },
  "current_time": "2023-04-11 01:34:38",
  "fromRedis": false
}
```

## Transaction
Changes user balance. Both debit and credit params are required to be integer, if debit results in a balance below 0 (negative balance) a status code `402` is returned.

If transaction completed succesfully the new user balance is returned.

If user is non-existant, a user is created for the corresponding ID. Default balance (start balance) can be changed in `defaultUser` within `server.js`.

### Request
**URL** : `/api/transaction/:user_id/:debit/:credit`
**Example** : `/api/transaction/6f556d77-4a89-46bc-80ae-db7a4758fc8c/52/2`
**Method** : `GET`
**Auth required** : NO
**Permissions required** : None

### Success Response
**Code** : `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "6f556d77-4a89-46bc-80ae-db7a4758fc8c",
    "privkey": "hidden",
    "balance": 9958,
    "currency": "USD",
    "created_at": "2023-04-11 01:38:38"
  },
  "current_time": "2023-04-11 01:51:25",
  "fromRedis": true
}
```

### Invalid debit/credit integer
**Code** : `400 Bad Request`
```json
{
  "success": false,
  "error": "Debit needs to be integer value greater then 0"
}
```

