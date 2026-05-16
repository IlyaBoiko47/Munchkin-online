/**
 * Логика обучения — только этот файл и tutorial-board.js (без правок game.js / card-block.js).
 */
import socket from './socket/index.js';
import {
	getMonsterBattleContext,
	timer,
	recalculateAllPowerDisplays,
	setLevelBySeat,
	setupMunchkinDiceAfterGameStart,
	updateTurnActionButtons,
} from './game.js';

const TUTORIAL_DOOR_DRAWABLE_IDS = ['door89', 'door28'];
const TUTORIAL_TREASURE_DRAWABLE_IDS = ['treasure72', 'treasure71'];
const OPPONENT_EQUIP_ZONE_IDS = ['zone_opponent', 'zone_opponent_side'];

/** Карты, которые можно класть в колоду / брать из неё (раздача + 2 верхние двери). */
const TUTORIAL_DEAL_CARD_IDS = new Set([
	...['door51', 'door94', 'door36', 'door12', 'treasure65', 'treasure32', 'treasure7', 'treasure16'],
	...['treasure31', 'treasure11', 'treasure56', 'door45'],
	'door9',
	'door28',
	'door89',
	'treasure71',
	'treasure72',
]);

const TUTORIAL_LEVEL_UI = {
	player: '.level-bottom-center',
	opponent: '.level-top-center',
};

const TUTORIAL_ACTIVE_ZONE_IDS = [
	'myhand', 'opponenthand', 'zone_opponent', 'zone_opponent_side',
	'zone2', 'zone5', 'zone3', 'zone_monster', 'zone_doors', 'zone_treasure',
	'zone_doors_drop', 'zone_treasure_drop',
];

const TUTORIAL_HAND_ZONE_BY_CARD = new Map([
	['door51', 'myhand'], ['door94', 'myhand'], ['door36', 'myhand'], ['door12', 'myhand'],
	['treasure65', 'myhand'], ['treasure32', 'myhand'], ['treasure7', 'myhand'], ['treasure16', 'myhand'],
	['treasure31', 'opponenthand'], ['treasure11', 'opponenthand'], ['treasure56', 'opponenthand'], ['door45', 'opponenthand'],
]);

/** Домашняя зона — только для отката из колоды во время перетаскивания (не финальная позиция). */
const TUTORIAL_CARD_HOME_ZONE = new Map([
	...TUTORIAL_HAND_ZONE_BY_CARD.entries(),
]);

const TUTORIAL_POWER_UI = {
	player: '.MyPower',
	opponent: '.PowerPlayer2',
};

/** Имена в плашках (getSeatLabel / «кинь кубик» и проклятия). */
const TUTORIAL_SEAT_DISPLAY_NAMES = {
	0: 'Игрок',
	1: 'Соперник',
};

const OPPONENT_CURSE_TYPES_LOCAL_ONLY = new Set([
	'lose your class', 'lose your race', 'change class', 'change race', 'change sex',
	'malign mirrror', 'lose_all_equipped_classes_or_levels',
]);

let tutorialDeckDragGuardBound = false;
let tutorialDragCleanupBound = false;
let tutorialSocketInterceptBound = false;
let tutorialDragActive = false;
let tutorialDraggingCardId = null;

function migrateTutorialLevelsShape() {
	const lv = window.__tutorialLevels;
	if (!lv || typeof lv !== 'object') {
		return;
	}
	if (lv.player != null || lv.opponent != null) {
		return;
	}
	window.__tutorialLevels = {
		player: Math.max(1, Number(lv[0]) || 1),
		opponent: Math.max(1, Number(lv[1]) || 4),
	};
}

function ensureTutorialLevels() {
	if (!window.__tutorialLevels) {
		window.__tutorialLevels = { player: 1, opponent: 4 };
	}
	migrateTutorialLevelsShape();
	return window.__tutorialLevels;
}

function getTutorialLevel(role) {
	return ensureTutorialLevels()[role] ?? 1;
}

function setTutorialLevel(role, level) {
	const lv = Math.max(1, Math.floor(Number(level)) || 1);
	ensureTutorialLevels()[role] = lv;
	const sel = TUTORIAL_LEVEL_UI[role];
	const el = sel ? document.querySelector(sel) : null;
	if (el) {
		el.textContent = String(lv);
	}
}

