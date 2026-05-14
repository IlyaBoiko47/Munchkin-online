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
/** Максимум игроков за столом (2–5). */
const MAX_ROOM_PLAYERS = 5;

function maxSeatIndexForRoom(roomID) {
  const prev = roomStates.get(roomID) || {};
  const n = Math.max(2, Math.min(MAX_ROOM_PLAYERS, Number(prev.num) || 2));
  return n - 1;
}

function normalizeSeatArraysForNum(game, numPlayers) {
  const n = Math.max(2, Math.min(MAX_ROOM_PLAYERS, Math.floor(Number(numPlayers) || 2)));
  const pad = (arr, fill) => {
    const a = Array.isArray(arr) ? arr.slice() : [];
    while (a.length < n) {
      a.push(fill);
    }
    return a.slice(0, n);
  };
  game.levelBySeat = pad(game.levelBySeat, 1).map((x) => Math.max(1, Math.floor(Number(x) || 1)));
  game.warriorFrenzyUsedBySeat = pad(game.warriorFrenzyUsedBySeat, 0).map((x) => Number(x) || 0);
  game.warriorFrenzyBonusBySeat = pad(game.warriorFrenzyBonusBySeat, 0).map((x) => Number(x) || 0);
  game.clericExorcismUsedBySeat = pad(game.clericExorcismUsedBySeat, 0).map((x) => Number(x) || 0);
  game.clericExorcismBonusBySeat = pad(game.clericExorcismBonusBySeat, 0).map((x) => Number(x) || 0);
  game.victimThiefTrimUsedBySeat = pad(game.victimThiefTrimUsedBySeat, 0).map((x) => Number(x) || 0);
  game.thiefBackstabDebuffBySeat = pad(game.thiefBackstabDebuffBySeat, 0).map((x) => Number(x) || 0);
}

// Комнаты, в которых уже стартовала игра (чтобы скрывать их из списка подключения).
// Как только комната станет пустой — убираем флаг.
const startedRooms = new Set();
// Авторитетное состояние комнаты для восстановления после refresh.
// roomID -> { started, num, deckDoors, deckTreasure, cards, cheatAttachments, hirelingAttachments, monsterBonusAttachments, game, playerMetaBySeat? }
const roomStates = new Map();
// Привязка “токен игрока” -> seat в комнате.
// roomID -> Map(token -> seat)
const roomSeatsByToken = new Map();
// Отображаемое имя комнаты (не UUID), задаётся при Create.
// roomID -> string
const roomDisplayNames = new Map();

function sanitizeRoomDisplayName(raw) {
  let s = String(raw || '').trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!s) return 'Комната';
  if (s.length > 48) s = s.slice(0, 48);
  return s;
}

/** Карта «Наёмничек» (treasure40): способностью вора нельзя украсть. */
function isThiefTheftBlockedTreasureCardId(cardId) {
  return String(cardId || '').trim() === 'treasure40';
}

/** 10-й уровень только с победы в бою или «божественного вмешательства». */
const WINNING_LEVEL_THRESHOLD = 10;

function cloneAndShuffleDeck(deck) {
  const copy = Array.isArray(deck) ? deck.slice() : [];
  shuffleArrayInPlace(copy);
  return copy;
}

/** Новый уровень при запрещённых источниках (карты «+уровень», «укради уровень», продажа и т.д.): не выше 9. */
function applyLevelDeltaRespectingWinRule(cur, delta, allowWinningLevel) {
  const c = Math.max(1, Math.floor(Number(cur) || 1));
  const d = Number(delta) || 0;
  let next = Math.max(1, c + d);
  if (d > 0 && !allowWinningLevel && next >= WINNING_LEVEL_THRESHOLD) {
    next = WINNING_LEVEL_THRESHOLD - 1;
  }
  return next;
}

function collectWinningSeatsFromLevels(levelBySeat) {
  if (!Array.isArray(levelBySeat)) {
    return [];
  }
  const out = [];
  levelBySeat.forEach((lvl, i) => {
    if (Number(lvl) >= WINNING_LEVEL_THRESHOLD) {
      out.push(i);
    }
  });
  return out;
}

function checkGameVictory(roomID) {
  const prev = roomStates.get(roomID);
  if (!prev || !prev.game) {
    return;
  }
  const game = prev.game;
  if (game.gameFinished) {
    return;
  }
  const winners = collectWinningSeatsFromLevels(game.levelBySeat);
  if (winners.length === 0) {
    return;
  }
  game.gameFinished = true;
  roomStates.set(roomID, { ...prev, game });
  io.to(roomID).emit('message', { method: 'GameVictory', winners });
}

/**
 * Старт/перезапуск стола: StartGame + раздача + регистрация остатка колод в state.cards.
 */
function dealFromShuffledDecks(roomID, state, doors, treasures, numPlayers, opts) {
  const restarted = Boolean(opts && opts.restarted);
  startedRooms.add(roomID);
  state.started = true;
  state.cards = {};
  state.monsterBonusAttachments = {};
  state.deckDoors = doors;
  state.deckTreasure = treasures;
  state.num = numPlayers;
  state.game = getOrInitRoomGameState(roomID);
  if (state.game && typeof state.game === 'object') {
    state.game.turnPhase = {};
    state.game.timerRunning = false;
    state.game.gameFinished = false;
    state.game.openModalsBySeat = {};
    state.game.myBonus = 0;
    state.game.monsterBasePower = 0;
    normalizeSeatArraysForNum(state.game, numPlayers);
  }

  io.to(roomID).emit("message", {
    method: "StartGame",
    num: numPlayers,
    deckDoors: doors,
    deckTreasure: treasures,
    restarted,
  });

  const doorHandZoneForIndex = (i) => {
    if (numPlayers === 2) return (i % 2 === 0) ? "myhand" : "opponenthand";
    if (numPlayers === 3) return (i % 3 === 0) ? "myhand" : (i % 3 === 1) ? "opponent2hand" : "opponent3hand";
    if (numPlayers === 4) {
      const r = i % 4;
      if (r === 0) return "myhand";
      if (r === 1) return "opponent2hand";
      if (r === 2) return "opponent3hand";
      return "opponenthand";
    }
    if (numPlayers === 5) {
      const r = i % 5;
      if (r === 0) return "myhand";
      if (r === 1) return "opponent_bl_hand";
      if (r === 2) return "opponent2hand";
      if (r === 3) return "opponent3hand";
      return "opponenthand";
    }
    return "myhand";
  };
  const treasureHandZoneForIndex = doorHandZoneForIndex;

  const dealCount = 4 * numPlayers;

  for (let i = 0; i < dealCount && i < doors.length; i += 1) {
    const cardId = String(doors[i]?.name || doors[i]?.id || doors[i]);
    if (!cardId) continue;
    const zoneId = doorHandZoneForIndex(i);
    state.cards[cardId] = { zoneId, targetId: null };
    io.to(roomID).emit("message", { method: "moveCard", cardId, targetId: null, zoneId, fromZoneId: "zone_doors" });
  }
  for (let i = 0; i < dealCount && i < treasures.length; i += 1) {
    const cardId = String(treasures[i]?.name || treasures[i]?.id || treasures[i]);
    if (!cardId) continue;
    const zoneId = treasureHandZoneForIndex(i);
    state.cards[cardId] = { zoneId, targetId: null };
    io.to(roomID).emit("message", { method: "moveCard", cardId, targetId: null, zoneId, fromZoneId: "zone_treasure" });
  }

  let prevDoorInDeck = null;
  for (let i = dealCount; i < doors.length; i += 1) {
    const cardId = String(doors[i]?.name || doors[i]?.id || doors[i]);
    if (!cardId) continue;
    state.cards[cardId] = { zoneId: 'zone_doors', targetId: prevDoorInDeck };
    prevDoorInDeck = cardId;
  }
  let prevTreasureInDeck = null;
  for (let i = dealCount; i < treasures.length; i += 1) {
    const cardId = String(treasures[i]?.name || treasures[i]?.id || treasures[i]);
    if (!cardId) continue;
    state.cards[cardId] = { zoneId: 'zone_treasure', targetId: prevTreasureInDeck };
    prevTreasureInDeck = cardId;
  }

  roomStates.set(roomID, state);
}

