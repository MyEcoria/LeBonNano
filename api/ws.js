// ----------------------- Informations -----------------------------
// Description: Gestion des commandes ws de l'API
// Created:  2023-04-18 ; Modified: 2023-04-18
// Par MyEcoria
// ------------------------------------------------------------------

// ----------------------- Modules -----------------------------
const WebSocket = require('ws');
const WS = require('ws');
const ReconnectingWebSocket = require('reconnecting-websocket');
const { Wallet } = require('simple-nano-wallet-js');
const { wallet: walletLib} = require('multi-nano-web');
const { v4: uuidv4 } = require('uuid');

const login = require('../modules/login.js');
const crypto = require('../modules/crypto.js');
const db = require('../modules/db.js');

const general = require('../config/general.json');
const apiKeys = require('../config/apiKeys.json');
const wallet = require('../config/seed.json');


// ----------------------- Configuration -----------------------------
const wss = new WebSocket.Server({ port: general.wsPort });

// ----------------------- WS -----------------------------
wss.on('connection', (server, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Un client est connecté depuis ${req.socket.remoteAddress}`);
  

  // Gestion des messages reçus du client
  server.on('message', async (message) => {
    console.log(message);
    const json = JSON.parse(message);
    if (json["action"]) {

      // ----------------------- Login -----------------------------

      if (json["action"] == "login") {
        const account = await crypto.getRandomWallet();
        server.send(`{"action": "send", "account": "${account}"}`);
        const ws = new ReconnectingWebSocket(`wss://nodes.nanswap.com/ws/?ticker=XNO&api=${apiKeys["nanswap"]}`, [], {
            WebSocket: WS,
            connectionTimeout: 1000,	
            maxRetries: 100000,
            maxReconnectionDelay: 2000,
            minReconnectionDelay: 10
        });
        ws.onopen = () => {
            const confirmation_subscription = {
                "action": "subscribe", 
                "topic": "confirmation",
                "options": {
                    "accounts": [account]
                }
            }
            ws.send(JSON.stringify(confirmation_subscription));
        };
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
                    let uuid;
                    db.getUser(data["account"])
                      .then((result) => {
                        if (result != null) {
                          console.log("User already exists");
                          uuid = result["cookies"];
                          console.log(`UUID: ${uuid}`);
                          server.send(`{"action": "add", "account": "${uuid}"}`);
                          ws.close();
                          server.close();
                        } else {
                          uuid = uuidv4();
                          console.log(uuid);
                          db.addUser(data["account"], data["account"], ip, uuid);
                          server.send(`{"action": "add", "account": "${uuid}"}`);
                          ws.close();
                          server.close();
                        }
                      }).catch((err) => {
                        console.error('Erreur lors de la récupération de la liste des utilisateur:', error);
                      });
                }
            }
        };

      }
      
      
    }
  });

  // Gestion de la déconnexion d'un client
  server.on('close', () => {
    console.log('Un client est déconnecté');
  });
});

console.log(`Le serveur est lancé sur le port ${general["wsPort"]}`);