function adjustTutorialLevelDisplay(role, delta) {
	setTutorialLevel(role, getTutorialLevel(role) + (Number(delta) || 0));
}

function tutorialRoleToGameSeat(role) {
	return role === 'opponent' ? 1 : 0;
}

function gameSeatToTutorialRole(seat) {
	return Number(seat) === 1 ? 'opponent' : 'player';
}

/** Подменяет ник из профиля/лобби на «Игрок» / «Соперник» в текстах game.js. */
export function applyTutorialSeatDisplayNames() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	Object.entries(TUTORIAL_SEAT_DISPLAY_NAMES).forEach(([seat, name]) => {
		const ch = window.characterBySeat?.[Number(seat)];
		if (ch) {
			ch.name = name;
		}
	});
}

function getTutorialRoleForCardZone(cardId) {
	const card = document.getElementById(cardId);
	const zoneId = card?.parentElement?.id;
	if (!zoneId) {
		return null;
	}
	if (OPPONENT_EQUIP_ZONE_IDS.includes(zoneId) || zoneId === 'opponenthand') {
		return 'opponent';
	}
	if (zoneId === 'zone2' || zoneId === 'zone5' || zoneId === 'myhand') {
		return 'player';
	}
	return null;
}

function resolveTutorialCurseTargetRole(cardId, networkSeat) {
	return getTutorialRoleForCardZone(cardId) ?? gameSeatToTutorialRole(networkSeat);
}

function isTutorialDeckMovableCard(cardId) {
	return Boolean(cardId) && TUTORIAL_DEAL_CARD_IDS.has(cardId);
}

export function markTutorialDeckCard(card) {
	if (card) {
		card.dataset.tutorialDeckCard = '1';
	}
}

export function deckFilling(deck, zone) {
	if (!Array.isArray(deck) || !zone) return;
	const markAsDeckCard = window.__TUTORIAL_BOARD
		&& (zone.id === 'zone_doors' || zone.id === 'zone_treasure');
	for (const def of deck) {
		const card = document.createElement('div');
		card.classList.add('card');
		card.setAttribute('id', def.name);
		card.setAttribute('draggable', 'true');
		const image = document.createElement('img');
		image.classList.add('card-item');
		image.setAttribute('src', def.img);
		card.appendChild(image);
		if (markAsDeckCard) {
			markTutorialDeckCard(card);
		}
		zone.appendChild(card);
	}
}

function normalizeTutorialBadStaff(badStaff) {
	if (!badStaff || typeof badStaff !== 'object') {
		return null;
	}
	const type = String(badStaff.type || '').trim();
	if (!type) {
		return null;
	}
	if (type === 'lose_levels') {
		return { type, levels: Number(badStaff.levels) || 1 };
	}
	return { type };
}

function moveDoorCardToDiscard(cardId) {
	const zone = document.getElementById('zone_doors_drop');
	const card = document.getElementById(cardId);
	if (zone && card) {
		zone.appendChild(card);
	}
}

function moveTreasureCardToDiscard(cardId) {
	const zone = document.getElementById('zone_treasure_drop');
	const card = document.getElementById(cardId);
	if (zone && card) {
		zone.appendChild(card);
	}
}

function findTopDoorDiscardClassCardId() {
	const zone = document.getElementById('zone_doors_drop');
	if (!zone) {
		return null;
	}
	const els = Array.from(zone.querySelectorAll('.card'));
	for (let i = els.length - 1; i >= 0; i -= 1) {
		const id = els[i]?.id;
		if (!id) {
			continue;
		}
		const door = window.doors?.find((d) => d.name === id);
		if (door && String(door.kind || '').trim()) {
			return id;
		}
	}
	return null;
}

function applyTutorialChangeClassOnSeat(role) {
	const zones = role === 'opponent' ? OPPONENT_EQUIP_ZONE_IDS : ['zone2', 'zone5'];
	const classIds = collectClassCardIdsInZones(zones);
	if (classIds.length === 0) {
		return;
	}
	classIds.forEach((id) => moveDoorCardToDiscard(id));
	const replacementId = findTopDoorDiscardClassCardId();
	if (replacementId) {
		const mainZone = document.getElementById(role === 'opponent' ? 'zone_opponent' : 'zone2');
		const card = document.getElementById(replacementId);
		if (mainZone && card) {
			mainZone.appendChild(card);
		}
	}
}

