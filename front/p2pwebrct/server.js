const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN ? process.env.SOCKET_CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const {version, validate} = require('uuid');

const ACTIONS = require('./src/socket/actions');
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

function getClientRooms() {
  const {rooms} = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4);
}

function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: getClientRooms()
  })
}
io.on('connection', socket => {
	
	//подключение игрока
  // const clientId = createClientId();
	// console.log("подключился игрок "+ clientId);
  // clientConnections[clientId] = socket;

  socket.on("message", message => {
    const moveData = message || {};

    if (moveData.method === "Create") {
      // Совместимость со старым протоколом: запоминаем комнату в сокете.
      socket.data.gameRoomID = typeof moveData.room === 'string' ? moveData.room : socket.data.gameRoomID;
      return;
    }

    if (moveData.method === "Join") {
      // Совместимость со старым протоколом: запоминаем комнату в сокете.
      socket.data.gameRoomID = moveData?.room?.roomID || socket.data.gameRoomID;
      return;
    }

    const roomID = socket.data.gameRoomID;
    if (!roomID) {
      return;
    }

    const roomSize = (io.sockets.adapter.rooms.get(roomID) || new Set()).size;
    moveData.num = roomSize;

    if (moveData.method === "Start") {
      matchClientsInRoom(roomID);
      return;
    }

    const includeSenderMethods = new Set([
      "StartGame",
      "CombatResolved",
      "moveCard",
      "PlayerMeta",
      "CheatAttach",
      "MercenaryAttach",
      "MercenaryDetach",
      "DeathStart",
      "DeathLootTurn",
      "DeathLootPick",
      "DeathLootPicked",
      "DeathLootFinished",
      "DeathLootResumeEscape",
      "DeathLootDropMonsters",
      "MonsterBonusAttach",
      "BadStaffLevel",
      "TreasureLevel",
      "Treasure65LevelSwap",
      "DivineInterventionResolve",
      "OutToLunchResolve",
      "FriendshipPotionResolve",
      "PotionResolve",
      "PotionResolveSingleMonster",
      "IllusionResolve",
      "MateApply",
      "MateTestDeal",
      "OfferHelp",
      "AcceptHelp",
      "EscapeSequenceStart",
      "EscapeMonsterPickStart",
      "EscapeMonsterChosen",
      "EscapeTurnStart",
      "EscapeRollResult",
      "EscapeOwnerTransfer",
      "EscapeHalflingRetryPrompt",
      "EscapeHalflingRetryDecision",
      "HalflingEscapeDiscard",
      "WizardFlightApply",
      "WizardTamingApply",
      "WarriorFrenzyApply",
      "ClericExorcismApply",
      "ThiefTrimApply",
      "ThiefTheftStart",
      "ThiefTheftRoll",
      "ThiefTheftTake",
      "EscapeSequenceFinished",
      "SellTreasures",
    ]);

    if (includeSenderMethods.has(moveData.method)) {
      io.to(roomID).emit("message", moveData);
    } else {
      socket.to(roomID).emit("message", moveData);
    }
  });

  shareRoomsInfo();

  socket.on(ACTIONS.JOIN, config => {
    const {room: roomID} = config;
    const {rooms: joinedRooms} = socket;

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

    clients.forEach(clientID => {
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    socket.join(roomID);
    socket.data.gameRoomID = roomID;
    shareRoomsInfo();
  });

  function leaveRoom() {
    const {rooms} = socket;

    Array.from(rooms)
      // LEAVE ONLY CLIENT CREATED ROOM
      .filter(roomID => validate(roomID) && version(roomID) === 4)
      .forEach(roomID => {

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients
          .forEach(clientID => {
          io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: socket.id,
          });

          socket.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });
        });

        socket.leave(roomID);
      });

    shareRoomsInfo();
  }

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on('disconnecting', leaveRoom);

  socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => {
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    });
  });

});

function matchClientsInRoom(roomID) {
  const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
  const clientCount = clients.length;

  if (clientCount === 2) {
    const [firstClientId, secondClientId] = clients;
    io.to(firstClientId).emit("message", {
      method: "1",
      fl: false,
      num: clientCount
    });
    io.to(secondClientId).emit("message", {
      method: "2Players",
      fl: true,
      num: clientCount
    });
    return;
  }

  if (clientCount === 3) {
    const [firstClientId, secondClientId, thirdClientId] = clients;
    io.to(firstClientId).emit("message", {
      method: "1",
      fl: false,
      num: clientCount
    });
    io.to(secondClientId).emit("message", {
      method: "3Players",
      fl: "2player",
      num: clientCount
    });
    io.to(thirdClientId).emit("message", {
      method: "3Players",
      fl: "3player",
      num: clientCount
    });
  }
}


// let clientIdCounter = 0;
// function createClientId() {
//   clientIdCounter++;
//   return clientIdCounter;
// }




const fs = require('fs');
const mime = require('mime-types');

// В проде после `npm run build` статика лежит в ./build
// В dev (без build) оставляем возможность отдавать ./public как раньше.
const buildPath = path.join(__dirname, 'build');
const publicPath = path.join(__dirname, 'public');
const staticPath = fs.existsSync(buildPath) ? buildPath : publicPath;

app.use(express.static(staticPath, {
  setHeaders: (res, p) => {
    const type = mime.lookup(p);
    if (type) {
      res.set('Content-Type', type);
    }
  }
}));
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

server.listen(PORT, HOST, () => {
  console.log(`Munchkin server started on http://${HOST}:${PORT} (static: ${path.basename(staticPath)})`);
});