function getOrInitRoomGameState(roomID) {
  const prev = roomStates.get(roomID) || {};
  const game = (prev.game && typeof prev.game === 'object') ? prev.game : {};
  // Дефолты для восстановления после refresh.
  const nPlayers = Math.max(2, Math.min(MAX_ROOM_PLAYERS, Number(prev.num) || 2));
  normalizeSeatArraysForNum(game, nPlayers);
  if (typeof game.myBonus !== 'number') game.myBonus = 0;
  if (typeof game.monsterBasePower !== 'number') game.monsterBasePower = 0;
  if (typeof game.gameFinished !== 'boolean') game.gameFinished = false;
  roomStates.set(roomID, { ...prev, game });
  return game;
}

function clampSeatInRoom(roomID, seat) {
  const prev = roomStates.get(roomID) || {};
  const numPlayers = Math.max(1, Math.min(MAX_ROOM_PLAYERS, Number(prev.num) || 3));
  // Важно: Number(null) === 0 — без проверки «пустого» места штрафы могли уходить не туда.
  if (seat === null || seat === undefined || seat === '') {
    return null;
  }
  const s = Number(seat);
  if (!Number.isFinite(s) || s < 0 || s >= numPlayers) return null;
  return Math.floor(s);
}

function getLevelBySeatFromGame(game, seat) {
  const s = Number(seat);
  const cur = Array.isArray(game?.levelBySeat) ? Number(game.levelBySeat[s] || 1) : 1;
  return Math.max(1, Math.floor(Number.isFinite(cur) ? cur : 1));
}

function setLevelBySeatInGame(game, seat, level) {
  const s = Number(seat);
  const next = Math.max(1, Math.floor(Number(level) || 1));
  if (!Array.isArray(game.levelBySeat)) {
    game.levelBySeat = [];
  }
  while (game.levelBySeat.length <= s) {
    game.levelBySeat.push(1);
  }
  game.levelBySeat[s] = next;
}

function discardZoneIdForCardId(cardId) {
  const id = String(cardId || '').trim();
  if (!id) return null;
  if (id.includes('treasure')) return 'zone_treasure_drop';
  if (id.includes('door')) return 'zone_doors_drop';
  return null;
}

/** Те же id зон руки, что при начальной раздаче (см. shuffleDeck). */
function handZoneIdForSeatInRoom(roomID, seat) {
  const prev = roomStates.get(roomID) || {};
  const numPlayers = Number(prev.num) || 0;
  const s = Number(seat);
  if (!Number.isFinite(s) || s < 0 || numPlayers <= 0) return 'myhand';
  if (numPlayers === 2) return (s % 2 === 0) ? 'myhand' : 'opponenthand';
  if (numPlayers === 3) return (s % 3 === 0) ? 'myhand' : ((s % 3 === 1) ? 'opponent2hand' : 'opponent3hand');
  if (numPlayers === 4) {
    const r = s % 4;
    if (r === 0) return 'myhand';
    if (r === 1) return 'opponent2hand';
    if (r === 2) return 'opponent3hand';
    return 'opponenthand';
  }
  if (numPlayers === 5) {
    const r = s % 5;
    if (r === 0) return 'myhand';
    if (r === 1) return 'opponent_bl_hand';
    if (r === 2) return 'opponent2hand';
    if (r === 3) return 'opponent3hand';
    return 'opponenthand';
  }
  return 'myhand';
}

function patchRoomCardEntries(roomID, entries) {
  if (!Array.isArray(entries) || !entries.length) return;
  const prev = roomStates.get(roomID) || {};
  const cards = prev.cards && typeof prev.cards === 'object' ? { ...prev.cards } : {};
  let nextMba = prev.monsterBonusAttachments && typeof prev.monsterBonusAttachments === 'object' ? { ...prev.monsterBonusAttachments } : {};
  entries.forEach((e) => {
    const cardId = String(e?.cardId || '').trim();
    const zoneId = String(e?.zoneId || '').trim();
    if (!cardId || !zoneId) return;
    let targetId = e?.targetId ? String(e.targetId) : null;

    // Если карта кладётся в сброс без targetId, вычисляем его на сервере,
    // чтобы после refresh порядок "последних сбросов" восстанавливался корректно.
    if (!targetId && (zoneId === 'zone_doors_drop' || zoneId === 'zone_treasure_drop')) {
      const keys = Object.keys(cards);
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        if (!k || k === cardId) continue;
        const pos = cards[k];
        if (pos && String(pos.zoneId || '') === zoneId) {
          targetId = k;
          break;
        }
      }
    }
    // ВАЖНО: сохраняем порядок "последних перемещений" для корректного восстановления после refresh.
    // В JS порядок ключей объекта сохраняется; чтобы обновить позицию карты в этом порядке,
    // удаляем ключ и добавляем заново.
    if (Object.prototype.hasOwnProperty.call(cards, cardId)) {
      delete cards[cardId];
    }
    cards[cardId] = { zoneId, targetId };
    if (zoneId !== 'zone_monster') delete nextMba[cardId];
  });
  roomStates.set(roomID, {
    ...prev,
    cards,
    monsterBonusAttachments: nextMba,
    started: startedRooms.has(roomID) || prev.started,
  });
}

function patchRoomDiscards(roomID, cardIds) {
  const prev = roomStates.get(roomID) || {};
  // Берём текущий порядок карт (ключи объекта) как "хронологию" последних перемещений.
  // Это позволяет вычислить targetId так, чтобы "последняя сброшенная" оказалась сверху после refresh.
  const cards = prev.cards && typeof prev.cards === 'object' ? { ...prev.cards } : {};

  const entries = [];
  (Array.isArray(cardIds) ? cardIds : []).forEach((raw) => {
    const id = String(raw || '').trim();
    const z = discardZoneIdForCardId(id);
    if (!id || !z) return;

    // Ищем последнюю карту, уже лежащую в нужном сбросе (по порядку ключей объекта).
    let targetId = null;
    const keys = Object.keys(cards);
    for (let i = keys.length - 1; i >= 0; i--) {
      const k = keys[i];
      if (!k || k === id) continue;
      const pos = cards[k];
      if (pos && String(pos.zoneId || '') === z) {
        targetId = k;
        break;
      }
    }

    // Обновляем локальную копию cards в том же порядке, как это сделает patchRoomCardEntries,
    // чтобы следующая карта в списке сбрасывалась "поверх" предыдущей.
    if (Object.prototype.hasOwnProperty.call(cards, id)) {
      delete cards[id];
    }
    cards[id] = { zoneId: z, targetId };

    entries.push({ cardId: id, zoneId: z, targetId });
  });

  patchRoomCardEntries(roomID, entries);
  return entries;
}