function collectClassCardIdsInZones(zoneIds) {
	const out = [];
	zoneIds.forEach((zid) => {
		const zone = document.getElementById(zid);
		if (!zone) {
			return;
		}
		zone.querySelectorAll(':scope > .card').forEach((el) => {
			const door = window.doors?.find((d) => d.name === el.id);
			if (!door || String(door.race || '') === 'monster') {
				return;
			}
			if (String(door.kind || '').trim() && !out.includes(el.id)) {
				out.push(el.id);
			}
		});
	});
	return out;
}

function applyTutorialCurseOnSeat(role, cardId) {
	const door = window.doors?.find((d) => d.name === cardId);
	if (!door) {
		return;
	}
	const bad = normalizeTutorialBadStaff(door.bad_staff);
	const zones = role === 'opponent' ? OPPONENT_EQUIP_ZONE_IDS : ['zone2', 'zone5'];

	if (bad?.type === 'lose your class') {
		const classIds = collectClassCardIdsInZones(zones);
		if (classIds.length === 0) {
			adjustTutorialLevelDisplay(role, -1);
		} else {
			classIds.forEach((id) => moveDoorCardToDiscard(id));
		}
	} else if (bad?.type === 'change class') {
		applyTutorialChangeClassOnSeat(role);
	} else if (bad?.type === 'lose_levels') {
		adjustTutorialLevelDisplay(role, -(Number(bad.levels) || 1));
	} else if (bad?.type === 'lose your race') {
		zones.forEach((zid) => {
			const zone = document.getElementById(zid);
			if (!zone) {
				return;
			}
			Array.from(zone.querySelectorAll(':scope > .card')).forEach((el) => {
				const d = window.doors?.find((x) => x.name === el.id);
				if (d && String(d.race || '').trim() && String(d.race) !== 'monster' && !String(d.kind || '').trim()) {
					moveDoorCardToDiscard(el.id);
				}
			});
		});
	}
	moveDoorCardToDiscard(cardId);
	afterTutorialLevelOrPowerChange();
}

function curseNeedsLocalApplyOnOpponent(door) {
	const bad = normalizeTutorialBadStaff(door?.bad_staff);
	return Boolean(bad && OPPONENT_CURSE_TYPES_LOCAL_ONLY.has(bad.type));
}

function applyTutorialBadStaffFromNetwork(seat, badStaff, cardId) {
	if (!cardId) {
		return;
	}
	const role = resolveTutorialCurseTargetRole(cardId, seat);
	const bad = normalizeTutorialBadStaff(badStaff);
	if (!bad) {
		moveDoorCardToDiscard(cardId);
		afterTutorialLevelOrPowerChange();
		return;
	}
	if (bad.type === 'lose_levels') {
		adjustTutorialLevelDisplay(role, -(bad.levels || 1));
		moveDoorCardToDiscard(cardId);
	} else {
		applyTutorialCurseOnSeat(role, cardId);
		return;
	}
	afterTutorialLevelOrPowerChange();
}

function applyCommittedOpponentCurses() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	OPPONENT_EQUIP_ZONE_IDS.forEach((zoneId) => {
		const zone = document.getElementById(zoneId);
		if (!zone) {
			return;
		}
		Array.from(zone.querySelectorAll(':scope > .card')).forEach((card) => {
			const id = card.id;
			if (!id) {
				return;
			}
			const door = window.doors?.find((d) => d.name === id);
			if (String(door?.special || '').trim().toLowerCase() !== 'curse') {
				return;
			}
			if (!curseNeedsLocalApplyOnOpponent(door)) {
				return;
			}
			applyTutorialCurseOnSeat('opponent', id);
		});
	});
}

