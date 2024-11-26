const express = require("express");
const cors = require("cors");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const PORT = 3000;

let activeUsers = new Set();

const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run("CREATE TABLE grid (x INT, y INT, color TEXT)");

  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 40; y++) {
      db.run("INSERT INTO grid VALUES (?, ?, ?)", x, y, "white");
    }
  }
});

app.use(cors());
app.use(express.json());

app.get("/grid", (req, res) => {
  db.all("SELECT * FROM grid", (err, rows) => {
    if (err) {
      return res.status(500).send("Database error");
    }
    const grid = Array(20)
      .fill()
      .map(() => Array(40).fill("white"));
    rows.forEach(({ x, y, color }) => {
      grid[x][y] = color;
    });
    res.json(grid);
  });
});

app.get("/activeUsers", (req, res) => {
  res.json({ activeUsers: activeUsers.size });
});

app.use((req, res, next) => {
  activeUsers.add(req.ip);
  next();
});

app.post("/setColor", (req, res) => {
  const { x, y, color } = req.body;

  if (x < 0 || x >= 30 || y < 0 || y >= 40) {
    return res.status(400).send("Invalid coordinates");
  }

  db.run(
    "UPDATE grid SET color = ? WHERE x = ? AND y = ?",
    color,
    x,
    y,
    (err) => {
      if (err) {
        return res.status(500).send("Database error");
      }

      res.send("Pixel updated!");
    },
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
