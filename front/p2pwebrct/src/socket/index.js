import {io} from 'socket.io-client';

const options = {
  "force new connection": true,
  reconnectionAttempts: "Infinity", // avoid having user reconnect manually in order to prevent dead clients after a server restart
  timeout : 10000, // before connect_error and connect_timeout are emitted.
  transports : ["websocket"]
}

const explicitUrl = process.env.REACT_APP_SOCKET_URL;
// В dev удобно ходить на отдельный порт (локальный сервер), в prod — на тот же домен (через nginx).
const url = explicitUrl
  ? explicitUrl
  : (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "/");

const socket = io(url, options);

export default socket;