function bindTutorialSocketInterceptHandlers() {
	if (tutorialSocketInterceptBound) {
		return;
	}
	tutorialSocketInterceptBound = true;

	window.addEventListener('munchkin:tutorialBadStaff', (ev) => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		const { seat, bad_staff: badStaff, cardId } = ev.detail || {};
		applyTutorialBadStaffFromNetwork(seat, badStaff, cardId);
	});

	window.addEventListener('munchkin:tutorialTreasure65', (ev) => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		const detail = ev.detail || {};
		const cardId = String(detail.cardId || 'treasure65');
		adjustTutorialLevelDisplay('player', 1);
		adjustTutorialLevelDisplay('opponent', -1);
		moveTreasureCardToDiscard(cardId);
		afterTutorialLevelOrPowerChange();
	});

	window.addEventListener('munchkin:tutorialTreasureLevel', (ev) => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		const { seat, level, cardId, treasureLevelApplied } = ev.detail || {};
		if (treasureLevelApplied === false || !cardId) {
			return;
		}
		const gain = Number(level);
		if (!Number.isFinite(gain) || gain <= 0) {
			return;
		}
		const role = getTutorialRoleForCardZone(cardId) ?? gameSeatToTutorialRole(seat);
		adjustTutorialLevelDisplay(role, gain);
		moveTreasureCardToDiscard(cardId);
		const hid = String(ev.detail?.killedHirelingCardId || '').trim();
		if (hid) {
			moveTreasureCardToDiscard(hid);
		}
		afterTutorialLevelOrPowerChange();
	});

	window.addEventListener('munchkin:tutorialLevelAdjust', (ev) => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		const { seat, delta } = ev.detail || {};
		const d = Number(delta);
		if (!Number.isFinite(d) || d === 0) {
			return;
		}
		adjustTutorialLevelDisplay(gameSeatToTutorialRole(seat), d);
		afterTutorialLevelOrPowerChange();
	});

	window.addEventListener('munchkin:tutorialEscapeFinished', () => {
		if (!window.__TUTORIAL_BOARD || window.__tutorialBattleCompleted) {
			return;
		}
		tutorialFinishBattleAfterEscape();
	});

	window.addEventListener('munchkin:playerProfileStorageUpdated', () => {
		applyTutorialSeatDisplayNames();
	});
}

function tutorialMoveBattleCardsToDiscard() {
	const doorDrop = document.getElementById('zone_doors_drop');
	const treasureDrop = document.getElementById('zone_treasure_drop');
	['zone_monster', 'zone3'].forEach((zoneId) => {
		const zone = document.getElementById(zoneId);
		if (!zone) {
			return;
		}
		Array.from(zone.querySelectorAll(':scope > .card')).forEach((card) => {
			const id = String(card.id || '');
			if (!id || id === 'card') {
				return;
			}
			const drop = id.includes('door') ? doorDrop : treasureDrop;
			if (drop) {
				drop.appendChild(card);
			}
		});
	});
}

function tutorialFinishBattleAfterEscape() {
	tutorialMoveBattleCardsToDiscard();
	const timerEl = document.getElementById('timer');
	if (timerEl) {
		timerEl.textContent = '';
	}
	window.__tutorialAwaitingEndTurn = true;
	const endTurn = document.getElementById('end-turn');
	const fold = document.getElementById('fold');
	if (endTurn) {
		endTurn.style.display = 'flex';
	}
	if (fold) {
		fold.style.display = 'none';
	}
	try {
		recalculateAllPowerDisplays();
		updateTurnActionButtons(false);
		window.dispatchEvent(new Event('munchkin:zonesChanged'));
	} catch {
		// ignore
	}
}

function createTutorialDiceFace(number) {
	const faces = {
		1: [[50, 50]],
		2: [[20, 20], [80, 80]],
		3: [[20, 20], [50, 50], [80, 80]],
		4: [[20, 20], [20, 80], [80, 20], [80, 80]],
		5: [[20, 20], [20, 80], [50, 50], [80, 20], [80, 80]],
		6: [[20, 20], [20, 80], [50, 20], [50, 80], [80, 20], [80, 80]],
	};
	const n = Math.min(6, Math.max(1, Math.floor(Number(number)) || 1));
	const dice = document.createElement('div');
	dice.classList.add('dice');
	(faces[n] || faces[1]).forEach(([top, left]) => {
		const dot = document.createElement('div');
		dot.classList.add('dice-dot');
		dot.style.setProperty('--top', `${top}%`);
		dot.style.setProperty('--left', `${left}%`);
		dice.appendChild(dot);
	});
	return dice;
}

/** Кубик и смывка — полная логика из game.js (в т.ч. escape). */
export function ensureTutorialDice() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	const diceContainer = document.querySelector('.dice-container');
	if (!diceContainer) {
		return;
	}
	diceContainer.style.pointerEvents = 'auto';
	diceContainer.style.cursor = 'pointer';
	setupMunchkinDiceAfterGameStart();
}

function initTutorialLevelDisplays() {
	setTutorialLevel('player', 1);
	setTutorialLevel('opponent', 4);
	syncTutorialLevelBySeatToGame();
}

