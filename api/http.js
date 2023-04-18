// ----------------------- Informations -----------------------------
// Description: Gestion des commandes http de l'API
// Created:  2023-04-18 ; Modified: 2023-04-18
// Par MyEcoria
// ------------------------------------------------------------------

// ----------------------- Modules -----------------------------
const express = require('express');
const app = express();
app.use(bodyParser.json());

const crypto = require('../modules/crypto.js');
const db = require('../modules/db.js');
const login = require('../modules/login.js');
const general = require('../config/general.json');

// ----------------------- HTTP -----------------------------

app.get('/home', async (req, res) => {
    const latest = await db.getLatestAnonces(40);
    res.json(latest);
});

app.get('/annonce/:id', async (req, res) => {

    const anonce = await db.getUserbyId(req.params.id);
    res.json(anonce);

});




  

// Démarrer le serveur en écoutant le port défini
app.listen(general["httpPort"], function() {
  console.log(`Serveur démarré sur le port ${port}`);
});


