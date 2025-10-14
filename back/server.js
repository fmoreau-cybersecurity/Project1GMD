// back/server.js
// ==========================
// Chargement des dépendances
// ==========================
require('dotenv').config({ path: __dirname + '/.env' });             
const express = require("express");      
const mysql = require("mysql2");         
const cors = require("cors");            
const bcrypt = require("bcrypt");        
const jwt = require('jsonwebtoken');

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 2864;   
const SECRET_KEY = process.env.JWT_SECRET_KEY; // Clé secrète chargée depuis .env

// ==========================
// Middleware
// ==========================
app.use(express.json());  
app.use(cors());          


// ==========================
// Connexion à la base MySQL
// ==========================
const bddConnexion = mysql.createPool({
  host: process.env.DB_HOST,       
  user: process.env.DB_USER,       
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME     
}).promise();


// ==========================
// REGISTER (Inscription) - ADAPTÉ BDD
// ==========================
app.post("/register", async (req, res) => {
  const { nom, prenom, mail, login, password } = req.body;

  if (!nom || !prenom || !mail || !login || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // Vérifie si le login existe déjà en base
    const [loginRows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `login` = ?",
      [login]
    );
    if (loginRows.length > 0) {
      return res.status(400).json({ error: "Identifiant déjà pris." });
    }

    // Vérifie si l’adresse mail existe déjà
    const [mailRows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `mail` = ?",
      [mail]
    );
    if (mailRows.length > 0) {
      return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10); 

// Insertion du nouvel utilisateur, en ajoutant la colonne 'token' avec la valeur NULL
    await bddConnexion.query(
      "INSERT INTO `User` (`nom`, `prenom`, `mail`, `login`, `password`, `boolAdmin`, `token`) VALUES (?, ?, ?, ?, ?, 0, NULL)",
      [nom, prenom, mail, login, hashedPassword]
    );

    return res.json({ message: "Utilisateur créé avec succès." });

  } catch (err) {
    console.error("Erreur register:", err);

    if (err.code === "ER_DUP_ENTRY") {
      if (err.sqlMessage.includes("mail")) {
        return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
      }
      if (err.sqlMessage.includes("login")) {
        return res.status(400).json({ error: "Identifiant déjà pris." });
      }
    }

    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ==========================
// LOGIN (Connexion) - ADAPTÉ BDD + JWT
// ==========================
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }

  try {
    // Recherche de l'utilisateur par login (ADAPTÉ AU NOM DE TABLE ET COLONNE)
    const [rows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `login` = ?",
      [login]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const user = rows[0];

    // Vérifie la correspondance du mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    // --- LOGIQUE JWT ---
    // 1. Définition du payload (ADAPTÉ AUX COLONNES `id` et `boolAdmin`)
    const payload = { 
        userId: user.id, 
        isAdmin: user.boolAdmin 
    };

    // 2. Génération et signature du token
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); 

    // 3. Envoi du token et des données utilisateur au client (ADAPTÉ AUX COLONNES)
    return res.json({ 
        message: 'Connexion réussie', 
        token: token, // Le jeton à stocker sur le front
        user: { 
            id: user.id,
            login: user.login,
            nom: user.nom,
            prenom: user.prenom,
            mail: user.mail,
            admin: user.boolAdmin
        }
    });
  } catch (err) {
    console.error("Erreur login:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ==========================
// Lancement du serveur
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://172.29.18.249:${PORT}`);
});