/** Синхронизировать __tutorialLevels → levelBySeat (иначе recalculate сбрасывает силу). */
function syncTutorialLevelBySeatToGame() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	Object.entries(TUTORIAL_LEVEL_UI).forEach(([role]) => {
		const seat = tutorialRoleToGameSeat(role);
		setLevelBySeat(seat, getTutorialLevel(role));
	});
}

function applyTutorialLevelsToCharacterPower() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	syncTutorialLevelBySeatToGame();
	try {
		recalculateAllPowerDisplays();
	} catch {
		// ignore
	}
	const oppEl = document.getElementById('PowerPlayer2');
	const myEl = document.getElementById('MyPower');
	const oppCh = window.characterBySeat?.[tutorialRoleToGameSeat('opponent')];
	const myCh = window.characterBySeat?.[tutorialRoleToGameSeat('player')];
	if (oppEl && oppCh) {
		oppEl.textContent = String(oppCh.power);
	}
	if (myEl && myCh) {
		myEl.textContent = String(myCh.power);
	}
}

function afterTutorialLevelOrPowerChange() {
	applyTutorialLevelsToCharacterPower();
}

/** После game.js (method "1") снова выставить уровни обучения. */
export function syncTutorialLevelsAfterCatalog() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	setTutorialLevel('player', getTutorialLevel('player'));
	setTutorialLevel('opponent', getTutorialLevel('opponent'));
	applyTutorialSeatDisplayNames();
	applyTutorialLevelsToCharacterPower();
}

export function ensureCardCatalogLoaded() {
	if (Array.isArray(window.doors) && window.doors.length > 0
		&& Array.isArray(window.treasures) && window.treasures.length > 0) {
		return;
	}
	socket.emit('message', { method: '1', fl: true, num: 2 });
}

function enableTutorialZones() {
	TUTORIAL_ACTIVE_ZONE_IDS.forEach((id) => {
		const zone = document.getElementById(id);
		if (!zone) {
			return;
		}
		zone.style.pointerEvents = 'auto';
		zone.style.opacity = '';
	});
}

function bindTutorialCatalogReadySync() {
	if (window.__tutorialCatalogSyncBound) {
		return;
	}
	window.__tutorialCatalogSyncBound = true;
	const resync = () => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		migrateTutorialLevelsShape();
		initTutorialLevelDisplays();
		applyTutorialSeatDisplayNames();
		applyTutorialLevelsToCharacterPower();
		refreshTutorialDeckTakeRules();
		ensureTutorialDice();
	};
	window.addEventListener('munchkin:tutorialCatalogReady', resync);
	window.addEventListener('munchkin:zonesChanged', () => {
		requestAnimationFrame(() => applyTutorialLevelsToCharacterPower());
	});
}

export function configureTutorialGameState() {
	window.__TUTORIAL_BOARD = true;
	window.num = 2;
	window.__tutorialBattleCompleted = false;
	window.__tutorialAwaitingEndTurn = false;
	window.__lobbySyncRequested = true;
	migrateTutorialLevelsShape();
	enableTutorialZones();
	initTutorialLevelDisplays();
	bindTutorialSocketInterceptHandlers();
	bindTutorialDragCleanup();
	bindTutorialCatalogReadySync();
	applyTutorialSeatDisplayNames();
	if (typeof window !== 'undefined') {
		window.__applyTutorialSeatDisplayNames = applyTutorialSeatDisplayNames;
	}
}

function getTutorialDeckTopCardIds(zoneId, count) {
	const zone = document.getElementById(zoneId);
	if (!zone || count <= 0) {
		return [];
	}
	return Array.from(zone.querySelectorAll(':scope > .card'))
		.slice(-count)
		.map((card) => card.id)
		.filter(Boolean);
}

function getTutorialTreasureDrawableIdsFromDeck() {
	const zone = document.getElementById('zone_treasure');
	if (!zone) {
		return [];
	}
	const ids = Array.from(zone.querySelectorAll(':scope > .card')).map((c) => c.id).filter(Boolean);
	const allowed = [];
	for (let i = ids.length - 1; i >= 0; i -= 1) {
		const id = ids[i];
		if (TUTORIAL_TREASURE_DRAWABLE_IDS.includes(id)) {
			allowed.unshift(id);
		} else if (allowed.length > 0) {
			break;
		}
	}
	return allowed.filter((id) => TUTORIAL_TREASURE_DRAWABLE_IDS.includes(id));
}

