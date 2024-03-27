const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid')
require('dotenv').config();
const jwt = require('jsonwebtoken')

// Function to encrypt data
function encryptData(data) {
    const token = jwt.sign({
        data
    }, process.env.JWT_SECRET);
    return token;
}

router.get("/generate-game-id", (req, res) => {
    try {
        const uniqueId = uuidv4();
        const expirationTime = 2 * 60;
        const expirationTimestamp = Date.now() + expirationTime * 1000;
        const gameId = encryptData(expirationTimestamp);
        const id = `${uniqueId}?expiry=${gameId}`;
        res.json({ success: true, id, uniqueId });
    } catch (error) {
        res.json({ success: false, error })
    }
});

module.exports = router;