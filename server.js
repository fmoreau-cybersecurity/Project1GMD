// back/server.js
// ==========================
// Chargement des dépendances
// ==========================
const path = require('path');
// Le chemin est configuré pour chercher .env dans le même dossier 'back'
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
// Middleware & Connexion BDD
// ==========================
app.use(express.json());  
app.use(cors());          

const bddConnexion = mysql.createPool({
  host: process.env.DB_HOST,       
  user: process.env.DB_USER,       
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME     
}).promise();


// =======================================================
// MIDDLEWARE DE VÉRIFICATION JWT (Protège les routes)
// =======================================================
const authenticateToken = (req, res, next) => {
    // Récupère l'en-tête "Authorization: Bearer [TOKEN]"
    const authHeader = req.headers['authorization'];
    // Extrait seulement le token (la deuxième partie après l'espace)
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        // Le client n'a pas fourni de token (Non Autorisé)
        return res.status(401).json({ error: "Accès refusé. Jeton d'authentification manquant." }); 
    }

    // Vérifie et décode le token
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            // Jeton invalide ou expiré (Interdit)
            console.error("JWT Verification Error:", err.message);
            return res.status(403).json({ error: "Jeton invalide ou expiré." }); 
        }
        // Jeton valide : attache le payload du token à la requête
        req.user = user; 
        next(); // Autorise l'accès à la route suivante
    });
};


// ==========================
// REGISTER (Inscription) - Route publique
// ==========================
app.post("/register", async (req, res) => {
  const { nom, prenom, mail, login, password } = req.body;

  if (!nom || !prenom || !mail || !login || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // Vérifications (login/mail existants)
    const [loginRows] = await bddConnexion.query("SELECT * FROM `User` WHERE `login` = ?", [login]);
    if (loginRows.length > 0) {
      return res.status(400).json({ error: "Identifiant déjà pris." });
    }
    const [mailRows] = await bddConnexion.query("SELECT * FROM `User` WHERE `mail` = ?", [mail]);
    if (mailRows.length > 0) {
      return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
    }

    // Hash et Insertion
    const hashedPassword = await bcrypt.hash(password, 10); 
    await bddConnexion.query(
      "INSERT INTO `User` (`nom`, `prenom`, `mail`, `login`, `password`, `boolAdmin`, `token`) VALUES (?, ?, ?, ?, ?, 0, NULL)",
      [nom, prenom, mail, login, hashedPassword]
    );

    return res.json({ message: "Utilisateur créé avec succès." });

  } catch (err) {
    console.error("Erreur register:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ==========================
// LOGIN (Connexion) - Route publique (Génère le token)
// ==========================
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }

  try {
    // Recherche de l'utilisateur
    const [rows] = await bddConnexion.query("SELECT * FROM `User` WHERE `login` = ?", [login]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const user = rows[0];

    // Vérification du mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    // --- LOGIQUE JWT ---
    const payload = { 
        userId: user.id, 
        isAdmin: user.boolAdmin 
    };

    // Génération du token
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); 

    // Mise à jour du token dans la BDD (Facultatif, mais utile pour le suivi)
    await bddConnexion.query(
        "UPDATE `User` SET `token` = ? WHERE `id` = ?",
        [token, user.id]
    );

    // Renvoie du token au client
    return res.json({ 
        message: 'Connexion réussie', 
        token: token, 
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


// ===================================
// ROUTE PROTÉGÉE (Route Manquante, maintenant ajoutée)
// ===================================
// Le front-end appelle cette route pour vérifier le token
app.get("/api/user-status", authenticateToken, (req, res) => {
    // Si le code atteint cette ligne, le token est VALIDÉ.
    res.json({ 
        success: true,
        message: "Authentification réussie. Le token est fonctionnel.",
        userId: req.user.userId,
        isAdmin: req.user.isAdmin
    });
});


// ==========================
// Lancement du serveur
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://172.29.18.249:${PORT}`);
});