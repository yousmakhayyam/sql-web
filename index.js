const express = require("express");
const sql = require("mssql");

const app = express();
const port = process.env.PORT || 3000;

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

app.get("/", async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query("SELECT GETDATE() AS CurrentTime");
        res.send(`Connected to DB! Current Time: ${result.recordset[0].CurrentTime}`);
    } catch (err) {
        res.status(500).send("DB Connection Failed: " + err);
    }
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
