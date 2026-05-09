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

// Комнаты, в которых уже стартовала игра (чтобы скрывать их из списка подключения).
// Как только комната станет пустой — убираем флаг.
const startedRooms = new Set();
// Авторитетное состояние комнаты для восстановления после refresh.
// roomID -> { started, num, deckDoors, deckTreasure, cards, cheatAttachments, hirelingAttachments, monsterBonusAttachments, game }
const roomStates = new Map();
// Привязка “токен игрока” -> seat в комнате.
// roomID -> Map(token -> seat)
const roomSeatsByToken = new Map();

function getOrInitRoomGameState(roomID) {
  const prev = roomStates.get(roomID) || {};
  const game = (prev.game && typeof prev.game === 'object') ? prev.game : {};
  // Дефолты для восстановления после refresh.
  if (!Array.isArray(game.levelBySeat)) game.levelBySeat = [1, 1, 1];
  if (!Array.isArray(game.warriorFrenzyUsedBySeat)) game.warriorFrenzyUsedBySeat = [0, 0, 0];
  if (!Array.isArray(game.warriorFrenzyBonusBySeat)) game.warriorFrenzyBonusBySeat = [0, 0, 0];
  if (!Array.isArray(game.clericExorcismUsedBySeat)) game.clericExorcismUsedBySeat = [0, 0, 0];
  if (!Array.isArray(game.clericExorcismBonusBySeat)) game.clericExorcismBonusBySeat = [0, 0, 0];
  if (!Array.isArray(game.victimThiefTrimUsedBySeat)) game.victimThiefTrimUsedBySeat = [0, 0, 0];
  if (!Array.isArray(game.thiefBackstabDebuffBySeat)) game.thiefBackstabDebuffBySeat = [0, 0, 0];
  if (typeof game.myBonus !== 'number') game.myBonus = 0;
  if (typeof game.monsterBasePower !== 'number') game.monsterBasePower = 0;
  roomStates.set(roomID, { ...prev, game });
  return game;
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
    const targetId = e?.targetId ? String(e.targetId) : null;
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
  const entries = [];
  (Array.isArray(cardIds) ? cardIds : []).forEach((raw) => {
    const id = String(raw || '').trim();
    const z = discardZoneIdForCardId(id);
    if (id && z) entries.push({ cardId: id, zoneId: z, targetId: null });
  });
  patchRoomCardEntries(roomID, entries);
}

