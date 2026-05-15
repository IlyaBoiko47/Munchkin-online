import {io} from 'socket.io-client';

/** На странице обучения — без сервера; emit не уходит в сеть (drag уже на клиенте). */
function createTutorialSocketStub() {
	const messageHandlers = [];
	return {
		emit(event, data) {
			if (event === 'message' && data) {
				messageHandlers.forEach((fn) => {
					try {
						fn(data);
					} catch {
						// ignore
					}
				});
			}
		},
		on(event, fn) {
			if (event === 'message' && typeof fn === 'function') {
				messageHandlers.push(fn);
			}
		},
		off() {},
		connect() {
			return this;
		},
		disconnect() {},
	};
}

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

const socket =
	typeof window !== 'undefined' && window.__TUTORIAL_BOARD
		? createTutorialSocketStub()
		: io(url, options);

export default socket;