// ----------------------- Informations -----------------------------
// Description: Module de gestion des crypto-monnaies (envoi, réception, etc.)
// Created:  2023-04-17 ; Modified: 2023-04-17
// Par MyEcoria
// ------------------------------------------------------------------

// ----------------------- Modules -----------------------------

// Import modules
const { Wallet } = require('simple-nano-wallet-js');
const { wallet: walletLib} = require('multi-nano-web')
const axios = require("axios");

// Import config
const wallet = require('../config/seed.json');
const apiKeys = require('../config/apiKeys.json');

// ----------------------- Configuration -----------------------------

let headerAuth = { // custom header for authentification
    "nodes-api-key": apiKeys["nanswap"]
}

// Nano Wallet
const walletXNO = new Wallet({
    RPC_URL: 'https://nodes.nanswap.com/XDG',
    WORK_URL: 'https://nodes.nanswap.com/XDG',
    WS_URL: `wss://nodes.nanswap.com/ws/?ticker=XDG&api=${apiKeys["nanswap"]}`,
    seed: wallet["XNO"]["seed"],
    defaultRep: "nano_1banexkcfuieufzxksfrxqf6xy8e57ry1zdtq9yn7jntzhpwu4pg4hajojmq",
    prefix: 'nano_',
    decimal: 30,
    customHeaders: headerAuth,
    wsSubAll: true, 
})

// ----------------------- Fonctions -----------------------------
// Fonction pour envoyer des XNO
async function sendXNO(source, address, amount) {

    // send 0.001 nano from nano_3g5hp... to nano_3g5hp...
    let hash = await walletXNO.send({
        source: source, // must be in wallet. 
        destination: address,
        amount: walletXNO.megaToRaw(amount
            ),
    })
    return hash;

}

// Fonction pour générer des wallets
async function generateWallet(amount) {

    let accounts = walletXNO.createAccounts(amount);
    return accounts;

}

// Fonction pour récupérer le solde d'un wallet
async function balance(add) {
    const data = {
      action: "account_balance",
      account: add
    };

    const head = {
        headers: {
          "Content-Type": "application/json",
          "nodes-api-key": config["nodes-api-key"]
        }
    };

    const urlNode = "https://nodes.nanswap.com/XNO";
  
    try {
      const response = await axios.post(urlNode, data, head);

      
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(error);
    }
}

async function receiveAll(account) {
    let hash = await walletXNO.receiveAll(account);
    return hash;
}

async function getRandomWallet() {
    let wallet = await walletXNO.createAccounts(1000);  // 1000 wallets
    const randomWallet = wallet[Math.floor(Math.random() * wallet.length)];
    return randomWallet;
}
    

// ----------------------- Export -----------------------------
module.exports = {
    sendXNO,
    generateWallet,
    balance,
    receiveAll,
    getRandomWallet
}

// ----------------------- Fin -----------------------------
// C'est la fin du fichier, merci d'avoir lu jusqu'ici !