/** Fisher–Yates shuffle in place. */
function shuffleArrayInPlace(arr) {
  const a = Array.isArray(arr) ? arr : [];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/**
 * Если колода пуста, а в сбросе есть карты того же типа — перемешиваем сброс и кладём в колоду.
 * @param {'doors'|'treasure'} deckKind
 */
function maybeRefillDeckFromDiscard(roomID, deckKind) {
  const prev = roomStates.get(roomID);
  if (!prev || !prev.started) {
    return;
  }
  const cards = prev.cards && typeof prev.cards === 'object' ? prev.cards : {};
  const deckZoneId = deckKind === 'doors' ? 'zone_doors' : 'zone_treasure';
  const dropZoneId = deckKind === 'doors' ? 'zone_doors_drop' : 'zone_treasure_drop';
  const idMatches = (id) => {
    const s = String(id || '').trim();
    if (!s || s === 'card') {
      return false;
    }
    return deckKind === 'doors' ? s.includes('door') : s.includes('treasure');
  };

  let inDeck = 0;
  Object.keys(cards).forEach((id) => {
    const p = cards[id];
    if (p && String(p.zoneId || '') === deckZoneId && idMatches(id)) {
      inDeck += 1;
    }
  });
  if (inDeck > 0) {
    return;
  }

  const discardIds = [];
  Object.keys(cards).forEach((id) => {
    const p = cards[id];
    if (p && String(p.zoneId || '') === dropZoneId && idMatches(id)) {
      discardIds.push(id);
    }
  });
  if (discardIds.length === 0) {
    return;
  }

  shuffleArrayInPlace(discardIds);

  const entries = [];
  let prevId = null;
  discardIds.forEach((cardId) => {
    entries.push({ cardId, zoneId: deckZoneId, targetId: prevId });
    prevId = cardId;
  });
  patchRoomCardEntries(roomID, entries);
  const room = roomID;
  queueMicrotask(() => {
    entries.forEach((e) => {
      io.to(room).emit('message', {
        method: 'moveCard',
        cardId: e.cardId,
        targetId: e.targetId,
        zoneId: e.zoneId,
        fromZoneId: dropZoneId,
      });
    });
  });
}

function isCardInDoorOrTreasureDiscard(roomID, cardId) {
  const prev = roomStates.get(roomID) || {};
  const cards = prev.cards && typeof prev.cards === 'object' ? prev.cards : {};
  const pos = cards[String(cardId || '').trim()];
  if (!pos) {
    return false;
  }
  const z = String(pos.zoneId || '');
  return z === 'zone_doors_drop' || z === 'zone_treasure_drop';
}

const WAND_OF_DOWSING_CARD_ID = 'treasure46';
const TRANSFERRAL_POTION_CARD_ID = 'treasure58';

function isWandOfDowsingActivatableZone(zoneId) {
  const z = String(zoneId || '');
  if (z === 'zone_monster' || z === 'zone3') {
    return true;
  }
  return (
    z === 'zone2'
    || z === 'zone5'
    || z === 'zone_opponent'
    || z === 'zone_opponent2'
    || z === 'zone_opponent3'
    || z === 'zone_opponent_bl'
  );
}

function getClientRooms() {
  const {rooms} = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4 && !startedRooms.has(roomID));
}

function buildRoomsPayloadForShare() {
  return getClientRooms().map((roomID) => {
    const players = (io.sockets.adapter.rooms.get(roomID) || new Set()).size;
    return {
      id: roomID,
      name: roomDisplayNames.get(roomID) || 'Комната',
      players,
    };
  });
}

function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: buildRoomsPayloadForShare(),
  });
}

