const express = require('express');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// DB config
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Connect to DB
sql.connect(config)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images, etc)
app.use(express.static(path.join(__dirname)));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// GET /messages — return all messages from DB
app.get('/messages', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT Name AS name, Message AS message, CreatedAt AS timestamp FROM Messages ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST /submit — insert a new message into DB
app.post('/submit', async (req, res) => {
  const { name, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required" });
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('message', sql.NVarChar, message)
      .query('INSERT INTO Messages (Name, Message) VALUES (@name, @message)');

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Submit Error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