function getTutorialDoorDrawableIdsFromDeck() {
	const zone = document.getElementById('zone_doors');
	if (!zone) {
		return [];
	}
	const ids = Array.from(zone.querySelectorAll(':scope > .card')).map((c) => c.id).filter(Boolean);
	const allowed = [];
	for (let i = ids.length - 1; i >= 0; i -= 1) {
		const id = ids[i];
		if (TUTORIAL_DOOR_DRAWABLE_IDS.includes(id)) {
			allowed.unshift(id);
		} else if (allowed.length > 0) {
			break;
		}
	}
	return allowed.filter((id) => TUTORIAL_DOOR_DRAWABLE_IDS.includes(id));
}

export function canDragCardToTutorialDeck(cardId) {
	if (!window.__TUTORIAL_BOARD || !cardId) {
		return true;
	}
	return isTutorialDeckMovableCard(cardId);
}

export function canDragCardFromTutorialDeck(cardId, fromZoneId) {
	if (!window.__TUTORIAL_BOARD || !cardId || !fromZoneId) {
		return true;
	}
	if (!isTutorialDeckMovableCard(cardId)) {
		return false;
	}
	if (fromZoneId === 'zone_doors') {
		if (TUTORIAL_DOOR_DRAWABLE_IDS.includes(cardId)) {
			return getTutorialDoorDrawableIdsFromDeck().includes(cardId);
		}
		return TUTORIAL_HAND_ZONE_BY_CARD.has(cardId) || cardId === 'door9';
	}
	if (fromZoneId === 'zone_treasure') {
		if (TUTORIAL_TREASURE_DRAWABLE_IDS.includes(cardId)) {
			return getTutorialTreasureDrawableIdsFromDeck().includes(cardId);
		}
		return TUTORIAL_HAND_ZONE_BY_CARD.has(cardId);
	}
	return true;
}

export function refreshTutorialDeckTakeRules() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	const doorAllowed = new Set(getTutorialDoorDrawableIdsFromDeck());
	const treasureAllowed = new Set(getTutorialTreasureDrawableIdsFromDeck());

	['zone_doors', 'zone_treasure'].forEach((zoneId) => {
		const zone = document.getElementById(zoneId);
		if (!zone) {
			return;
		}
		zone.querySelectorAll(':scope > .card').forEach((card) => {
			const id = card.id;
			if (!id || id === 'card') {
				return;
			}
			if (card.dataset.tutorialDeckCard === '1') {
				const allowed = zoneId === 'zone_doors' ? doorAllowed : treasureAllowed;
				card.draggable = allowed.has(id);
				return;
			}
			card.draggable = isTutorialDeckMovableCard(id);
		});
	});

	if (!tutorialDeckDragGuardBound) {
		tutorialDeckDragGuardBound = true;
		document.addEventListener('dragstart', (event) => {
			const card = event.target?.closest?.('.card');
			if (!card?.id) {
				return;
			}
			const zoneId = card.parentElement?.id;
			if ((zoneId === 'zone_doors' || zoneId === 'zone_treasure')
				&& !canDragCardFromTutorialDeck(card.id, zoneId)) {
				event.preventDefault();
				event.stopPropagation();
			}
		}, true);
		document.addEventListener('dragover', (event) => {
			if (!window.__TUTORIAL_BOARD || !tutorialDraggingCardId) {
				return;
			}
			const zone = event.target?.closest?.('.cards-zone');
			if (!zone || (zone.id !== 'zone_doors' && zone.id !== 'zone_treasure')) {
				return;
			}
			if (!canDragCardToTutorialDeck(tutorialDraggingCardId)) {
				event.preventDefault();
				if (event.dataTransfer) {
					event.dataTransfer.dropEffect = 'none';
				}
			}
		}, true);
	}
}

function markTutorialDeckCommittedCards() {
	['zone_doors', 'zone_treasure'].forEach((zoneId) => {
		const zone = document.getElementById(zoneId);
		if (!zone) {
			return;
		}
		Array.from(zone.querySelectorAll(':scope > .card')).forEach((card) => {
			if (card.dataset.tutorialDeckCard === '1') {
				return;
			}
			if (isTutorialDeckMovableCard(card.id)) {
				card.dataset.tutorialCommittedToDeck = '1';
			}
		});
	});
}