function getClientRooms() {
  const {rooms} = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4 && !startedRooms.has(roomID));
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
        startedRooms.add(roomID);
        state.started = true;
        state.cards = {};
        state.monsterBonusAttachments = {};
        state.game = getOrInitRoomGameState(roomID);
        if (state.game && typeof state.game === 'object') {
          state.game.turnPhase = {};
        }
        roomStates.set(roomID, state);

        io.to(roomID).emit("message", {
          method: "StartGame",
          num: numPlayers,
          deckDoors: state.deckDoors,
          deckTreasure: state.deckTreasure,
        });

        const doorHandZoneForIndex = (i) => {
          // ВАЖНО: используем исходные id зон из DOM (myhand/opponenthand/opponent2hand/opponent3hand),
          // потому что клиентская верстка/логика уже завязана на них.
          // Попытка перейти на hand0/hand1/hand2 приводит к разному отображению на разных клиентах.
          if (numPlayers === 2) return (i % 2 === 0) ? "myhand" : "opponenthand";
          if (numPlayers === 3) return (i % 3 === 0) ? "myhand" : (i % 3 === 1) ? "opponent2hand" : "opponent3hand";
          return "myhand";
        };
        const treasureHandZoneForIndex = doorHandZoneForIndex;

        const dealCount = 4 * numPlayers;
        const doors = state.deckDoors || [];
        const treasures = state.deckTreasure || [];

        for (let i = 0; i < dealCount && i < doors.length; i++) {
          const cardId = String(doors[i]?.name || doors[i]?.id || doors[i]);
          if (!cardId) continue;
          const zoneId = doorHandZoneForIndex(i);
          state.cards[cardId] = { zoneId, targetId: null };
          io.to(roomID).emit("message", { method: "moveCard", cardId, targetId: null, zoneId, fromZoneId: "zone_doors" });
        }
        for (let i = 0; i < dealCount && i < treasures.length; i++) {
          const cardId = String(treasures[i]?.name || treasures[i]?.id || treasures[i]);
          if (!cardId) continue;
          const zoneId = treasureHandZoneForIndex(i);
          state.cards[cardId] = { zoneId, targetId: null };
          io.to(roomID).emit("message", { method: "moveCard", cardId, targetId: null, zoneId, fromZoneId: "zone_treasure" });
        }

        roomStates.set(roomID, state);
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
      const nextCards = { ...cards, [String(moveData.cardId)]: { zoneId: String(moveData.zoneId), targetId: moveData.targetId ? String(moveData.targetId) : null } };
      let nextMba = prev.monsterBonusAttachments && typeof prev.monsterBonusAttachments === 'object' ? { ...prev.monsterBonusAttachments } : {};
      if (String(moveData.zoneId) !== 'zone_monster') {
        delete nextMba[String(moveData.cardId)];
      }
      roomStates.set(roomID, { ...prev, cards: nextCards, monsterBonusAttachments: nextMba, started: startedRooms.has(roomID) || prev.started });
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
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2) {
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
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2 && Number.isFinite(level) && level > 0) {
        game.levelBySeat[seat] = Math.max(1, Math.floor(level));
      }
      const helperSeat = Number(moveData.helperSeat);
      const helperLevel = Number(moveData.helperLevel);
      if (Number.isFinite(helperSeat) && helperSeat >= 0 && helperSeat <= 2 && Number.isFinite(helperLevel) && helperLevel > 0) {
        game.levelBySeat[helperSeat] = Math.max(1, Math.floor(helperLevel));
      }
      // после боя таймер не идёт
      game.timerRunning = false;
    }

    if (moveData.method === "TreasureLevel") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      const gain = Number(moveData.level);
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2 && Number.isFinite(gain) && gain > 0) {
        const cur = Number(game.levelBySeat[seat] || 1) || 1;
        game.levelBySeat[seat] = Math.max(1, Math.floor(cur + gain));
      }
    }

    if (moveData.method === "BadStaffLevel") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      const bad = moveData.bad_staff;
      const loss = bad && typeof bad === 'object' ? Number(bad.levelLoss) || 0 : 0;
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2 && loss > 0) {
        const cur = Number(game.levelBySeat[seat] || 1) || 1;
        game.levelBySeat[seat] = Math.max(1, Math.floor(cur - loss));
      }
    }

    if (moveData.method === "Treasure65LevelSwap") {
      const game = getOrInitRoomGameState(roomID);
      const fromSeat = Number(moveData.fromSeat);
      const toSeat = Number(moveData.toSeat);
      if (
        Number.isFinite(fromSeat) && fromSeat >= 0 && fromSeat <= 2
        && Number.isFinite(toSeat) && toSeat >= 0 && toSeat <= 2
      ) {
        const fromLevel = Number(game.levelBySeat[fromSeat] || 1) || 1;
        const toLevel = Number(game.levelBySeat[toSeat] || 1) || 1;
        game.levelBySeat[fromSeat] = Math.max(1, Math.floor(fromLevel + 1));
        game.levelBySeat[toSeat] = Math.max(1, Math.floor(toLevel - 1));
      }
    }

    if (moveData.method === "ThiefTheftRoll") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      const v = Number(moveData.value);
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2 && Number.isFinite(v) && v > 0 && v < 4) {
        const cur = Number(game.levelBySeat[seat] || 1) || 1;
        game.levelBySeat[seat] = Math.max(1, Math.floor(cur - 1));
      }
    }

    if (moveData.method === "WarriorFrenzyApply") {
      const game = getOrInitRoomGameState(roomID);
      const seat = Number(moveData.seat);
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2) {
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
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2) {
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
        if (Number.isFinite(victimSeat) && victimSeat >= 0 && victimSeat <= 2) {
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
      if (Number.isFinite(thiefSeat) && thiefSeat >= 0 && thiefSeat <= 2 && cardId) {
        patchRoomCardEntries(roomID, [{ cardId, zoneId: handZoneIdForSeatInRoom(roomID, thiefSeat), targetId: null }]);
      }
    }

    if (moveData.method === "HalflingEscapeDiscard") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "DivineInterventionResolve") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
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
      patchRoomDiscards(roomID, Array.isArray(moveData.cardIds) ? moveData.cardIds : []);
    }

    if (moveData.method === "BadStaffLevel") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "TreasureLevel") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "Treasure65LevelSwap") {
      const cid = String(moveData.cardId || '').trim();
      if (cid) patchRoomDiscards(roomID, [cid]);
    }

    if (moveData.method === "MateTestDeal") {
      const seat = Number(moveData.seat);
      const cardId = String(moveData.cardId || '').trim();
      if (Number.isFinite(seat) && seat >= 0 && seat <= 2 && cardId) {
        patchRoomCardEntries(roomID, [{ cardId, zoneId: handZoneIdForSeatInRoom(roomID, seat), targetId: null }]);
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

    if (includeSenderMethods.has(moveData.method)) {
      io.to(roomID).emit("message", moveData);
    } else {
      socket.to(roomID).emit("message", moveData);
    }
  });

  shareRoomsInfo();

  socket.on(ACTIONS.JOIN, config => {
    const {room: roomID, token} = config || {};
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
    if (token) {
      socket.data.playerToken = String(token);
    }
    shareRoomsInfo();

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