// ----------------------- Informations -----------------------------
// Description: Gestion des commandes http de l'API
// Created:  2023-04-18 ; Modified: 2023-04-18
// Par MyEcoria
// ------------------------------------------------------------------

// ----------------------- Modules -----------------------------
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cryptog = require('crypto');
const multer = require('multer');
app.use(bodyParser.json());
const fs = require('fs');
const sharp = require('sharp');


const crypto = require('../modules/crypto.js');
const db = require('../modules/db.js');
const login = require('../modules/login.js');
const general = require('../config/general.json');

// ----------------------- Configuration -----------------------------
// Configuration de multer pour la gestion des fichiers d'image
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 } // Limite la taille des fichiers à 200 Mo
});

// ----------------------- HTTP -----------------------------

app.get('/home', async (req, res) => {
    const latest = await db.getLatestAnonces(40);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(latest);
});

app.get('/annonce/:id', async (req, res) => {

    const anonce = await db.getAnnonce(req.params.id);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(anonce);

});

app.get('/anUser/:id', async (req, res) => {

    const anonce = await db.getArticleByUser(req.params.id);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(anonce);

});

app.get('/anUuid/:id', async (req, res) => {

    const anonce = await db.getArticleByUuid(req.params.id);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(anonce);

});

app.get('/user/:uuid', async (req, res) => {
    const user = await db.getUser(req.params.uuid);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(user);
});

app.get('/theUser/:uuid', async (req, res) => {
    const user = await db.getUserbyUuid(req.params.uuid);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(user);
});

app.get('/change/:uuid/:name', async (req, res) => {

  console.log("UUID: " + req.params.uuid + " Name: " + req.params.name);

  try {
      const result = await db.getUserByName(req.params.name);
      console.log(result);
      if (!result) {
          console.log("OK");
          const user = await db.setName(req.params.name, req.params.uuid);
          console.log(user);
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
          res.header("Access-Control-Allow-Headers", "Content-Type");
          res.json(user);
      } else {
          console.log("KO");
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
          res.header("Access-Control-Allow-Headers", "Content-Type");
          res.status(400).send("KO");
      }
  } catch (err) {
      console.log(err);
      res.status(500).send("Internal server error");
  }
  
});



// Route pour recevoir et enregistrer une image
app.post('/new', upload.single('image'), async (req, res) => {
    console.log("new");
    const body = req.body;
    console.log(body);
    try {
      // Récupération du fichier d'image depuis la requête
      const imageFile = req.file;
  
      // Génération du haché de l'image à partir des données binaires du fichier
      const hash = cryptog.createHash('sha256').update(imageFile.buffer).digest('hex');
  
      const hashString = hash.toString();
      // Vérification si l'image existe déjà dans la base de données par son haché
      const existingImage = await db.getImages(hashString);
  
      if (existingImage) {
        // Si l'image existe déjà, renvoyer un message indiquant que l'image est enregistrée
        return res.send(`Image already exists with name: ${existingImage.name}`);
      }
  
      // Enregistrement de l'image dans la base de données
      await db.addImage(imageFile.originalname, imageFile.buffer, imageFile.mimetype, hashString);
      console.log(body);
      const leBody1 = JSON.stringify(body);
      console.log(leBody1);
      const leBody = JSON.parse(leBody1);
      console.log(leBody);
      if (leBody.uuid) {console.log("OK: 1")}
      if (leBody.name) {console.log("OK: 2")}
      if (leBody.description) {console.log("OK: 3")}
      if (leBody.price) {console.log("OK: 4")}
      if (leBody.uuid && leBody.description && leBody.price && leBody.name) {
        console.log("ok");
        const user = await db.getUserbyUuid(leBody.uuid);
        if (user) {
          await db.addAnonce(leBody.name, leBody.description, parseInt(leBody.price), hashString, leBody.uuid, user["address"]);
        } else {
          res.status(403).send('User not found');
        }
  
      }
  
      // Envoi d'une réponse indiquant que l'image a été enregistrée
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.status(200).send(`{"status": "Image saved with hash: ${hashString}"}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error saving image');
    }
});
  

// Route pour récupérer une image
app.get('/image/:hash', async (req, res) => {
    try {
      // Récupération de l'image à partir de son haché
      const image = await db.getImages(req.params.hash);
  
      if (!image) {
        return res.status(404).send('Image not found');
      }
  
      // Conversion de l'image base64 en format binaire
      const buffer = Buffer.from(image.data.data, 'base64');
  
      // Détection du format de l'image
      const format = await sharp(buffer).metadata().then(info => info.format);
  
      // Envoi de la réponse HTTP avec l'image binaire
      res.type(`image/${format}`);
      res.send(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error getting image');
    }
  });

// Route pour la recherche d'annonces
app.get('/search/:search', async (req, res) => {
    const search = req.params.search;
    const annonces = await db.getAnonces(search);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.json(annonces);
});

app.post('/all', async (req, res) => {

    const body = req.body;
    console.log(body);
    if (body["action"] && body["action"] == "search") {
        console.log("search");
        const annonces = await db.getAnonces(body["search"]);
        res.json(annonces);
    } else if (body["action"] && body["action"] == "getAnnonce") {
        const anonce = await db.getAnnonce(body["id"]);
        res.json(anonce);
    } else if (body["action"] && body["action"] == "getUser") {
        const user = await db.getUserbyUuid(body["uuid"]);
        res.json(user);
    } else if (body["action"] && body["action"] == "getLatest") {
        const latest = await db.getLatestAnonces(40);
        res.json(latest);
    } else if (body["action"] && body["action"] == "getAnnonceByUser") {
        const annonces = await db.getAnoncesByUser(body["uuid"]);
        res.json(annonces);
    }
});

app.get('/getMessages/:sender/:receive', async (req, res) => {
    const messages = await db.getMessages();
    res.json(messages);
});

app.post('/messages', async (req, res) => {
    const body = req.body;
    console.log(body);
    if (body["action"] && body["action"] == "getMessages") {
        const messages = await db.getMessages(body["sender"], body["receive"]);
        res.json(messages);
    } else if (body["action"] && body["action"] == "sendMessage") {
        const user = await db.getUserbyUuid(body["sender"]);
        if (user) {
            await db.sendMessage(body["sender"], body["receive"], body["message"]);
            res.json({"status": "ok"});
        } else {
            res.status(403).send('User not found');
        }
    } else if (body["action"] && body["action"] == "create") {
      
    }
});

// Démarrer le serveur en écoutant le port défini
app.listen(general["httpPort"], '0.0.0.0', function() {
  console.log(`Serveur démarré sur le port ${general["httpPort"]}`);
});