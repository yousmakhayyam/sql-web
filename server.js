const express = require('express');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

async function connectToDb() {
  try {
    pool = await sql.connect(config);
    console.log("✅ DB Connected");
    // Event listener for errors after connection
    pool.on('error', err => {
      console.error('❌ MSSQL pool error', err);
      // You could implement reconnect logic here if needed
    });
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
    throw err;
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from a 'public' folder (recommended)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/messages', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT name, message, created_at AS timestamp FROM dbo.Messages ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

app.post('/submit', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required" });
  }
  try {
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('message', sql.NVarChar, message)
      .query('INSERT INTO dbo.Messages (name, message) VALUES (@name, @message)');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Submit Error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Start server only after DB connection is ready
connectToDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to start server due to DB connection error:", err);
    process.exit(1); // Stop process if DB connection fails
  });
