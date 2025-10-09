// ==========================
// Chargement des dépendances
// ==========================
require('dotenv').config();             // Charge les variables d'environnement depuis le fichier .env
const express = require("express");      // Framework web pour créer le serveur HTTP
const mysql = require("mysql2");         // Module pour interagir avec une base de données MySQL
const cors = require("cors");            // Permet les requêtes cross-origin (utile pour connecter le front)
const bcrypt = require("bcrypt");        // Librairie pour hasher les mots de passe (sécurité)

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 2864;   // Définit le port du serveur (depuis .env ou valeur par défaut)


// ==========================
// Middleware
// ==========================
app.use(express.json());  // Permet de parser le JSON reçu dans les requêtes HTTP
app.use(cors());          // Autorise les requêtes venant d’autres origines (front local, etc.)


// ==========================
// Connexion à la base MySQL
// ==========================
const bddConnexion = mysql.createPool({
  host: process.env.DB_HOST,       // Adresse du serveur MySQL
  user: process.env.DB_USER,       // Nom d’utilisateur MySQL
  password: process.env.DB_PASSWORD, // Mot de passe MySQL
  database: process.env.DB_NAME     // Nom de la base de données
}).promise(); // Utilise les Promises pour simplifier le code asynchrone


// ==========================
// REGISTER (Inscription)
// ==========================
app.post("/register", async (req, res) => {
  const { nom, prenom, mail, login, password } = req.body;

  // Vérifie que tous les champs sont présents
  if (!nom || !prenom || !mail || !login || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // Vérifie si le login existe déjà en base
    const [loginRows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `Login` = ?",
      [login]
    );
    if (loginRows.length > 0) {
      return res.status(400).json({ error: "Identifiant déjà pris." });
    }

    // Vérifie si l’adresse mail existe déjà
    const [mailRows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `Mail` = ?",
      [mail]
    );
    if (mailRows.length > 0) {
      return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
    }

    // Hash du mot de passe pour ne jamais stocker de mot de passe en clair
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = niveau de complexité du hash

    // Insertion du nouvel utilisateur dans la base de données
    await bddConnexion.query(
      "INSERT INTO `User` (`Nom`, `Prénom`, `Mail`, `Login`, `Password`, `Admin`) VALUES (?, ?, ?, ?, ?, 0)",
      [nom, prenom, mail, login, hashedPassword]
    );

    // Retourne une réponse positive au front
    return res.json({ message: "Utilisateur créé avec succès." });

  } catch (err) {
    console.error("Erreur register:", err);

    // Gestion spécifique des erreurs de duplication MySQL
    if (err.code === "ER_DUP_ENTRY") {
      if (err.sqlMessage.includes("Mail")) {
        return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
      }
      if (err.sqlMessage.includes("Login")) {
        return res.status(400).json({ error: "Identifiant déjà pris." });
      }
    }

    // Erreur générique
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ==========================
// LOGIN (Connexion)
// ==========================
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  // Vérifie la présence des identifiants
  if (!login || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }

  try {
    // Recherche de l'utilisateur par login
    const [rows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `Login` = ?",
      [login]
    );

    // Si aucun utilisateur trouvé
    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const user = rows[0];

    // Vérifie la correspondance du mot de passe (hashé en BDD)
    const valid = await bcrypt.compare(password, user.Password);
    if (!valid) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    // Réponse au front sans renvoyer le mot de passe
    return res.json({
      user: {
        login: user.Login,
        nom: user.Nom,
        prenom: user["Prénom"],
        mail: user.Mail,
        admin: user.Admin
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
  console.log(`🚀 Serveur démarré sur http://172.29.19.53:${PORT}`);
});
