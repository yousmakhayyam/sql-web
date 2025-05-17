require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

app.get("/", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query("SELECT * FROM Messages ORDER BY CreatedAt DESC");
    res.render("index", { messages: result.recordset });
  } catch (err) {
    console.error("DB Error:", err);
    res.send("Error loading page");
  }
});

app.post("/submit", async (req, res) => {
  const { name, message } = req.body;
  try {
    await sql.connect(config);
    await sql.query`INSERT INTO Messages (Name, Message) VALUES (${name}, ${message})`;
    res.redirect("/");
  } catch (err) {
    console.error("Submit Error:", err);
    res.send("Error submitting message");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on port ${port}`));
