// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0
 const dotenv = require("dotenv") ;
 dotenv.config();

const assert = require("assert");
const { default: axios } = require('axios');
const fs = require("fs");
const path = require("path");
const {SDK} = require('@pontem/liquidswap-sdk')
const { requestCommon } = require('../../utils/binance.js')
const mysql = require('mysql');

const { AptosAccount, AptosClient, TxnBuilderTypes, MaybeHexString, HexString, FaucetClient } = require("aptos");

/** run our demo! */
async function main() {
  console.log()

  let connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: 'chain'
});
connection.connect(function(err, args) {
  console.log(`Mysql Connected.`)
  for(let i = 0; i < 10000; i++) {
    let account = new AptosAccount();
    let privateKeyObject = account.toPrivateKeyObject()
    console.log(`INSERT INTO aptos_accounts (address, public_key, private_key) VALUES ('${privateKeyObject.address}', '${privateKeyObject.publicKeyHex}', '${privateKeyObject.privateKeyHex}')`)
    connection.query(`INSERT INTO aptos_accounts (address, public_key, private_key) VALUES ('${privateKeyObject.address}', '${privateKeyObject.publicKeyHex}', '${privateKeyObject.privateKeyHex}')`, function (error, results, fields) {
        if (error) console.log(error);
    })
  }

  connection.end();
});



  

  
  
  
}

main()