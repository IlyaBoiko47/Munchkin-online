import {io} from 'socket.io-client';

const options = {
  "force new connection": true,
  reconnectionAttempts: "Infinity", // avoid having user reconnect manually in order to prevent dead clients after a server restart
  timeout : 10000, // before connect_error and connect_timeout are emitted.
  transports : ["websocket"]
}

// На другом устройстве в LAN `localhost` указывает на то устройство, а не на ПК с сервером.
const socketPort = process.env.REACT_APP_SOCKET_PORT || 3001;
const socketHost =
  typeof window !== "undefined" && window.location && window.location.hostname
    ? window.location.hostname
    : "localhost";
const socket = io(`http://${socketHost}:${socketPort}`, options);

export default socket;