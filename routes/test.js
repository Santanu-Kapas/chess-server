const router = require("express").Router()
const db = require("../database.js")
router.post("/test", async (req, res) => {
    try {
        await db.query("insert into times (time) values (to_timestamp($1))", [Date.now() / 1000.0]);
        return res.json({ hello: true })
    } catch (error) {
        console.log(error)
    }
})

module.exports = router;