function restoreMisplacedHandCardsFromDecks() {
	['zone_doors', 'zone_treasure'].forEach((zoneId) => {
		const zone = document.getElementById(zoneId);
		if (!zone) {
			return;
		}
		Array.from(zone.querySelectorAll(':scope > .card')).forEach((card) => {
			if (card.dataset.tutorialDeckCard === '1') {
				return;
			}
			if (card.dataset.tutorialCommittedToDeck === '1' && isTutorialDeckMovableCard(card.id)) {
				return;
			}
			const home = TUTORIAL_CARD_HOME_ZONE.get(card.id);
			if (!home) {
				return;
			}
			const homeZone = document.getElementById(home);
			if (homeZone) {
				homeZone.appendChild(card);
			}
			delete card.dataset.tutorialCommittedToDeck;
			card.style.opacity = '';
			card.style.pointerEvents = '';
			card.style.filter = '';
			card.draggable = true;
		});
	});
}

function runTutorialDragEndCleanup() {
	if (!window.__TUTORIAL_BOARD) {
		return;
	}
	markTutorialDeckCommittedCards();
	restoreMisplacedHandCardsFromDecks();
	applyCommittedOpponentCurses();
	document.querySelectorAll('.card').forEach((card) => {
		if (card.dataset.tutorialDeckCard !== '1') {
			card.style.opacity = '';
			card.style.pointerEvents = '';
		}
	});
	refreshTutorialDeckTakeRules();
	tryStartTutorialBattleTimer();
}

function bindTutorialDragCleanup() {
	if (tutorialDragCleanupBound) {
		return;
	}
	tutorialDragCleanupBound = true;
	document.addEventListener('dragstart', (event) => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		tutorialDragActive = true;
		const card = event.target?.closest?.('.card');
		tutorialDraggingCardId = card?.id || null;
		if (card?.dataset?.tutorialCommittedToDeck === '1') {
			delete card.dataset.tutorialCommittedToDeck;
		}
	}, true);
	document.addEventListener('dragend', () => {
		if (!window.__TUTORIAL_BOARD) {
			return;
		}
		setTimeout(() => {
			tutorialDragActive = false;
			tutorialDraggingCardId = null;
			runTutorialDragEndCleanup();
		}, 0);
	}, false);
}

export function tryStartTutorialBattleTimer() {
	if (!window.__TUTORIAL_BOARD || window.__tutorialBattleCompleted) {
		return;
	}
	if (window.__tutorialAwaitingEndTurn) {
		return;
	}
	if (tutorialDragActive) {
		return;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	const battleZoneIds = ['zone3', 'zone_monster'];
	const hasMonsterInBattleZone = battleZoneIds.some((zoneId) => {
		const zone = document.getElementById(zoneId);
		if (!zone) {
			return false;
		}
		return Array.from(zone.querySelectorAll(':scope > .card')).some((card) => {
			const door = window.doors?.find((d) => d.name === card.id);
			return door && String(door.race || '') === 'monster';
		});
	});
	if (!hasMonsterInBattleZone) {
		return;
	}
	const timerEl = document.getElementById('timer');
	if (timerEl && timerEl.textContent) {
		return;
	}
	window.__tutorialAwaitingEndTurn = false;
	timer();
	try {
		window.dispatchEvent(new Event('munchkin:tutorialTimerUiChanged'));
	} catch {
		// ignore
	}
}

export function resetTutorialDeckTakeLimits() {
	// зарезервировано под будущие лимиты колоды
}

export function wireTutorialEndTurnButton() {
	const btn = document.getElementById('end-turn');
	if (!btn || btn.dataset.tutorialWired === '1') {
		return;
	}
	btn.dataset.tutorialWired = '1';
	btn.addEventListener('click', () => {
		window.__tutorialBattleCompleted = true;
		document.body.classList.add('tutorial-finished');
		const overlay = document.getElementById('tutorial-complete-overlay');
		if (overlay) {
			overlay.classList.remove('is-hidden');
			overlay.setAttribute('aria-hidden', 'false');
		}
		try {
			window.dispatchEvent(new Event('munchkin:tutorialTimerUiChanged'));
		} catch {
			// ignore
		}
	});
}

window.canDragCardFromTutorialDeck = canDragCardFromTutorialDeck;
