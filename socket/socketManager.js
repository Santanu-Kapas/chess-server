const { Server } = require("socket.io");
const db = require("../database")

const user2Selection = (data) => {
  if (data === 'white') {
    return 'black';
  } else {
    return 'white';
  }
}

const playWithFriendSelection = new Map();

const playWithFriendBoardPosition = new Map();

function initializeSocket(server) {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_HOST, credentials: true }
  });

  io.on("connection", socket => {

    socket.on("logIn", (data) => {
      const room = data.sessionID;
      socket.join(room);
      socket.join(data.id);
    });

    socket.on("add-friend", (data) => {
      io.to(data.rid).emit("new-friend-request", { sid: data.sid, susername: data.susername, sprofile_photo: data.sprofile_photo });
    })

    socket.on("accept-request", (data) => {
      io.to(data.rid).emit("new-friend", { sid: data.sid, username: data.username, profile_photo: data.profile_photo })
    })

    socket.on("reject-request", (data) => {
      io.to(data.rid).emit("remove-request", { sid: data.sid })
    })

    socket.on("logOut", (data) => {
      const room = data.sessionID;
      socket.to(room).emit("log-out");
    });


    socket.on("game-created", (data) => {
      const gameRoom = data.room;
      socket.join(gameRoom);
      const roomSize = parseInt(socket.adapter.rooms.get(gameRoom).size) || 0;
      if (roomSize > 2) {
        socket.emit("closed", { success: false, data: "Already 2 members joined" });
        socket.leave(gameRoom)
        return
      }
      if (data.userSelection) {
        playWithFriendSelection.set(data.room, data.userSelection);
      }
      const clients = io.sockets.adapter.rooms.get(gameRoom);
      const socketIds = Array.from(clients.keys());
      if (roomSize == 2) {
        socket.to(socketIds[0]).emit("redirect", { data: "Both User Joined" });
      }
      socket.to(socketIds[0]).emit("board-orientation", { orientation: playWithFriendSelection.get(data.room) });
      io.to(socketIds[1]).emit("board-orientation", { orientation: user2Selection(playWithFriendSelection.get(data.room)) });
    });

    socket.on("move", (data) => {
      io.to(data.room).emit("board", { game: data.game, position: data.position, turn: data.turn });
      playWithFriendBoardPosition.set(data.room, data.position)
    });

    socket.on("search-user", async (data) => {
      try {
        const userList = await db.query("select id,username,profile_photo from users where username like $1 || '%';", [data.query]);
        io.to(socket.id).emit("search-user-result", { result: userList.rows })
      }
      catch (err) {
        io.to(socket.id).emit("search-user-result", { error: err.message })
      }
    });

    socket.on("play-with-friend", (data) => {
      const gameRoom = data.room;
      socket.join(gameRoom);
      socket.to(data.rid).emit("new-match-request", { sid: data.sid, susername: data.susername, sprofile_photo: data.sprofile_photo, gameLink: data.gameLink, gameId: data.room })
      playWithFriendSelection.set(data.room, data.userSelection);
    })

    socket.on("game-request-accepted", (data) => {
      const clients = io.sockets.adapter.rooms.get(data.room);
      const socketIds = Array.from(clients.keys());
      socket.to(socketIds[0]).emit("challenge-accepted", { gameLink: data.gameLink });
    })

    socket.on("game-request-rejected", (data) => {
      const clients = io.sockets.adapter.rooms.get(data.room);
      const socketIds = Array.from(clients.keys());
      socket.to(socketIds[0]).emit("challenge-rejected", { id: data.id, username: data.username, profile_photo: data.profile_photo });
      io.of('/').in(data.room).socketsLeave(data.room);
    })

    socket.on("game-request-cancelled", (data) => {
      socket.to(data.rid).emit("game-cancelled", { gameId: data.room });
      io.of('/').in(data.room).socketsLeave(data.room);
    })

  });

  return io;
}

module.exports = initializeSocket;