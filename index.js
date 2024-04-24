const express = require("express");
const db = require("./database.js");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const { createServer } = require("http");
const path = require("path");
const initializeSocket = require('./socket/socketManager.js');
require('dotenv').config();

db.connect();

const port = process.env.PORT_NUMBER;
const host = process.env.FRONTEND_HOST;
const app = express();

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 * 5, // 5 days
      rolling: true
    }
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

const server = createServer(app);
const io = initializeSocket(server);

app.use(express.static(path.join(__dirname, 'chess-client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'chess-client/build', 'index.html'));
});

app.use("/api", require("./routes/login.js"));
app.use("/api", require("./routes/register.js"));
app.use("/api", require("./routes/generateOtp.js"));
app.use("/api", require("./routes/resetPassword.js"));
app.use("/api", require("./routes/logout.js"));
app.use("/api", require("./routes/credentials.js"));
app.use("/api", require("./routes/uploadOrDeletePhoto.js"));
app.use("/api", require("./routes/generateGameID.js"));
app.use("/api", require("./routes/friendList.js"));
app.use("/api", require("./routes/addFriend.js"));
app.use("/api", require("./routes/acceptRequest.js"));
app.use("/api", require("./routes/rejectRequest.js"));
app.use("/api", require("./routes/removeFriend.js"));
app.use("/api", require("./routes/unsendRequest.js"));
app.use("/api", require("./routes/pendingData.js"));
app.use("/api", require("./routes/friendData.js"));
app.use("/api", require("./routes/commentStatus.js"));
app.use("/api", require("./routes/commentSubmit.js"));
app.use("/api", require("./routes/commentFeed.js"));
app.use("/api", require("./routes/gameHistorySave.js"));
app.use("/api", require("./routes/gameHistoryFeed.js"));
app.use("/api", require("./routes/forgotPassword.js"));
app.use("/api", require("./routes/test.js"));

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});