const bcrypt = require("bcrypt");

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "MARDONOLIMJONOv$080808",
  database: "mardonenglish"
});

db.connect(err => {
  if (err) {
    console.error("MySQL ulanmadi:", err);
    return;
  }
  console.log("MySQL connected");
});

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

let users = [];

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      err => {
        if (err) {
          return res.json({ success: false });
        }
        res.json({ success: true, name });
      }
    );
  } catch (err) {
    res.json({ success: false });
  }
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, results) => {
      if (results.length === 0) {
        return res.json({ success: false });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.json({ success: false });
      }

      res.json({ success: true, name: user.name });
    }
  );
});

app.post("/save-progress", (req, res) => {
  const { email, skill, score } = req.body;

  db.query(
    "INSERT INTO progress (user_email, skill, score) VALUES (?, ?, ?)",
    [email, skill, score],
    err => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    }
  );
});

app.get("/get-progress", (req, res) => {
  const { email } = req.query;

  db.query(
    "SELECT * FROM progress WHERE user_email=? ORDER BY created_at DESC",
    [email],
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    }
  );
});



const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  console.log("User connected");

  socket.on("chatMessage", msg => {
    io.emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Backend + Socket.io 3000-portda");
});
