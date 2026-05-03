const express = require("express");
const path = require("path");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
app.use(express.static(path.join(__dirname, "..", "client")));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "game_board.html"));
});
const clientConnections = {};
let clientIdWaitingMatch = [];


// rl.question("Введите значение переменной num: " + "\n", (answer) => {
//   num = parseInt(answer);
//   rl.close();
// });

io.on("connection", socket => {
  const clientId = createClientId();
	console.log("подключился игрок "+ clientId);
  clientConnections[clientId] = socket;

  socket.on("message", message => {
    let moveData = message;
    moveData.num = clientIdCounter;
    // Отправить информацию о перемещении карты другим клиентам
    if (moveData.method == "Start"){
			matchClients(clientIdCounter);
		}
    else if (moveData.method == "StartGame") { 
      io.emit("message", moveData);
    }
		else{
			socket.broadcast.emit("message", moveData);
		}
		
  });
	
});
server.listen(8080, () => {
  //console.log('Server started');
});

function matchClients(clientId) {
	let coutner = 1;
	while(coutner<=clientId){
		clientIdWaitingMatch.push(coutner);
		coutner+=1;
	};

  if (clientIdCounter == 2) {
    const firstClientId = clientIdWaitingMatch.shift();
    const secondClientId = clientIdWaitingMatch.shift();

    clientConnections[firstClientId].emit("message", {
      method: "1",
      fl: false,
      num: clientId
    });
    clientConnections[secondClientId].emit("message", {
      method: "2Players",
      fl: true
    });
		console.log("отправлено двум игрокам");
  }
  if (clientIdCounter == 3) {
    const firstClientId = clientIdWaitingMatch.shift();
    const secondClientId = clientIdWaitingMatch.shift();
    const thirdClientId = clientIdWaitingMatch.shift();

    clientConnections[firstClientId].emit("message", {
      method: "1",
      fl: false,
      num: clientId
    });
    clientConnections[secondClientId].emit("message", {
      method: "3Players",
      fl: "2player"
    });
    clientConnections[thirdClientId].emit("message", {
      method: "3Players",
      fl: "3player"
    });
		console.log("отправлено трем игрокам");
  }
}
let clientIdCounter = 0;
function createClientId() {
  clientIdCounter++;
  return clientIdCounter;
}