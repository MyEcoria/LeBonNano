// ----------------------- Informations -----------------------------
// Description: Ce module permet de récupérer l'addresse de l'utilisateur grâce à une transaction
// Created:  2023-04-17 ; Modified: 2023-04-17
// Par MyEcoria
// ------------------------------------------------------------------

// ----------------------- Modules -----------------------------

// Import modules
const WS = require('ws');
const ReconnectingWebSocket = require('reconnecting-websocket');
const { Wallet } = require('simple-nano-wallet-js');
const { wallet: walletLib} = require('multi-nano-web')

// Import config
const apiKeys = require('../config/apiKeys.json');
const wallet = require('../config/seed.json');



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

async function getWallet(account) {

    // Create a reconnecting WebSocket.
    // In this example, we wait a maximum of 2 seconds before retrying.
    const ws = new ReconnectingWebSocket(`wss://nodes.nanswap.com/ws/?ticker=XNO&api=${apiKeys["nanswap"]}`, [], {
        WebSocket: WS,
        connectionTimeout: 1000,	
        maxRetries: 100000,
        maxReconnectionDelay: 2000,
        minReconnectionDelay: 10 // if not set, initial connection will take a few seconds by default
    });

    // As soon as we connect, subscribe to block confirmations
    ws.onopen = () => {
        const confirmation_subscription = {
            "action": "subscribe", 
            "topic": "confirmation",
            "options": {
                "accounts": [account]
            }
        }
        ws.send(JSON.stringify(confirmation_subscription));

        async function receiveAl(account) {
            let hashesReceive = await walletXNO.receiveAll(account);
            console.log(hashesReceive);
        }

        receiveAl(account);
    };

    // The node sent us a message
    ws.onmessage = msg => {
        console.log(msg.data);
        data_json = JSON.parse(msg.data);

        if (data_json.topic === "confirmation") {
            console.log ('Confirmed', data_json.message.hash)
            data = data_json["message"]
            data = data["account"]
            if (data != account) {
                data = { "account": data }
                console.log(data);
                ws.close();
                return data;
            }
        }
    };

}

// ----------------------- Exports -----------------------------
module.exports = {
    getWallet
}

// ------ End of file: modules\crypto.js ------
// C''est un peu du bidouillage mais ça fonctionne