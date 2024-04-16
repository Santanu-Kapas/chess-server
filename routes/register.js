const express = require("express");
const db = require("../database.js");
const bcrypt = require("bcrypt");
const router = express.Router();
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const otp = req.body.otp;
  const token = req.body.token

  try {
    const decoded = await jwt.verify(token, otp);
    const data = decoded.data;
    const secretLen = jwtSecret.length;
    const retrievedUsername = data.slice(secretLen);

    if (retrievedUsername !== username) {
      return res.json({ success: false, error: "You're not authorised" });
    }

    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);


    if (checkResult.rows.length > 0) {
      res.json({ error: "This Username is taken, try with another.", success: false });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          res.json({ success: false, error: err });
        } else {
          const result = await db.query(
            "INSERT INTO users (username,email, password) VALUES ($1, $2,$3) RETURNING *",
            [username, email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            if (err) res.json({ success: false, error: "Server error" });
            else {
              req.io.emit('logIn', {
                message: "log in successfully"
              })
              res.json({ success: true, error: "nothing" });
            }
          });
        }
      });
    }
  } catch (err) {
    res.json({ success: false, error: err });
  }
});
module.exports = router;