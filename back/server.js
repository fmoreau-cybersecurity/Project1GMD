require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt"); // pour sécuriser les mots de passe

const app = express();
const PORT = process.env.PORT || 2864;

// Middleware
app.use(express.json());
app.use(cors());

// Connexion MySQL
const bddConnexion = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "LAWGMD",
  password: process.env.DB_PASSWORD || "W_IpFpY40n-dSZJQ",
  database: process.env.DB_NAME || "Lawrence GMD"
}).promise();


// ==========================
// REGISTER
// ==========================
app.post("/register", async (req, res) => {
  const { nom, prenom, mail, login, password } = req.body;

  if (!nom || !prenom || !mail || !login || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }

  try {
    // Vérifie si le login existe déjà
    const [loginRows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `Login` = ?",
      [login]
    );
    if (loginRows.length > 0) {
      return res.status(400).json({ error: "Identifiant déjà pris." });
    }

    // Vérifie si le mail existe déjà
    const [mailRows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `Mail` = ?",
      [mail]
    );
    if (mailRows.length > 0) {
      return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer en base
    await bddConnexion.query(
      "INSERT INTO `User` (`Nom`, `Prénom`, `Mail`, `Login`, `Password`, `Admin`) VALUES (?, ?, ?, ?, ?, 0)",
      [nom, prenom, mail, login, hashedPassword]
    );

    return res.json({ message: "Utilisateur créé avec succès." });
  } catch (err) {
    console.error("Erreur register:", err);

    // Gestion spécifique des doublons MySQL
    if (err.code === "ER_DUP_ENTRY") {
      if (err.sqlMessage.includes("Mail")) {
        return res.status(400).json({ error: "Adresse e-mail déjà utilisée." });
      }
      if (err.sqlMessage.includes("Login")) {
        return res.status(400).json({ error: "Identifiant déjà pris." });
      }
    }

    return res.status(500).json({ error: "Erreur serveur." });
  }
});



// ==========================
// LOGIN
// ==========================
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }

  try {
    // Vérifie si l'utilisateur existe
    const [rows] = await bddConnexion.query(
      "SELECT * FROM `User` WHERE `Login` = ?",
      [login]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    const user = rows[0];

    // Vérifie le mot de passe
    const valid = await bcrypt.compare(password, user.Password);
    if (!valid) {
      return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
    }

    // Réponse au front (sans renvoyer le mot de passe)
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
// Lancer serveur
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://172.29.19.53:${PORT}`);
});
