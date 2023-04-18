// ----------------------- Informations -----------------------------
// Description: Database module, utilisé pour la gestion de la base de données
// Created:  2023-04-17 ; Modified: 2023-04-17
// Par MyEcoria
// ------------------------------------------------------------------


// ----------------------- Modules -----------------------------

// Import modules
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Import config
const config = require('../config/mongo.json');

// Connect to database
mongoose.connect(config["mongoUrl"], { useNewUrlParser: true, useUnifiedTopology: true });



// ----------------------- Définition des modèles -----------------------------
const userSchema = new mongoose.Schema({
    address: { type: String, required: true },
    balance: { type: Number, required: false, default: 0 },
    ip: { type: String, required: true },
    score: { type: Number, required: false },
    name: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    cookies: { type: String, required: true }
});

const anonceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    owner: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    id: { type: String, required: false, default: uuidv4() }
}, { 
    // Define text index on 'name' and 'description' fields
    // This will enable text search on these fields
    // We set the 'default_language' to 'french' to use french stemming when searching
    // You can adjust this option depending on your needs
    text: { name: "textIndex", description: "textIndex", default_language: "french" } 
});

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Anonce = mongoose.model('Anonce', anonceSchema);
const Message = mongoose.model('Message', messageSchema);



// ----------------------- Fonctions -----------------------------
async function addUser(name, address, ip, cookies) {
    const newUser = new User({
      address: address,
      name: name,
      ip: ip,
      cookies: cookies
    });
    await newUser.save();
}

async function addAnonce(name, description, price, image, owner) {
    const newAnonce = new Anonce({
      name: name,
      description: description,
      price: price,
      image: image,
      owner: owner
    });
    await newAnonce.save();
}

async function addMessage(sender, receiver, text) {
    const newMessage = new Message({
      sender: sender,
      receiver: receiver,
      text: text
    });
    await newMessage.save();
}

async function getMessages(sender, receiver) {
    const messages = await Message.find({ $or: [{ sender: sender, receiver: receiver }, { sender: receiver, receiver: sender }] });
    return messages;
}

// Fonction de recherche intelligente (c'est incroyable ce truc, je ne connaissais pas !!!)
async function getAnonces(terme) {
    const anonces = await Anonce.find(
        { $text: { $search: terme } },
        { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } });
    return anonces;
}

async function numberAnonces() {
    const anonces = await Anonce.find();
    return anonces.length;
}

async function getAllAnonces() {
    const anonces = await Anonce.find();
    return anonces;
}

async function getLatestAnonces(number) {
    const anonces = await Anonce.find().sort({ date: -1 }).limit(number);
    return anonces;
} // explique: https://stackoverflow.com/questions/10123953/mongodb-find-latest-10-records

async function getUser(address) {
    const user = await User.findOne({ address: address });
    if (user) {
      return user.toJSON();
    }
    return null;
}

async function getUserbyId(id) {
    const data = await User.findOne({ id: id });
    if (user) {
      return data.toJSON();
    }
    return null;
}

// ----------------------- Export -----------------------------
module.exports = {
    addUser,
    addAnonce,
    addMessage,
    getAnonces,
    getMessages,
    numberAnonces,
    getUser,
    getAllAnonces,
    getLatestAnonces,
    getUserbyId
};

// ----------------------- Fin -----------------------------
// C'est déjà fini ?! Oui, c'est déjà fini !! 😭