import {io} from 'socket.io-client';

/** В обучении один живой игрок — seat 0; остальные места отвечают автоматически. */
const TUTORIAL_HUMAN_SEAT = 0;

function emitTutorialMessageToHandlers(messageHandlers, data) {
	messageHandlers.forEach((fn) => {
		try {
			fn(data);
		} catch {
			// ignore
		}
	});
}

function forEachTutorialPhantomSeat(callback) {
	const seatCount = Number(window.num) || 2;
	for (let seat = 0; seat < seatCount; seat += 1) {
		if (seat === TUTORIAL_HUMAN_SEAT) {
			continue;
		}
		callback(seat);
	}
}

function autoResolveTutorialPhantomSeats(messageHandlers, buildMessageForSeat) {
	forEachTutorialPhantomSeat((seat) => {
		const msg = buildMessageForSeat(seat);
		if (!msg) {
			return;
		}
		queueMicrotask(() => {
			emitTutorialMessageToHandlers(messageHandlers, msg);
		});
	});
}

/** На странице обучения — сообщения остаются на клиенте (без сервера). */
function createTutorialSocketStub() {
	const messageHandlers = [];
	return {
		emit(event, data) {
			if (event === 'message' && data) {
				if (typeof window !== 'undefined' && window.__TUTORIAL_BOARD) {
					if (data.method === 'BadStaffLevel') {
						window.dispatchEvent(new CustomEvent('munchkin:tutorialBadStaff', { detail: data }));
						return;
					}
					if (data.method === 'Treasure65LevelSwap') {
						window.dispatchEvent(new CustomEvent('munchkin:tutorialTreasure65', { detail: data }));
						return;
					}
					if (data.method === 'TreasureLevel') {
						window.dispatchEvent(new CustomEvent('munchkin:tutorialTreasureLevel', { detail: data }));
						return;
					}
					if (data.method === 'LevelAdjust') {
						window.dispatchEvent(new CustomEvent('munchkin:tutorialLevelAdjust', { detail: data }));
						return;
					}
					if (data.method === 'FoldCount') {
						emitTutorialMessageToHandlers(messageHandlers, data);
						window.FoldCount = Number(window.num) || 2;
						return;
					}
					if (data.method === 'EscapeGluePrompt') {
						emitTutorialMessageToHandlers(messageHandlers, data);
						const wallFlee = new Set(
							(Array.isArray(data.wallFleeSeats) ? data.wallFleeSeats : [])
								.map((s) => Number(s))
								.filter((s) => Number.isFinite(s)),
						);
						autoResolveTutorialPhantomSeats(messageHandlers, (seat) => {
							if (wallFlee.has(seat)) {
								return null;
							}
							return {
								method: 'EscapeGlueDecision',
								key: String(data.key || ''),
								used: false,
								actingSeat: seat,
								targetSeat: data.escapedSeat,
								monsterCardId: data.monsterCardId,
								viaInstantWall: data.viaInstantWall,
								wallFleeSeats: data.wallFleeSeats,
							};
						});
						return;
					}
					if (data.method === 'InstantWallHelperPrompt') {
						emitTutorialMessageToHandlers(messageHandlers, data);
						const helperSeat = Number(data.helperSeat);
						if (Number.isFinite(helperSeat) && helperSeat !== TUTORIAL_HUMAN_SEAT) {
							queueMicrotask(() => {
								emitTutorialMessageToHandlers(messageHandlers, {
									method: 'InstantWallHelperDecision',
									helperSeat,
									loserSeat: data.loserSeat,
									used: false,
									cardId: null,
								});
							});
						}
						return;
					}
					if (data.method === 'PlayerMeta') {
						emitTutorialMessageToHandlers(messageHandlers, data);
						queueMicrotask(() => {
							window.__applyTutorialSeatDisplayNames?.();
						});
						return;
					}
				}
				emitTutorialMessageToHandlers(messageHandlers, data);
				if (window.__TUTORIAL_BOARD && data.method === 'EscapeSequenceFinished') {
					queueMicrotask(() => {
						window.dispatchEvent(new Event('munchkin:tutorialEscapeFinished'));
					});
				}
				if (window.__TUTORIAL_BOARD && data.method === '1') {
					queueMicrotask(() => {
						window.dispatchEvent(new Event('munchkin:tutorialCatalogReady'));
					});
				}
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
  transports: ['websocket', 'polling'],
}

const explicitUrl = process.env.REACT_APP_SOCKET_URL;
// В dev удобно ходить на отдельный порт (локальный сервер), в prod — на тот же домен (через nginx).
const url = explicitUrl
  ? explicitUrl
  : (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "/");

const useTutorialSocket = typeof window !== 'undefined' && window.__TUTORIAL_BOARD;
const socket = useTutorialSocket ? createTutorialSocketStub() : io(url, options);

export default socket;