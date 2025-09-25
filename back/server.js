require ('dotenv').config(); //chargement des variables

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 2864;
const HOST = process.env.DB_HOST || '172.29.19.53';

app.use(express.json());
app.use(cors());

//Connexion à la base de données : 
const bddConection = mysql.createPool({
  host : process.env.DB_HOST,
  user : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME
}).promise();

//Route pour récupérer les utilisateurs
 
//test


app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