function emitRoomLobbyPlayerCount(roomID) {
  if (!roomID || !validate(roomID) || version(roomID) !== 4) {
    return;
  }
  const size = (io.sockets.adapter.rooms.get(roomID) || new Set()).size;
  io.to(roomID).emit('message', { method: 'RoomLobbyUpdate', connectedPlayers: size, maxPlayers: MAX_ROOM_PLAYERS });
}
io.on('connection', socket => {
	
	//подключение игрока
  // const clientId = createClientId();
	// console.log("подключился игрок "+ clientId);
  // clientConnections[clientId] = socket;

  socket.on("message", message => {
    const moveData = message || {};

    if (moveData.method === "Create") {
      const roomId = typeof moveData.room === 'string' ? moveData.room : null;
      if (roomId && validate(roomId) && version(roomId) === 4) {
        socket.data.gameRoomID = roomId;
        roomDisplayNames.set(roomId, sanitizeRoomDisplayName(moveData.roomName || moveData.displayName));
      } else {
        socket.data.gameRoomID = typeof moveData.room === 'string' ? moveData.room : socket.data.gameRoomID;
      }
      shareRoomsInfo();
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

    if (moveData.method === "PlayerMeta") {
      const seat = Number(moveData.seat);
      const name = String(moveData.name || "").trim();
      const gender =
        moveData.gender === "Male" || moveData.gender === "Female" ? moveData.gender : "";
      const roomN = Math.max(1, Number(moveData.num) || roomSize || 1);
      const maxSeat = roomN - 1;
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeat && name && gender) {
        const prev = roomStates.get(roomID) || {};
        const playerMetaBySeat = {
          ...(prev.playerMetaBySeat && typeof prev.playerMetaBySeat === "object" ? prev.playerMetaBySeat : {}),
          [String(seat)]: { name, gender },
        };
        roomStates.set(roomID, { ...prev, playerMetaBySeat });
      }
    }

    const prevForFinish = roomStates.get(roomID);
    const gameForFinish = prevForFinish?.game;
    if (moveData.method === 'moveCard' && gameForFinish && gameForFinish.gameFinished === true) {
      return;
    }

    if (moveData.method === 'RestartGame') {
      const prev = roomStates.get(roomID) || {};
      const gFin = prev.game && typeof prev.game === 'object' ? prev.game : getOrInitRoomGameState(roomID);
      if (!gFin.gameFinished) {
        return;
      }
      const doors = cloneAndShuffleDeck(Array.isArray(prev.deckDoors) ? prev.deckDoors : []);
      const treasures = cloneAndShuffleDeck(Array.isArray(prev.deckTreasure) ? prev.deckTreasure : []);
      const numPlayers = Math.max(2, Math.min(MAX_ROOM_PLAYERS, Number(prev.num) || Number(roomSize) || 2));
      roomStates.set(roomID, { ...prev, started: true });
      const state = roomStates.get(roomID);
      dealFromShuffledDecks(roomID, state, doors, treasures, numPlayers, { restarted: true });
      shareRoomsInfo();
      return;
    }

    if (moveData.method === "shuffleDeck") {
      // Сохраняем перетасованные колоды, чтобы можно было восстановить карты после refresh.
      const prev = roomStates.get(roomID) || {};
      roomStates.set(roomID, {
        ...prev,
        deckDoors: moveData.deckDoors || prev.deckDoors,
        deckTreasure: moveData.deckTreasure || prev.deckTreasure,
        num: Number(moveData.num) || prev.num || 0,
      });
      // После того как ведущий перемешал колоды — стартуем игру на сервере (авторитетно)
      // и делаем начальную раздачу через moveCard (так сервер сразу знает позиции).
      const state = roomStates.get(roomID) || {};
      const numPlayers = Number(state.num) || Number(roomSize) || 0;
      if (numPlayers >= 2 && Array.isArray(state.deckDoors) && Array.isArray(state.deckTreasure)) {
        dealFromShuffledDecks(roomID, state, state.deckDoors, state.deckTreasure, numPlayers, { restarted: false });
        shareRoomsInfo();
      }
      return;
    }

    if (moveData.method === "Start") {
      startedRooms.add(roomID);
      shareRoomsInfo();
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
      "IncomeTaxStart",
      "IncomeTaxInitiatorPick",
      "IncomeTaxInsufficientDumpSync",
      "IncomeTaxResponderSubmit",
      "IncomeTaxCurseFinished",
      "CurseWishingRingOffer",
      "CurseWishingRingResponse",
      "CurseWishingRingAllSkippedApply",
      "LoseYourClassResolve",
      "MalignMirrorApply",
      "ChangeSexApply",
      "LevelAdjust",
      "TreasureLevel",
      "Treasure65LevelSwap",
      "DivineInterventionResolve",
      "OutToLunchResolve",
      "FriendshipPotionResolve",
      "HalitosisKillDoor68Resolve",
      "PotionResolve",
      "PotionResolveSingleMonster",
      "IllusionResolve",
      "MateApply",
      "MateTestDeal",
      "WandOfDowsingResolve",
      "OfferHelp",
      "AcceptHelp",
      "DissolveBattleHelp",
      "EscapeSequenceStart",
      "EscapeMonsterPickStart",
      "EscapeMonsterChosen",
      "EscapeTurnStart",
      "EscapeCloseAidModals",
      "EscapeRatOnStickApply",
      "EscapeInvisibilityPotionApply",
      "EscapeHirelingApply",
      "EscapeMagicLampBanish",
      "EscapeFailAidPrompt",
      "EscapeFailAidSkip",
      "EscapeLoseHandOrLevelsResolve",
      "InstantWallHelperPrompt",
      "InstantWallHelperWaiting",
      "InstantWallSoloAidWaiting",
      "InstantWallSoloAidClose",
      "InstantWallHelperDecision",
      "InstantWallUse",
      "InstantWallOffer",
      "InstantWallOfferWaiting",
      "InstantWallOfferDecision",
      "EscapeRollResult",
      "EscapeBadStaffDiceRoll",
      "EscapeOwnerTransfer",
      "EscapeHalflingRetryPrompt",
      "EscapeHalflingRetryDecision",
      "HalflingEscapeDiscard",
      "EscapeGluePrompt",
      "EscapeGlueWaiting",
      "EscapeGlueDecision",
      "EscapeGlueClose",
      "WizardFlightApply",
      "WizardTamingApply",
      "WarriorFrenzyApply",
      "ClericExorcismApply",
      "ThiefTrimApply",
      "ThiefTheftStart",
      "ThiefTheftRoll",
      "LoadedDieDiscard",
      "ThiefTheftTake",
      "EscapeSequenceFinished",
      "SellTreasures",
    ]);

    // Полная синхронизация привязок бонусов к монстру (DOM -> сервер), без рассылки всем.
    if (moveData.method === "MonsterBonusState") {
      const prev = roomStates.get(roomID) || {};
      const raw = moveData.attachments && typeof moveData.attachments === 'object' ? moveData.attachments : {};
      const cleaned = {};
      Object.entries(raw).forEach(([k, v]) => {
        const kk = String(k || '').trim();
        const vv = String(v || '').trim();
        if (kk && vv) cleaned[kk] = vv;
      });
      roomStates.set(roomID, { ...prev, monsterBonusAttachments: cleaned });
    }

    // Поддержка восстановления: обновляем положение карт на сервере по каждому moveCard.
    if (moveData.method === "moveCard" && moveData.cardId && moveData.zoneId) {
      const prev = roomStates.get(roomID) || {};
      const cards = prev.cards && typeof prev.cards === 'object' ? prev.cards : {};
      const cid = String(moveData.cardId);
      const zid = String(moveData.zoneId);
      const tid = moveData.targetId ? String(moveData.targetId) : null;
      // ВАЖНО: обновляем порядок ключей так, чтобы "последнее moveCard" было последним в Object.keys().
      // Это нужно для корректного восстановления стека сброса после refresh.
      const nextCards = { ...(cards && typeof cards === 'object' ? cards : {}) };
      if (Object.prototype.hasOwnProperty.call(nextCards, cid)) {
        delete nextCards[cid];
      }
      nextCards[cid] = { zoneId: zid, targetId: tid };
      let nextMba = prev.monsterBonusAttachments && typeof prev.monsterBonusAttachments === 'object' ? { ...prev.monsterBonusAttachments } : {};
      if (zid !== 'zone_monster') {
        delete nextMba[cid];
      }
      roomStates.set(roomID, { ...prev, cards: nextCards, monsterBonusAttachments: nextMba, started: startedRooms.has(roomID) || prev.started });

      maybeRefillDeckFromDiscard(roomID, 'doors');
      maybeRefillDeckFromDiscard(roomID, 'treasure');
    }

    if (moveData.method === "MonsterBonusAttach") {
      const bonus = String(moveData.bonusCardId || '').trim();
      const monster = String(moveData.monsterCardId || '').trim();
      if (bonus && monster) {
        const prev = roomStates.get(roomID) || {};
        const nextMba = { ...(prev.monsterBonusAttachments && typeof prev.monsterBonusAttachments === 'object' ? prev.monsterBonusAttachments : {}), [bonus]: monster };
        roomStates.set(roomID, { ...prev, monsterBonusAttachments: nextMba });
      }
    }

    // Открытые модалки по месту (только для восстановления после refresh).
    if (moveData.method === "RoomUiState") {
      const seatMap = roomSeatsByToken.get(roomID);
      const token = String(socket.data.playerToken || '');
      const seatFromToken = seatMap && token ? seatMap.get(token) : null;
      const seat = Number.isFinite(Number(seatFromToken))
        ? Number(seatFromToken)
        : Number(moveData.seat);
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID)) {
        const game = getOrInitRoomGameState(roomID);
        if (!game.openModalsBySeat || typeof game.openModalsBySeat !== 'object') {
          game.openModalsBySeat = {};
        }
        const ids = Array.isArray(moveData.openModalIds) ? moveData.openModalIds.map((x) => String(x || '').trim()).filter(Boolean) : [];
        game.openModalsBySeat[String(seat)] = ids;
      }
    }

    // Снимок фазы хода/боя/смывки (без рассылки всем).
    if (moveData.method === "TurnStateSync") {
      const game = getOrInitRoomGameState(roomID);
      const tp = moveData.turnPhase && typeof moveData.turnPhase === 'object' ? moveData.turnPhase : null;
      if (tp) {
        try {
          game.turnPhase = JSON.parse(JSON.stringify(tp));
        } catch {
          game.turnPhase = { ...tp };
        }
      }
      return;
    }

    // Сохраняем числовые значения для восстановления (уровни/бонусы/способности).
    if (moveData.method === "UpdateBonus") {
      const game = getOrInitRoomGameState(roomID);
      game.myBonus = Number(moveData.power) || 0;
    }
    if (moveData.method === "UpdateMonster") {
      const game = getOrInitRoomGameState(roomID);
      game.monsterBasePower = Number(moveData.power) || 0;
    }

    if (moveData.method === "CombatResolved") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      const level = Number(moveData.level);
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID) && Number.isFinite(level) && level > 0) {
        game.levelBySeat[seat] = Math.max(1, Math.floor(level));
      }
      const helperSeat = Number(moveData.helperSeat);
      const helperLevel = Number(moveData.helperLevel);
      if (Number.isFinite(helperSeat) && helperSeat >= 0 && helperSeat <= maxSeatIndexForRoom(roomID) && Number.isFinite(helperLevel) && helperLevel > 0) {
        game.levelBySeat[helperSeat] = Math.max(1, Math.floor(helperLevel));
      }
      // после боя таймер не идёт
      game.timerRunning = false;
      queueMicrotask(() => checkGameVictory(roomID));
    }

    if (moveData.method === "TreasureLevel") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      const gain = Number(moveData.level);
      moveData.treasureLevelApplied = false;
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID) && Number.isFinite(gain) && gain > 0) {
        const cur = Number(game.levelBySeat[seat] || 1) || 1;
        const next = applyLevelDeltaRespectingWinRule(cur, gain, false);
        if (next > cur) {
          game.levelBySeat[seat] = next;
          moveData.treasureLevelApplied = true;
        } else {
          const actorSeat = clampSeatInRoom(roomID, moveData.actorSeat);
          const cid = String(moveData.cardId || '').trim();
          if (actorSeat != null && cid) {
            patchRoomCardEntries(roomID, [{ cardId: cid, zoneId: `hand${actorSeat}`, targetId: null }]);
          }
        }
      }
      queueMicrotask(() => checkGameVictory(roomID));
    }

    if (moveData.method === "BadStaffLevel") {
      const game = getOrInitRoomGameState(roomID);
      const seat = clampSeatInRoom(roomID, moveData.seat);
      const bad = moveData.bad_staff;
      const loss = bad && typeof bad === 'object'
        ? (Number(bad.levelLoss) || Number(bad.levels) || 0)
        : 0;
      if (seat != null && loss > 0) {
        const cur = getLevelBySeatFromGame(game, seat);
        setLevelBySeatInGame(game, seat, cur - loss);
      }
    }

    if (moveData.method === "LevelAdjust") {
      const game = getOrInitRoomGameState(roomID);
      const seat = clampSeatInRoom(roomID, moveData.seat);
      const delta = Number(moveData.delta) || 0;
      const allowWinningLevel = Boolean(moveData.allowWinningLevel);
      if (seat != null && Number.isFinite(delta) && delta !== 0) {
        const cur = getLevelBySeatFromGame(game, seat);
        const next = applyLevelDeltaRespectingWinRule(cur, delta, allowWinningLevel);
        setLevelBySeatInGame(game, seat, next);
        const latest = roomStates.get(roomID) || {};
        roomStates.set(roomID, { ...latest, game });
        queueMicrotask(() => checkGameVictory(roomID));
      }
    }

    if (moveData.method === "EscapeLoseHandOrLevelsResolve") {
      const seat = clampSeatInRoom(roomID, moveData.escapePenaltySeat ?? moveData.seat);
      const choice = String(moveData.choice || '').trim();
      if (seat != null) {
        const room = roomID;
        if (choice === 'lose_levels') {
          const loss = Math.max(1, Math.floor(Number(moveData.levelLoss) || 2));
          const game = getOrInitRoomGameState(roomID);
          const cur = getLevelBySeatFromGame(game, seat);
          setLevelBySeatInGame(game, seat, cur - loss);
          const latest = roomStates.get(roomID) || {};
          roomStates.set(roomID, { ...latest, game });
          // Единый путь обновления UI и согласованности с остальными штрафами (как LevelAdjust с клиента).
          queueMicrotask(() => {
            io.to(room).emit('message', { method: 'LevelAdjust', seat, delta: -loss });
          });
        } else if (choice === 'discard_hand') {
          const ids = Array.isArray(moveData.cardIds) ? moveData.cardIds.map((x) => String(x || '').trim()).filter(Boolean) : [];
          if (ids.length) {
            const entries = patchRoomDiscards(roomID, ids);
            queueMicrotask(() => {
              (Array.isArray(entries) ? entries : []).forEach((e) => {
                const cardId = String(e?.cardId || '').trim();
                const zoneId = String(e?.zoneId || '').trim();
                if (!cardId || !zoneId) return;
                io.to(room).emit('message', {
                  method: 'moveCard',
                  cardId,
                  targetId: e?.targetId ? String(e.targetId) : null,
                  zoneId,
                });
              });
            });
          }
        }
      }
    }

    if (moveData.method === "Treasure65LevelSwap") {
      const game = getOrInitRoomGameState(roomID);
      const fromSeat = Number(moveData.fromSeat);
      const toSeat = Number(moveData.toSeat);
      if (
        Number.isFinite(fromSeat) && fromSeat >= 0 && fromSeat <= maxSeatIndexForRoom(roomID)
        && Number.isFinite(toSeat) && toSeat >= 0 && toSeat <= maxSeatIndexForRoom(roomID)
      ) {
        const fromLevel = Number(game.levelBySeat[fromSeat] || 1) || 1;
        const toLevel = Number(game.levelBySeat[toSeat] || 1) || 1;
        game.levelBySeat[fromSeat] = applyLevelDeltaRespectingWinRule(fromLevel, 1, false);
        game.levelBySeat[toSeat] = Math.max(1, Math.floor(toLevel - 1));
      }
      queueMicrotask(() => checkGameVictory(roomID));
    }

    if (moveData.method === "ThiefTheftRoll") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      const v = Number(moveData.value);
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID) && Number.isFinite(v) && v > 0 && v < 4) {
        const cur = Number(game.levelBySeat[seat] || 1) || 1;
        game.levelBySeat[seat] = Math.max(1, Math.floor(cur - 1));
      }
    }

    if (moveData.method === "WarriorFrenzyApply") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID)) {
        const already = Number(game.warriorFrenzyUsedBySeat[seat] || 0) || 0;
        const remaining = Math.max(0, 3 - already);
        const gain = Math.max(0, Math.min(remaining, Array.isArray(moveData.cardIds) ? moveData.cardIds.length : 0));
        game.warriorFrenzyUsedBySeat[seat] = already + gain;
        game.warriorFrenzyBonusBySeat[seat] = (Number(game.warriorFrenzyBonusBySeat[seat] || 0) || 0) + gain;
      }
      patchRoomDiscards(roomID, Array.isArray(moveData.cardIds) ? moveData.cardIds : []);
    }

    if (moveData.method === "ClericExorcismApply") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID)) {
        const already = Number(game.clericExorcismUsedBySeat[seat] || 0) || 0;
        const remaining = Math.max(0, 3 - already);
        const gain = Math.max(0, Math.min(remaining, Array.isArray(moveData.cardIds) ? moveData.cardIds.length : 0));
        game.clericExorcismUsedBySeat[seat] = already + gain;
        game.clericExorcismBonusBySeat[seat] = (Number(game.clericExorcismBonusBySeat[seat] || 0) || 0) + gain;
      }
      patchRoomDiscards(roomID, Array.isArray(moveData.cardIds) ? moveData.cardIds : []);
    }

    if (moveData.method === "ThiefTrimApply") {
      const game = getOrInitRoomGameState(roomID);
      const assignments = Array.isArray(moveData.assignments) ? moveData.assignments : [];
      assignments.forEach((a) => {
        const victimSeat = Number(a?.victimSeat);
        if (Number.isFinite(victimSeat) && victimSeat >= 0 && victimSeat <= maxSeatIndexForRoom(roomID)) {
          game.victimThiefTrimUsedBySeat[victimSeat] = 1;
          game.thiefBackstabDebuffBySeat[victimSeat] = (Number(game.thiefBackstabDebuffBySeat[victimSeat] || 0) || 0) + 2;
        }
      });
      const trimIds = assignments.map((a) => a && a.cardId).filter(Boolean);
      patchRoomDiscards(roomID, trimIds);
    }

    if (moveData.method === "WizardFlightApply") {
      patchRoomDiscards(roomID, Array.isArray(moveData.cardIds) ? moveData.cardIds : []);
    }

    if (moveData.method === "WizardTamingApply") {
      const handIds = Array.isArray(moveData.handCardIds) ? moveData.handCardIds : [];
      const monsterId = String(moveData.monsterCardId || '').trim();
      const combined = [...handIds.map(String), ...(monsterId ? [monsterId] : [])];
      patchRoomDiscards(roomID, combined);
    }

    if (moveData.method === "ThiefTheftStart") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "ThiefTheftTake") {
      const thiefSeat = Number(moveData.thiefSeat);
      const cardId = String(moveData.cardId || '').trim();
      if (
        Number.isFinite(thiefSeat)
        && thiefSeat >= 0
        && thiefSeat <= maxSeatIndexForRoom(roomID)
        && cardId
        && !isThiefTheftBlockedTreasureCardId(cardId)
      ) {
        patchRoomCardEntries(roomID, [{ cardId, zoneId: handZoneIdForSeatInRoom(roomID, thiefSeat), targetId: null }]);
      }
    }

    if (moveData.method === "HalflingEscapeDiscard") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "EscapeRatOnStickApply") {
      const ratId = String(moveData.ratCardId || '').trim();
      if (ratId) patchRoomDiscards(roomID, [ratId]);
    }

    if (moveData.method === "EscapeInvisibilityPotionApply") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "EscapeHirelingApply") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) {
        const prev = roomStates.get(roomID) || {};
        const h = prev.hirelingAttachments && typeof prev.hirelingAttachments === 'object' ? { ...prev.hirelingAttachments } : {};
        const trId = String(h[cid] || '').trim();
        delete h[cid];
        roomStates.set(roomID, { ...prev, hirelingAttachments: h });
        patchRoomDiscards(roomID, [cid, trId].filter(Boolean));
      }
    }
    
    if (moveData.method === "EscapeMagicLampBanish") {
      const cid = String(moveData.cardId || '').trim();
      const mon = String(moveData.monsterCardId || '').trim();
      patchRoomDiscards(roomID, [cid, mon].filter(Boolean));
    }

    if (moveData.method === "LoadedDieDiscard") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "EscapeGlueDecision") {
      const used = Boolean(moveData.used);
      const cid = String(moveData.cardId || '').trim();
      if (used && cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "InstantWallHelperDecision") {
      const used = Boolean(moveData.used);
      const cid = String(moveData.cardId || '').trim();
      if (used && cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "InstantWallUse") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "DivineInterventionResolve") {
      const seatMap = roomSeatsByToken.get(roomID);
      const token = String(socket.data.playerToken || '');
      const actorSeat = seatMap && token ? seatMap.get(token) : null;
      if (Number(actorSeat) !== 0) {
        return;
      }
      const prev = roomStates.get(roomID) || {};
      if (prev.game && prev.game.gameFinished === true) {
        return;
      }
      const cid = String(moveData.cardId || '').trim();
      const clericSeats = Array.isArray(moveData.clericSeats)
        ? moveData.clericSeats.map((x) => Number(x)).filter((s) => Number.isFinite(s) && s >= 0 && s <= maxSeatIndexForRoom(roomID))
        : [];
      const game = getOrInitRoomGameState(roomID);
      clericSeats.forEach((s) => {
        const cur = getLevelBySeatFromGame(game, s);
        setLevelBySeatInGame(game, s, applyLevelDeltaRespectingWinRule(cur, 1, true));
      });
      const latest = roomStates.get(roomID) || {};
      roomStates.set(roomID, { ...latest, game });
      if (cid) {
        patchRoomDiscards(roomID, [cid]);
      }
      queueMicrotask(() => checkGameVictory(roomID));
    }

    if (moveData.method === "PotionResolve") {
      const ids = [moveData.potionCardId, moveData.monsterCardId]
        .map((x) => String(x || '').trim())
        .filter(Boolean);
      patchRoomDiscards(roomID, ids);
    }

    if (moveData.method === "IllusionResolve") {
      const illusionCardId = String(moveData.illusionCardId || '').trim();
      const discardMonsterId = String(moveData.discardMonsterId || '').trim();
      const addMonsterId = String(moveData.addMonsterId || '').trim();
      patchRoomDiscards(roomID, [illusionCardId, discardMonsterId].filter(Boolean));
      if (addMonsterId) {
        patchRoomCardEntries(roomID, [{ cardId: addMonsterId, zoneId: 'zone_monster', targetId: null }]);
      }
    }

    if (moveData.method === "SellTreasures") {
      const game = getOrInitRoomGameState(roomID);
      const seat = clampSeatInRoom(roomID, moveData.seat);
      const totalCost = Number(moveData.totalCost);
      if (seat != null && Number.isFinite(totalCost) && totalCost >= 0) {
        const levelGain = Math.floor(Math.max(0, totalCost) / 1000);
        if (levelGain > 0) {
          const cur = getLevelBySeatFromGame(game, seat);
          setLevelBySeatInGame(game, seat, applyLevelDeltaRespectingWinRule(cur, levelGain, false));
          queueMicrotask(() => checkGameVictory(roomID));
        }
      }
      patchRoomDiscards(roomID, Array.isArray(moveData.cardIds) ? moveData.cardIds : []);
    }

    if (moveData.method === "BadStaffLevel") {
      const bad = moveData.bad_staff;
      const badType = bad && typeof bad === 'object' ? String(bad.type || '').trim() : '';
      if (badType !== 'chicken on your head' && badType !== 'income tax') {
        const cid = String(moveData.cardId || '').trim();
        if (cid) patchRoomDiscards(roomID, [cid]);
      }
    }

    if (moveData.method === "IncomeTaxInitiatorPick") {
      const tid = String(moveData.treasureId || '').trim();
      if (tid) patchRoomDiscards(roomID, [tid]);
    }

    if (moveData.method === "IncomeTaxInsufficientDumpSync") {
      const seat = clampSeatInRoom(roomID, moveData.seat);
      const ids = Array.isArray(moveData.cardIds) ? moveData.cardIds.map((x) => String(x || '').trim()).filter(Boolean) : [];
      if (seat != null) {
        if (ids.length) {
          patchRoomDiscards(roomID, ids);
        }
        const game = getOrInitRoomGameState(roomID);
        const cur = getLevelBySeatFromGame(game, seat);
        setLevelBySeatInGame(game, seat, cur - 1);
        const latest = roomStates.get(roomID) || {};
        roomStates.set(roomID, { ...latest, game });
      }
    }

    if (moveData.method === "IncomeTaxResponderSubmit") {
      patchRoomDiscards(roomID, Array.isArray(moveData.cardIds) ? moveData.cardIds : []);
    }

    if (moveData.method === "IncomeTaxCurseFinished") {
      const cid = String(moveData.curseCardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "CurseWishingRingResponse") {
      const useRing = Boolean(moveData.useRing);
      const curseCardId = String(moveData.curseCardId || '').trim();
      const ringCardId = String(moveData.ringCardId || '').trim();
      if (useRing && curseCardId && ringCardId) {
        patchRoomDiscards(roomID, [curseCardId, ringCardId].filter(Boolean));
      }
    }

    if (moveData.method === "CurseWishingRingAllSkippedApply") {
      const curseCardId = String(moveData.curseCardId || '').trim();
      const incomeTax = Boolean(moveData.incomeTax);
      if (!incomeTax) {
        const game = getOrInitRoomGameState(roomID);
        const seat = clampSeatInRoom(roomID, moveData.curseTargetSeat);
        const bad = moveData.bad_staff;
        const loss = bad && typeof bad === 'object'
          ? (Number(bad.levelLoss) || Number(bad.levels) || 0)
          : 0;
        if (seat != null && loss > 0) {
          const cur = getLevelBySeatFromGame(game, seat);
          setLevelBySeatInGame(game, seat, cur - loss);
        }
        const badType = bad && typeof bad === 'object' ? String(bad.type || '').trim() : '';
        if (badType !== 'chicken on your head' && badType !== 'income tax' && curseCardId) {
          patchRoomDiscards(roomID, [curseCardId]);
        }
      }
    }

    if (moveData.method === "TreasureLevel") {
      if (moveData.treasureLevelApplied) {
        const cid = String(moveData.cardId || '').trim();
        if (cid) patchRoomDiscards(roomID, [cid]);
      }
    }

    if (moveData.method === "Treasure65LevelSwap") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "MateTestDeal") {
      const seat = Number(moveData.seat);
      const cardId = String(moveData.cardId || '').trim();
      if (Number.isFinite(seat) && seat >= 0 && seat <= maxSeatIndexForRoom(roomID) && cardId) {
        patchRoomCardEntries(roomID, [{ cardId, zoneId: handZoneIdForSeatInRoom(roomID, seat), targetId: null }]);
      }
    }

    if (moveData.method === "WandOfDowsingResolve") {
      const wandId = String(moveData.wandCardId || '').trim();
      const pickedId = String(moveData.pickedCardId || '').trim();
      const actorSeat = Number(moveData.actorSeat);
      if (wandId !== WAND_OF_DOWSING_CARD_ID || !Number.isFinite(actorSeat) || actorSeat < 0 || actorSeat > maxSeatIndexForRoom(roomID)) {
        // ignore invalid
      } else {
        const prev = roomStates.get(roomID) || {};
        const cards = prev.cards && typeof prev.cards === 'object' ? prev.cards : {};
        const wandPos = cards[wandId];
        const wz = wandPos ? String(wandPos.zoneId || '') : '';
        if (wandPos && isWandOfDowsingActivatableZone(wz)) {
          const entries = [];
          if (pickedId && isCardInDoorOrTreasureDiscard(roomID, pickedId)) {
            entries.push({ cardId: pickedId, zoneId: handZoneIdForSeatInRoom(roomID, actorSeat), targetId: null });
          }
          entries.push({ cardId: wandId, zoneId: 'zone_treasure_drop', targetId: null });
          patchRoomCardEntries(roomID, entries);
        }
      }
    }

    if (moveData.method === "TransferralPotionResolve") {
      const potionId = String(moveData.potionCardId || '').trim();
      const newFighter = Number(moveData.newFighterSeat);
      const prev = roomStates.get(roomID) || {};
      const numPlayers = Math.max(1, Math.min(MAX_ROOM_PLAYERS, Number(prev.num) || 3));
      if (
        potionId === TRANSFERRAL_POTION_CARD_ID
        && Number.isFinite(newFighter)
        && newFighter >= 0
        && newFighter < numPlayers
      ) {
        const cards = prev.cards && typeof prev.cards === 'object' ? prev.cards : {};
        const potPos = cards[potionId];
        const pz = potPos ? String(potPos.zoneId || '') : '';
        if (potPos && isWandOfDowsingActivatableZone(pz)) {
          const game = getOrInitRoomGameState(roomID);
          let tp = {};
          try {
            tp = game.turnPhase && typeof game.turnPhase === 'object' ? JSON.parse(JSON.stringify(game.turnPhase)) : {};
          } catch {
            tp = game.turnPhase && typeof game.turnPhase === 'object' ? { ...game.turnPhase } : {};
          }
          const turn = Number.isFinite(Number(tp.currentTurnSeat)) ? Number(tp.currentTurnSeat) : 0;
          const mfs0 = (tp.monsterFightSeat == null || tp.monsterFightSeat === '' || Number.isNaN(Number(tp.monsterFightSeat)))
            ? null
            : Number(tp.monsterFightSeat);
          const curFight = mfs0 != null ? mfs0 : turn;
          if (newFighter !== curFight) {
            patchRoomDiscards(roomID, [potionId]);
            tp.monsterFightSeat = newFighter;
            tp.acceptedHelperSeat = null;
            tp.pendingHelpSeats = [];
            game.turnPhase = tp;
            const latest = roomStates.get(roomID) || {};
            roomStates.set(roomID, { ...latest, game });
            io.to(roomID).emit("message", {
              method: "TransferralPotionResolve",
              potionCardId: potionId,
              newFighterSeat: newFighter,
            });
          }
        }
      }
    }

    if (moveData.method === "DeathLootFinished") {
      patchRoomDiscards(roomID, Array.isArray(moveData.remainingCardIds) ? moveData.remainingCardIds : []);
    }

    if (moveData.method === "CheatAttach") {
      const prev = roomStates.get(roomID) || {};
      const cheat = prev.cheatAttachments && typeof prev.cheatAttachments === 'object' ? prev.cheatAttachments : {};
      const next = { ...cheat, [String(moveData.cheatCardId || '')]: String(moveData.treasureCardId || '') };
      roomStates.set(roomID, { ...prev, cheatAttachments: next });
    }
    if (moveData.method === "MercenaryAttach") {
      const prev = roomStates.get(roomID) || {};
      const h = prev.hirelingAttachments && typeof prev.hirelingAttachments === 'object' ? prev.hirelingAttachments : {};
      const next = { ...h, [String(moveData.hirelingCardId || '')]: String(moveData.treasureCardId || '') };
      roomStates.set(roomID, { ...prev, hirelingAttachments: next });
    }
    if (moveData.method === "MercenaryDetach") {
      const prev = roomStates.get(roomID) || {};
      const h = prev.hirelingAttachments && typeof prev.hirelingAttachments === 'object' ? prev.hirelingAttachments : {};
      const next = { ...h };
      delete next[String(moveData.hirelingCardId || '')];
      roomStates.set(roomID, { ...prev, hirelingAttachments: next });
    }

    if (moveData.method === "SetTurn") {
      const prev = roomStates.get(roomID) || {};
      const game = prev.game && typeof prev.game === 'object' ? prev.game : {};
      const seat = Number(moveData.seat);
      roomStates.set(roomID, { ...prev, game: { ...game, currentTurnSeat: Number.isFinite(seat) ? seat : game.currentTurnSeat } });
    }

    if (moveData.method === "UpdateTimer") {
      const prev = roomStates.get(roomID) || {};
      const game = prev.game && typeof prev.game === 'object' ? prev.game : {};
      roomStates.set(roomID, {
        ...prev,
        game: {
          ...game,
          timerRunning: true,
          turnStartedAt: Date.now(),
          turnDurationMs: 30000,
        },
      });
    }

    if (moveData.method === "CombatResolved") {
      const prev = roomStates.get(roomID) || {};
      const game = prev.game && typeof prev.game === 'object' ? prev.game : {};
      roomStates.set(roomID, { ...prev, game: { ...game, timerRunning: false } });
    }

    if (moveData.method === "IncomeTaxSyncDiscards") {
      const game = getOrInitRoomGameState(roomID);
      const seats = Array.isArray(moveData.levelDownSeats) ? moveData.levelDownSeats : [];
      seats.forEach((raw) => {
        const s = clampSeatInRoom(roomID, raw);
        if (s != null) {
          const cur = getLevelBySeatFromGame(game, s);
          setLevelBySeatInGame(game, s, cur - 1);
        }
      });
      const latest = roomStates.get(roomID) || {};
      roomStates.set(roomID, { ...latest, game });
      const rawIds = Array.isArray(moveData.cardIds) ? moveData.cardIds : [];
      patchRoomDiscards(roomID, rawIds);
      const room = roomID;
      const treasureIds = [...new Set(rawIds.map((x) => String(x || '').trim()).filter((id) => id.includes('treasure')))];
      if (treasureIds.length) {
        queueMicrotask(() => {
          treasureIds.forEach((cardId) => {
            io.to(room).emit('message', {
              method: 'moveCard',
              cardId,
              targetId: null,
              zoneId: 'zone_treasure_drop',
            });
          });
        });
      }
      return;
    }

    if (includeSenderMethods.has(moveData.method)) {
      io.to(roomID).emit("message", moveData);
    } else {
      socket.to(roomID).emit("message", moveData);
    }
  });

  shareRoomsInfo();

  socket.on(ACTIONS.JOIN, config => {
    const {room: roomID, token, roomDisplayName} = config || {};
    const {rooms: joinedRooms} = socket;

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    if (typeof roomDisplayName === 'string' && roomDisplayName.trim()) {
      roomDisplayNames.set(roomID, sanitizeRoomDisplayName(roomDisplayName));
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
    if (token) {
      socket.data.playerToken = String(token);
    }
    shareRoomsInfo();
    emitRoomLobbyPlayerCount(roomID);

    const stMeta = roomStates.get(roomID);
    if (
      stMeta &&
      stMeta.playerMetaBySeat &&
      typeof stMeta.playerMetaBySeat === "object" &&
      Object.keys(stMeta.playerMetaBySeat).length
    ) {
      socket.emit("message", {
        method: "RoomPlayerMetaSnapshot",
        playerMetaBySeat: stMeta.playerMetaBySeat,
      });
    }

    // Если игра уже началась — восстанавливаем seat и состояние комнаты с сервера.
    if (startedRooms.has(roomID)) {
      const seatMap = roomSeatsByToken.get(roomID);
      const t = socket.data.playerToken;
      if (seatMap && t && seatMap.has(t)) {
        console.log('[restore] send RestoreSeat', { roomID, socketId: socket.id, token: t, seat: seatMap.get(t), num: (roomStates.get(roomID)?.num || 0) });
        socket.emit("message", { method: "RestoreSeat", seat: seatMap.get(t), num: (roomStates.get(roomID)?.num || 0) });
      } else {
        console.log('[restore] no seat for token', { roomID, socketId: socket.id, token: t, hasSeatMap: Boolean(seatMap) });
      }
      const state = roomStates.get(roomID);
      if (state && state.started) {
        console.log('[restore] send RoomState', { roomID, socketId: socket.id, cards: Object.keys(state.cards || {}).length, num: state.num, timer: state.game ? { timerRunning: state.game.timerRunning, turnStartedAt: state.game.turnStartedAt, turnDurationMs: state.game.turnDurationMs } : null });
        // Дублируем seat в RoomState, чтобы клиент мог применить раскладку даже если RestoreSeat придёт позже.
        const seatFromToken = (roomSeatsByToken.get(roomID)?.get(socket.data.playerToken) ?? null);
        socket.emit("message", { method: "RoomState", state, seat: seatFromToken });
      }
    }
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

        // Если комната стала пустой — разрешаем снова показывать её в списке (на случай новой игры).
        const remainingSize = (io.sockets.adapter.rooms.get(roomID) || new Set()).size;
        if (remainingSize <= 0) {
          startedRooms.delete(roomID);
          roomStates.delete(roomID);
          roomSeatsByToken.delete(roomID);
          roomDisplayNames.delete(roomID);
        } else {
          emitRoomLobbyPlayerCount(roomID);
        }
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

  // Запоминаем seat для токена игрока, чтобы при refresh вернуть того же персонажа.
  const seatMap = roomSeatsByToken.get(roomID) || new Map();
  roomSeatsByToken.set(roomID, seatMap);

  if (clientCount === 5) {
    const [c0, c1, c2, c3, c4] = clients;
    const s0 = io.sockets.sockets.get(c0);
    const s1 = io.sockets.sockets.get(c1);
    const s2 = io.sockets.sockets.get(c2);
    const s3 = io.sockets.sockets.get(c3);
    const s4 = io.sockets.sockets.get(c4);
    if (s0?.data?.playerToken) seatMap.set(String(s0.data.playerToken), 0);
    if (s1?.data?.playerToken) seatMap.set(String(s1.data.playerToken), 1);
    if (s2?.data?.playerToken) seatMap.set(String(s2.data.playerToken), 2);
    if (s3?.data?.playerToken) seatMap.set(String(s3.data.playerToken), 3);
    if (s4?.data?.playerToken) seatMap.set(String(s4.data.playerToken), 4);
    io.to(c0).emit('message', { method: '1', fl: false, num: clientCount });
    io.to(c1).emit('message', { method: '5Players', fl: 'p1', num: clientCount });
    io.to(c2).emit('message', { method: '5Players', fl: 'p2', num: clientCount });
    io.to(c3).emit('message', { method: '5Players', fl: 'p3', num: clientCount });
    io.to(c4).emit('message', { method: '5Players', fl: 'p4', num: clientCount });
    return;
  }

  if (clientCount === 4) {
    const [firstClientId, secondClientId, thirdClientId, fourthClientId] = clients;
    const s1 = io.sockets.sockets.get(firstClientId);
    const s2 = io.sockets.sockets.get(secondClientId);
    const s3 = io.sockets.sockets.get(thirdClientId);
    const s4 = io.sockets.sockets.get(fourthClientId);
    if (s1?.data?.playerToken) seatMap.set(String(s1.data.playerToken), 0);
    if (s2?.data?.playerToken) seatMap.set(String(s2.data.playerToken), 1);
    if (s3?.data?.playerToken) seatMap.set(String(s3.data.playerToken), 2);
    if (s4?.data?.playerToken) seatMap.set(String(s4.data.playerToken), 3);
    io.to(firstClientId).emit("message", {
      method: "1",
      fl: false,
      num: clientCount,
    });
    io.to(secondClientId).emit("message", {
      method: "4Players",
      fl: "p1",
      num: clientCount,
    });
    io.to(thirdClientId).emit("message", {
      method: "4Players",
      fl: "p2",
      num: clientCount,
    });
    io.to(fourthClientId).emit("message", {
      method: "4Players",
      fl: "p3",
      num: clientCount,
    });
    return;
  }

  if (clientCount === 2) {
    const [firstClientId, secondClientId] = clients;
    const s1 = io.sockets.sockets.get(firstClientId);
    const s2 = io.sockets.sockets.get(secondClientId);
    if (s1?.data?.playerToken) seatMap.set(String(s1.data.playerToken), 0);
    if (s2?.data?.playerToken) seatMap.set(String(s2.data.playerToken), 1);
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
    const s1 = io.sockets.sockets.get(firstClientId);
    const s2 = io.sockets.sockets.get(secondClientId);
    const s3 = io.sockets.sockets.get(thirdClientId);
    if (s1?.data?.playerToken) seatMap.set(String(s1.data.playerToken), 0);
    if (s2?.data?.playerToken) seatMap.set(String(s2.data.playerToken), 1);
    if (s3?.data?.playerToken) seatMap.set(String(s3.data.playerToken), 2);
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
    return;
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