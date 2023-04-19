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
    res.json(latest);
});

app.get('/annonce/:id', async (req, res) => {

    const anonce = await db.getAnnonce(req.params.id);
    res.json(anonce);

});

app.get('/user/:uuid', async (req, res) => {
    const user = await db.getUserbyUuid(req.params.uuid);
    res.json(user);
});

// Route pour recevoir et enregistrer une image
app.post('/new', upload.single('image'), async (req, res) => {
    console.log("new");
    const body = req.body;
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
      const leBody = JSON.parse(body.data);
      console.log(leBody);
      if (leBody.uuid && leBody.description && leBody.price && leBody.name) {
        console.log("ok");
        const user = await db.getUserbyUuid(leBody.uuid);
        if (user) {
          await db.addAnonce(leBody.name, leBody.description, leBody.price, hashString, leBody.uuid);
        } else {
          res.status(403).send('User not found');
        }
  
      }
  
      // Envoi d'une réponse indiquant que l'image a été enregistrée
      res.send(`Image saved with hash: ${hashString}`);
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
// Démarrer le serveur en écoutant le port défini
app.listen(general["httpPort"], function() {
  console.log(`Serveur démarré sur le port ${general["httpPort"]}`);
});


