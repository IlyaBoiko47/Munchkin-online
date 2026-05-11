import { adjustCardWidth } from './card-block.js';
import { adjustCardHeight } from './card-block.js';
import { UpdateZones } from './увеличение карточек во время игры.js';
import socket from './socket/index.js';

// console.log("game работает");
let fl ;
window.doors = [];
window.treasures = [];

let num;
let localSeat = null;

/** Для moveCard: кто инициировал перенос (локальное место), чтобы удалённые клиенты открыли модалку штыря у нужного игрока. */
export function getLocalSeatForSocket() {
	return localSeat;
}

let currentTurnSeat = 0;
const levelBySeat = [1, 1, 1];
const STEAL_LEVEL_CARD_NAME = "Steal a level";

// Curse state: Malign mirrror (door38)
// Pending: applied to seat, will activate when seat participates in a battle.
// Active: currently restricting equipment power in battle; discarded after battle ends.
const malignMirrorPendingBySeat = new Map(); // seat -> curseCardId
const malignMirrorActiveBySeat = new Map(); // seat -> curseCardId

// Curse state: Change sex (door23)
// Pending: -5 in next battle the seat participates in (or current if already in battle)
// Active: -5 currently applied in battle; discarded after battle ends.
const changeSexPendingBySeat = new Map(); // seat -> curseCardId
const changeSexActiveBySeat = new Map(); // seat -> curseCardId

// Налог (door26): пошаговый сброс шмоток.
/** @type {{ curseSeat: number, curseCardId: string, referenceCost: number, phase2NeedModal: number[], phase2AllCount: number, phase2Done: Set<number>, finishEmitSent?: boolean } | null} */
let incomeTaxSession = null;

function getCharacterRaces(character) {
	if (!character) {
		return [];
	}
	const r1 = String(character.race || "").trim();
	const r2 = String(character.race2 || "").trim();
	return [r1, r2].filter(Boolean);
}

function seatHasRace(seat, race) {
	const ch = characterBySeat?.[seat];
	const target = String(race || "").trim();
	if (!ch || !target) {
		return false;
	}
	return getCharacterRaces(ch).includes(target);
}

function getCharacterKinds(character) {
	if (!character) {
		return [];
	}
	const k1 = String(character.kind || "").trim();
	const k2 = String(character.kind2 || "").trim();
	return [k1, k2].filter(Boolean);
}

function seatHasKind(seat, kind) {
	const ch = characterBySeat?.[seat];
	const target = String(kind || "").trim();
	if (!ch || !target) {
		return false;
	}
	return getCharacterKinds(ch).includes(target);
}
class PlayerCharacterState {
	constructor(seat) {
		this.seat = seat;
		this.name = `Игрок ${Number(seat) + 1}`;
		/** @type {"Male" | "Female" | ""} */
		this.gender = "Male";
		this.level = 1;
		this.power = 1;
		this.race = "Human";
		/** Вторая раса (используется только при Half-breed). */
		this.race2 = "";
		/** Экипирована ли карта Half-breed (полукровка). */
		this.hasHalfBreed = false;
		this.kind = "";
		/** Второй класс (используется только при Super Munchkin). */
		this.kind2 = "";
		/** Экипирована ли карта Super Munchkin. */
		this.hasSuperMunchkin = false;
		this.body = 0;
		this.hand = 0;
		this.footwear = 0;
		this.hat = 0;
		this.big = 0;
		this.equipmentPower = 0;
		this.remover = 0;
		this.freeSlots = {
			body: 1,
			hand: 2,
			footwear: 1,
			hat: 1,
			big: 1,
		};
	}

	setLevel(level) {
		this.level = Math.max(1, Math.floor(Number(level)) || 1);
		this.power = Math.max(1, this.level + this.equipmentPower);
	}

	applyEquipmentCards(cards) {
		this.body = 0;
		this.hand = 0;
		this.footwear = 0;
		this.hat = 0;
		this.big = 0;
		this.equipmentPower = 0;
		this.remover = 0;

		cards.forEach(card => {
			this.body += Number(card?.body) || 0;
			this.hand += Number(card?.hand) || 0;
			this.footwear += Number(card?.footwear) || 0;
			this.hat += Number(card?.hat) || 0;
			this.big += Number(card?.big) || 0;
			this.equipmentPower += getTreasureEffectivePower(card, this);
			this.remover += Number(card?.remover) || 0;
		});

		this.freeSlots = {
			body: Math.max(0, 1 - this.body),
			hand: Math.max(0, 2 - this.hand),
			footwear: Math.max(0, 1 - this.footwear),
			hat: Math.max(0, 1 - this.hat),
			big: Math.max(0, 1 - this.big),
		};
		this.power = Math.max(1, this.level + this.equipmentPower);
	}
}

function getTreasureEffectivePower(treasure, character) {
	const base = Number(treasure?.power) || 0;
	const map = treasure?.powerByRace;
	if (map && typeof map === "object") {
		const races = [
			String(character?.race || "").trim(),
			String(character?.race2 || "").trim(),
		].filter(Boolean);
		let best = base;
		races.forEach((race) => {
			if (race && Object.prototype.hasOwnProperty.call(map, race)) {
				const v = Number(map[race]);
				if (Number.isFinite(v)) {
					best = Math.max(best, v);
				}
			}
		});
		return best;
	}
	return base;
}

const characterBySeat = [
	new PlayerCharacterState(0),
	new PlayerCharacterState(1),
	new PlayerCharacterState(2),
];
window.characterBySeat = characterBySeat;
let battleActive = false;
let pendingHelpSeats = new Set();
let acceptedHelperSeat = null;
/** В бою с монстром: кто ведёт бой (сила MyBonus, смывка, уровни). По умолчанию null = {@link currentTurnSeat}. */
let monsterFightSeat = null;

function getMonsterFightSeat() {
	// ВАЖНО: battleActive может расходиться между клиентами (особенно у помощника),
	// но факт боя можно надёжно определить по наличию монстров на столе.
	if (!battleActive && !getMonsterBattleContext().hasMonster) {
		return currentTurnSeat;
	}
	if (monsterFightSeat != null && monsterFightSeat !== undefined && !Number.isNaN(Number(monsterFightSeat))) {
		const m = Number(monsterFightSeat);
		const maxSeat = Math.max(1, Number(num) || characterBySeat.length || 3) - 1;
		if (m >= 0 && m <= maxSeat) {
			return m;
		}
	}
	return currentTurnSeat;
}

let escapeActive = false;
let escapeQueue = [];
let escapeQueueIndex = -1;
let escapeMonsterRemover = 0;
let escapeMonsterBadStaff = null;
let escapeMonsterQueue = [];
let escapeMonsterInitialCount = 0;
let escapeMonsterTemplateQueue = [];
let escapeCurrentMonsterCardId = null;
let escapeCurrentSeat = null;
let escapeWaitingForRoll = false;
let escapeOwnerSeat = null;
let escapeRollInProgress = false;
let escapeAttemptNumber = 0;
let escapeHalflingRetryUsedForCurrentAttempt = false;
let escapeHalflingRetryPending = null;
let escapeWizardFlightPending = null;
// Instant wall: приоритет помощника и предложение лидеру.
let escapeInstantWallGate = null; // { helperSeat, loserSeat } пока ждём решения помощника перед стартом смывки
let escapeInstantWallOfferPending = null; // { helperSeat, loserSeat } пока ждём ответа лидера (принять стенку или нет)
let instantWallSoloAidWaitingEmitted = false; // ждали рассылку InstantWallSoloAidWaiting (aid с опцией стенки) — чтобы при закрытии aid ушёл InstantWallSoloAidClose
let escapeInstantWallAutoSeats = new Set(); // места, которые будут смываться автоматически (без кубика) от всех монстров
let escapeFailAidPending = null; // { seat, payload, attemptNumber } ждём решения игрока по помощи после провала смывки
let escapeGluePromptState = null; // только у владельца очереди: { key, escapedSeat, wallFleeSeats?, monsterCardId, pending: Set<number>, resolved: boolean, viaInstantWall: boolean, finishAfter: boolean }
let escapeGlueWaitingKey = null; // key опроса клея, для показа статуса "игрок решает" на всех клиентах
/** Пока ждём выбор монстра для смывки (EscapeMonsterPickStart); нужен для restore после F5. */
let escapeMonsterPickSession = null;
let sellTreasuresDelegated = false;
let turnAwaitingManualEnd = false;
let deathLootActive = false;
let deathLootState = null;
let resumeEscapeAfterLoot = false;
let deathLootAwaitingEscapeFinish = false;
const halflingDoubleSellUsedBySeat = [false, false, false];
const warriorFrenzyUsedBySeat = [0, 0, 0];
const warriorFrenzyBonusBySeat = [0, 0, 0];
const clericExorcismUsedBySeat = [0, 0, 0];
const clericExorcismBonusBySeat = [0, 0, 0];
/** В этом бою жертва уже «подрезана» (1 карта = один раз). */
const victimThiefTrimUsedBySeat = [0, 0, 0];
/** −2 в бою к силе жертвы; остаётся до конца боя, даже если вор снял класс. */
const thiefBackstabDebuffBySeat = [0, 0, 0];
const THIEF_THEFT_SUCCESS_ROLL = 4;
/** Сброшена карта кражи; ждём клик по общему кубику .dice-container. */
let thiefTheftBoardDicePending = false;
let thiefTheftBoardDiceInProgress = false;
const ESCAPE_TARGET_ROLL = 5;
const WIZARD_FLIGHT_MAX_DISCARD = 3;
const ACTIVE_TURN_FILTER = "brightness(0) saturate(100%) invert(90%) sepia(100%) saturate(1000%) hue-rotate(30deg) brightness(100%) contrast(100%)";
const HELPER_FILTER = "brightness(0.9) saturate(120%) invert(37%) sepia(99%) saturate(1598%) hue-rotate(188deg) brightness(100%) contrast(101%)";
const TOP_ICON_SELECTORS = new Set([
	'.top-center-image',
	'.image-top-left',
	'.image-top-right',
]);
const ALL_ICON_SELECTORS = [
	'.image-bottom-center',
	'.top-center-image',
	'.image-top-right',
	'.image-top-left',
	'.image-bottom-right',
	'.image-bottom-left',
];
//export const socket = io('http://localhost:3001');

function setDisplay(selector, displayValue) {
	const element = document.querySelector(selector);
	if (element) {
		element.style.display = displayValue;
	}
}

function setZoneInteractivityByPlayers(numPlayers) {
	const allZoneIds = [
		'myhand',
		'opponenthand',
		'opponent2hand',
		'opponent3hand',
		'zone2',
		'zone3',
		'zone5',
		'zone_opponent',
		'zone_opponent_side',
		'zone_opponent2',
		'zone_opponent2_side',
		'zone_opponent3',
		'zone_opponent3_side',
		'zone_monster',
		'zone_doors',
		'zone_treasure',
		'zone_doors_drop',
		'zone_treasure_drop',
	];

	const enabledZoneIds = new Set([
		// Базовые игровые зоны, активные в любом количестве игроков.
		'myhand',
		'zone2',
		'zone3',
		'zone5',
		'zone_monster',
		'zone_doors',
		'zone_treasure',
		'zone_doors_drop',
		'zone_treasure_drop',
	]);

	if (numPlayers === 2) {
		enabledZoneIds.add('opponenthand');
		enabledZoneIds.add('zone_opponent');
		enabledZoneIds.add('zone_opponent_side');
	}

	if (numPlayers === 3) {
		enabledZoneIds.add('opponent2hand');
		enabledZoneIds.add('zone_opponent2');
		enabledZoneIds.add('zone_opponent2_side');
		enabledZoneIds.add('opponent3hand');
		enabledZoneIds.add('zone_opponent3');
		enabledZoneIds.add('zone_opponent3_side');
	}

	allZoneIds.forEach(id => {
		const zone = document.getElementById(id);
		if (!zone) {
			return;
		}
		const enabled = enabledZoneIds.has(id);
		zone.style.pointerEvents = enabled ? 'auto' : 'none';
		zone.style.opacity = enabled ? '' : '0.5';
	});
}

function updatePlayersUiVisibility(numPlayers) {
	setZoneInteractivityByPlayers(numPlayers);

	// Скрываем слоты оппонентов.
	setDisplay('.top-center-image', 'none');
	setDisplay('.level-top-center', 'none');
	setDisplay('.top-center', 'none');

	setDisplay('.image-top-left', 'none');
	setDisplay('.level-top-left', 'none');
	setDisplay('.top-left', 'none');

	setDisplay('.image-top-right', 'none');
	setDisplay('.level-top-right', 'none');
	setDisplay('.top-right', 'none');

	setDisplay('.image-bottom-left', 'none');
	setDisplay('.level-bottom-left', 'none');
	setDisplay('.bottom-left', 'none');

	setDisplay('.image-bottom-right', 'none');
	setDisplay('.level-bottom-right', 'none');
	setDisplay('.bottom-right', 'none');

	// Локальный игрок всегда видим.
	setDisplay('.image-bottom-center', 'block');
	setDisplay('.level-bottom-center', 'block');
	setDisplay('.bottom-center', 'flex');

	if (numPlayers === 2) {
		// Один оппонент.
		setDisplay('.top-center-image', 'block');
		setDisplay('.level-top-center', 'block');
		setDisplay('.top-center', 'flex');
	}

	if (numPlayers === 3) {
		// Два оппонента.
		setDisplay('.image-top-left', 'block');
		setDisplay('.level-top-left', 'block');
		setDisplay('.top-left', 'block');

		setDisplay('.image-top-right', 'block');
		setDisplay('.level-top-right', 'block');
		setDisplay('.top-right', 'block');
	}
}

/**
 * Сколько игроков учитывать в маппинге мест → зон (иконки, сила, уровень, рука, налог).
 * Строго num === 2 | 3 — как раньше; иначе Number(num)||window.num (после StartGame num иногда строка или ещё не записан).
 */
function effectiveSeatLayoutPlayerCount() {
	if (num === 2 || num === 3) {
		return num;
	}
	const n = Number(num) || Number(window.num);
	if (!Number.isFinite(n)) {
		return 2;
	}
	return Math.min(3, Math.max(2, Math.floor(n)));
}

function getSeatToIconMap() {
	const n = effectiveSeatLayoutPlayerCount();
	if (n === 2) {
		return localSeat === 1
			? { 1: '.image-bottom-center', 0: '.top-center-image' }
			: { 0: '.image-bottom-center', 1: '.top-center-image' };
	}

	if (n >= 3) {
		if (localSeat === 1) {
			return { 1: '.image-bottom-center', 2: '.image-top-right', 0: '.image-top-left' };
		}
		if (localSeat === 2) {
			return { 2: '.image-bottom-center', 0: '.image-top-right', 1: '.image-top-left' };
		}
		return { 0: '.image-bottom-center', 1: '.image-top-right', 2: '.image-top-left' };
	}

	return { 0: '.image-bottom-center' };
}

function getSeatToPowerMap() {
	const n = effectiveSeatLayoutPlayerCount();
	if (n === 2) {
		return localSeat === 1
			? { 1: '.MyPower', 0: '.PowerPlayer2' }
			: { 0: '.MyPower', 1: '.PowerPlayer2' };
	}

	if (n >= 3) {
		if (localSeat === 1) {
			return { 1: '.MyPower', 2: '.PowerPlayer3', 0: '.PowerPlayer4' };
		}
		if (localSeat === 2) {
			return { 2: '.MyPower', 0: '.PowerPlayer3', 1: '.PowerPlayer4' };
		}
		return { 0: '.MyPower', 1: '.PowerPlayer3', 2: '.PowerPlayer4' };
	}

	return { 0: '.MyPower' };
}

function getSeatToBattleZoneMap() {
	// Важно: зона экипировки должна соответствовать тому же игроку, что и вывод силы в getSeatToPowerMap.
	// Строим маппинг от power-селекторов, чтобы избежать рассинхрона zone_opponent2/zone_opponent3.
	const powerToZone = {
		'.MyPower': '.zone2',
		'.PowerPlayer2': '.zone_opponent',
		'.PowerPlayer3': '.zone_opponent2',
		'.PowerPlayer4': '.zone_opponent3',
		'.PowerPlayer5': '.zone_opponent_side',
		'.PowerPlayer6': '.zone_opponent2_side',
	};

	const seatToPowerMap = getSeatToPowerMap();
	const seatToZoneMap = {};
	Object.entries(seatToPowerMap).forEach(([seatKey, powerSelector]) => {
		const zoneSelector = powerToZone[powerSelector];
		if (zoneSelector) {
			seatToZoneMap[seatKey] = zoneSelector;
		}
	});

	return seatToZoneMap;
}

function getSeatToLevelMap() {
	const n = effectiveSeatLayoutPlayerCount();
	if (n === 2) {
		return localSeat === 1
			? { 1: '.level-bottom-center', 0: '.level-top-center' }
			: { 0: '.level-bottom-center', 1: '.level-top-center' };
	}

	if (n >= 3) {
		if (localSeat === 1) {
			return { 1: '.level-bottom-center', 2: '.level-top-right', 0: '.level-top-left' };
		}
		if (localSeat === 2) {
			return { 2: '.level-bottom-center', 0: '.level-top-right', 1: '.level-top-left' };
		}
		return { 0: '.level-bottom-center', 1: '.level-top-right', 2: '.level-top-left' };
	}

	return { 0: '.level-bottom-center' };
}

function showBattleResult(text) {
	const battleResultElement = document.getElementById('battle-result');
	if (battleResultElement) {
		battleResultElement.textContent = text;
		battleResultElement.style.display = 'block';
	}
}

function showLootStatus(text) {
	// Переиспользуем battle-result как строку статуса.
	// В будущем можно выделить отдельный элемент, но сейчас достаточно так.
	showBattleResult(text);
}

function hideBattleResult() {
	const battleResultElement = document.getElementById('battle-result');
	if (battleResultElement) {
		battleResultElement.textContent = '';
		battleResultElement.style.display = 'none';
	}
}

function formatGenderRu(gender) {
	const g = String(gender || "").trim();
	if (g === "Male") return "М";
	if (g === "Female") return "Ж";
	return "";
}

function getChickenOnHeadDicePenaltyForSeat(seat) {
	// door24: chicken on your head
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return 0;
	}
	return isCardInSeatMainOrSide("door24", s) ? -1 : 0;
}

function applyDicePenaltyForSeat(seat, roll) {
	const r = Number(roll);
	if (!Number.isFinite(r)) {
		return roll;
	}
	const next = r + getChickenOnHeadDicePenaltyForSeat(seat);
	// Бросок кубика остаётся в диапазоне 1..6
	return Math.max(1, Math.min(6, Math.floor(next)));
}

function hideSeatIconTooltip() {
	const existing = document.getElementById("seat-icon-tooltip");
	if (existing) {
		existing.remove();
	}
}

function showSeatIconTooltipForSeat(seat, anchorEl) {
	if (!anchorEl) {
		return;
	}
	hideSeatIconTooltip();
	const s = Number(seat);
	const name = String(characterBySeat?.[s]?.name || "").trim() || `Игрок ${s + 1}`;
	const gender = formatGenderRu(characterBySeat?.[s]?.gender || "");
	const tip = document.createElement("div");
	tip.id = "seat-icon-tooltip";
	tip.style.position = "fixed";
	tip.style.zIndex = "100000";
	tip.style.padding = "6px 10px";
	tip.style.borderRadius = "10px";
	tip.style.background = "rgba(0,0,0,0.72)";
	tip.style.color = "#fff";
	tip.style.fontSize = "18px";
	tip.style.lineHeight = "1.1";
	tip.style.pointerEvents = "none";
	tip.textContent = gender ? `${name} (${gender})` : name;
	const rect = anchorEl.getBoundingClientRect();
	// Плашка прямо поверх иконки (по центру).
	tip.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
	tip.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
	tip.style.transform = "translate(-50%, -50%)";
	document.body.appendChild(tip);
}

function bindSeatIconHoverTooltips() {
	const seatToIconMap = getSeatToIconMap();
	Object.entries(seatToIconMap).forEach(([seatKey, selector]) => {
		const seat = parseInt(seatKey, 10);
		if (Number.isNaN(seat) || !selector) {
			return;
		}
		const el = document.querySelector(selector);
		if (!el) {
			return;
		}
		if (String(el.dataset?.seatTooltipBound || "") === "1") {
			return;
		}
		el.dataset.seatTooltipBound = "1";
		el.addEventListener("mouseenter", () => showSeatIconTooltipForSeat(seat, el));
		el.addEventListener("mouseleave", () => hideSeatIconTooltip());
	});
	// Если уводим курсор/перекладываем DOM — прячем.
	window.addEventListener("scroll", hideSeatIconTooltip, { passive: true });
	window.addEventListener("resize", hideSeatIconTooltip);
}

function setLevelBySeat(seat, level) {
	const v = Math.max(1, Math.floor(Number(level)) || 1);
	if (seat >= 0 && seat <= 2) {
		levelBySeat[seat] = v;
		characterBySeat[seat]?.setLevel(v);
	}
	const seatToLevelMap = getSeatToLevelMap();
	const levelSelector = seatToLevelMap[seat];
	const levelElement = levelSelector ? document.querySelector(levelSelector) : null;
	if (levelElement) {
		levelElement.textContent = String(v);
	}
}

export function isPlayerPlayZoneElement(zoneEl) {
	if (!zoneEl?.id) {
		return false;
	}
	const playZoneIds = new Set([
		'zone2',
		'zone5',
		'zone_opponent',
		'zone_opponent_side',
		'zone_opponent2',
		'zone_opponent2_side',
		'zone_opponent3',
		'zone_opponent3_side',
	]);
	return playZoneIds.has(zoneEl.id);
}

export function getGlobalSeatForPlayZone(zoneEl) {
	if (!zoneEl) {
		return null;
	}
	const nPlayers = Number(num) || Number(window.num);
	if (!Number.isFinite(nPlayers) || nPlayers < 1) {
		return null;
	}
	// id при swap не совпадает с «ролью» зоны: ориентируемся на те же .zone2 / .zone5,
	// что и getSeatToBattleZoneMap (querySelector по классу).
	const maxSeat = Math.min(Math.floor(nPlayers), characterBySeat.length);
	for (let seat = 0; seat < maxSeat; seat += 1) {
		const { main, side } = getMainAndSideZoneElementsForSeat(seat);
		if (zoneEl === main || zoneEl === side) {
			return seat;
		}
	}
	return null;
}

function isMainEquipmentZoneElement(zoneEl) {
	if (!zoneEl) {
		return false;
	}
	const nPlayers = Number(num) || Number(window.num);
	if (!Number.isFinite(nPlayers) || nPlayers < 1) {
		return false;
	}
	const maxSeat = Math.min(Math.floor(nPlayers), characterBySeat.length);
	for (let seat = 0; seat < maxSeat; seat += 1) {
		const { main } = getMainAndSideZoneElementsForSeat(seat);
		if (main && zoneEl === main) {
			return true;
		}
	}
	return false;
}

function isSideEquipmentZoneElement(zoneEl) {
	if (!zoneEl) {
		return false;
	}
	const nPlayers = Number(num) || Number(window.num);
	if (!Number.isFinite(nPlayers) || nPlayers < 1) {
		return false;
	}
	const maxSeat = Math.min(Math.floor(nPlayers), characterBySeat.length);
	for (let seat = 0; seat < maxSeat; seat += 1) {
		const { side } = getMainAndSideZoneElementsForSeat(seat);
		if (side && zoneEl === side) {
			return true;
		}
	}
	return false;
}

// Пары main/side по class-селекторам, как в getSeatToBattleZoneMap (id у блоков НЕ двигаются при 2/3P swap).
const BATTLE_MAIN_SELECTOR_TO_SIDE_SELECTOR = {
	'.zone2': '.zone5',
	'.zone_opponent': '.zone_opponent_side',
	'.zone_opponent2': '.zone_opponent2_side',
	'.zone_opponent3': '.zone_opponent3_side',
};

/**
 * «Свой» / чужой стол после swap определяется классом (.zone2, …), а не id.
 * @param {number} seat
 * @returns {{ main: Element | null, side: Element | null }}
 */
function getMainAndSideZoneElementsForSeat(seat) {
	const seatToBattle = getSeatToBattleZoneMap();
	const mainSel = seatToBattle[seat] ?? seatToBattle[String(seat)];
	if (!mainSel) {
		return { main: null, side: null };
	}
	const main = document.querySelector(mainSel);
	const sideSel = BATTLE_MAIN_SELECTOR_TO_SIDE_SELECTOR[mainSel];
	const side = sideSel ? document.querySelector(sideSel) : null;
	return { main, side };
}

/** Рука игрока seat с точки зрения этого клиента. Класс .myhand — у текущего игрока (id не обязан быть myhand после 2/3P swap). */
function getHandElementForPlayerSeat(targetSeat) {
	if (targetSeat == null || targetSeat < 0) {
		return null;
	}
	if (Number(targetSeat) === Number(localSeat)) {
		return document.querySelector(".myhand");
	}
	const n = effectiveSeatLayoutPlayerCount();
	if (n === 2) {
		return document.querySelector(".opponenthand");
	}
	if (n >= 3) {
		const bz = getSeatToBattleZoneMap();
		const mainSel = bz[String(targetSeat)] ?? bz[targetSeat];
		if (!mainSel) {
			return null;
		}
		if (mainSel.includes("zone_opponent2") && !mainSel.includes("zone_opponent3")) {
			return document.getElementById("opponent2hand");
		}
		if (mainSel.includes("zone_opponent3")) {
			return document.getElementById("opponent3hand");
		}
		if (mainSel.includes("zone_opponent")) {
			return document.getElementById("opponenthand");
		}
	}
	return null;
}

function isTreasureSmallShmot(treasure) {
	if (!treasure) {
		return false;
	}
	return (Number(treasure.big) || 0) === 0;
}

function collectSmallStealableTreasuresFromSeat(victimSeat) {
	const out = [];
	const { main, side } = getMainAndSideZoneElementsForSeat(victimSeat);
	[main, side].forEach((zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const t = window.treasures?.find((tr) => tr.name === cardEl.id);
			if (!t || !isTreasureSmallShmot(t)) {
				return;
			}
			const imgEl = cardEl.querySelector(".card-item");
			if (!imgEl?.src) {
				return;
			}
			out.push({ cardId: cardEl.id, img: imgEl.src });
		});
	});
	return out;
}

function isSeatDwarfRaceActive(seat) {
	const { main } = getMainAndSideZoneElementsForSeat(seat);
	if (!main) {
		return false;
	}
	const mainCards = Array.from(main.querySelectorAll('.card'));
	return mainCards.some((cardEl) => {
		const doorCard = window.doors?.find(d => d.name === cardEl.id);
		return doorCard?.race === "Dwarf";
	});
}

function isEquipmentSumsValid(body, hand, footwear, hat, big) {
	return body <= 1 && hand <= 2 && footwear <= 1 && hat <= 1 && big <= 1;
}

function doesTreasureRestrictionsAllowSeat(treasure, seat) {
	const rules = treasure?.restrictions;
	if (!Array.isArray(rules) || rules.length === 0) {
		return true;
	}
	const ch = characterBySeat?.[seat];
	const isHalfBreedSingleRace = Boolean(ch?.hasHalfBreed) && String(ch?.race2 || "") === "Human";
	const isSuperMunchkinSingleClass = Boolean(ch?.hasSuperMunchkin) && !String(ch?.kind2 || "").trim();
	const races = [
		String(ch?.race || "").trim(),
		String(ch?.race2 || "").trim(),
	].filter(Boolean);
	const kinds = [
		String(ch?.kind || "").trim(),
		String(ch?.kind2 || "").trim(),
	].filter(Boolean);
	const kind = String(ch?.kind || "");
	const gender = String(ch?.gender || "");
	const matchesAny = (value, allowedList) => Array.isArray(allowedList) && allowedList.some((x) => String(x) === String(value));
	const matchesAnyRace = (allowedList) => Array.isArray(allowedList) && races.some((r) => matchesAny(r, allowedList));
	const matchesAnyKind = (allowedList) => Array.isArray(allowedList) && kinds.some((k) => matchesAny(k, allowedList));

	return rules.every((rule) => {
		const mode = String(rule?.mode || "");
		const raceList = rule?.race;
		const kindList = rule?.kind;
		const genderList = rule?.gender;

		// Если в правиле нет полей — игнорируем.
		const hasAnyField = Array.isArray(raceList) || Array.isArray(kindList) || Array.isArray(genderList);
		if (!hasAnyField) {
			return true;
		}

		// Half-breed + 1 раса: режим "not" не действует (полностью).
		if ((isHalfBreedSingleRace || isSuperMunchkinSingleClass) && mode === "not") {
			return true;
		}

		// "only Human" должен запрещать шмот при Half-breed + 1 раса (даже если вторая раса базовая Human).
		if (mode === "only" && Array.isArray(raceList) && raceList.some((x) => String(x) === "Human")) {
			const isPureHuman = races.length === 1 && races[0] === "Human";
			return isPureHuman;
		}

		const okRace = !Array.isArray(raceList) || (mode === "not" ? !matchesAnyRace(raceList) : matchesAnyRace(raceList));
		const okKind = !Array.isArray(kindList) || (mode === "not" ? !matchesAnyKind(kindList) : matchesAnyKind(kindList));
		const okGender = !Array.isArray(genderList) || (mode === "not" ? !matchesAny(gender, genderList) : matchesAny(gender, genderList));

		// AND между полями
		return okRace && okKind && okGender;
	});
}

/**
 * Можно ли оставить карту в зоне экипировки для этого места.
 * Логика:
 * - в боковую зону можно класть любые не-big шмотки, даже при занятых слотах;
 * - big нельзя класть в боковую зону;
 * - в основную зону проверяем обычные лимиты слотов.
 * @param {HTMLElement} draggingCardEl
 * @param {Element | null} targetZoneEl — зона под курсором (или null).
 */
export function canPlaceTreasureInPlayerEquipment(draggingCardEl, targetZoneEl) {
	if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
		return true;
	}
	const seat = getGlobalSeatForPlayZone(targetZoneEl);
	if (seat == null) {
		return true;
	}
	const treasure = window.treasures?.find(t => t.name === draggingCardEl.id);
	if (!treasure) {
		return true;
	}

	const { main, side } = getMainAndSideZoneElementsForSeat(seat);
	if (!main) {
		return true;
	}
	const isTargetSideZone = !!side && targetZoneEl === side;
	const hasCheat = Boolean(draggingCardEl?.dataset?.cheatCardId);
	const hasHireling = Boolean(draggingCardEl?.dataset?.hirelingCardId);

	const allowHirelingAssist = !isTargetSideZone
		&& isMainEquipmentZoneElement(targetZoneEl)
		&& !hasCheat
		&& !hasHireling
		&& !Boolean(treasure?.oneTime)
		&& !isTreasureSpecial(draggingCardEl.id, "Hireling")
		&& (() => {
			const h = getHirelingCardInMainForSeat(seat);
			return Boolean(h && !String(h.dataset?.hirelingAttachedTreasureId || ""));
		})();
	// ВАЖНО: ограничения по расе/классу/полу блокируют экипировку в ОСНОВНУЮ зону,
	// но в боковую зону такие карты класть можно.
	if (!isTargetSideZone && !hasCheat && !hasHireling && !doesTreasureRestrictionsAllowSeat(treasure, seat)) {
		return allowHirelingAssist;
	}
	const draggedBig = Number(treasure.big) || 0;

	// Считаем все big у игрока (основная + боковая), кроме перетаскиваемой карты.
	const allPlayerCards = [];
	const pushUnique = (cardEl) => {
		if (cardEl && allPlayerCards.indexOf(cardEl) === -1) {
			allPlayerCards.push(cardEl);
		}
	};
	main.querySelectorAll('.card').forEach(pushUnique);
	side?.querySelectorAll?.('.card')?.forEach(pushUnique);
	let existingBigTotal = 0;
	allPlayerCards.forEach((el) => {
		if (el === draggingCardEl) {
			return;
		}
		// Шмотка под Cheat не занимает слоты и не считается big.
		if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
			return;
		}
		const t = window.treasures.find(tr => tr.name === el.id);
		if (t) {
			existingBigTotal += Number(t.big) || 0;
		}
	});
	const nextBigTotal = existingBigTotal + ((hasCheat || hasHireling) ? 0 : draggedBig);
	const dwarfUnlimitedBig = isSeatDwarfRaceActive(seat);
	if (!dwarfUnlimitedBig && nextBigTotal > 1) {
		return allowHirelingAssist;
	}

	if (isTargetSideZone) {
		// Боковая зона не расходует обычные слоты, но общий лимит big уже проверен выше.
		return true;
	}

	/** @type {HTMLElement[]} */
	const seen = [];
	const fromZone = (z) => {
		z?.querySelectorAll?.('.card')?.forEach((c) => {
			if (seen.indexOf(c) === -1) {
				seen.push(c);
			}
		});
	};
	fromZone(main);

	let body = 0;
	let hand = 0;
	let footwear = 0;
	let hat = 0;
	let big = 0;

	seen.forEach((el) => {
		if (el === draggingCardEl) {
			return;
		}
		// Шмотка под Cheat не занимает слоты.
		if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
			return;
		}
		const t = window.treasures.find(tr => tr.name === el.id);
		if (t) {
			body += Number(t.body) || 0;
			hand += Number(t.hand) || 0;
			footwear += Number(t.footwear) || 0;
			hat += Number(t.hat) || 0;
			big += Number(t.big) || 0;
		}
	});

	if (!hasCheat && !hasHireling) {
		body += Number(treasure.body) || 0;
		hand += Number(treasure.hand) || 0;
		footwear += Number(treasure.footwear) || 0;
		hat += Number(treasure.hat) || 0;
		big += Number(treasure.big) || 0;
	}

	const ok = isEquipmentSumsValid(body, hand, footwear, hat, big);
	return ok || allowHirelingAssist;
}

function isHalfBreedDoorCard(doorCard) {
	return Boolean(doorCard && (String(doorCard.special || "") === "Half-breed" || String(doorCard.card_name || "") === "Half-breed"));
}

function isSuperMunchkinDoorCard(doorCard) {
	return Boolean(doorCard && (String(doorCard.special || "") === "Super Munchkin" || String(doorCard.card_name || "") === "Super Munchkin"));
}

/**
 * Проверка экипировки дверных карт (расы / Half-breed) в основную экипировку.
 * Нужна для подсветки/отката при drag&drop как у шмоток.
 */
export function canPlaceDoorInPlayerEquipment(draggingCardEl, targetZoneEl) {
	if (!draggingCardEl || !isPlayerPlayZoneElement(targetZoneEl)) {
		return true;
	}
	// Ограничения действуют только для основной экипировки.
	if (!isMainEquipmentZoneElement(targetZoneEl)) {
		return true;
	}
	const seat = getGlobalSeatForPlayZone(targetZoneEl);
	if (seat == null) {
		return true;
	}
	const door = window.doors?.find((d) => d.name === draggingCardEl.id);
	if (!door) {
		return true;
	}
	// Монстры / не-дверные эффекты не ограничиваем здесь.
	if (String(door.race || "") === "monster") {
		return true;
	}
	// Проклятия и двери с bad_staff: любой игрок может положить на любого (в т.ч. на себя), без правил рас/классов.
	if (String(door.special || "").trim().toLowerCase() === "curse" || normalizeBadStaff(door.bad_staff)) {
		return true;
	}

	const { main } = getMainAndSideZoneElementsForSeat(seat);
	if (!main) {
		return true;
	}

	// Состояние main по DOM; если перетаскиваемая карта ещё не в main — добавляем её к счётчикам (проверка до вставки при dragover).
	let hasHalfBreed = false;
	let halfBreedCount = 0;
	const raceCounts = new Map(); // race -> count
	let hasSuperMunchkin = false;
	let superMunchkinCount = 0;
	const kindCounts = new Map(); // kind -> count
	main.querySelectorAll(".card").forEach((el) => {
		const d = window.doors?.find((x) => x.name === el.id);
		if (!d) {
			return;
		}
		if (isHalfBreedDoorCard(d)) {
			hasHalfBreed = true;
			halfBreedCount += 1;
		}
		if (isSuperMunchkinDoorCard(d)) {
			hasSuperMunchkin = true;
			superMunchkinCount += 1;
		}
		if (d.race && String(d.race) !== "monster") {
			const r = String(d.race);
			raceCounts.set(r, (raceCounts.get(r) || 0) + 1);
		}
		if (d.kind) {
			const k = String(d.kind);
			kindCounts.set(k, (kindCounts.get(k) || 0) + 1);
		}
	});

	// Если карта ещё не в main (например, dragover до вставки из руки), учитываем её как «гипотетическую» экипировку.
	if (!main.contains(draggingCardEl)) {
		const d = door;
		if (isHalfBreedDoorCard(d)) {
			hasHalfBreed = true;
			halfBreedCount += 1;
		}
		if (isSuperMunchkinDoorCard(d)) {
			hasSuperMunchkin = true;
			superMunchkinCount += 1;
		}
		if (d.race && String(d.race) !== "monster") {
			const r = String(d.race);
			raceCounts.set(r, (raceCounts.get(r) || 0) + 1);
		}
		if (d.kind) {
			const k = String(d.kind);
			kindCounts.set(k, (kindCounts.get(k) || 0) + 1);
		}
	}

	// Разрешаем максимум одну Half-breed.
	if (isHalfBreedDoorCard(door) && halfBreedCount > 1) {
		return false;
	}
	// Разрешаем максимум одну Super Munchkin.
	if (isSuperMunchkinDoorCard(door) && superMunchkinCount > 1) {
		return false;
	}

	// Half-breed можно экипировать только если уже есть (хотя бы 1) раса в main (кроме Human по умолчанию).
	if (isHalfBreedDoorCard(door)) {
		const raceCardCount = Array.from(raceCounts.values()).reduce((a, b) => a + b, 0);
		return raceCardCount >= 1;
	}
	// Super Munchkin можно экипировать только если уже есть (хотя бы 1) класс в main.
	if (isSuperMunchkinDoorCard(door)) {
		const kindCardCount = Array.from(kindCounts.values()).reduce((a, b) => a + b, 0);
		return kindCardCount >= 1;
	}

	// Если это карта расы.
	if (door.race) {
		const totalRaceCards = Array.from(raceCounts.values()).reduce((a, b) => a + b, 0);
		const uniqueRaceCards = raceCounts.size;

		// Запрет на одинаковые расы при Half-breed.
		if (hasHalfBreed) {
			// дубликат любой расы запрещён
			if ((raceCounts.get(String(door.race)) || 0) > 1) {
				return false;
			}
			// максимум 2 разных рас
			return uniqueRaceCards <= 2 && totalRaceCards <= 2;
		}

		// Пока Half-breed не экипирована — максимум 1 раса в экипировке.
		return totalRaceCards <= 1;
	}

	// Если это карта класса.
	if (door.kind) {
		const totalKindCards = Array.from(kindCounts.values()).reduce((a, b) => a + b, 0);
		const uniqueKindCards = kindCounts.size;
		if (hasSuperMunchkin) {
			// дубликат любого класса запрещён
			if ((kindCounts.get(String(door.kind)) || 0) > 1) {
				return false;
			}
			// максимум 2 класса
			return uniqueKindCards <= 2 && totalKindCards <= 2;
		}
		// Без Super Munchkin — максимум 1 класс
		return totalKindCards <= 1;
	}

	return true;
}

function normalizeBadStaff(badStaff) {
	if (!badStaff || typeof badStaff !== "object") {
		return null;
	}
	const type = String(badStaff.type || "");
	if (!type) {
		return null;
	}
	if (type === "lose_levels") {
		const levels = Number(badStaff.levels) || 0;
		return levels > 0 ? { type: "lose_levels", levels } : null;
	}
	if (type === "death") {
		return { type: "death" };
	}
	return { type };
}

function getBadStaffLevelLoss(badStaff) {
	const normalized = normalizeBadStaff(badStaff);
	if (!normalized || normalized.type !== "lose_levels") {
		return 0;
	}
	return Number(normalized.levels) || 0;
}

function applyBadStaffToSeat(seat, badStaff) {
	const normalized = normalizeBadStaff(badStaff);
	if (!normalized) {
		return;
	}
	if (normalized.type !== "lose_levels") {
		// Другие типы (например death) будут обработаны отдельной механикой.
		return;
	}
	const levelLoss = getBadStaffLevelLoss(normalized);
	if (!Number.isFinite(levelLoss) || levelLoss <= 0) {
		return;
	}
	let current = levelBySeat[seat];
	if (current == null || Number.isNaN(current)) {
		current = 1;
	}
	current = Math.max(1, current);
	const next = Math.max(1, current - levelLoss);
	setLevelBySeat(seat, next);
	recalculateAllPowerDisplays();
}

/** Карта класса для экипировки (kind), не монстр. */
function isDoorEquippedClassKindCard(door) {
	if (!door || String(door.race || "") === "monster") {
		return false;
	}
	return Boolean(String(door.kind || "").trim());
}

/** Верх сброса дверей = последняя сброшенная карта (конец DOM). Ищем сверху вниз первый класс. */
function findTopDoorDiscardClassCardId() {
	const z = document.getElementById("zone_doors_drop");
	if (!z) {
		return null;
	}
	const els = Array.from(z.querySelectorAll(".card"));
	for (let i = els.length - 1; i >= 0; i--) {
		const id = els[i]?.id;
		if (!id || !String(id).includes("door")) {
			continue;
		}
		const door = window.doors?.find((d) => d.name === id);
		if (isDoorEquippedClassKindCard(door)) {
			return id;
		}
	}
	return null;
}

function collectEquippedClassDoorIdsForSeat(seat) {
	const out = [];
	const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
	[main, side].forEach((zone) => {
		if (!zone) {
			return;
		}
		zone.querySelectorAll(".card").forEach((el) => {
			const id = el?.id;
			if (!id || !String(id).includes("door")) {
				return;
			}
			const door = window.doors?.find((d) => d.name === id);
			if (isDoorEquippedClassKindCard(door) && !out.includes(id)) {
				out.push(id);
			}
		});
	});
	return out;
}

function collectEquippedSuperMunchkinDoorIdsForSeat(seat) {
	const out = [];
	const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
	[main, side].forEach((zone) => {
		if (!zone) {
			return;
		}
		zone.querySelectorAll(".card").forEach((el) => {
			const id = el?.id;
			if (!id) {
				return;
			}
			const door = window.doors?.find((d) => d.name === id);
			if (isSuperMunchkinDoorCard(door) && !out.includes(id)) {
				out.push(id);
			}
		});
	});
	return out;
}

function syncDoorCardMoveToZone(cardId, zoneId, targetId = null) {
	const id = String(cardId || "").trim();
	const zid = String(zoneId || "").trim();
	if (!id || !zid || !document.getElementById(id)) {
		return;
	}
	applyMoveCardLocally({
		method: "moveCard",
		cardId: id,
		zoneId: zid,
		targetId: targetId || null,
	});
	socket.emit("message", {
		method: "moveCard",
		cardId: id,
		zoneId: zid,
		targetId: targetId || null,
	});
}

function syncDoorCardMoveToDiscard(cardId) {
	const z = document.getElementById("zone_doors_drop");
	// Чтобы порядок сброса корректно восстанавливался после refresh, сохраняем targetId:
	// "вставить после текущей верхней карты сброса" (то есть после последней в DOM).
	let targetId = null;
	if (z) {
		const els = Array.from(z.querySelectorAll(".card"));
		for (let i = els.length - 1; i >= 0; i--) {
			const id = els[i]?.id;
			// В сбросе есть плейсхолдер (id="card") — его нельзя использовать как targetId,
			// иначе карты после refresh будут оказываться "внизу".
			if (!id || id === "card") {
				continue;
			}
			if (id === cardId) {
				continue;
			}
			targetId = id;
			break;
		}
	}
	syncDoorCardMoveToZone(cardId, "zone_doors_drop", targetId);
	// Для Change sex: как только карта проклятия попала в сброс, её можно применять снова.
	const el = document.getElementById(String(cardId || "").trim());
	if (el && String(el.dataset?.changeSexUsedNotDiscarded || "") === "1") {
		el.dataset.changeSexUsedNotDiscarded = "";
	}
}

/** Для проклятий с модалкой выбора. */
const loseYourClassPendingBySeat = new Map(); // seat -> { curseCardId: string, classCardIds: string[] }

function hideLoseYourClassModal() {
	const existing = document.getElementById("lose-your-class-modal");
	if (existing) {
		existing.remove();
	}
}

function openLoseYourClassModal({ seat, curseCardId, classCardIds }) {
	hideLoseYourClassModal();
	const modal = document.createElement("div");
	modal.id = "lose-your-class-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Потеряй один класс: выбери, какой сбросить";
	panel.appendChild(title);

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	cardsWrap.style.maxHeight = "min(55vh, 600px)";
	cardsWrap.style.overflowY = "auto";

	let selectedId = "";
	classCardIds.forEach((id) => {
		const door = window.doors?.find((d) => d.name === id);
		const img = door?.img || "";
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = id;
		const imgEl = document.createElement("img");
		imgEl.className = "wizard-taming-pick-card-img";
		imgEl.src = img;
		imgEl.alt = id;
		btn.appendChild(imgEl);
		btn.addEventListener("click", () => {
			selectedId = id;
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("selected"));
			btn.classList.add("selected");
			applyBtn.disabled = false;
		});
		cardsWrap.appendChild(btn);
	});

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Сбросить выбранный класс";
	applyBtn.disabled = true;
	applyBtn.addEventListener("click", () => {
		if (!selectedId) {
			return;
		}
		// Применяем локально сразу, чтобы пострадавший игрок видел сброс без ожидания эха сервера.
		// Остальные игроки применят по широковещательному сообщению.
		resolveLoseYourClassCurse({
			seat,
			curseCardId,
			chosenClassCardId: selectedId,
		});
		socket.emit("message", {
			method: "LoseYourClassResolve",
			seat,
			curseCardId,
			chosenClassCardId: selectedId,
		});
		modal.remove();
	});

	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	modal.addEventListener("click", (e) => {
		// Не даём закрывать кликом по фону, чтобы не зависало состояние.
		if (e.target === modal) {
			e.stopPropagation();
		}
	});
}

/**
 * Проклятие change class: сначала запоминаем верхний класс в сбросе дверей, затем сбрасываем все классы
 * (и Super Munchkin при наличии классов), затем экипируем запомнённый класс в основную зону.
 * Без экипированных классов — только сброс самой карты проклятия.
 */
function applyChangeClassCurseToSeat(seat, curseCardId) {
	const s = Number(seat);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	// Эффекты проклятий должны эмититься ровно одним клиентом, иначе будет задвоение moveCard/уровней.
	// Берём владельца места (того, у кого localSeat совпадает с seat).
	if (Number(localSeat) !== Number(s)) {
		return;
	}
	const curseId = String(curseCardId || "").trim();
	const equippedClassIds = collectEquippedClassDoorIdsForSeat(s);
	if (equippedClassIds.length === 0) {
		if (curseId) syncDoorCardMoveToDiscard(curseId);
		recalculateAllPowerDisplays();
		return;
	}
	const replacementId = findTopDoorDiscardClassCardId();
	const superIds = collectEquippedSuperMunchkinDoorIdsForSeat(s);
	const stripIds = [...equippedClassIds, ...superIds.filter((id) => !equippedClassIds.includes(id))];
	stripIds.forEach((id) => {
		syncDoorCardMoveToDiscard(id);
	});
	if (replacementId && document.getElementById(replacementId)) {
		const { main } = getMainAndSideZoneElementsForSeat(s) || {};
		if (main && main.id) {
			syncDoorCardMoveToZone(replacementId, main.id, null);
		}
	}
	if (curseId) syncDoorCardMoveToDiscard(curseId);
	recalculateAllPowerDisplays();
}

/** Карта расы для экипировки: есть race, не монстр, не класс (kind). */
function isDoorEquippedRaceCard(door) {
	if (!door || String(door.race || "") === "monster") {
		return false;
	}
	if (!String(door.race || "").trim()) {
		return false;
	}
	if (String(door.kind || "").trim()) {
		return false;
	}
	return true;
}

function findTopDoorDiscardRaceCardId() {
	const z = document.getElementById("zone_doors_drop");
	if (!z) {
		return null;
	}
	const els = Array.from(z.querySelectorAll(".card"));
	for (let i = els.length - 1; i >= 0; i--) {
		const id = els[i]?.id;
		if (!id || !String(id).includes("door")) {
			continue;
		}
		const door = window.doors?.find((d) => d.name === id);
		if (isDoorEquippedRaceCard(door)) {
			return id;
		}
	}
	return null;
}

function collectEquippedRaceDoorIdsForSeat(seat) {
	const out = [];
	const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
	[main, side].forEach((zone) => {
		if (!zone) {
			return;
		}
		zone.querySelectorAll(".card").forEach((el) => {
			const id = el?.id;
			if (!id || !String(id).includes("door")) {
				return;
			}
			const door = window.doors?.find((d) => d.name === id);
			if (isDoorEquippedRaceCard(door) && !out.includes(id)) {
				out.push(id);
			}
		});
	});
	return out;
}

function collectEquippedHalfBreedDoorIdsForSeat(seat) {
	const out = [];
	const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
	[main, side].forEach((zone) => {
		if (!zone) {
			return;
		}
		zone.querySelectorAll(".card").forEach((el) => {
			const id = el?.id;
			if (!id) {
				return;
			}
			const door = window.doors?.find((d) => d.name === id);
			if (isHalfBreedDoorCard(door) && !out.includes(id)) {
				out.push(id);
			}
		});
	});
	return out;
}

/**
 * Проклятие change race: верхняя раса в сбросе дверей → сброс всех рас (и Half-breed при наличии рас)
 * → экипировка запомнённой расы в основную зону. Без экипированных рас — только сброс проклятия.
 */
function applyChangeRaceCurseToSeat(seat, curseCardId) {
	const s = Number(seat);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	if (Number(localSeat) !== Number(s)) {
		return;
	}
	const curseId = String(curseCardId || "").trim();
	const equippedRaceIds = collectEquippedRaceDoorIdsForSeat(s);
	if (equippedRaceIds.length === 0) {
		if (curseId) syncDoorCardMoveToDiscard(curseId);
		recalculateAllPowerDisplays();
		return;
	}
	const replacementId = findTopDoorDiscardRaceCardId();
	const halfBreedIds = collectEquippedHalfBreedDoorIdsForSeat(s);
	const stripIds = [...equippedRaceIds, ...halfBreedIds.filter((id) => !equippedRaceIds.includes(id))];
	stripIds.forEach((id) => {
		syncDoorCardMoveToDiscard(id);
	});
	if (replacementId && document.getElementById(replacementId)) {
		const { main } = getMainAndSideZoneElementsForSeat(s) || {};
		if (main && main.id) {
			syncDoorCardMoveToZone(replacementId, main.id, null);
		}
	}
	if (curseId) syncDoorCardMoveToDiscard(curseId);
	recalculateAllPowerDisplays();
}

function emitLevelAdjust(seat, delta) {
	const s = Number(seat);
	const d = Number(delta) || 0;
	if (!Number.isFinite(s) || s < 0 || !Number.isFinite(d) || d === 0) {
		return;
	}
	socket.emit("message", { method: "LevelAdjust", seat: s, delta: d });
}

function resolveLoseYourClassCurse({ seat, curseCardId, chosenClassCardId }) {
	const s = Number(seat);
	const curseId = String(curseCardId || "").trim();
	const chosenId = String(chosenClassCardId || "").trim();
	if (!Number.isFinite(s) || s < 0 || !curseId) {
		return;
	}

	const pending = loseYourClassPendingBySeat.get(s);
	const allowed = pending?.classCardIds || [];
	if (!chosenId || (allowed.length > 0 && !allowed.includes(chosenId))) {
		return;
	}

	// Сбрасываем выбранный класс.
	syncDoorCardMoveToDiscard(chosenId);
	// И сбрасываем саму карту проклятия.
	syncDoorCardMoveToDiscard(curseId);
	loseYourClassPendingBySeat.delete(s);
	recalculateAllPowerDisplays();
}

function applyLoseYourClassCurseToSeat(seat, curseCardId) {
	const s = Number(seat);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	// Только владелец места эмитит LevelAdjust/moveCard, иначе эффект задваивается (2+ клиентов отправляют одно и то же).
	if (Number(localSeat) !== Number(s)) {
		return;
	}
	const curseId = String(curseCardId || "").trim();
	const classIds = collectEquippedClassDoorIdsForSeat(s);
	if (classIds.length === 0) {
		emitLevelAdjust(s, -1);
		if (curseId) syncDoorCardMoveToDiscard(curseId);
		return;
	}
	if (classIds.length === 1) {
		syncDoorCardMoveToDiscard(classIds[0]);
		if (curseId) syncDoorCardMoveToDiscard(curseId);
		recalculateAllPowerDisplays();
		return;
	}

	// 2 класса: модалка выбора только если есть Super Munchkin.
	const superIds = collectEquippedSuperMunchkinDoorIdsForSeat(s);
	const hasSuper = superIds.length > 0;
	if (!hasSuper) {
		// Фолбэк: сбрасываем «верхний» класс (последний найденный).
		const id = classIds[classIds.length - 1];
		syncDoorCardMoveToDiscard(id);
		if (curseId) syncDoorCardMoveToDiscard(curseId);
		recalculateAllPowerDisplays();
		return;
	}

	loseYourClassPendingBySeat.set(s, { curseCardId: curseId, classCardIds: classIds.slice(0, 2) });
	// Модалку открывает только игрок, на которого применили проклятие.
	if (Number(localSeat) === Number(s)) {
		openLoseYourClassModal({ seat: s, curseCardId: curseId, classCardIds: classIds.slice(0, 2) });
	}
}

function applyLoseYourRaceCurseToSeat(seat, curseCardId) {
	const s = Number(seat);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	// Только владелец места эмитит moveCard, иначе эффект задваивается.
	if (Number(localSeat) !== Number(s)) {
		return;
	}
	const curseId = String(curseCardId || "").trim();
	const raceIds = collectEquippedRaceDoorIdsForSeat(s);
	if (raceIds.length === 0) {
		// Рас нет — просто сбрасываем карту проклятия.
		if (curseId) syncDoorCardMoveToDiscard(curseId);
		return;
	}
	// Сбрасываем все экипированные расы и Half-breed (если был).
	const halfBreedIds = collectEquippedHalfBreedDoorIdsForSeat(s);
	const stripIds = [...raceIds, ...halfBreedIds.filter((id) => !raceIds.includes(id))];
	stripIds.forEach((id) => syncDoorCardMoveToDiscard(id));
	if (curseId) syncDoorCardMoveToDiscard(curseId);
	recalculateAllPowerDisplays();
}

function applyMalignMirrorCurseToSeat(seat, curseCardId) {
	const s = Number(seat);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	const curseId = String(curseCardId || "").trim();
	if (!curseId) {
		return;
	}
	// Локально состояние меняем у всех клиентов, но широковещательно "применить проклятие" эмитит только владелец места.
	if (Number(localSeat) === Number(s)) {
		socket.emit("message", { method: "MalignMirrorApply", seat: s, curseCardId: curseId });
	}
	recalculateAllPowerDisplays();
}

function tryActivateMalignMirrorForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return;
	}
	// ВАЖНО: battleActive может расходиться между клиентами, используем наличие монстров на столе.
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	if (!malignMirrorPendingBySeat.has(s) || malignMirrorActiveBySeat.has(s)) {
		return;
	}
	if (isSeatParticipantInCurrentMonsterBattle(s)) {
		malignMirrorActiveBySeat.set(s, malignMirrorPendingBySeat.get(s));
		malignMirrorPendingBySeat.delete(s);
	}
}

function tryActivateChangeSexPenaltyForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	if (!changeSexPendingBySeat.has(s) || changeSexActiveBySeat.has(s)) {
		return;
	}
	if (isSeatParticipantInCurrentMonsterBattle(s)) {
		changeSexActiveBySeat.set(s, changeSexPendingBySeat.get(s));
		changeSexPendingBySeat.delete(s);
	}
}

function applyChangeSexCurseToSeat(seat, curseCardId) {
	const s = Number(seat);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	const curseId = String(curseCardId || "").trim();
	if (!curseId) {
		return;
	}
	// Эмитит только владелец места: смена пола должна быть серверным фактом.
	if (Number(localSeat) !== Number(s)) {
		return;
	}
	// Повторно применять можно только после того, как карта побывала в сбросе.
	const curseEl = document.getElementById(curseId);
	if (curseEl) {
		const usedNotDiscarded = String(curseEl.dataset?.changeSexUsedNotDiscarded || "") === "1";
		const inDiscard = String(curseEl.parentElement?.id || "") === "zone_doors_drop";
		if (usedNotDiscarded && !inDiscard) {
			return;
		}
	}
	const currentGender = String(characterBySeat?.[s]?.gender || "").trim();
	const nextGender = currentGender === "Female" ? "Male" : "Female";
	socket.emit("message", { method: "ChangeSexApply", seat: s, curseCardId: curseId, gender: nextGender });
}

function isCardInSeatMainOrSide(cardId, seat) {
	const id = String(cardId || "").trim();
	if (!id) {
		return false;
	}
	const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
	if (!main && !side) {
		return false;
	}
	const el = document.getElementById(id);
	if (!el) {
		return false;
	}
	return (main && main.contains(el)) || (side && side.contains(el));
}

function moveBadStaffCardToDiscard(cardId) {
	const card = document.getElementById(cardId);
	const dropZone = document.getElementById('zone_doors_drop');
	if (!card || !dropZone) {
		return;
	}
	if (!cardId.includes('door')) {
		return;
	}
	const door = window.doors?.find((d) => d.name === cardId);
	// Если сбрасываем Cheat — снимаем привязки, чтобы карту можно было применять повторно.
	if (door && String(door.special || "") === "Cheat") {
		const trId = String(card.dataset?.cheatAttachedTreasureId || "");
		if (trId) {
			const trEl = document.getElementById(trId);
			if (trEl) {
				trEl.dataset.cheatCardId = "";
			}
		}
		clearCheatVisualPlacement(cardId, trId);
		card.dataset.cheatAttachedTreasureId = "";
		card.dataset.cheatUsed = "";
	}
	// Если сбрасываем Mate — полностью очищаем состояние пары, чтобы карту можно было применять повторно.
	if (door && String(door.special || "") === "Mate") {
		const srcId = String(card.dataset?.mateSourceMonsterId || "");
		const pairId = String(card.dataset?.matePairId || "");
		const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
		// Снимаем признак пары у всех карт в зоне монстров (на случай "залипшего" matePairId).
		if (zone && pairId) {
			zone.querySelectorAll(".card").forEach((el) => {
				if (String(el?.dataset?.matePairId || "") === pairId) {
					el.dataset.matePairId = "";
				}
			});
		}
		// Перевешиваем бонусы, которые были привязаны к Mate, обратно на исходного монстра.
		if (zone && srcId) {
			zone.querySelectorAll(".card").forEach((el) => {
				const bId = el?.id;
				if (!bId) {
					return;
				}
				const bDoor = window.doors?.find((d) => d.name === bId);
				if (!bDoor || String(bDoor.special || "") !== "bonus_power_monster") {
					return;
				}
				if (String(el.dataset?.attachedMonsterId || "") === String(cardId)) {
					el.dataset.attachedMonsterId = srcId;
				}
			});
			pushMonsterBonusAttachmentsToServer();
		}
		// Чистим флаги на карте.
		card.dataset.mateUsed = "";
		card.dataset.mateSourceMonsterId = "";
		card.dataset.matePairId = "";
		// Ничего не делаем с картинкой: Mate всегда остаётся Mate.
	}
	dropZone.appendChild(card);
	UpdatebackImgDoor();
	adjustCardWidth('.zone_doors_drop');
}

function enforceCheatAttachmentsInvariant() {
	// Инвариант: Cheat действует только пока сокровище в ОСНОВНОЙ зоне экипировки.
	// Где бы карта ни оказалась (кража/способности/локальные перемещения), если она не в main — Cheat уходит в сброс.
	document.querySelectorAll('.card[data-cheat-card-id]').forEach((trEl) => {
		const treasureId = trEl?.id;
		if (!treasureId || !String(treasureId).includes("treasure")) {
			return;
		}
		const cheatId = String(trEl.dataset?.cheatCardId || "");
		if (!cheatId) {
			return;
		}
		const inMain = isMainEquipmentZoneElement(trEl.parentElement);
		if (inMain) {
			applyCheatVisualPlacement(cheatId, treasureId);
			return;
		}
		// Снимаем привязку со шмотки сразу.
		trEl.dataset.cheatCardId = "";
		clearCheatVisualPlacement(cheatId, treasureId);
		const cheatEl = document.getElementById(cheatId);
		if (cheatEl && cheatEl.parentElement?.id !== "zone_doors_drop") {
			socket.emit("message", {
				method: "moveCard",
				cardId: cheatId,
				targetId: null,
				zoneId: "zone_doors_drop",
			});
		}
	});
}

function enforceHirelingFollowInvariant() {
	// Инвариант: если у Наёмничка есть прикреплённая шмотка — она всегда должна быть в той же зоне.
	document.querySelectorAll('.card').forEach((maybeHireling) => {
		if (!maybeHireling?.id || !String(maybeHireling.id).includes("treasure")) {
			return;
		}
		if (!isTreasureSpecial(maybeHireling.id, "Hireling")) {
			return;
		}
		const attachedId = String(maybeHireling.dataset?.hirelingAttachedTreasureId || "");
		if (!attachedId) {
			return;
		}
		const attachedEl = document.getElementById(attachedId);
		if (!attachedEl) {
			maybeHireling.dataset.hirelingAttachedTreasureId = "";
			return;
		}
		// Поддерживаем двустороннюю ссылку.
		if (String(attachedEl.dataset?.hirelingCardId || "") !== String(maybeHireling.id)) {
			attachedEl.dataset.hirelingCardId = String(maybeHireling.id);
		}
		const hirelingZoneId = maybeHireling.parentElement?.id || "";
		const attachedZoneId = attachedEl.parentElement?.id || "";
		if (!hirelingZoneId || !attachedZoneId) {
			return;
		}
		if (hirelingZoneId !== attachedZoneId) {
			socket.emit("message", {
				method: "moveCard",
				cardId: attachedId,
				targetId: null,
				zoneId: hirelingZoneId,
			});
		}
	});
}

function applyDivineInterventionResolve(cardId) {
	const card = document.getElementById(cardId);
	if (card) {
		// Разрешаем повторное применение после сброса/перемещения.
		card.dataset.divineScheduled = "";
	}
	if (card) {
		moveBadStaffCardToDiscard(cardId);
	}
	// Всем клирикам +1 уровень
	for (let s = 0; s < 3; s++) {
		if (isSeatClericClassActive(s)) {
			const cur = Number(levelBySeat[s] ?? 1) || 1;
			setLevelBySeat(s, cur + 1);
		}
	}
	recalculateAllPowerDisplays();
}

function scheduleDivineInterventionIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	if (!isDoorSpecial(cardId, "Divine intervention")) {
		return;
	}
	// Пока карта в колоде или в сбросе дверей — ничего не делаем.
	if (zoneEl.id === "zone_doors" || zoneEl.id === "zone_doors_drop") {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	// Чтобы не планировать много раз на одном клиенте
	if (el.dataset?.divineScheduled) {
		return;
	}
	el.dataset.divineScheduled = "1";

	// Разрешаем "один источник истины" для сокет-события: seat 0
	// (иначе все клиенты сделают +1 уровня и получатся дубли).
	if (Number(localSeat) !== 0) {
		return;
	}
	setTimeout(() => {
		const curEl = document.getElementById(cardId);
		if (!curEl) {
			return;
		}
		// Если карту успели вернуть в колоду или в сброс — не срабатываем.
		if (curEl.parentElement?.id === "zone_doors" || curEl.parentElement?.id === "zone_doors_drop") {
			curEl.dataset.divineScheduled = "";
			return;
		}
		socket.emit("message", { method: "DivineInterventionResolve", cardId });
	}, 1000);
}

function applyOutToLunchResolve(cardId) {
	const el = document.getElementById(cardId);
	if (el) {
		el.dataset.outToLunchScheduled = "";
	}
	// Срабатывает только если на поле боя есть хотя бы один монстр.
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	// Сбрасываем все карты с поля боя (монстры + бонусы игрока/монстра).
	MoveMonstersToDrop();

	// Завершаем бой без победителя/проигравшего.
	battleActive = false;
	battleTurnSeat = null;
	pendingHelpSeats.clear();
	acceptedHelperSeat = null;
	monsterFightSeat = null;
	resetEscapeStateNow();
	deathLootActive = false;
	deathLootState = null;
	resumeEscapeAfterLoot = false;
	deathLootAwaitingEscapeFinish = false;
	turnAwaitingManualEnd = true;

	clearInterval(countdownInterval);
	const timerElement = document.getElementById('timer');
	if (timerElement) {
		timerElement.textContent = "";
	}
	updateTurnActionButtons(false);
	applyTurnHighlight();
	updateHelpUi();
	recalculateAllPowerDisplays();

	showBattleResult(`${getSeatLabel(currentTurnSeat)}, возьми 2 сокровища`);
	setTimeout(() => {
		hideBattleResult();
	}, 2000);
}

function hideWandOfDowsingModal() {
	const existing = document.getElementById("wand-of-dowsing-modal");
	if (existing) {
		existing.remove();
	}
}

function collectDiscardCardsForWandOfDowsing() {
	/** @type {{ cardId: string, img: string, zoneId: string }[]} */
	const out = [];
	["zone_doors_drop", "zone_treasure_drop"].forEach((zoneId) => {
		const z = document.getElementById(zoneId);
		if (!z) {
			return;
		}
		z.querySelectorAll(".card").forEach((el) => {
			const id = el?.id;
			if (!id || id === "card") {
				return;
			}
			const door = window.doors?.find((d) => d.name === id);
			const tr = window.treasures?.find((t) => t.name === id);
			const img = door?.img || tr?.img || "";
			if (!img) {
				return;
			}
			out.push({ cardId: id, img, zoneId });
		});
	});
	return out;
}

function openWandOfDowsingModal({ wandCardId, actorSeat }) {
	hideWandOfDowsingModal();
	const modal = document.createElement("div");
	modal.id = "wand-of-dowsing-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Штырь лозоходца: выбери карту из сброса";

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	cardsWrap.style.maxHeight = "min(62vh, 640px)";
	cardsWrap.style.overflowY = "auto";

	const candidates = collectDiscardCardsForWandOfDowsing();
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Подтвердить выбор";
	applyBtn.disabled = true;

	let selectedId = "";

	if (candidates.length === 0) {
		const empty = document.createElement("div");
		empty.style.color = "#e8e8f0";
		empty.style.textAlign = "center";
		empty.style.margin = "12px 0";
		empty.textContent = "В сбросах нет карт. Штырь всё равно уйдёт в сброс.";
		panel.appendChild(title);
		panel.appendChild(empty);
		applyBtn.textContent = "ОК";
		applyBtn.disabled = false;
		applyBtn.addEventListener("click", () => {
			socket.emit("message", {
				method: "WandOfDowsingResolve",
				wandCardId,
				pickedCardId: "",
				actorSeat,
			});
			modal.remove();
		});
		panel.appendChild(applyBtn);
		modal.appendChild(panel);
		document.body.appendChild(modal);
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				const w = document.getElementById(wandCardId);
				if (w) {
					w.dataset.wandDowsingScheduled = "";
				}
				modal.remove();
			}
		});
		return;
	}

	candidates.forEach((c) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = c.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = c.img || "";
		img.alt = c.cardId;
		btn.appendChild(img);
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selectedId = c.cardId;
			applyBtn.disabled = !selectedId;
		});
		cardsWrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (!selectedId) {
			return;
		}
		socket.emit("message", {
			method: "WandOfDowsingResolve",
			wandCardId,
			pickedCardId: selectedId,
			actorSeat,
		});
		modal.remove();
	});

	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			const w = document.getElementById(wandCardId);
			if (w) {
				w.dataset.wandDowsingScheduled = "";
			}
			modal.remove();
		}
	});
}

function scheduleWandOfDowsingIfNeeded(cardId, zoneEl, playedBySeatRaw) {
	if (!cardId || !zoneEl) {
		return;
	}
	if (!isTreasureSpecial(cardId, "Wand of dowsing")) {
		return;
	}
	const onMain = isMainEquipmentZoneElement(zoneEl);
	const onMonster = zoneEl.id === "zone_monster";
	const onZone3 = zoneEl.id === "zone3";
	if (!onMain && !onMonster && !onZone3) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	if (el.dataset?.wandDowsingScheduled) {
		return;
	}
	el.dataset.wandDowsingScheduled = "1";
	let actorSeat = Number(playedBySeatRaw);
	if (!Number.isFinite(actorSeat) || actorSeat < 0) {
		if (onMain) {
			actorSeat = getGlobalSeatForPlayZone(zoneEl);
		} else {
			actorSeat = Number(currentTurnSeat);
		}
	}
	if (!Number.isFinite(actorSeat) || actorSeat < 0) {
		el.dataset.wandDowsingScheduled = "";
		return;
	}
	setTimeout(() => {
		const cur = document.getElementById(cardId);
		if (!cur) {
			return;
		}
		const parent = cur.parentElement;
		const pId = parent?.id || "";
		const stillOnMain = isMainEquipmentZoneElement(parent);
		const stillOnMonster = pId === "zone_monster";
		const stillOnZone3 = pId === "zone3";
		const stillOk = (onMain && stillOnMain) || (onMonster && stillOnMonster) || (onZone3 && stillOnZone3);
		if (!stillOk) {
			cur.dataset.wandDowsingScheduled = "";
			return;
		}
		if (Number(localSeat) === Number(actorSeat)) {
			openWandOfDowsingModal({ wandCardId: cardId, actorSeat });
		}
	}, 140);
}

function applyWandOfDowsingResolve({ wandCardId, pickedCardId, actorSeat }) {
	const hand = getHandElementForPlayerSeat(actorSeat);
	const drop = document.getElementById("zone_treasure_drop");
	if (pickedCardId) {
		const pickEl = document.getElementById(pickedCardId);
		if (pickEl && hand) {
			hand.appendChild(pickEl);
		}
	}
	const wandEl = document.getElementById(wandCardId);
	if (wandEl) {
		wandEl.dataset.wandDowsingScheduled = "";
		if (drop) {
			drop.appendChild(wandEl);
		}
	}
	hideWandOfDowsingModal();
	adjustCardWidth(".myhand");
	adjustCardWidth(".zone2");
	adjustCardWidth(".zone5");
	adjustCardHeight(".zone3");
	adjustCardHeight(".zone_monster");
	adjustCardWidth(".opponenthand");
	adjustCardWidth(".zone_opponent");
	adjustCardWidth(".zone_opponent_side");
	adjustCardWidth(".opponent2hand");
	adjustCardWidth(".zone_opponent2");
	adjustCardWidth(".zone_opponent2_side");
	adjustCardWidth(".opponent3hand");
	adjustCardWidth(".zone_opponent3");
	adjustCardWidth(".zone_opponent3_side");
	UpdatebackImgTreasure();
	UpdatebackImgDoor();
	recalculateAllPowerDisplays();
}

function hideTransferralPotionModal() {
	const existing = document.getElementById("transferral-potion-modal");
	if (existing) {
		existing.remove();
	}
}

function openTransferralPotionModal({ potionCardId, actorSeat }) {
	hideTransferralPotionModal();
	if (!battleActive || !getMonsterBattleContext().hasMonster) {
		const el = document.getElementById(potionCardId);
		if (el) {
			el.dataset.transferralPotionScheduled = "";
		}
		return;
	}
	const fightSeat = getMonsterFightSeat();
	const maxSeat = Math.max(0, (Number(num) || characterBySeat.length || 3) - 1);
	const candidates = [];
	for (let s = 0; s <= maxSeat; s++) {
		if (Number(s) !== Number(fightSeat)) {
			candidates.push(s);
		}
	}
	if (candidates.length === 0) {
		const el = document.getElementById(potionCardId);
		if (el) {
			el.dataset.transferralPotionScheduled = "";
		}
		return;
	}

	const modal = document.createElement("div");
	modal.id = "transferral-potion-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Transferral potion: кто теперь сражается с монстрами?";

	const buttons = document.createElement("div");
	buttons.style.display = "flex";
	buttons.style.flexDirection = "column";
	buttons.style.gap = "10px";
	buttons.style.alignItems = "stretch";

	candidates.forEach((seat) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-apply-btn";
		btn.textContent = getSeatLabel(seat);
		btn.addEventListener("click", () => {
			socket.emit("message", {
				method: "TransferralPotionResolve",
				potionCardId,
				newFighterSeat: seat,
				actorSeat,
			});
			hideTransferralPotionModal();
		});
		buttons.appendChild(btn);
	});

	panel.appendChild(title);
	panel.appendChild(buttons);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			const el = document.getElementById(potionCardId);
			if (el) {
				el.dataset.transferralPotionScheduled = "";
			}
			hideTransferralPotionModal();
		}
	});
}

function scheduleTransferralPotionIfNeeded(cardId, zoneEl, playedBySeatRaw) {
	if (!cardId || !zoneEl) {
		return;
	}
	if (!isTreasureSpecial(cardId, "Transferral potion")) {
		return;
	}
	if (!battleActive || !getMonsterBattleContext().hasMonster) {
		return;
	}
	const onMain = isMainEquipmentZoneElement(zoneEl);
	const onMonster = zoneEl.id === "zone_monster";
	const onZone3 = zoneEl.id === "zone3";
	if (!onMain && !onMonster && !onZone3) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	if (el.dataset?.transferralPotionScheduled) {
		return;
	}
	el.dataset.transferralPotionScheduled = "1";
	let actorSeat = Number(playedBySeatRaw);
	if (!Number.isFinite(actorSeat) || actorSeat < 0) {
		if (onMain) {
			actorSeat = getGlobalSeatForPlayZone(zoneEl);
		} else {
			actorSeat = Number(currentTurnSeat);
		}
	}
	if (!Number.isFinite(actorSeat) || actorSeat < 0) {
		el.dataset.transferralPotionScheduled = "";
		return;
	}
	setTimeout(() => {
		const cur = document.getElementById(cardId);
		if (!cur) {
			return;
		}
		const parent = cur.parentElement;
		const pId = parent?.id || "";
		const stillOnMain = isMainEquipmentZoneElement(parent);
		const stillOnMonster = pId === "zone_monster";
		const stillOnZone3 = pId === "zone3";
		const stillOk = (onMain && stillOnMain) || (onMonster && stillOnMonster) || (onZone3 && stillOnZone3);
		if (!stillOk || !battleActive || !getMonsterBattleContext().hasMonster) {
			cur.dataset.transferralPotionScheduled = "";
			return;
		}
		if (Number(localSeat) === Number(actorSeat)) {
			openTransferralPotionModal({ potionCardId: cardId, actorSeat });
		}
	}, 140);
}

function applyTransferralPotionResolve({ potionCardId, newFighterSeat }) {
	hideTransferralPotionModal();
	const drop = document.getElementById("zone_treasure_drop");
	const potionEl = document.getElementById(potionCardId);
	if (potionEl) {
		potionEl.dataset.transferralPotionScheduled = "";
		if (drop) {
			drop.appendChild(potionEl);
		}
	}
	pendingHelpSeats.clear();
	acceptedHelperSeat = null;
	const nf = Number(newFighterSeat);
	if (Number.isFinite(nf) && nf >= 0) {
		monsterFightSeat = nf;
	}
	adjustCardWidth(".myhand");
	adjustCardWidth(".zone2");
	adjustCardWidth(".zone5");
	adjustCardHeight(".zone3");
	adjustCardHeight(".zone_monster");
	adjustCardWidth(".opponenthand");
	adjustCardWidth(".zone_opponent");
	adjustCardWidth(".zone_opponent_side");
	adjustCardWidth(".opponent2hand");
	adjustCardWidth(".zone_opponent2");
	adjustCardWidth(".zone_opponent2_side");
	adjustCardWidth(".opponent3hand");
	adjustCardWidth(".zone_opponent3");
	adjustCardWidth(".zone_opponent3_side");
	UpdatebackImgTreasure();
	UpdatebackImgDoor();
	recalculateAllPowerDisplays();
	updateEffectiveMonsterBonusDisplay();
	applyTurnHighlight();
	updateHelpUi();
	flushTurnStateSyncToServer();
}

function applyFriendshipPotionResolve(cardId) {
	const el = document.getElementById(cardId);
	if (el) {
		el.dataset.friendshipPotionScheduled = "";
	}
	// Срабатывает только если на поле боя есть хотя бы один монстр.
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	MoveMonstersToDrop();
	battleActive = false;
	battleTurnSeat = null;
	pendingHelpSeats.clear();
	acceptedHelperSeat = null;
	monsterFightSeat = null;
	resetEscapeStateNow();
	deathLootActive = false;
	deathLootState = null;
	resumeEscapeAfterLoot = false;
	deathLootAwaitingEscapeFinish = false;
	turnAwaitingManualEnd = true;
	clearInterval(countdownInterval);
	const timerElement = document.getElementById('timer');
	if (timerElement) {
		timerElement.textContent = "";
	}
	updateTurnActionButtons(false);
	applyTurnHighlight();
	updateHelpUi();
	recalculateAllPowerDisplays();

	showBattleResult(`${getSeatLabel(currentTurnSeat)}, можешь почистить нычки`);
	setTimeout(() => {
		hideBattleResult();
	}, 2000);
}

function endBattleNoWinnerAndDropBattlefield(message, ms = 2000) {
	MoveMonstersToDrop();
	battleActive = false;
	battleTurnSeat = null;
	pendingHelpSeats.clear();
	acceptedHelperSeat = null;
	monsterFightSeat = null;
	resetEscapeStateNow();
	deathLootActive = false;
	deathLootState = null;
	resumeEscapeAfterLoot = false;
	deathLootAwaitingEscapeFinish = false;
	turnAwaitingManualEnd = true;
	clearInterval(countdownInterval);
	const timerElement = document.getElementById('timer');
	if (timerElement) {
		timerElement.textContent = "";
	}
	updateTurnActionButtons(false);
	applyTurnHighlight();
	updateHelpUi();
	recalculateAllPowerDisplays();
	if (message) {
		showBattleResult(message);
		setTimeout(() => hideBattleResult(), ms);
	}
}

function hidePotionPickMonsterModal() {
	const existing = document.getElementById("potion-pick-monster-modal");
	if (existing) {
		existing.remove();
	}
}

function openPickMonsterToDiscardModal({ titleText, applyText, monsters, onApply }) {
	hidePotionPickMonsterModal();
	const modal = document.createElement("div");
	modal.id = "potion-pick-monster-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = titleText || "Выбери монстра";

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = applyText || "Выбрать";
	applyBtn.disabled = true;

	let selectedMonster = null;
	(monsters || []).forEach((m) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = m.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = m.img || "";
		img.alt = m.cardId;
		btn.appendChild(img);

		const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
		const sumEl = document.createElement("div");
		sumEl.className = "wizard-taming-pick-sum";
		sumEl.textContent = bonusSum ? `Бонус: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "Бонус: 0";
		sumEl.style.marginTop = "4px";
		sumEl.style.fontSize = "16px";
		sumEl.style.color = "#ffd37a";
		sumEl.style.textAlign = "center";
		btn.appendChild(sumEl);

		const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
		if (attachedBonuses.length > 0) {
			const bonusesWrap = document.createElement("div");
			bonusesWrap.className = "wizard-taming-pick-bonuses";
			bonusesWrap.style.display = "flex";
			bonusesWrap.style.flexWrap = "wrap";
			bonusesWrap.style.justifyContent = "center";
			bonusesWrap.style.gap = "6px";
			bonusesWrap.style.marginTop = "6px";
			attachedBonuses.forEach((bc) => {
				const bi = document.createElement("img");
				bi.className = "wizard-taming-pick-bonus-img";
				bi.src = bc.img || "";
				bi.alt = bc.cardId;
				bi.style.width = "40px";
				bi.style.height = "auto";
				bi.style.borderRadius = "6px";
				bonusesWrap.appendChild(bi);
			});
			btn.appendChild(bonusesWrap);
		}
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selectedMonster = m.cardId;
			applyBtn.disabled = !selectedMonster;
		});
		cardsWrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (!selectedMonster) {
			return;
		}
		onApply?.(selectedMonster);
		modal.remove();
	});

	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
}

function applyPotionDiscardMonster({ potionCardId, monsterCardId }) {
	const potionEl = potionCardId ? document.getElementById(potionCardId) : null;
	if (potionEl) {
		// Разрешаем повторное использование после сброса/перемещения.
		potionEl.dataset.potionUsed = "";
	}
	if (potionCardId) {
		moveCardToDiscardById(potionCardId);
	}
	if (monsterCardId) {
		moveCardToDiscardById(monsterCardId);
	}
	// Пересчитываем базовую силу монстров по оставшимся картам (включая модификаторы).
	setMonsterBasePower(computeMonsterZoneBasePower());
	// Если монстр был один — после его ухода поле боя очищается и бой завершается.
	const ctx = getMonsterBattleContext();
	if (!ctx.hasMonster || ctx.monsters.length <= 0) {
		endBattleNoWinnerAndDropBattlefield(null, 0);
	}
	recalculateAllPowerDisplays();
}

function schedulePotionPickMonsterIfNeeded({ cardId, zoneEl, mode }) {
	if (!cardId || !zoneEl) {
		return;
	}
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return;
	}
	if (!battleActive || !getMonsterBattleContext().hasMonster) {
		return;
	}
	const tr = window.treasures?.find((t) => t.name === cardId);
	if (!tr) {
		return;
	}
	const expected = mode === "magic" ? "Magic lamp" : "Pollymorth Potion";
	if (String(tr.special || "") !== expected) {
		return;
	}
	// Magic lamp может активировать только активный игрок.
	if (mode === "magic" && Number(localSeat) !== Number(currentTurnSeat)) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	if (el.dataset?.potionUsed) {
		return;
	}

	el.dataset.potionUsed = "1";
	setTimeout(() => {
		// всё ещё на поле боя
		const curEl = document.getElementById(cardId);
		const parentId = curEl?.parentElement?.id || "";
		const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
		if (!curEl || !stillOnBattlefield) {
			if (curEl) {
				curEl.dataset.potionUsed = "";
			}
			return;
		}
		const ctx = getMonsterBattleContext();
		if (!ctx.hasMonster) {
			curEl.dataset.potionUsed = "";
			return;
		}
		const monsters = ctx.monsters;
		if (monsters.length <= 1) {
			// Важно: это должно произойти у ВСЕХ игроков, поэтому делаем через сокет-событие.
			socket.emit("message", { method: "PotionResolveSingleMonster", potionCardId: cardId });
			return;
		}
		openPickMonsterToDiscardModal({
			titleText: "Выбери монстра, который уйдёт в сброс",
			applyText: "Сбросить выбранного монстра",
			monsters,
			onApply: (monsterCardId) => {
				socket.emit("message", { method: "PotionResolve", potionCardId: cardId, monsterCardId });
			},
		});
	}, 30);
}

function hideIllusionModals() {
	hidePotionPickMonsterModal();
	hideWanderingMonsterPickModal();
}

export function scheduleIllusionIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return;
	}
	if (!battleActive || !getMonsterBattleContext().hasMonster) {
		return;
	}
	if (!isDoorSpecial(cardId, "Illusion")) {
		return;
	}
	// Требование: в руке должен быть хотя бы один монстр.
	const monstersInHand = getLocalHandMonsterCardsForWanderingMonster();
	if (monstersInHand.length <= 0) {
		showBattleResult("Illusion: в руке нет монстров для замены.");
		setTimeout(hideBattleResult, 1800);
		return;
	}
	const el = document.getElementById(cardId);
	if (!el || el.dataset?.illusionUsed) {
		return;
	}
	el.dataset.illusionUsed = "1";

	// 1) выбрать монстра в бою, который уйдёт в сброс
	setTimeout(() => {
		const curEl = document.getElementById(cardId);
		const parentId = curEl?.parentElement?.id || "";
		const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
		if (!curEl || !stillOnBattlefield) {
			if (curEl) {
				curEl.dataset.illusionUsed = "";
			}
			return;
		}
		const ctx = getMonsterBattleContext();
		if (!ctx.hasMonster || ctx.monsters.length <= 0) {
			curEl.dataset.illusionUsed = "";
			return;
		}
		openPickMonsterToDiscardModal({
			titleText: "Illusion: выбери монстра, который уйдёт в сброс",
			applyText: "Сбросить выбранного монстра",
			monsters: ctx.monsters,
			onApply: (discardMonsterId) => {
				// 2) затем выбрать монстра из руки, который будет добавлен в бой
				hidePotionPickMonsterModal();
				const monstersNow = getLocalHandMonsterCardsForWanderingMonster();
				if (monstersNow.length <= 0) {
					showBattleResult("Illusion: в руке нет монстров для замены.");
					setTimeout(hideBattleResult, 1800);
					curEl.dataset.illusionUsed = "";
					return;
				}
				hideWanderingMonsterPickModal();
				const modal = document.createElement("div");
				modal.id = "illusion-pick-hand-monster-modal";
				modal.className = "wizard-taming-pick-modal";
				const panel = document.createElement("div");
				panel.className = "wizard-taming-pick-panel";
				const title = document.createElement("div");
				title.className = "wizard-taming-pick-title";
				title.textContent = "Illusion: выбери монстра из руки для замены";
				const cardsWrap = document.createElement("div");
				cardsWrap.className = "wizard-taming-pick-cards";
				const applyBtn = document.createElement("button");
				applyBtn.type = "button";
				applyBtn.className = "wizard-taming-pick-apply-btn";
				applyBtn.textContent = "Добавить выбранного монстра в бой";
				applyBtn.disabled = true;
				let selected = null;
				monstersNow.forEach((m) => {
					const btn = document.createElement("button");
					btn.type = "button";
					btn.className = "wizard-taming-pick-card";
					btn.dataset.cardId = m.cardId;
					const img = document.createElement("img");
					img.className = "wizard-taming-pick-card-img";
					img.src = m.img || "";
					img.alt = m.cardId;
					btn.appendChild(img);
					btn.addEventListener("click", () => {
						cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
						btn.classList.add("is-selected");
						selected = m.cardId;
						applyBtn.disabled = !selected;
					});
					cardsWrap.appendChild(btn);
				});
				applyBtn.addEventListener("click", () => {
					if (!selected) {
						return;
					}
					socket.emit("message", {
						method: "IllusionResolve",
						seat: localSeat,
						illusionCardId: cardId,
						discardMonsterId,
						addMonsterId: selected,
					});
					modal.remove();
				});
				panel.appendChild(title);
				panel.appendChild(cardsWrap);
				panel.appendChild(applyBtn);
				modal.appendChild(panel);
				document.body.appendChild(modal);
				modal.addEventListener("click", (e) => {
					if (e.target === modal) {
						modal.remove();
					}
				});
			},
		});
	}, 30);
}

export function scheduleMagicLampIfNeeded(cardId, zoneEl) {
	return schedulePotionPickMonsterIfNeeded({ cardId, zoneEl, mode: "magic" });
}

export function schedulePollymorthPotionIfNeeded(cardId, zoneEl) {
	return schedulePotionPickMonsterIfNeeded({ cardId, zoneEl, mode: "poly" });
}

export function canLocalPlayMagicLampToBattleZone(zoneEl) {
	if (!zoneEl) {
		return true;
	}
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return true;
	}
	// Перемещение не блокируем; ограничение делаем на этапе активации.
	return true;
}
function scheduleOutToLunchIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	if (!isDoorSpecial(cardId, "Out to lunch")) {
		return;
	}
	// Эффект запускается только когда карту кладут на поле боя (к бонусам монстра или игрока).
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return;
	}
	// Срабатывает только если на поле боя уже есть хотя бы один монстр.
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	if (el.dataset?.outToLunchScheduled) {
		return;
	}
	el.dataset.outToLunchScheduled = "1";

	// Не ограничиваем seat-ом: иначе у клиентов, которые не seat0, эффект не запустится.
	// Повторные resolve безвредны (сброс поля боя и так идемпотентен).
	setTimeout(() => {
		const curEl = document.getElementById(cardId);
		if (!curEl) {
			return;
		}
		// Если карту успели куда-то убрать с поля боя — отменяем.
		const parentId = curEl.parentElement?.id || "";
		const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
		if (!stillOnBattlefield) {
			curEl.dataset.outToLunchScheduled = "";
			return;
		}
		// На момент срабатывания тоже проверяем, что монстр всё ещё есть.
		if (!getMonsterBattleContext().hasMonster) {
			curEl.dataset.outToLunchScheduled = "";
			return;
		}
		socket.emit("message", { method: "OutToLunchResolve", cardId });
	}, 1000);
}

function scheduleFriendshipPotionIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	if (!isTreasureSpecial(cardId, "Friendship potion")) {
		return;
	}
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	if (el.dataset?.friendshipPotionScheduled) {
		return;
	}
	el.dataset.friendshipPotionScheduled = "1";
	setTimeout(() => {
		const curEl = document.getElementById(cardId);
		if (!curEl) {
			return;
		}
		const parentId = curEl.parentElement?.id || "";
		const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
		if (!stillOnBattlefield) {
			curEl.dataset.friendshipPotionScheduled = "";
			return;
		}
		if (!getMonsterBattleContext().hasMonster) {
			curEl.dataset.friendshipPotionScheduled = "";
			return;
		}
		socket.emit("message", { method: "FriendshipPotionResolve", cardId });
	}, 1000);
}

function hideMatePickModal() {
	const existing = document.getElementById("mate-pick-monster-modal");
	if (existing) {
		existing.remove();
	}
}

export function scheduleMateIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return;
	}
	if (!battleActive || !getMonsterBattleContext().hasMonster) {
		return;
	}
	if (!isDoorSpecial(cardId, "Mate")) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el || el.dataset?.mateUsed) {
		return;
	}
	el.dataset.mateUsed = "1";

	setTimeout(() => {
		const curEl = document.getElementById(cardId);
		const parentId = curEl?.parentElement?.id || "";
		const stillOnBattlefield = parentId === "zone_monster" || parentId === "zone3";
		if (!curEl || !stillOnBattlefield) {
			if (curEl) {
				curEl.dataset.mateUsed = "";
			}
			return;
		}
		const ctx = getMonsterBattleContext();
		if (!ctx.hasMonster || ctx.monsters.length <= 0) {
			curEl.dataset.mateUsed = "";
			return;
		}
		if (ctx.monsters.length === 1) {
			const pairId = `mate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
			socket.emit("message", { method: "MateApply", mateCardId: cardId, sourceMonsterId: ctx.monsters[0].cardId, pairId });
			return;
		}
		hideMatePickModal();
		const modal = document.createElement("div");
		modal.id = "mate-pick-monster-modal";
		modal.className = "wizard-taming-pick-modal";
		const panel = document.createElement("div");
		panel.className = "wizard-taming-pick-panel";
		const title = document.createElement("div");
		title.className = "wizard-taming-pick-title";
		title.textContent = "Mate: выбери монстра для дублирования";
		const cardsWrap = document.createElement("div");
		cardsWrap.className = "wizard-taming-pick-cards";
		const applyBtn = document.createElement("button");
		applyBtn.type = "button";
		applyBtn.className = "wizard-taming-pick-apply-btn";
		applyBtn.textContent = "Дублировать выбранного монстра";
		applyBtn.disabled = true;
		let selected = null;
		ctx.monsters.forEach((m) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "wizard-taming-pick-card";
			btn.dataset.cardId = m.cardId;
			const img = document.createElement("img");
			img.className = "wizard-taming-pick-card-img";
			img.src = m.img || "";
			img.alt = m.cardId;
			btn.appendChild(img);

			// Бонусы отображаем ровно так же, как в окне усмирения (WizardTamingPick).
			const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
			const sumEl = document.createElement("div");
			sumEl.className = "wizard-taming-pick-sum";
			sumEl.textContent = bonusSum ? `Бонус: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "Бонус: 0";
			sumEl.style.marginTop = "4px";
			sumEl.style.fontSize = "16px";
			sumEl.style.color = "#ffd37a";
			sumEl.style.textAlign = "center";
			btn.appendChild(sumEl);

			const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
			if (attachedBonuses.length > 0) {
				const bonusesWrap = document.createElement("div");
				bonusesWrap.className = "wizard-taming-pick-bonuses";
				bonusesWrap.style.display = "flex";
				bonusesWrap.style.flexWrap = "wrap";
				bonusesWrap.style.justifyContent = "center";
				bonusesWrap.style.gap = "6px";
				bonusesWrap.style.marginTop = "6px";
				attachedBonuses.forEach((bc) => {
					const bi = document.createElement("img");
					bi.className = "wizard-taming-pick-bonus-img";
					bi.src = bc.img || "";
					bi.alt = bc.cardId;
					bi.style.width = "40px";
					bi.style.height = "auto";
					bi.style.borderRadius = "6px";
					bonusesWrap.appendChild(bi);
				});
				btn.appendChild(bonusesWrap);
			}

			btn.addEventListener("click", () => {
				cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
				btn.classList.add("is-selected");
				selected = m.cardId;
				applyBtn.disabled = !selected;
			});
			cardsWrap.appendChild(btn);
		});
		applyBtn.addEventListener("click", () => {
			if (!selected) {
				return;
			}
			const pairId = `mate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
			socket.emit("message", { method: "MateApply", mateCardId: cardId, sourceMonsterId: selected, pairId });
			modal.remove();
		});
		panel.appendChild(title);
		panel.appendChild(cardsWrap);
		panel.appendChild(applyBtn);
		modal.appendChild(panel);
		document.body.appendChild(modal);
		modal.addEventListener("click", (e) => {
			if (e.target === modal) {
				modal.remove();
			}
		});
	}, 30);
}

/** Карта сокровища в руке/main/side указанного места (надёжнее getElementById при дубликатах id в DOM). */
function findTreasureCardInSeatZones(cardId, seat) {
	const id = String(cardId || "").trim();
	if (!id || !id.includes("treasure")) {
		return null;
	}
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return null;
	}
	const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
	const zones = [getHandElementForPlayerSeat(s), main, side].filter(Boolean);
	for (const z of zones) {
		const found = Array.from(z.querySelectorAll(".card")).find((c) => c && c.id === id);
		if (found) {
			return found;
		}
	}
	// Синхронизация сброса: при расхождении num/DOM карта соперника может лежать в «другой» руке/зоне.
	if (localSeat != null && Number.isFinite(Number(localSeat)) && Number(s) !== Number(localSeat)) {
		const extra = [
			document.getElementById("opponenthand"),
			document.getElementById("opponent2hand"),
			document.getElementById("opponent3hand"),
			document.querySelector(".opponenthand"),
		].filter(Boolean);
		for (const z of extra) {
			if (zones.includes(z)) {
				continue;
			}
			const hit = Array.from(z.querySelectorAll(".card")).find((c) => c && c.id === id);
			if (hit) {
				return hit;
			}
		}
		const zoneSels = [".zone_opponent", ".zone_opponent2", ".zone_opponent3", ".zone_opponent_side", ".zone_opponent2_side", ".zone_opponent3_side"];
		for (const sel of zoneSels) {
			const z = document.querySelector(sel);
			if (!z || zones.includes(z)) {
				continue;
			}
			const hit = Array.from(z.querySelectorAll(".card")).find((c) => c && c.id === id);
			if (hit) {
				return hit;
			}
		}
	}
	return null;
}

function moveTreasureCardToDiscard(cardId, opts) {
	const id = String(cardId || "").trim();
	let card = null;
	const ownerSeat = opts && opts.ownerSeat != null ? Number(opts.ownerSeat) : NaN;
	if (Number.isFinite(ownerSeat)) {
		card = findTreasureCardInSeatZones(id, ownerSeat);
	}
	if (!card) {
		card = document.getElementById(id);
	}
	const dropZone = document.getElementById('zone_treasure_drop');
	if (!card || !dropZone) {
		return;
	}
	if (!id.includes('treasure')) {
		return;
	}
	// Если сбрасываем Наёмничка — его шмотка должна уйти вместе с ним.
	if (isTreasureSpecial(id, "Hireling")) {
		const attachedId = String(card.dataset?.hirelingAttachedTreasureId || "");
		if (attachedId) {
			const attachedEl = document.getElementById(attachedId);
			if (attachedEl) {
				attachedEl.dataset.hirelingCardId = "";
				dropZone.appendChild(attachedEl);
			}
		}
		card.dataset.hirelingAttachedTreasureId = "";
	}
	// Если на шмотке был Cheat — при любом её выходе из основной экипировки Cheat должен уйти в сброс.
	const attachedCheatId = String(card.dataset?.cheatCardId || "");
	if (attachedCheatId) {
		card.dataset.cheatCardId = "";
		clearCheatVisualPlacement(attachedCheatId, id);
		const cheatEl = document.getElementById(attachedCheatId);
		if (cheatEl && cheatEl.parentElement?.id !== "zone_doors_drop") {
			moveBadStaffCardToDiscard(attachedCheatId);
		}
	}
	dropZone.appendChild(card);
	UpdatebackImgTreasure();
	adjustCardWidth('.zone_treasure_drop');
}

const WISHING_RING_LABEL = "Wishing ring";

function treasureMetaIsWishingRing(tr) {
	if (!tr) {
		return false;
	}
	return String(tr.card_name || "").trim() === WISHING_RING_LABEL
		|| String(tr.special || "").trim() === WISHING_RING_LABEL;
}

function isDoorCurseBySpecial(door) {
	if (!door) {
		return false;
	}
	return String(door.special || "").trim().toLowerCase() === "curse";
}

function findWishingRingTreasureIdForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return null;
	}
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
	for (const zoneEl of [hand, main, side]) {
		if (!zoneEl) {
			continue;
		}
		for (const el of zoneEl.querySelectorAll(".card")) {
			const id = el?.id;
			if (!id || !String(id).includes("treasure")) {
				continue;
			}
			const tr = window.treasures?.find((t) => t.name === id);
			if (treasureMetaIsWishingRing(tr)) {
				return id;
			}
		}
	}
	return null;
}

/**
 * Ожидание решений по хотельным кольцам: проклятие не применяется, пока все держатели колец не ответят
 * («не использовать») или кто-то не отменит проклятие кольцом.
 * @type {{
 *   curseCardId: string,
 *   curseTargetSeat: number,
 *   incomeTax: boolean,
 *   bad_staff: object | null,
 *   ringSeats: number[],
 *   ringCardBySeat: Record<string, string>,
 *   skipped: number[],
 *   cancelled: boolean,
 * } | null}
 */
let curseWishingRingActive = null;

function hideWishingRingChoiceBanner() {
	const el = document.getElementById("wishing-ring-curse-choice");
	if (el) {
		el.remove();
	}
}

function clearCurseWishingRingActive() {
	curseWishingRingActive = null;
	hideWishingRingChoiceBanner();
}

function collectWishingRingRespondersForTable() {
	const n = effectiveSeatLayoutPlayerCount();
	const out = [];
	for (let s = 0; s < n; s++) {
		const ringCardId = findWishingRingTreasureIdForSeat(s);
		if (ringCardId) {
			out.push({ seat: s, ringCardId });
		}
	}
	return out;
}

function maybeEmitCurseWishingRingAllSkippedApply() {
	const a = curseWishingRingActive;
	if (!a || a.cancelled) {
		return;
	}
	if (!a.ringSeats.length) {
		return;
	}
	if (!a.ringSeats.every((s) => a.skipped.includes(s))) {
		return;
	}
	const minSeat = Math.min(...a.ringSeats);
	if (localSeat === null || localSeat === undefined || Number(localSeat) !== minSeat) {
		return;
	}
	socket.emit("message", {
		method: "CurseWishingRingAllSkippedApply",
		curseTargetSeat: a.curseTargetSeat,
		curseCardId: a.curseCardId,
		incomeTax: Boolean(a.incomeTax),
		bad_staff: a.bad_staff,
	});
}

function refreshWishingRingBarUI() {
	hideWishingRingChoiceBanner();
	const a = curseWishingRingActive;
	if (!a || a.cancelled) {
		return;
	}
	if (localSeat === null || localSeat === undefined) {
		return;
	}
	const my = Number(localSeat);
	if (!Number.isFinite(my) || my < 0) {
		return;
	}
	if (!a.ringSeats.includes(my)) {
		return;
	}
	if (a.skipped.includes(my)) {
		return;
	}
	const wrap = document.createElement("div");
	wrap.id = "wishing-ring-curse-choice";
	wrap.className = "wishing-ring-curse-choice";
	const panel = document.createElement("div");
	panel.className = "wishing-ring-curse-choice-panel";
	const title = document.createElement("div");
	title.className = "wishing-ring-curse-choice-title";
	const victimLabel = getSeatLabel(a.curseTargetSeat);
	if (my === Number(a.curseTargetSeat)) {
		title.textContent = "На тебя сыграли проклятие. Использовать хотельное кольцо и отменить его?";
	} else {
		title.textContent = `Сыграли проклятие на ${victimLabel}. Использовать своё хотельное кольцо и отменить проклятие?`;
	}
	panel.appendChild(title);
	const row = document.createElement("div");
	row.className = "wishing-ring-curse-choice-actions";
	const btnUse = document.createElement("button");
	btnUse.type = "button";
	btnUse.className = "wishing-ring-curse-choice-btn";
	btnUse.textContent = "Использовать кольцо";
	const btnSkip = document.createElement("button");
	btnSkip.type = "button";
	btnSkip.className = "wishing-ring-curse-choice-btn";
	btnSkip.textContent = "Не использовать";
	let done = false;
	const finish = (useRing) => {
		if (done) {
			return;
		}
		done = true;
		const st = curseWishingRingActive;
		if (!st || st.cancelled) {
			return;
		}
		if (localSeat === null || localSeat === undefined) {
			return;
		}
		const mySeat = Number(localSeat);
		if (!st.ringSeats.includes(mySeat)) {
			return;
		}
		const ringId = String(st.ringCardBySeat[String(mySeat)] || "").trim();
		socket.emit("message", {
			method: "CurseWishingRingResponse",
			curseCardId: st.curseCardId,
			responderSeat: mySeat,
			useRing,
			ringCardId: useRing ? ringId : "",
		});
		hideWishingRingChoiceBanner();
	};
	btnUse.addEventListener("click", () => finish(true));
	btnSkip.addEventListener("click", () => finish(false));
	row.appendChild(btnUse);
	row.appendChild(btnSkip);
	panel.appendChild(row);
	wrap.appendChild(panel);
	document.body.appendChild(wrap);
}

function applyBadStaffLevelFromNetwork(res) {
	const seat = Number(res.seat);
	const badStaff = normalizeBadStaff(res.bad_staff);
	const cardId = res.cardId;
	if (!Number.isFinite(seat) || seat < 0 || !badStaff || !cardId) {
		return;
	}
	if (badStaff.type === "change class") {
		applyChangeClassCurseToSeat(seat, cardId);
	} else if (badStaff.type === "change race") {
		applyChangeRaceCurseToSeat(seat, cardId);
	} else if (badStaff.type === "lose your class") {
		applyLoseYourClassCurseToSeat(seat, cardId);
	} else if (badStaff.type === "lose your race") {
		applyLoseYourRaceCurseToSeat(seat, cardId);
	} else if (badStaff.type === "malign mirrror") {
		applyMalignMirrorCurseToSeat(seat, cardId);
	} else if (badStaff.type === "change sex") {
		applyChangeSexCurseToSeat(seat, cardId);
	} else if (badStaff.type === "chicken on your head") {
		// Остаётся в экипировке; штраф к кубику — по наличию карты в зоне.
	} else if (badStaff.type === "income tax") {
		// Отдельный поток IncomeTaxStart / IncomeTaxInitiatorPick.
	} else {
		applyBadStaffToSeat(seat, badStaff);
		moveBadStaffCardToDiscard(cardId);
	}
}

function handleCurseWishingRingOffer(res) {
	const curseTargetSeat = Number(res.curseTargetSeat);
	const curseCardId = String(res.curseCardId || "").trim();
	const incomeTax = Boolean(res.incomeTax);
	const rawResponders = Array.isArray(res.ringResponders) ? res.ringResponders : [];
	const bad_staff = res.bad_staff && typeof res.bad_staff === "object" ? res.bad_staff : null;
	if (!Number.isFinite(curseTargetSeat) || curseTargetSeat < 0 || !curseCardId) {
		return;
	}
	const ringResponders = rawResponders
		.map((x) => ({
			seat: Number(x?.seat),
			ringCardId: String(x?.ringCardId || "").trim(),
		}))
		.filter((x) => Number.isFinite(x.seat) && x.seat >= 0 && x.ringCardId);
	if (!ringResponders.length) {
		return;
	}
	const ringCardBySeat = {};
	const ringSeats = [];
	for (const { seat, ringCardId } of ringResponders) {
		ringSeats.push(seat);
		ringCardBySeat[String(seat)] = ringCardId;
	}
	curseWishingRingActive = {
		curseCardId,
		curseTargetSeat,
		incomeTax,
		bad_staff: bad_staff ? normalizeBadStaff(bad_staff) : null,
		ringSeats,
		ringCardBySeat,
		skipped: [],
		cancelled: false,
	};
	refreshWishingRingBarUI();
}

function handleCurseWishingRingResponse(res) {
	const curseCardId = String(res.curseCardId || "").trim();
	const responderSeat = Number(res.responderSeat);
	const useRing = Boolean(res.useRing);
	const ringCardId = String(res.ringCardId || "").trim();
	const a = curseWishingRingActive;
	if (!curseCardId || !Number.isFinite(responderSeat) || responderSeat < 0) {
		return;
	}
	if (!a || a.cancelled || a.curseCardId !== curseCardId) {
		return;
	}
	if (!a.ringSeats.includes(responderSeat)) {
		return;
	}
	if (useRing) {
		a.cancelled = true;
		if (ringCardId) {
			moveTreasureCardToDiscard(ringCardId, { ownerSeat: responderSeat });
		}
		moveBadStaffCardToDiscard(curseCardId);
		clearCurseWishingRingActive();
		recalculateAllPowerDisplays();
		return;
	}
	if (a.skipped.includes(responderSeat)) {
		return;
	}
	a.skipped.push(responderSeat);
	refreshWishingRingBarUI();
	maybeEmitCurseWishingRingAllSkippedApply();
}

function handleCurseWishingRingAllSkippedApply(res) {
	hideWishingRingChoiceBanner();
	const curseCardId = String(res.curseCardId || "").trim();
	const curseTargetSeat = Number(res.curseTargetSeat);
	const incomeTax = Boolean(res.incomeTax);
	if (!curseCardId || !Number.isFinite(curseTargetSeat) || curseTargetSeat < 0) {
		return;
	}
	if (!curseWishingRingActive || curseWishingRingActive.curseCardId !== curseCardId) {
		return;
	}
	curseWishingRingActive = null;
	if (incomeTax) {
		handleIncomeTaxStart({ curseSeat: curseTargetSeat, curseCardId });
	} else {
		const bs = normalizeBadStaff(res.bad_staff);
		if (bs) {
			applyBadStaffLevelFromNetwork({
				seat: curseTargetSeat,
				bad_staff: res.bad_staff,
				cardId: curseCardId,
			});
		} else {
			moveBadStaffCardToDiscard(curseCardId);
		}
	}
	recalculateAllPowerDisplays();
}

export function scheduleBadStaffIfNeeded(cardId, zoneEl) {
	const door = window.doors?.find(d => d.name === cardId);
	if (!door) {
		return;
	}
	if (!isDoorCurseBySpecial(door)) {
		return;
	}
	const badStaff = normalizeBadStaff(door.bad_staff);
	if (badStaff?.type === "chicken on your head") {
		return;
	}
	if (door.race === 'monster') {
		return;
	}
	if (!isPlayerPlayZoneElement(zoneEl)) {
		return;
	}
	const seat = getGlobalSeatForPlayZone(zoneEl);
	if (seat === null || seat === undefined) {
		return;
	}
	const zoneId = zoneEl.id;

	const ringResponders = collectWishingRingRespondersForTable();
	const emitCurseWishingRingOfferIfNeeded = () => {
		if (!ringResponders.length) {
			return false;
		}
		socket.emit("message", {
			method: "CurseWishingRingOffer",
			curseTargetSeat: seat,
			curseCardId: cardId,
			incomeTax: badStaff?.type === "income tax",
			bad_staff: badStaff?.type === "income tax" ? null : badStaff,
			ringResponders,
		});
		return true;
	};

	const runWhenCardStillInZone = (fn) => {
		queueMicrotask(() => {
			const card = document.getElementById(cardId);
			const zone = document.getElementById(zoneId);
			if (!card || !zone || !zone.contains(card)) {
				return;
			}
			fn(card, zone);
		});
	};

	if (badStaff?.type === "income tax") {
		if (emitCurseWishingRingOfferIfNeeded()) {
			return;
		}
		runWhenCardStillInZone((card) => {
			const { main, side } = getMainAndSideZoneElementsForSeat(seat) || {};
			const stillEquipped = (main && main.contains(card)) || (side && side.contains(card));
			if (!stillEquipped) {
				return;
			}
			socket.emit("message", {
				method: "IncomeTaxStart",
				curseSeat: seat,
				curseCardId: cardId,
			});
		});
		return;
	}

	if (emitCurseWishingRingOfferIfNeeded()) {
		return;
	}

	runWhenCardStillInZone(() => {
		if (badStaff) {
			socket.emit("message", {
				method: "BadStaffLevel",
				seat,
				bad_staff: badStaff,
				cardId,
			});
		} else {
			syncDoorCardMoveToDiscard(cardId);
		}
	});
}

function ensureIncomeTaxBannerEl() {
	let el = document.getElementById("income-tax-curse-banner");
	if (!el) {
		el = document.createElement("div");
		el.id = "income-tax-curse-banner";
		el.className = "income-tax-curse-banner";
		el.setAttribute("aria-live", "polite");
		document.body.appendChild(el);
	}
	return el;
}

function showIncomeTaxBanner(text) {
	const el = ensureIncomeTaxBannerEl();
	el.textContent = String(text || "");
	el.classList.add("is-visible");
}

function hideIncomeTaxBanner() {
	const el = document.getElementById("income-tax-curse-banner");
	if (el) {
		el.textContent = "";
		el.classList.remove("is-visible");
	}
}

function collectIncomeTaxTreasuresForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s) || {};
	const out = [];
	const seen = new Set();
	const pushZone = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const id = cardEl.id;
			if (!id || !String(id).includes("treasure") || seen.has(id)) {
				return;
			}
			const t = window.treasures?.find((tr) => tr.name === id);
			if (!t) {
				return;
			}
			const price = Number(t.cost);
			if (!Number.isFinite(price) || price < 0) {
				return;
			}
			seen.add(id);
			const imgEl = cardEl.querySelector(".card-item");
			out.push({
				cardId: id,
				cost: price,
				img: imgEl?.src || t.img,
			});
		});
	};
	pushZone(hand);
	pushZone(main);
	pushZone(side);
	return out;
}

function getIncomeTaxTotalGoldForSeat(seat) {
	return collectIncomeTaxTreasuresForSeat(seat).reduce((acc, x) => acc + (Number(x.cost) || 0), 0);
}

/** Стоимость эталонной шмотки (после выбора жертвой налога). */
function getIncomeTaxReferenceCostForTreasureId(treasureId) {
	const tid = String(treasureId || "").trim();
	if (!tid) {
		return 0;
	}
	const t = window.treasures?.find((x) => x.name === tid);
	return Math.max(0, Number(t?.cost) || 0);
}

function closeIncomeTaxInitiatorModal() {
	const m = document.getElementById("income-tax-initiator-modal");
	if (m) {
		m.remove();
	}
}

function closeIncomeTaxResponderModal() {
	const m = document.getElementById("income-tax-responder-modal");
	if (m) {
		m.remove();
	}
}

function openIncomeTaxInitiatorModal(curseCardId) {
	closeIncomeTaxInitiatorModal();
	const curseSeat = incomeTaxSession ? incomeTaxSession.curseSeat : Number(localSeat);
	const cards = collectIncomeTaxTreasuresForSeat(curseSeat);

	const modal = document.createElement("div");
	modal.id = "income-tax-initiator-modal";
	modal.className = "sell-treasures-modal";

	const panel = document.createElement("div");
	panel.className = "sell-treasures-panel";

	const topBar = document.createElement("div");
	topBar.className = "sell-treasures-topbar";
	const titleText = document.createElement("div");
	titleText.className = "sell-treasures-total";
	titleText.style.flex = "1";
	titleText.style.fontSize = "22px";
	titleText.textContent = "Налог: выбери одну шмотку для сброса";
	const confirmBtn = document.createElement("button");
	confirmBtn.className = "sell-treasures-btn";
	confirmBtn.textContent = cards.length ? "Сбросить выбранную" : "Продолжить (нет шмоток)";
	confirmBtn.disabled = cards.length > 0;
	topBar.appendChild(titleText);
	topBar.appendChild(confirmBtn);

	const cardsContainer = document.createElement("div");
	cardsContainer.className = "sell-treasures-cards";
	panel.appendChild(topBar);
	panel.appendChild(cardsContainer);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	let selectedId = "";
	const updateBtn = () => {
		if (!cards.length) {
			confirmBtn.disabled = false;
			return;
		}
		confirmBtn.disabled = !selectedId;
	};

	if (!cards.length) {
		const emptyState = document.createElement("div");
		emptyState.className = "sell-treasures-empty";
		emptyState.textContent = "Нет шмоток — налог для остальных будет 0 золота.";
		cardsContainer.appendChild(emptyState);
	} else {
		cards.forEach((cardData) => {
			const item = document.createElement("button");
			item.type = "button";
			item.className = "sell-treasures-card";
			item.dataset.cardId = cardData.cardId;
			const img = document.createElement("img");
			img.className = "sell-treasures-card-img";
			img.src = cardData.img;
			img.alt = cardData.cardId;
			const costLabel = document.createElement("div");
			costLabel.className = "sell-treasures-card-cost";
			costLabel.textContent = `${cardData.cost}`;
			item.appendChild(img);
			item.appendChild(costLabel);
			item.addEventListener("click", () => {
				const cid = item.dataset.cardId;
				if (!cid) {
					return;
				}
				cardsContainer.querySelectorAll(".sell-treasures-card").forEach((el) => el.classList.remove("is-selected"));
				if (selectedId === cid) {
					selectedId = "";
				} else {
					selectedId = cid;
					item.classList.add("is-selected");
				}
				updateBtn();
			});
			cardsContainer.appendChild(item);
		});
	}

	confirmBtn.addEventListener("click", () => {
		const tid = selectedId || "";
		socket.emit("message", {
			method: "IncomeTaxInitiatorPick",
			curseSeat,
			curseCardId: String(curseCardId || "").trim(),
			treasureId: tid,
			referenceCost: getIncomeTaxReferenceCostForTreasureId(tid),
		});
		closeIncomeTaxInitiatorModal();
	});
}

function openIncomeTaxResponderModal(referenceCost, curseCardId) {
	closeIncomeTaxResponderModal();
	const ref = Math.max(0, Number(referenceCost) || 0);
	const cards = collectIncomeTaxTreasuresForSeat(localSeat);

	const modal = document.createElement("div");
	modal.id = "income-tax-responder-modal";
	modal.className = "sell-treasures-modal";

	const panel = document.createElement("div");
	panel.className = "sell-treasures-panel";

	const topBar = document.createElement("div");
	topBar.className = "sell-treasures-topbar";
	const titleText = document.createElement("div");
	titleText.className = "sell-treasures-total";
	titleText.style.flex = "1";
	titleText.style.fontSize = "22px";
	titleText.textContent = `Налог: сбрось шмотки минимум на ${ref} золота (сейчас: 0).`;
	const confirmBtn = document.createElement("button");
	confirmBtn.className = "sell-treasures-btn";
	confirmBtn.textContent = "Подтвердить сброс";
	confirmBtn.disabled = ref > 0;
	topBar.appendChild(titleText);
	topBar.appendChild(confirmBtn);

	const cardsContainer = document.createElement("div");
	cardsContainer.className = "sell-treasures-cards";
	panel.appendChild(topBar);
	panel.appendChild(cardsContainer);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	const selected = new Set();
	const selectedOrder = [];
	const cardCostById = new Map();
	cards.forEach(({ cardId, cost }) => {
		cardCostById.set(cardId, Number(cost) || 0);
	});
	const sumSelected = () => {
		let t = 0;
		selected.forEach((id) => {
			t += cardCostById.get(id) || 0;
		});
		return t;
	};
	const refreshTitle = () => {
		const s = sumSelected();
		titleText.textContent = `Налог: сбрось шмотки минимум на ${ref} золота (сейчас: ${s}).`;
		confirmBtn.disabled = ref > 0 && s < ref;
	};

	if (!cards.length && ref > 0) {
		const emptyState = document.createElement("div");
		emptyState.className = "sell-treasures-empty";
		emptyState.textContent = "Нет шмоток для выбора.";
		cardsContainer.appendChild(emptyState);
		confirmBtn.disabled = true;
	} else {
		cards.forEach((cardData) => {
			const item = document.createElement("button");
			item.type = "button";
			item.className = "sell-treasures-card";
			item.dataset.cardId = cardData.cardId;
			const img = document.createElement("img");
			img.className = "sell-treasures-card-img";
			img.src = cardData.img;
			img.alt = cardData.cardId;
			const costLabel = document.createElement("div");
			costLabel.className = "sell-treasures-card-cost";
			costLabel.textContent = `${cardData.cost}`;
			item.appendChild(img);
			item.appendChild(costLabel);
			item.addEventListener("click", () => {
				const cid = item.dataset.cardId;
				if (!cid) {
					return;
				}
				if (selected.has(cid)) {
					selected.delete(cid);
					const idx = selectedOrder.indexOf(cid);
					if (idx >= 0) {
						selectedOrder.splice(idx, 1);
					}
					item.classList.remove("is-selected");
				} else {
					selected.add(cid);
					selectedOrder.push(cid);
					item.classList.add("is-selected");
				}
				refreshTitle();
			});
			cardsContainer.appendChild(item);
		});
	}

	confirmBtn.addEventListener("click", () => {
		if (ref > 0 && sumSelected() < ref) {
			return;
		}
		socket.emit("message", {
			method: "IncomeTaxResponderSubmit",
			seat: localSeat,
			cardIds: Array.from(selected),
			curseCardId: String(curseCardId || "").trim(),
		});
		closeIncomeTaxResponderModal();
	});
}

function finishIncomeTaxCurse(curseCardId) {
	hideIncomeTaxBanner();
	closeIncomeTaxInitiatorModal();
	closeIncomeTaxResponderModal();
	incomeTaxSession = null;
	const cid = String(curseCardId || "").trim();
	if (cid) {
		moveBadStaffCardToDiscard(cid);
	}
	recalculateAllPowerDisplays();
}

/** Завершение налога: любой клиент может отправить (жертва не всегда надёжно определяется через localSeat). Сервер идемпотентен по сбросу карты. */
function tryEmitIncomeTaxCurseFinishedIfDone() {
	if (!incomeTaxSession || incomeTaxSession.finishEmitSent) {
		return;
	}
	const { curseCardId, phase2NeedModal, phase2Done, phase2AllCount } = incomeTaxSession;
	const need = Array.isArray(phase2NeedModal) ? phase2NeedModal : [];
	const total = Number.isFinite(Number(phase2AllCount)) && Number(phase2AllCount) > 0
		? Number(phase2AllCount)
		: need.length;
	if (phase2Done.size < total) {
		return;
	}
	incomeTaxSession.finishEmitSent = true;
	const cid = String(curseCardId || "").trim();
	if (cid) {
		socket.emit("message", { method: "IncomeTaxCurseFinished", curseCardId: cid });
	}
}

function handleIncomeTaxStart(res) {
	const curseSeat = Number(res.curseSeat);
	const curseCardId = String(res.curseCardId || "").trim();
	if (!Number.isFinite(curseSeat) || curseSeat < 0 || !curseCardId) {
		return;
	}
	closeIncomeTaxInitiatorModal();
	closeIncomeTaxResponderModal();
	incomeTaxSession = {
		curseSeat,
		curseCardId,
		referenceCost: null,
		phase2NeedModal: [],
		phase2AllCount: 0,
		phase2Done: new Set(),
		finishEmitSent: false,
	};
	showIncomeTaxBanner(`Налог: ${getSeatLabel(curseSeat)} выбирает шмотку для сброса.`);
	if (localSeat !== null && localSeat !== undefined && Number(localSeat) === curseSeat) {
		openIncomeTaxInitiatorModal(curseCardId);
	}
}

function handleIncomeTaxInitiatorPick(res) {
	const curseSeat = Number(res.curseSeat);
	const curseCardId = String(res.curseCardId || "").trim();
	const treasureId = String(res.treasureId || "").trim();
	if (!Number.isFinite(curseSeat) || curseSeat < 0 || !curseCardId) {
		return;
	}
	let referenceCost = Number(res.referenceCost);
	if (!Number.isFinite(referenceCost)) {
		referenceCost = 0;
		if (treasureId) {
			const t = window.treasures?.find((x) => x.name === treasureId);
			referenceCost = Math.max(0, Number(t?.cost) || 0);
		}
	}
	referenceCost = Math.max(0, referenceCost);

	if (treasureId) {
		moveTreasureCardToDiscard(treasureId, { ownerSeat: curseSeat });
	}

	// На каждом клиенте свой подсчёт по локальному DOM (без «снимка» жертвы): < эталона → сброс всех шмоток и −1 уровень, иначе → модалка выбора.
	const nPlayersForModal = Math.min(3, Math.max(2, Number(num) || Number(window.num) || 2));
	const insufficientSeats = [];
	const discardIdsBySeat = {};
	for (let s = 0; s < nPlayersForModal; s++) {
		if (s === curseSeat) {
			continue;
		}
		if (getIncomeTaxTotalGoldForSeat(s) < referenceCost) {
			insufficientSeats.push(s);
			discardIdsBySeat[s] = collectIncomeTaxTreasuresForSeat(s).map((r) => r.cardId).filter(Boolean);
		}
	}
	const payingSeats = [];
	for (let s = 0; s < nPlayersForModal; s++) {
		if (s === curseSeat) {
			continue;
		}
		if (!insufficientSeats.includes(s)) {
			payingSeats.push(s);
		}
	}
	const needModal = payingSeats;

	// Полный сброс «бедного» рассылает только сам игрок (у жертвы налога на экране чужие суммы могли бы ошибиться).
	for (const s of insufficientSeats) {
		const rawIds = discardIdsBySeat[s] ?? discardIdsBySeat[String(s)] ?? [];
		const ids = Array.isArray(rawIds) ? rawIds.filter(Boolean) : [];
		if (localSeat !== null && localSeat !== undefined && Number(localSeat) === s) {
			for (const id of ids) {
				moveTreasureCardToDiscard(id, { ownerSeat: s });
			}
			let cur = levelBySeat[s];
			if (cur == null || Number.isNaN(cur)) {
				cur = 1;
			}
			setLevelBySeat(s, Math.max(1, cur - 1));
			socket.emit("message", {
				method: "IncomeTaxInsufficientDumpSync",
				seat: s,
				cardIds: ids,
			});
		}
	}

	if (localSeat !== null && localSeat !== undefined && Number(localSeat) === curseSeat) {
		socket.emit("message", {
			method: "IncomeTaxSyncDiscards",
			cardIds: treasureId ? [treasureId] : [],
			levelDownSeats: [],
		});
	}

	const bannerParts = [];
	if (insufficientSeats.length) {
		const who = insufficientSeats
			.map((s) => (localSeat !== null && localSeat !== undefined && Number(localSeat) === s ? "У тебя" : getSeatLabel(s)))
			.join(", ");
		bannerParts.push(`${who} — недостаточно суммы стоимости шмоток (нужно ${referenceCost}).`);
	}
	if (bannerParts.length) {
		showIncomeTaxBanner(`Налог: ${bannerParts.join(" ")}`);
	} else {
		hideIncomeTaxBanner();
	}

	const phase2AllCount = insufficientSeats.length + payingSeats.length;
	const phase2DoneInit = new Set(insufficientSeats);
	const mergePhase2Done = () => {
		const merged = new Set(phase2DoneInit);
		if (incomeTaxSession && incomeTaxSession.curseCardId === curseCardId && incomeTaxSession.phase2Done) {
			for (const s0 of incomeTaxSession.phase2Done) {
				const n = Number(s0);
				if (!Number.isFinite(n)) {
					continue;
				}
				if (insufficientSeats.includes(n) || payingSeats.includes(n)) {
					merged.add(n);
				}
			}
		}
		return merged;
	};
	const nextPhase2Done = mergePhase2Done();

	if (!incomeTaxSession || incomeTaxSession.curseCardId !== curseCardId) {
		incomeTaxSession = {
			curseSeat,
			curseCardId,
			referenceCost,
			phase2NeedModal: needModal,
			phase2AllCount,
			phase2Done: nextPhase2Done,
			finishEmitSent: false,
		};
	} else {
		incomeTaxSession.referenceCost = referenceCost;
		incomeTaxSession.phase2NeedModal = needModal;
		incomeTaxSession.phase2AllCount = phase2AllCount;
		incomeTaxSession.phase2Done = nextPhase2Done;
	}

	if (needModal.length === 0) {
		tryEmitIncomeTaxCurseFinishedIfDone();
		return;
	}

	for (const s of needModal) {
		if (localSeat !== null && localSeat !== undefined && Number(localSeat) === s) {
			openIncomeTaxResponderModal(referenceCost, curseCardId);
		}
	}
	tryEmitIncomeTaxCurseFinishedIfDone();
}

function handleIncomeTaxInsufficientDumpSync(res) {
	const seat = Number(res.seat);
	const cardIds = Array.isArray(res.cardIds) ? res.cardIds.filter(Boolean) : [];
	if (!Number.isFinite(seat) || seat < 0) {
		return;
	}
	if (localSeat !== null && localSeat !== undefined && Number(localSeat) === seat) {
		return;
	}
	cardIds.forEach((id) => moveTreasureCardToDiscard(id, { ownerSeat: seat }));
	let cur = levelBySeat[seat];
	if (cur == null || Number.isNaN(cur)) {
		cur = 1;
	}
	setLevelBySeat(seat, Math.max(1, cur - 1));
	recalculateAllPowerDisplays();
}

function handleIncomeTaxResponderSubmit(res) {
	const seat = Number(res.seat);
	const curseCardId = String(res.curseCardId || "").trim();
	const cardIds = Array.isArray(res.cardIds) ? res.cardIds.filter(Boolean) : [];
	if (!Number.isFinite(seat) || seat < 0 || !curseCardId) {
		return;
	}
	cardIds.forEach((id) => moveTreasureCardToDiscard(id, { ownerSeat: seat }));
	if (incomeTaxSession && incomeTaxSession.curseCardId === curseCardId) {
		incomeTaxSession.phase2Done.add(seat);
		tryEmitIncomeTaxCurseFinishedIfDone();
	}
	recalculateAllPowerDisplays();
}

function applyTreasureLevelToSeat(seat, levelGain) {
	const gain = Number(levelGain);
	if (!Number.isFinite(gain) || gain <= 0) {
		return;
	}
	let current = levelBySeat[seat];
	if (current == null || Number.isNaN(current)) {
		current = 1;
	}
	current = Math.max(1, current);
	const next = Math.max(1, current + gain);
	setLevelBySeat(seat, next);
	recalculateAllPowerDisplays();
}

function getLocalPlayerSellableTreasureCards() {
	const handEl = document.querySelector('.myhand');
	const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
	const cards = [];
	const pushZoneTreasures = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll('.card').forEach((cardEl) => {
			const treasure = window.treasures?.find(t => t.name === cardEl.id);
			if (!treasure) {
				return;
			}
			const price = Number(treasure.cost);
			if (!Number.isFinite(price) || price < 0) {
				return;
			}
			if (price === 0) {
				return;
			}
			cards.push({
				cardId: cardEl.id,
				img: treasure.img,
				cost: price,
			});
		});
	};
	pushZoneTreasures(handEl);
	pushZoneTreasures(side);
	pushZoneTreasures(main);
	return cards;
}

function closeSellTreasuresModal() {
	const modal = document.getElementById('sell-treasures-modal');
	if (modal) {
		modal.remove();
	}
}

function openSellTreasuresModal() {
	if (localSeat === null || localSeat === undefined) {
		return;
	}
	if (Number(localSeat) !== Number(currentTurnSeat)) {
		showBattleResult("Продавать шмотки можно только в свой ход.");
		setTimeout(() => {
			hideBattleResult();
		}, 1500);
		return;
	}
	closeSellTreasuresModal();

	const sellableCards = getLocalPlayerSellableTreasureCards();
	const localCharacter = characterBySeat[localSeat];
	const isLocalHalfling = seatHasRace(localSeat, "Halfling");
	const halflingBonusAvailable = isLocalHalfling && !halflingDoubleSellUsedBySeat[localSeat];
	const modal = document.createElement('div');
	modal.id = 'sell-treasures-modal';
	modal.className = 'sell-treasures-modal';

	const panel = document.createElement('div');
	panel.className = 'sell-treasures-panel';

	const topBar = document.createElement('div');
	topBar.className = 'sell-treasures-topbar';
	const totalText = document.createElement('div');
	totalText.className = 'sell-treasures-total';
	totalText.textContent = 'Общая сумма: 0';
	const sellButton = document.createElement('button');
	sellButton.className = 'sell-treasures-btn';
	sellButton.textContent = 'продать';
	sellButton.disabled = true;
	topBar.appendChild(totalText);
	topBar.appendChild(sellButton);

	const cardsContainer = document.createElement('div');
	cardsContainer.className = 'sell-treasures-cards';
	panel.appendChild(topBar);
	panel.appendChild(cardsContainer);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	const selected = new Set();
	const selectedOrder = [];
	const cardCostById = new Map();
	sellableCards.forEach(({ cardId, cost }) => {
		cardCostById.set(cardId, Number(cost) || 0);
	});
	const getSelectedTotalCost = () => {
		let total = 0;
		selected.forEach((cardId) => {
			total += cardCostById.get(cardId) || 0;
		});
		let bonusUsed = false;
		if (halflingBonusAvailable && selectedOrder.length > 0) {
			const firstSelectedId = selectedOrder[0];
			if (selected.has(firstSelectedId)) {
				total += cardCostById.get(firstSelectedId) || 0;
				bonusUsed = true;
			}
		}
		return { total, bonusUsed };
	};
	const updateTopBar = () => {
		totalText.textContent = `Общая сумма: ${getSelectedTotalCost().total}`;
		sellButton.disabled = selected.size === 0;
	};

	if (!sellableCards.length) {
		const emptyState = document.createElement('div');
		emptyState.className = 'sell-treasures-empty';
		emptyState.textContent = 'Нет шмоток для продажи';
		cardsContainer.appendChild(emptyState);
	} else {
		sellableCards.forEach((cardData) => {
			const item = document.createElement('button');
			item.type = 'button';
			item.className = 'sell-treasures-card';
			item.dataset.cardId = cardData.cardId;
			item.dataset.cost = String(cardData.cost);

			const img = document.createElement('img');
			img.className = 'sell-treasures-card-img';
			img.src = cardData.img;
			img.alt = cardData.cardId;

			const costLabel = document.createElement('div');
			costLabel.className = 'sell-treasures-card-cost';
			costLabel.textContent = `${cardData.cost}`;

			item.appendChild(img);
			item.appendChild(costLabel);
			item.addEventListener('click', () => {
				const cardId = item.dataset.cardId;
				if (!cardId) {
					return;
				}
				if (selected.has(cardId)) {
					selected.delete(cardId);
					const idx = selectedOrder.indexOf(cardId);
					if (idx >= 0) {
						selectedOrder.splice(idx, 1);
					}
					item.classList.remove('is-selected');
				} else {
					selected.add(cardId);
					selectedOrder.push(cardId);
					item.classList.add('is-selected');
				}
				updateTopBar();
			});
			cardsContainer.appendChild(item);
		});
	}

	modal.addEventListener('click', (event) => {
		if (event.target === modal) {
			closeSellTreasuresModal();
		}
	});

	sellButton.addEventListener('click', () => {
		if (!selected.size) {
			return;
		}
		const { total: totalCost, bonusUsed } = getSelectedTotalCost();
		if (bonusUsed && isLocalHalfling) {
			halflingDoubleSellUsedBySeat[localSeat] = true;
		}
		socket.emit("message", {
			method: "SellTreasures",
			seat: localSeat,
			cardIds: Array.from(selected),
			totalCost,
		});
		closeSellTreasuresModal();
	});
}

function applyTreasureSellResult(seat, cardIds, totalCost) {
	const parsedSeat = parseInt(seat, 10);
	if (Number.isNaN(parsedSeat)) {
		return;
	}
	const safeCardIds = Array.isArray(cardIds) ? cardIds.filter(Boolean) : [];
	let validCost = Number(totalCost);
	if (!Number.isFinite(validCost)) {
		validCost = 0;
	}
	if (!safeCardIds.length) {
		return;
	}

	safeCardIds.forEach((cardId) => moveTreasureCardToDiscard(cardId));

	const levelGain = Math.floor(Math.max(0, validCost) / 1000);
	if (levelGain > 0) {
		let current = levelBySeat[parsedSeat];
		if (current == null || Number.isNaN(current)) {
			current = 1;
		}
		setLevelBySeat(parsedSeat, Math.max(1, current + levelGain));
	}

	recalculateAllPowerDisplays();
}

export function scheduleTreasureLevelIfNeeded(cardId, zoneEl) {
	const treasure = window.treasures?.find(t => t.name === cardId);
	if (!treasure) {
		return;
	}
	const levelGain = Number(treasure.level);
	if (!Number.isFinite(levelGain) || levelGain <= 0) {
		return;
	}
	if (!isPlayerPlayZoneElement(zoneEl)) {
		return;
	}
	const seat = getGlobalSeatForPlayZone(zoneEl);
	if (seat === null || seat === undefined) {
		return;
	}
	const zoneId = zoneEl.id;

	setTimeout(() => {
		const card = document.getElementById(cardId);
		const zone = document.getElementById(zoneId);
		if (!card || !zone || !zone.contains(card)) {
			return;
		}
		socket.emit("message", {
			method: "TreasureLevel",
			seat,
			level: levelGain,
			cardId,
		});
	}, 1000);
}

function applyTreasure65LevelSwap(fromSeat, toSeat) {
	if (fromSeat === toSeat) {
		return;
	}
	let fromLevel = levelBySeat[fromSeat];
	if (fromLevel == null || Number.isNaN(fromLevel)) {
		fromLevel = 1;
	}
	let toLevel = levelBySeat[toSeat];
	if (toLevel == null || Number.isNaN(toLevel)) {
		toLevel = 1;
	}
	setLevelBySeat(fromSeat, Math.max(1, fromLevel + 1));
	setLevelBySeat(toSeat, Math.max(1, toLevel - 1));
	recalculateAllPowerDisplays();
}

export function scheduleTreasure65IfNeeded(cardId, zoneEl) {
	const treasure = window.treasures?.find(t => t.name === cardId);
	if (!treasure || treasure.card_name !== STEAL_LEVEL_CARD_NAME) {
		return;
	}
	if (!isPlayerPlayZoneElement(zoneEl)) {
		return;
	}
	const toSeat = getGlobalSeatForPlayZone(zoneEl);
	// "Укради уровень" может играть любой игрок в любой момент:
	// уровень получает тот, кто применил карту (локальный игрок), а не активный по ходу.
	const fromSeat = localSeat;
	if (toSeat === null || toSeat === undefined || fromSeat === null || fromSeat === undefined) {
		return;
	}
	if (toSeat === fromSeat) {
		return;
	}
	const zoneId = zoneEl.id;

	setTimeout(() => {
		const card = document.getElementById(cardId);
		const zone = document.getElementById(zoneId);
		if (!card || !zone || !zone.contains(card)) {
			return;
		}
		socket.emit("message", {
			method: "Treasure65LevelSwap",
			fromSeat,
			toSeat,
			cardId,
			card_name: treasure.card_name,
		});
	}, 1000);
}

function getMonsterBattleContext() {
	const zoneCards = document.querySelectorAll('.zone_monster .card');
	let levelSum = 0;
	let hasMonster = false;
	let removerSum = 0;
	let badStaffSum = null;
	/** @type {{cardId:string, remover:number, badStaff:object|null, img:string}[]} */
	const monsters = [];

	zoneCards.forEach(el => {
		const door = window.doors?.find(d => d.name === el.id);
		if (door && (door.race === 'monster' || (String(door.special || "") === "Mate" && String(el.dataset?.mateSourceMonsterId || "")))) {
			const srcId = String(el.dataset?.mateSourceMonsterId || "");
			const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
			const effectiveDoor = (door.race === "monster") ? door : (srcDoor || null);
			if (!effectiveDoor || String(effectiveDoor.race || "") !== "monster") {
				return;
			}
			hasMonster = true;
			levelSum += Number(effectiveDoor.level) || 0;
			removerSum += Number(effectiveDoor.remover) || 0;
			const monsterBadStaff = normalizeBadStaff(effectiveDoor.bad_staff);
			if (!badStaffSum && monsterBadStaff) {
				badStaffSum = monsterBadStaff;
			}
			monsters.push({
				// Важно: cardId — это именно DOM id карты в зоне (Mate должен быть отдельным монстром).
				cardId: el.id,
				remover: Number(effectiveDoor.remover) || 0,
				badStaff: monsterBadStaff,
				// Картинку Mate НЕ подменяем, чтобы на столе/в модалках он выглядел как отдельная карта.
				img: door.img || "",
			});
		}
	});

	return { hasMonster, levelSum, removerSum, badStaffSum, monsters };
}

/** Участник текущего боя с монстром: ведущий ход или принятый помощник (пока в зоне есть монстр). */
function isSeatParticipantInCurrentMonsterBattle(seat) {
	if (seat == null || seat < 0) {
		return false;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return false;
	}
	if (Number(seat) === Number(getMonsterFightSeat())) {
		return true;
	}
	// Помощник участвует в бою. На некоторых клиентах acceptedHelperSeat может обновляться с задержкой,
	// поэтому учитываем и "ожидающих" помощи (pendingHelpSeats) — это ближе к пользовательскому ожиданию:
	// как только игрок вовлечён в бой как помощник, проклятия/ограничения боя должны действовать.
	if (pendingHelpSeats?.has?.(Number(seat))) {
		return true;
	}
	if (acceptedHelperSeat != null && acceptedHelperSeat >= 0 && Number(seat) === Number(acceptedHelperSeat)) {
		return true;
	}
	return false;
}

/** Есть соперник не в бою с экипированной мелкой шмоткой — с него можно красть. */
function hasThiefTheftAvailableTarget() {
	if (localSeat == null) {
		return false;
	}
	for (let s = 0; s < (num || 0); s++) {
		if (s === localSeat) {
			continue;
		}
		if (isSeatParticipantInCurrentMonsterBattle(s)) {
			continue;
		}
		if (collectSmallStealableTreasuresFromSeat(s).length > 0) {
			return true;
		}
	}
	return false;
}

function getSeatEquipmentRemover(seat) {
	updateCharacterStatesFromBoard();
	return Number(characterBySeat[seat]?.remover) || 0;
}

function getSeatLabel(seat) {
	const s = parseInt(seat, 10);
	const metaName = Number.isNaN(s) ? "" : String(characterBySeat?.[s]?.name || "");
	if (metaName.trim()) {
		return metaName.trim();
	}
	return `Игрок ${Number(seat) + 1}`;
}

function hidePlayerProfileModal() {
	const existing = document.getElementById("player-profile-modal");
	if (existing) {
		existing.remove();
	}
}

function openPlayerProfileModal() {
	hidePlayerProfileModal();
	if (localSeat == null || localSeat < 0) {
		return;
	}
	const modal = document.createElement("div");
	modal.id = "player-profile-modal";
	modal.className = "wizard-taming-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-title";
	title.textContent = "Выбери имя и пол";
	const desc = document.createElement("div");
	desc.className = "wizard-taming-desc";
	desc.textContent = "Имя будет отображаться в сообщениях игры.";

	const storedName = localStorage.getItem("munchkin.playerName") || "";
	const storedGender = localStorage.getItem("munchkin.playerGender") || "";

	const nameInput = document.createElement("input");
	nameInput.type = "text";
	nameInput.placeholder = "Имя игрока";
	nameInput.value = storedName;
	nameInput.maxLength = 18;
	nameInput.style.alignSelf = "center";
	nameInput.style.width = "min(520px, 88%)";
	nameInput.style.padding = "10px 12px";
	nameInput.style.fontSize = "22px";
	nameInput.style.borderRadius = "10px";
	nameInput.style.border = "2px solid rgba(255,255,255,0.22)";
	nameInput.style.background = "rgba(40, 44, 58, 0.95)";
	nameInput.style.color = "#fff";

	const genderWrap = document.createElement("div");
	genderWrap.style.display = "flex";
	genderWrap.style.justifyContent = "center";
	genderWrap.style.gap = "16px";
	genderWrap.style.flexWrap = "wrap";
	genderWrap.style.marginTop = "6px";

	const makeGenderBtn = (value, label) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.textContent = label;
		btn.dataset.gender = value;
		btn.style.padding = "8px 14px";
		btn.style.fontSize = "20px";
		btn.style.borderRadius = "10px";
		btn.style.border = "2px solid rgba(255, 255, 255, 0.24)";
		btn.style.background = "rgba(40, 44, 58, 0.95)";
		btn.style.color = "#fff";
		btn.style.cursor = "pointer";
		if (storedGender === value) {
			btn.classList.add("is-selected");
			btn.style.borderColor = "#8fd2ff";
			btn.style.boxShadow = "0 0 0 3px rgba(143, 210, 255, 0.32)";
		}
		return btn;
	};

	const maleBtn = makeGenderBtn("Male", "Мужской");
	const femaleBtn = makeGenderBtn("Female", "Женский");
	let selectedGender = storedGender === "Male" || storedGender === "Female" ? storedGender : "";

	const selectGender = (g) => {
		selectedGender = g;
		[maleBtn, femaleBtn].forEach((b) => {
			const isSel = b.dataset.gender === g;
			b.style.borderColor = isSel ? "#8fd2ff" : "rgba(255, 255, 255, 0.24)";
			b.style.boxShadow = isSel ? "0 0 0 3px rgba(143, 210, 255, 0.32)" : "";
		});
		applyBtn.disabled = !canApply();
	};

	maleBtn.addEventListener("click", () => selectGender("Male"));
	femaleBtn.addEventListener("click", () => selectGender("Female"));
	genderWrap.appendChild(maleBtn);
	genderWrap.appendChild(femaleBtn);

	const canApply = () => {
		const n = String(nameInput.value || "").trim();
		return n.length > 0 && (selectedGender === "Male" || selectedGender === "Female");
	};

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-apply-btn";
	applyBtn.textContent = "Подтвердить";
	applyBtn.disabled = !canApply();

	nameInput.addEventListener("input", () => {
		applyBtn.disabled = !canApply();
	});

	applyBtn.addEventListener("click", () => {
		const name = String(nameInput.value || "").trim();
		if (!name || !(selectedGender === "Male" || selectedGender === "Female")) {
			return;
		}
		localStorage.setItem("munchkin.playerName", name);
		localStorage.setItem("munchkin.playerGender", selectedGender);
		characterBySeat[localSeat].name = name;
		characterBySeat[localSeat].gender = selectedGender;
		socket.emit("message", {
			method: "PlayerMeta",
			seat: localSeat,
			name,
			gender: selectedGender,
		});
		hidePlayerProfileModal();
	});

	panel.appendChild(title);
	panel.appendChild(desc);
	panel.appendChild(nameInput);
	panel.appendChild(genderWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
}

function ensureLocalPlayerProfileChosen() {
	// Временно отключено: используем дефолтные имя/пол для всех игроков.
	return;
}

function ensureDeathLootZoneElement() {
	let el = document.getElementById("death-loot-zone");
	if (el) {
		return el;
	}
	el = document.createElement("div");
	el.id = "death-loot-zone";
	// Это технический контейнер для "лутовых" карт в DOM.
	// Он должен быть невидим, а выбор осуществляется через модалку.
	el.style.display = "none";
	document.body.appendChild(el);
	return el;
}

function clearDeathLootUi() {
	const el = document.getElementById("death-loot-zone");
	if (el) {
		el.remove();
	}
	const modal = document.getElementById("death-loot-pick-modal");
	if (modal) {
		modal.remove();
	}
}

function isEquippedDoorRaceOrKindCard(cardEl, seat) {
	if (!cardEl?.id) {
		return false;
	}
	const { main } = getMainAndSideZoneElementsForSeat(seat);
	if (!main || !main.contains(cardEl)) {
		return false;
	}
	const door = window.doors?.find((d) => d.name === cardEl.id);
	if (!door) {
		return false;
	}
	// Сохраняем экипированную расу/класс игрока.
	return !!door.race || !!door.kind;
}

function collectDeathLootCardIds(deadSeat) {
	const ids = [];
	const pushUnique = (id) => {
		if (!id || ids.indexOf(id) !== -1) {
			return;
		}
		ids.push(id);
	};

	const { main, side } = getMainAndSideZoneElementsForSeat(deadSeat);
	const handEl = getHandElementForPlayerSeat(deadSeat);

	// Все карты из руки — в лут.
	handEl?.querySelectorAll?.(".card")?.forEach((cardEl) => {
		pushUnique(cardEl.id);
	});

	// Все шмотки/прочее из экипировки — в лут, кроме рас/классов (экипированных).
	[main, side].forEach((zoneEl) => {
		zoneEl?.querySelectorAll?.(".card")?.forEach((cardEl) => {
			if (isEquippedDoorRaceOrKindCard(cardEl, deadSeat)) {
				return;
			}
			pushUnique(cardEl.id);
		});
	});

	return ids;
}

function computeLootersOrder(deadSeat) {
	const seats = [];
	for (let s = 0; s < (num || 0); s++) {
		if (Number(s) === Number(deadSeat)) {
			continue;
		}
		seats.push(s);
	}
	// Группируем по уровню, сортируем по уровню убыв.
	const groups = new Map();
	seats.forEach((s) => {
		const lvl = Number(levelBySeat[s]) || 1;
		if (!groups.has(lvl)) {
			groups.set(lvl, []);
		}
		groups.get(lvl).push(s);
	});
	const levels = Array.from(groups.keys()).sort((a, b) => b - a);
	const out = [];
	levels.forEach((lvl) => {
		const arr = groups.get(lvl) || [];
		// Тай-брейк: случайный порядок в группе одинаковых уровней.
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		arr.forEach((s) => out.push(s));
	});
	return out;
}

function moveCardIdToDiscard(cardId) {
	if (!cardId) {
		return;
	}
	if (cardId.includes("door")) {
		moveBadStaffCardToDiscard(cardId);
		return;
	}
	if (cardId.includes("treasure")) {
		moveTreasureCardToDiscard(cardId);
	}
}

function appendCardToSeatHand(cardId, seat) {
	const card = document.getElementById(cardId);
	let hand = getHandElementForPlayerSeat(seat);
	if (!card) {
		return;
	}

	// Санити-чек: если перемещаем карту НЕ локальному игроку, то целевая рука не должна быть .myhand.
	// Иногда из-за swap/классов можно ошибочно получить .myhand для чужого места — тогда карта
	// "появляется" и у грабящего, и у погибшего (на разных клиентах).
	if (hand && Number(seat) !== Number(localSeat) && hand.classList.contains("myhand")) {
		// Для 2p достаточно взять .opponenthand, для 3p используем id по селектору зоны.
		if (num === 2) {
			hand = document.querySelector(".opponenthand") || hand;
		} else if (num === 3) {
			const bz = getSeatToBattleZoneMap();
			const mainSel = bz[String(seat)] ?? bz[seat];
			if (mainSel?.includes("zone_opponent2") && !mainSel.includes("zone_opponent3")) {
				hand = document.getElementById("opponent2hand") || hand;
			} else if (mainSel?.includes("zone_opponent3")) {
				hand = document.getElementById("opponent3hand") || hand;
			} else if (mainSel?.includes("zone_opponent")) {
				hand = document.getElementById("opponenthand") || hand;
			}
		}
	}

	// Fallback: иногда getHandElementForPlayerSeat может вернуть null из-за swap/классов.
	// Тогда пытаемся найти руку по известным id.
	if (!hand) {
		if (Number(seat) === Number(localSeat)) {
			hand = document.querySelector(".myhand");
		} else if (num === 2) {
			hand = document.querySelector(".opponenthand") || document.getElementById("opponenthand");
		} else if (num === 3) {
			// Пытаемся определить по текущей раскладке зон.
			const bz = getSeatToBattleZoneMap();
			const mainSel = bz[String(seat)] ?? bz[seat];
			if (mainSel?.includes("zone_opponent2") && !mainSel.includes("zone_opponent3")) {
				hand = document.getElementById("opponent2hand");
			} else if (mainSel?.includes("zone_opponent3")) {
				hand = document.getElementById("opponent3hand");
			} else if (mainSel?.includes("zone_opponent")) {
				hand = document.getElementById("opponenthand");
			}
		}
	}

	if (!hand) {
		return;
	}
	hand.appendChild(card);
	// Обновляем отображение как в других перемещениях карт.
	adjustCardWidth(".myhand");
	adjustCardWidth(".zone2");
	adjustCardWidth(".zone5");
	adjustCardHeight(".zone3");
	adjustCardHeight(".zone_monster");
	adjustCardWidth(".opponenthand");
	adjustCardWidth(".zone_opponent");
	adjustCardWidth(".zone_opponent_side");
	adjustCardWidth(".opponent2hand");
	adjustCardWidth(".zone_opponent2");
	adjustCardWidth(".zone_opponent2_side");
	adjustCardWidth(".opponent3hand");
	adjustCardWidth(".zone_opponent3");
	adjustCardWidth(".zone_opponent3_side");
	UpdatebackImgTreasure();
	UpdatebackImgDoor();
}

function openDeathLootPickModal(deadSeat, looterSeat, remainingCardIds) {
	const existing = document.getElementById("death-loot-pick-modal");
	if (existing) {
		existing.remove();
	}
	const modal = document.createElement("div");
	modal.id = "death-loot-pick-modal";
	modal.className = "thief-theft-steal-modal";

	const panel = document.createElement("div");
	panel.className = "thief-theft-steal-panel";

	const title = document.createElement("div");
	title.className = "thief-theft-steal-title";
	title.textContent = `Грабёж: выбери 1 карту у ${getSeatLabel(deadSeat)}`;

	const cardsContainer = document.createElement("div");
	cardsContainer.className = "thief-theft-steal-cards";

	const pickBtn = document.createElement("button");
	pickBtn.type = "button";
	pickBtn.className = "thief-theft-steal-go";
	pickBtn.textContent = "Взять карту";
	pickBtn.disabled = true;

	const selected = { cardId: null };
	cardsContainer.replaceChildren();
	if (!Array.isArray(remainingCardIds) || remainingCardIds.length === 0) {
		const empty = document.createElement("div");
		empty.className = "thief-theft-steal-empty";
		empty.textContent = "Нет карт для выбора.";
		cardsContainer.appendChild(empty);
	} else {
		const getFrontSrcForCardId = (cardId) => {
			const door = window.doors?.find((d) => d.name === cardId);
			if (door?.img) {
				return door.img;
			}
			const treasure = window.treasures?.find((t) => t.name === cardId);
			if (treasure?.img) {
				return treasure.img;
			}
			// Fallback: если данных нет, используем то, что в DOM.
			const cardEl = document.getElementById(cardId);
			const imgEl = cardEl?.querySelector?.(".card-item");
			return imgEl?.src || "";
		};
		remainingCardIds.forEach((cardId) => {
			const src = getFrontSrcForCardId(cardId);
			const b = document.createElement("button");
			b.type = "button";
			b.className = "thief-theft-steal-card";
			b.dataset.cardId = cardId;
			const img = document.createElement("img");
			img.className = "thief-theft-steal-card-img";
			img.src = src;
			img.alt = cardId;
			b.appendChild(img);
			b.addEventListener("click", () => {
				cardsContainer.querySelectorAll(".thief-theft-steal-card").forEach((x) => x.classList.remove("is-selected"));
				b.classList.add("is-selected");
				selected.cardId = cardId;
				pickBtn.disabled = !selected.cardId;
			});
			cardsContainer.appendChild(b);
		});
	}

	pickBtn.addEventListener("click", () => {
		if (!selected.cardId) {
			return;
		}
		pickBtn.disabled = true;
		const myHand = document.querySelector(".myhand");
		socket.emit("message", {
			method: "DeathLootPick",
			deadSeat,
			looterSeat,
			cardId: selected.cardId,
			handZoneId: myHand?.id || null,
		});
	});
	panel.appendChild(title);
	panel.appendChild(cardsContainer);
	panel.appendChild(pickBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	// Нельзя закрывать кликом в фон — иначе игрок "повиснет" и очередь остановится.
}

function resetEscapeStateNow() {
	escapeActive = false;
	escapeQueue = [];
	escapeQueueIndex = -1;
	escapeMonsterRemover = 0;
	escapeMonsterBadStaff = null;
	escapeMonsterQueue = [];
	escapeMonsterInitialCount = 0;
	escapeMonsterTemplateQueue = [];
	escapeCurrentMonsterCardId = null;
	escapeCurrentSeat = null;
	escapeWaitingForRoll = false;
	escapeOwnerSeat = null;
	escapeRollInProgress = false;
	escapeAttemptNumber = 0;
	escapeHalflingRetryUsedForCurrentAttempt = false;
	escapeHalflingRetryPending = null;
	escapeWizardFlightPending = null;
	clearEscapeMonsterPickSession();
	hideWizardFlightModal();
	hideEscapeMonsterPicker();
	hideEscapeHalflingRetryModal();
}

function removeSeatFromEscapeQueue(seat) {
	if (seat == null) {
		return;
	}
	const s = Number(seat);
	if (!Array.isArray(escapeQueue) || escapeQueue.length === 0) {
		escapeQueue = [];
		escapeQueueIndex = -1;
		return;
	}
	const removedIndex = escapeQueue.findIndex((x) => Number(x) === s);
	if (removedIndex < 0) {
		return;
	}
	escapeQueue.splice(removedIndex, 1);
	try {
		escapeInstantWallAutoSeats?.delete?.(s);
	} catch {}
	// Корректируем индекс очереди:
	// - если убрали элемент ДО текущего индекса — индекс сдвигается влево;
	// - если убрали ТЕКУЩИЙ элемент — оставляем индекс как есть, чтобы указывать на "следующего" после удаления.
	if (escapeQueueIndex > removedIndex) {
		escapeQueueIndex = Math.max(0, escapeQueueIndex - 1);
	}
	if (escapeQueue.length <= 0) {
		escapeQueueIndex = -1;
	}
}

function showEscapeTurnText(seat) {
	// Одна верхняя плашка: текст смывки заменяет статусные баннеры клея/стенки.
	removeEscapeGlueWaitingBanner();
	escapeGlueWaitingKey = null;
	removeInstantWallWaitingBanners();
	removeInstantWallSoloAidWaitingBanner();
	const firstSeat = escapeQueue.length > 0 ? escapeQueue[0] : null;
	if (firstSeat !== null && Number(seat) !== Number(firstSeat)) {
		showBattleResult(`Помощник ${getSeatLabel(seat)}, кинь кубик, чтобы попробовать смыться от монстра.`);
		return;
	}
	showBattleResult(`Победил монстр, ${getSeatLabel(seat)} кинь кубик, чтобы смыться от монстра.`);
}

function hideEscapeHalflingRetryModal() {
	const existing = document.getElementById("escape-halfling-retry-modal");
	if (existing) {
		existing.remove();
	}
}

function getLocalPlayerAllCardsForHalflingDiscard() {
	const cards = [];
	const cardIds = new Set();
	const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
	const protectedEquippedHalflingIds = new Set();
	if (main) {
		main.querySelectorAll('.card').forEach((cardEl) => {
			const doorCard = window.doors?.find(d => d.name === cardEl.id);
			if (doorCard?.race === "Halfling") {
				protectedEquippedHalflingIds.add(cardEl.id);
			}
		});
	}

	const pushFromZone = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll('.card').forEach((cardEl) => {
			if (!cardEl?.id || cardIds.has(cardEl.id)) {
				return;
			}
			// Нельзя сбрасывать экипированную карту расы Halfling для повторной смывки.
			if (zoneEl === main && protectedEquippedHalflingIds.has(cardEl.id)) {
				return;
			}
			const imgEl = cardEl.querySelector('.card-item');
			if (!imgEl?.src) {
				return;
			}
			cardIds.add(cardEl.id);
			cards.push({
				cardId: cardEl.id,
				img: imgEl.src,
			});
		});
	};

	const handEl = document.querySelector('.myhand');
	pushFromZone(handEl);
	pushFromZone(side);
	pushFromZone(main);
	return cards;
}

function hideWizardFlightModal() {
	const existing = document.getElementById("wizard-flight-modal");
	if (existing) {
		existing.remove();
	}
}

function getLocalPlayerAllCardsForWizardFlightDiscard() {
	const cards = [];
	const cardIds = new Set();
	const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
	const protectedEquippedWizardIds = new Set();
	if (main) {
		main.querySelectorAll('.card').forEach((cardEl) => {
			const doorCard = window.doors?.find((d) => d.name === cardEl.id);
			if (doorCard?.kind === "Wizard") {
				protectedEquippedWizardIds.add(cardEl.id);
			}
		});
	}
	const pushFromZone = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll('.card').forEach((cardEl) => {
			if (!cardEl?.id || cardIds.has(cardEl.id)) {
				return;
			}
			// Нельзя сбрасывать экипированную карту класса Wizard.
			if (zoneEl === main && protectedEquippedWizardIds.has(cardEl.id)) {
				return;
			}
			const imgEl = cardEl.querySelector('.card-item');
			if (!imgEl?.src) {
				return;
			}
			cardIds.add(cardEl.id);
			cards.push({
				cardId: cardEl.id,
				img: imgEl.src,
			});
		});
	};
	const handEl = document.querySelector('.myhand');
	pushFromZone(handEl);
	pushFromZone(side);
	pushFromZone(main);
	return cards;
}

function moveCardToDiscardById(cardId) {
	if (!cardId) {
		return;
	}
	if (cardId.includes('door')) {
		// Если сбрасываем монстра — сбрасываем и все привязанные к нему бонусы.
		const door = window.doors?.find((d) => d.name === cardId);
		const cardEl = document.getElementById(cardId);
		const isMonsterLike = Boolean(
			door?.race === "monster"
			|| (door && String(door.special || "") === "Mate" && String(cardEl?.dataset?.mateSourceMonsterId || ""))
		);
		if (isMonsterLike) {
			const monsterZoneEl = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
			// Если это один из Mate-пары — переносим бонусы на оставшегося, а не сбрасываем их.
			const pairId = String(cardEl?.dataset?.matePairId || "");
			let remainingId = "";
			if (pairId && monsterZoneEl) {
				monsterZoneEl.querySelectorAll(".card").forEach((zEl) => {
					if (zEl?.id && zEl.id !== cardId && String(zEl.dataset?.matePairId || "") === pairId) {
						remainingId = zEl.id;
					}
				});
			}
			(monsterZoneEl ? monsterZoneEl.querySelectorAll(".card") : []).forEach((el) => {
				const bonusId = el?.id;
				if (!bonusId) {
					return;
				}
				const bonusDoor = window.doors?.find((d) => d.name === bonusId);
				if (!bonusDoor || String(bonusDoor.special || "") !== "bonus_power_monster") {
					return;
				}
				if (String(el.dataset?.attachedMonsterId || "") === String(cardId)) {
					if (remainingId) {
						// Бонус остаётся и продолжает действовать на оставшегося монстра.
						el.dataset.attachedMonsterId = remainingId;
					} else {
						el.dataset.attachedMonsterId = "";
						moveBadStaffCardToDiscard(bonusId);
					}
				}
			});
			pushMonsterBonusAttachmentsToServer();
		}
		moveBadStaffCardToDiscard(cardId);
		return;
	}
	if (cardId.includes('treasure')) {
		moveTreasureCardToDiscard(cardId);
	}
}

function applyWizardFlightDiscardAndResolve(seat, cardIds) {
	const parsedSeat = parseInt(seat, 10);
	if (Number.isNaN(parsedSeat) || parsedSeat < 0) {
		return;
	}
	const ids = Array.isArray(cardIds) ? cardIds.filter(Boolean).slice(0, WIZARD_FLIGHT_MAX_DISCARD) : [];
	ids.forEach((id) => {
		if (!document.getElementById(id)) {
			return;
		}
		moveCardToDiscardById(id);
	});
	recalculateAllPowerDisplays();
	// Финальный пересчёт и продвижение очереди делает только владелец смывки.
	if (Number(localSeat) !== Number(escapeOwnerSeat)) {
		return;
	}
	if (!escapeFailAidPending || Number(escapeFailAidPending.seat) !== Number(parsedSeat) || !escapeFailAidPending.payload) {
		return;
	}
	const pending = { ...escapeFailAidPending.payload };
	escapeFailAidPending = null;
	const bonus = Math.min(WIZARD_FLIGHT_MAX_DISCARD, ids.length);
	const totalRoll = (Number(pending.totalRoll) || 0) + bonus;
	const escaped = totalRoll >= ESCAPE_TARGET_ROLL;
	const payload = {
		...pending,
		totalRoll,
		escaped,
		badStaffPenalty: escaped ? null : normalizeBadStaff(pending.badStaffPenalty),
	};
	updateWizardFlightUi();
	emitEscapeRollResultAndAdvance(payload);
}

function applyWizardTaming(seat, handCardIds, monsterCardId) {
	const s = parseInt(seat, 10);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	const handIds = Array.isArray(handCardIds) ? handCardIds.filter(Boolean) : [];
	if (handIds.length < 3) {
		return;
	}
	handIds.forEach((id) => {
		if (document.getElementById(id)) {
			moveCardToDiscardById(id);
		}
	});

	const { monsters } = getMonsterBattleContext();
	if (monsters.length <= 1) {
		MoveMonstersToDrop();
		battleActive = false;
		battleTurnSeat = null;
		pendingHelpSeats.clear();
		acceptedHelperSeat = null;
		monsterFightSeat = null;
		turnAwaitingManualEnd = true;
		clearInterval(countdownInterval);
		const timerElement = document.getElementById('timer');
		if (timerElement) {
			timerElement.textContent = "";
		}
		showBattleResult("Монстр усмирен.");
		setTimeout(hideBattleResult, 1800);
	} else if (monsterCardId) {
		moveCardToDiscardById(monsterCardId);
		// Пересчитываем базовую силу строго по оставшимся картам в зоне монстров (в т.ч. отрицательные модификаторы).
		setMonsterBasePower(computeMonsterZoneBasePower());
		showBattleResult("Монстр усмирен.");
		setTimeout(hideBattleResult, 3000);
	}
	hideWizardTamingModal();
	hideWizardTamingPickModal();
	recalculateAllPowerDisplays();
	updateHelpUi();
	applyTurnHighlight();
	updateTurnActionButtons(false);
}

/** Сколько мест за столом участвуют в опросе (тюбик клея и т.п.). Нельзя брать Math.min(num, characterBySeat.length): длина массива часто 0 до инициализации UI. */
function getRoomSeatCountForGluePrompts() {
	const n = Number(num);
	if (Number.isFinite(n) && n > 0) {
		return n;
	}
	const len = Array.isArray(characterBySeat) ? characterBySeat.length : 0;
	if (len > 0) {
		return len;
	}
	const qLen = Array.isArray(escapeQueue) ? escapeQueue.length : 0;
	return qLen > 0 ? qLen : 1;
}

/**
 * Только у владельца очереди смывки: рассылает EscapeGluePrompt и держит escapeGluePromptState.
 * @returns {boolean} true если опрос клея запущен.
 */
function startEscapeGluePromptFromOwner({ escapedSeat, monsterCardId, viaInstantWall, finishAfter, wallFleeSeats }) {
	if (Number(localSeat) !== Number(escapeOwnerSeat) || !escapeActive) {
		return false;
	}
	const es = Number(escapedSeat);
	if (!Number.isFinite(es)) {
		return false;
	}
	const viaWall = Boolean(viaInstantWall);
	let mon = String(monsterCardId || "").trim();
	if (!mon) {
		mon = String(escapeCurrentMonsterCardId || (escapeMonsterTemplateQueue?.[0]?.cardId) || "").trim();
	}
	if (!mon && viaWall) {
		mon = "__instant_wall__";
	}
	if (!mon) {
		return false;
	}
	const wallFleeArr = (Array.isArray(wallFleeSeats) ? wallFleeSeats : [])
		.map((x) => Number(x))
		.filter((x) => Number.isFinite(x));
	const wallFleeUnique = Array.from(new Set(wallFleeArr.length ? wallFleeArr : [es]));
	const wallFleeSet = new Set(wallFleeUnique);
	const key = `${Date.now()}-${wallFleeUnique.join("-")}-${mon}`;
	const pending = new Set();
	const maxSeat = getRoomSeatCountForGluePrompts();
	for (let s = 0; s < maxSeat; s += 1) {
		if (!wallFleeSet.has(Number(s))) {
			pending.add(Number(s));
		}
	}
	escapeGluePromptState = {
		key,
		escapedSeat: es,
		wallFleeSeats: wallFleeUnique,
		monsterCardId: mon,
		pending,
		resolved: false,
		viaInstantWall: viaWall,
		finishAfter: Boolean(finishAfter),
	};
	socket.emit("message", {
		method: "EscapeGluePrompt",
		key,
		escapedSeat: es,
		monsterCardId: mon,
		viaInstantWall: viaWall,
		wallFleeSeats: wallFleeUnique,
	});
	return true;
}

function emitEscapeRollResultAndAdvance(payload) {
	// Важно: продвигать очередь смывки и публиковать результат должен только владелец очереди.
	if (Number(localSeat) !== Number(escapeOwnerSeat)) {
		return;
	}
	socket.emit("message", payload);
	// Смерть: если смывка не удалась и bad stuff = death, то смывка обрывается,
	// после смерти начинается грабёж; смывка помощника (если есть) начнётся после грабежа.
	const bad = normalizeBadStaff(payload?.badStaffPenalty);
	if (!payload?.escaped && bad && String(bad.type || "") === "death") {
		// Важно: смывку по текущей реализации считает только владелец очереди (escapeOwnerSeat),
		// и он же должен запускать смерть/грабёж, даже если умер помощник.
		// Иногда payload.seat может быть не тем (например, при рассинхроне/ручном вызове) —
		// а текущий смывающийся seat у владельца очереди уже известен точно.
		const deadSeat = (escapeCurrentSeat != null && !Number.isNaN(Number(escapeCurrentSeat)))
			? Number(escapeCurrentSeat)
			: parseInt(payload.seat, 10);
		const ownerSeat = escapeOwnerSeat;
		if (!Number.isNaN(deadSeat) && deadSeat >= 0 && ownerSeat != null && Number(localSeat) === Number(ownerSeat)) {
			// Удаляем умершего из очереди смывки.
			removeSeatFromEscapeQueue(deadSeat);

			// Если умер владелец очереди, передаём владение следующему (обычно помощнику).
			let nextOwner = ownerSeat;
			if (Number(deadSeat) === Number(ownerSeat) && Array.isArray(escapeQueue) && escapeQueue.length > 0) {
				nextOwner = escapeQueue[0];
				escapeOwnerSeat = nextOwner;
				socket.emit("message", {
					method: "EscapeOwnerTransfer",
					ownerSeat: nextOwner,
				});
				escapeQueueIndex = 0;
			}
			const lootCardIds = collectDeathLootCardIds(deadSeat);
			const lootersOrder = computeLootersOrder(deadSeat);
			// Если остались участники (помощник), смывку продолжим после грабежа.
			resumeEscapeAfterLoot =
				Array.isArray(escapeQueue)
				&& escapeQueue.length > 0;
			deathLootAwaitingEscapeFinish = resumeEscapeAfterLoot;

			// Сначала грабёж.
			socket.emit("message", {
				method: "DeathStart",
				deadSeat,
				ownerSeat: nextOwner,
				lootCardIds,
				lootersOrder,
				text: "Смерть!",
			});

			// Если больше некому смываться, сразу завершаем очередь смывки.
			if (!resumeEscapeAfterLoot) {
				finishEscapeSequenceAndBroadcast();
			}
		}
		// Не продвигаем очередь смывки для умершего.
		return;
	}

	// Flask of glue: после успешной смывки ждём ответов игроков (без таймера), прежде чем продолжать смывку.
	if (payload?.escaped) {
		const escapedSeat = Number(payload.seat);
		const viaInstantWall = Boolean(payload.viaInstantWall);
		const monInput = String(payload.monsterCardId || "").trim();
		if (!startEscapeGluePromptFromOwner({
			escapedSeat,
			monsterCardId: monInput,
			viaInstantWall,
			finishAfter: false,
			wallFleeSeats: [escapedSeat],
		})) {
			setTimeout(() => {
				runNextEscapeAttemptAndBroadcast();
			}, 1200);
		}
		return;
	}

	setTimeout(() => {
		runNextEscapeAttemptAndBroadcast();
	}, 1200);
}

function hideWarriorFrenzyModal() {
	const existing = document.getElementById("warrior-frenzy-modal");
	if (existing) {
		existing.remove();
	}
}

function hideClericExorcismModal() {
	const existing = document.getElementById("cleric-exorcism-modal");
	if (existing) {
		existing.remove();
	}
}

function getLocalPlayerAllCardsForWarriorFrenzyDiscard() {
	const cards = [];
	const cardIds = new Set();
	const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
	const protectedEquippedWarriorIds = new Set();
	if (main) {
		main.querySelectorAll('.card').forEach((cardEl) => {
			const doorCard = window.doors?.find(d => d.name === cardEl.id);
			if (doorCard?.kind === "Warrior") {
				protectedEquippedWarriorIds.add(cardEl.id);
			}
		});
	}
	const pushFromZone = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll('.card').forEach((cardEl) => {
			if (!cardEl?.id || cardIds.has(cardEl.id)) {
				return;
			}
			// Нельзя сбрасывать экипированную карту класса Warrior.
			if (zoneEl === main && protectedEquippedWarriorIds.has(cardEl.id)) {
				return;
			}
			const imgEl = cardEl.querySelector('.card-item');
			if (!imgEl?.src) {
				return;
			}
			cardIds.add(cardEl.id);
			cards.push({
				cardId: cardEl.id,
				img: imgEl.src,
			});
		});
	};
	const handEl = document.querySelector('.myhand');
	pushFromZone(handEl);
	pushFromZone(side);
	pushFromZone(main);
	return cards;
}

function isSeatWarriorClassActive(seat) {
	if (seat == null || seat < 0) {
		return false;
	}
	updateCharacterStatesFromBoard();
	return seatHasKind(seat, "Warrior");
}

function isSeatClericClassActive(seat) {
	if (seat == null || seat < 0) {
		return false;
	}
	updateCharacterStatesFromBoard();
	return seatHasKind(seat, "Cleric");
}

function isSeatThiefClassActive(seat) {
	if (seat == null || seat < 0) {
		return false;
	}
	updateCharacterStatesFromBoard();
	return seatHasKind(seat, "Thief");
}

function isSeatWizardClassActive(seat) {
	if (seat == null || seat < 0) {
		return false;
	}
	updateCharacterStatesFromBoard();
	return seatHasKind(seat, "Wizard");
}

/**
 * «Другие» в бою (ведущий и принятый помощник). Подрезать можно только, если сам вор
 * не в этом бою (не ведущий и не помощник). По каждой жертве — не больше раза за бой.
 */
function getValidThiefTrimVictims() {
	if (localSeat == null || localSeat < 0 || !battleActive) {
		return [];
	}
	const iAmFighter = Number(localSeat) === Number(getMonsterFightSeat())
		|| (acceptedHelperSeat != null && Number(localSeat) === Number(acceptedHelperSeat));
	if (iAmFighter) {
		return [];
	}
	const inFight = [];
	const fightSeat = getMonsterFightSeat();
	if (fightSeat != null && fightSeat >= 0) {
		inFight.push(fightSeat);
	}
	if (acceptedHelperSeat != null && acceptedHelperSeat >= 0 && inFight.indexOf(acceptedHelperSeat) === -1) {
		inFight.push(acceptedHelperSeat);
	}
	return inFight.filter((s) => !victimThiefTrimUsedBySeat[s]);
}

function hasUndeadMonsterInCurrentBattle() {
	const zoneCards = document.querySelectorAll('.zone_monster .card');
	return Array.from(zoneCards).some((el) => {
		const door = window.doors?.find(d => d.name === el.id);
		return door?.race === "monster" && door?.special === "Undead";
	});
}

function canLocalUseWarriorFrenzyNow() {
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!battleActive || escapeActive) {
		return false;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return false;
	}
	const isParticipant = Number(localSeat) === Number(getMonsterFightSeat())
		|| (acceptedHelperSeat !== null && Number(localSeat) === Number(acceptedHelperSeat));
	if (!isParticipant) {
		return false;
	}
	if (!isSeatWarriorClassActive(localSeat)) {
		return false;
	}
	return (3 - (warriorFrenzyUsedBySeat[localSeat] || 0)) > 0;
}

function canLocalUseClericExorcismNow() {
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!battleActive || escapeActive) {
		return false;
	}
	const isParticipant = Number(localSeat) === Number(getMonsterFightSeat())
		|| (acceptedHelperSeat !== null && Number(localSeat) === Number(acceptedHelperSeat));
	if (!isParticipant) {
		return false;
	}
	if (!hasUndeadMonsterInCurrentBattle()) {
		return false;
	}
	if (!isSeatClericClassActive(localSeat)) {
		return false;
	}
	return (3 - (clericExorcismUsedBySeat[localSeat] || 0)) > 0;
}

function canLocalUseThiefTrimNow() {
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!battleActive || escapeActive) {
		return false;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return false;
	}
	if (!isSeatThiefClassActive(localSeat)) {
		return false;
	}
	const targets = getValidThiefTrimVictims();
	if (!targets.length) {
		return false;
	}
	return true;
}

function positionWarriorFrenzyButton(btn) {
	if (!btn) {
		return;
	}
	// Позиция кнопки задается только через CSS (#warrior-frenzy-btn).
	btn.style.position = '';
	btn.style.left = '';
	btn.style.top = '';
	btn.style.transform = '';
	btn.style.zIndex = '';
}

function updateWarriorFrenzyUi() {
	const btn = document.getElementById('warrior-frenzy-btn');
	if (!btn) {
		return;
	}
	if (localSeat == null || localSeat < 0 || !isSeatWarriorClassActive(localSeat)) {
		btn.style.display = 'none';
		btn.style.opacity = "";
		btn.style.cursor = "";
		hideWarriorFrenzyModal();
		return;
	}
	btn.style.display = 'flex';
	positionWarriorFrenzyButton(btn);
	const canUse = canLocalUseWarriorFrenzyNow();
	if (canUse) {
		btn.style.opacity = '1';
		btn.style.cursor = '';
	} else {
		btn.style.opacity = '0.5';
		btn.style.cursor = 'not-allowed';
		hideWarriorFrenzyModal();
	}
}

function updateClericExorcismUi() {
	const btn = document.getElementById('cleric-exorcism-btn');
	if (!btn) {
		return;
	}
	if (localSeat == null || localSeat < 0 || !isSeatClericClassActive(localSeat)) {
		btn.style.display = 'none';
		btn.style.opacity = "";
		btn.style.cursor = "";
		hideClericExorcismModal();
		return;
	}
	btn.style.display = 'flex';
	positionWarriorFrenzyButton(btn);
	const canUse = canLocalUseClericExorcismNow();
	if (canUse) {
		btn.style.opacity = '1';
		btn.style.cursor = '';
	} else {
		btn.style.opacity = '0.5';
		btn.style.cursor = 'not-allowed';
		hideClericExorcismModal();
	}
}

function updateThiefTrimUi() {
	const btn = document.getElementById('thief-trim-btn');
	if (!btn) {
		return;
	}
	// У вора две способности с кнопками (кража и подрезка). Для UX кнопку подрезки
	// показываем всегда, когда вор экипирован, но делаем disabled-визуал, если нельзя применять сейчас.
	if (localSeat == null || localSeat < 0 || !isSeatThiefClassActive(localSeat)) {
		btn.style.display = 'none';
		btn.style.opacity = "";
		btn.style.cursor = "";
		hideThiefTrimModal();
		return;
	}
	btn.style.display = 'flex';
	positionWarriorFrenzyButton(btn);
	const canUse = canLocalUseThiefTrimNow();
	if (canUse) {
		btn.style.opacity = "1";
		btn.style.cursor = "";
	} else {
		btn.style.opacity = "0.5";
		btn.style.cursor = "not-allowed";
		hideThiefTrimModal();
	}
}

function canLocalUseWizardFlightNow() {
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!isSeatWizardClassActive(localSeat)) {
		return false;
	}
	if (!escapeActive || !escapeWizardFlightPending) {
		return false;
	}
	if (Number(escapeWizardFlightPending.seat) !== Number(localSeat)) {
		return false;
	}
	const cards = getLocalPlayerAllCardsForWizardFlightDiscard();
	return cards.length > 0;
}

function updateWizardFlightUi() {
	// Для "Заклинания Полёта" кнопка не используется: модалка открывается сразу после неудачной смывки.
	if (!canLocalUseWizardFlightNow()) {
		hideWizardFlightModal();
	}
}

function hideThiefTrimModal() {
	const existing = document.getElementById("thief-trim-modal");
	if (existing) {
		existing.remove();
	}
}

function hideThiefTheftStealModal() {
	const existing = document.getElementById("thief-theft-steal-modal");
	if (existing) {
		existing.remove();
	}
}

function hideThiefTheftModal() {
	const existing = document.getElementById("thief-theft-modal");
	if (existing) {
		existing.remove();
	}
}

function clearThiefTheftBoardDicePrompt() {
	thiefTheftBoardDicePending = false;
	thiefTheftBoardDiceInProgress = false;
}

function thiefTheftStartAwaitBoardDice() {
	hideThiefTheftModal();
	thiefTheftBoardDicePending = true;
	showBattleResult(`${getSeatLabel(localSeat)} Брось кубик`);
}

function canLocalUseThiefTheftNow() {
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!isSeatThiefClassActive(localSeat)) {
		return false;
	}
	// Пока идут броски смывки, монстр ещё на поле; кража снова доступна после EscapeSequenceFinished.
	if (escapeActive) {
		return false;
	}
	if (isSeatParticipantInCurrentMonsterBattle(localSeat)) {
		return false;
	}
	if (!hasThiefTheftAvailableTarget()) {
		return false;
	}
	if (thiefTheftBoardDicePending || thiefTheftBoardDiceInProgress) {
		return false;
	}
	if (!num || num < 2) {
		return false;
	}
	return true;
}

function updateThiefTheftUi() {
	const btn = document.getElementById("thief-theft-btn");
	if (!btn) {
		return;
	}
	// Кнопка у вора: не в бою с монстром, есть цель вне боя с мелкой шмоткой (см. canLocalUseThiefTheftNow).
	if (localSeat == null || localSeat < 0 || !isSeatThiefClassActive(localSeat)) {
		btn.style.display = "none";
		btn.style.opacity = "";
		btn.style.cursor = "";
		hideThiefTheftModal();
		hideThiefTheftStealModal();
		clearThiefTheftBoardDicePrompt();
		return;
	}
	btn.style.display = "flex";
	positionWarriorFrenzyButton(btn);
	const canUse = canLocalUseThiefTheftNow();
	if (canUse) {
		btn.style.opacity = "1";
		btn.style.cursor = "";
	} else {
		btn.style.opacity = "0.5";
		btn.style.cursor = "not-allowed";
		hideThiefTheftModal();
		hideThiefTheftStealModal();
		if (thiefTheftBoardDicePending && (escapeActive || isSeatParticipantInCurrentMonsterBattle(localSeat) || !isSeatThiefClassActive(localSeat))) {
			clearThiefTheftBoardDicePrompt();
		}
	}
}

function getLocalPlayerAllCardsForThiefTheftDiscard() {
	return getLocalPlayerAllCardsForThiefTrimDiscard();
}

function applyThiefTheftStartDiscard(seat, cardId) {
	const parsed = parseInt(seat, 10);
	if (Number.isNaN(parsed) || parsed < 0) {
		return;
	}
	if (!cardId) {
		return;
	}
	if (!document.getElementById(cardId)) {
		return;
	}
	moveCardToDiscardById(cardId);
	recalculateAllPowerDisplays();
	if (Number(localSeat) === Number(parsed)) {
		thiefTheftStartAwaitBoardDice();
	} else {
		showBattleResult(`${getSeatLabel(parsed)} пытается совершить кражу`);
	}
}

function hasAnyStealableSmallFromOthers() {
	return hasThiefTheftAvailableTarget();
}

function applyThiefTheftRollResult(seat, value) {
	const s = parseInt(seat, 10);
	if (Number.isNaN(s) || s < 0) {
		return;
	}
	const v = parseInt(value, 10);
	if (Number.isNaN(v) || v < 1 || v > 6) {
		return;
	}
	const diceBox = document.querySelector(".dice-container");
	if (diceBox) {
		diceBox.innerHTML = "";
		diceBox.appendChild(createDice(v));
	}
	clearThiefTheftBoardDicePrompt();
	if (v < THIEF_THEFT_SUCCESS_ROLL) {
		const cur = levelBySeat[s] ?? 1;
		setLevelBySeat(s, Math.max(1, cur - 1));
	}
	recalculateAllPowerDisplays();
	if (v < THIEF_THEFT_SUCCESS_ROLL) {
		showBattleResult("Кража не удалась!");
		setTimeout(hideBattleResult, 3000);
	} else {
		showBattleResult("Кража удалась!");
		setTimeout(hideBattleResult, 3000);
	}
	if (v >= THIEF_THEFT_SUCCESS_ROLL && Number(localSeat) === s) {
		setTimeout(() => {
			if (hasAnyStealableSmallFromOthers()) {
				openThiefTheftStealModal();
			}
		}, 500);
	}
	updateThiefTheftUi();
}

function applyThiefTheftStolenCardMove(thiefSeat, fromSeat, cardId) {
	const t = parseInt(thiefSeat, 10);
	const f = parseInt(fromSeat, 10);
	if (Number.isNaN(t) || Number.isNaN(f) || !cardId) {
		return;
	}
	const tr = window.treasures?.find((x) => x.name === cardId);
	if (!tr || !isTreasureSmallShmot(tr)) {
		return;
	}
	const card = document.getElementById(cardId);
	if (!card) {
		return;
	}
	const { main, side } = getMainAndSideZoneElementsForSeat(f);
	const fromOk = (main && main.contains(card)) || (side && side.contains(card));
	if (!fromOk) {
		return;
	}
	const hand = getHandElementForPlayerSeat(t);
	if (!hand) {
		return;
	}
	hand.appendChild(card);
	adjustCardWidth(".myhand");
	adjustCardWidth(".zone2");
	adjustCardWidth(".zone5");
	adjustCardHeight(".zone3");
	adjustCardWidth(".opponenthand");
	adjustCardWidth(".zone_opponent");
	adjustCardWidth(".zone_opponent_side");
	adjustCardWidth(".opponent2hand");
	adjustCardWidth(".zone_opponent2");
	adjustCardWidth(".zone_opponent2_side");
	adjustCardWidth(".opponent3hand");
	adjustCardWidth(".zone_opponent3");
	adjustCardWidth(".zone_opponent3_side");
	UpdatebackImgTreasure();
	UpdatebackImgDoor();
	recalculateAllPowerDisplays();
}

function openThiefTheftStealModal() {
	if (localSeat == null) {
		return;
	}
	if (!isSeatThiefClassActive(localSeat)) {
		return;
	}
	if (!hasAnyStealableSmallFromOthers()) {
		return;
	}
	const existing = document.getElementById("thief-theft-steal-modal");
	if (existing) {
		existing.remove();
	}
	const modal = document.createElement("div");
	modal.id = "thief-theft-steal-modal";
	modal.className = "thief-theft-steal-modal";
	const panel = document.createElement("div");
	panel.className = "thief-theft-steal-panel";
	const title = document.createElement("div");
	title.className = "thief-theft-steal-title";
	title.textContent = "Кого грабим?";
	let chosenVictim = null;
	const victimRow = document.createElement("div");
	victimRow.className = "thief-theft-steal-victims";
	const cardsContainer = document.createElement("div");
	cardsContainer.className = "thief-theft-steal-cards";
	const goBtn = document.createElement("button");
	goBtn.type = "button";
	goBtn.className = "thief-theft-steal-go";
	goBtn.textContent = "Взять шмотку";
	goBtn.disabled = true;
	const selected = { victim: null, cardId: null };

	const renderCardsFor = (vSeat) => {
		cardsContainer.replaceChildren();
		const items = collectSmallStealableTreasuresFromSeat(vSeat);
		if (!items.length) {
			const e = document.createElement("div");
			e.className = "thief-theft-steal-empty";
			e.textContent = "Нет мелких шмот";
			cardsContainer.appendChild(e);
			return;
		}
		items.forEach((c) => {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "thief-theft-steal-card";
			b.dataset.cardId = c.cardId;
			const img = document.createElement("img");
			img.className = "thief-theft-steal-card-img";
			img.src = c.img;
			img.alt = c.cardId;
			b.appendChild(img);
			b.addEventListener("click", () => {
				cardsContainer.querySelectorAll(".thief-theft-steal-card").forEach((x) => x.classList.remove("is-selected"));
				b.classList.add("is-selected");
				selected.victim = vSeat;
				selected.cardId = c.cardId;
				goBtn.disabled = !selected.cardId;
			});
			cardsContainer.appendChild(b);
		});
	};

	for (let s = 0; s < (num || 0); s++) {
		if (s === localSeat) {
			continue;
		}
		if (isSeatParticipantInCurrentMonsterBattle(s)) {
			continue;
		}
		if (collectSmallStealableTreasuresFromSeat(s).length === 0) {
			continue;
		}
		const vb = document.createElement("button");
		vb.type = "button";
		vb.className = "thief-theft-steal-victim-btn";
		vb.textContent = getSeatLabel(s);
		vb.addEventListener("click", () => {
			victimRow.querySelectorAll(".thief-theft-steal-victim-btn").forEach((x) => x.classList.remove("is-selected"));
			vb.classList.add("is-selected");
			chosenVictim = s;
			renderCardsFor(s);
		});
		victimRow.appendChild(vb);
	}
	if (victimRow.children.length === 1) {
		victimRow.querySelector("button")?.click();
	}
	goBtn.addEventListener("click", () => {
		if (selected.victim == null || !selected.cardId) {
			return;
		}
		socket.emit("message", {
			method: "ThiefTheftTake",
			thiefSeat: localSeat,
			fromSeat: selected.victim,
			cardId: selected.cardId,
		});
		modal.remove();
	});
	panel.appendChild(title);
	panel.appendChild(victimRow);
	panel.appendChild(cardsContainer);
	panel.appendChild(goBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
}

function openThiefTheftModal() {
	if (thiefTheftBoardDicePending) {
		showBattleResult("Сначала кликни по кубику на поле.");
		setTimeout(hideBattleResult, 3000);
		return;
	}
	if (!canLocalUseThiefTheftNow()) {
		return;
	}
	hideThiefTheftModal();
	hideThiefTheftStealModal();
	const cards = getLocalPlayerAllCardsForThiefTheftDiscard();
	const modal = document.createElement("div");
	modal.id = "thief-theft-modal";
	modal.className = "thief-theft-modal";
	const panel = document.createElement("div");
	panel.id = "thief-theft-panel";
	panel.className = "thief-theft-panel";
	const t = document.createElement("div");
	t.className = "thief-theft-title";
	t.textContent = "Кража";
	const desc = document.createElement("div");
	desc.className = "thief-theft-ability-text";
	desc.textContent = "Сбрось 1 карту, затем кликни по кубику. 4+ — удача, 1–3 — уровень. Недоступно, если ты в бою с монстром или нет соперника вне боя с мелкой экипированной шмоткой.";
	const dynamic = document.createElement("div");
	dynamic.id = "thief-theft-dynamic";
	const cardsWrap = document.createElement("div");
	cardsWrap.className = "thief-theft-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "thief-theft-apply";
	applyBtn.textContent = "Сбросить карту";
	applyBtn.disabled = true;
	const selected = new Set();
	if (!cards.length) {
		const e = document.createElement("div");
		e.className = "thief-theft-empty";
		e.textContent = "Нет карт на сброс";
		cardsWrap.appendChild(e);
	} else {
		cards.forEach((c) => {
			const b = document.createElement("button");
			b.type = "button";
			b.className = "thief-theft-card";
			b.dataset.cardId = c.cardId;
			const im = document.createElement("img");
			im.className = "thief-theft-card-img";
			im.src = c.img;
			im.alt = c.cardId;
			b.appendChild(im);
			b.addEventListener("click", () => {
				cardsWrap.querySelectorAll(".thief-theft-card").forEach((x) => x.classList.remove("is-selected"));
				selected.clear();
				selected.add(c.cardId);
				b.classList.add("is-selected");
				applyBtn.disabled = selected.size !== 1;
			});
			cardsWrap.appendChild(b);
		});
	}
	applyBtn.addEventListener("click", () => {
		if (selected.size !== 1) {
			return;
		}
		const [cardId] = Array.from(selected);
		applyBtn.disabled = true;
		socket.emit("message", {
			method: "ThiefTheftStart",
			seat: localSeat,
			cardId,
		});
	});
	dynamic.appendChild(cardsWrap);
	dynamic.appendChild(applyBtn);
	panel.appendChild(t);
	panel.appendChild(desc);
	panel.appendChild(dynamic);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideThiefTheftModal();
		}
	});
}

function openWizardFlightModal() {
	if (!canLocalUseWizardFlightNow()) {
		return;
	}
	hideWizardFlightModal();
	const pending = escapeWizardFlightPending;
	if (!pending) {
		return;
	}
	const cards = getLocalPlayerAllCardsForWizardFlightDiscard();
	const maxPick = Math.min(WIZARD_FLIGHT_MAX_DISCARD, cards.length);
	const needNow = Math.max(0, ESCAPE_TARGET_ROLL - (Number(pending.totalRoll) || 0));

	const modal = document.createElement("div");
	modal.id = "wizard-flight-modal";
	modal.className = "wizard-flight-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-flight-panel";

	const title = document.createElement("div");
	title.className = "wizard-flight-title";
	title.textContent = "Заклинание Полёта";

	const desc = document.createElement("div");
	desc.className = "wizard-flight-desc";
	desc.textContent = "Сбрось до 3 карт: каждая даст +1 к смывке. Экипированную карту волшебника сбрасывать нельзя.";

	const counter = document.createElement("div");
	counter.className = "wizard-flight-counter";
	const updateCounterText = (selectedCount) => {
		const leftNeed = Math.max(0, needNow - selectedCount);
		const leftCanDiscard = Math.max(0, maxPick - selectedCount);
		counter.textContent = `До успеха смывки нужно: +${leftNeed}. Ещё можно сбросить карт: ${leftCanDiscard}.`;
	};
	updateCounterText(0);

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-flight-cards";
	const selected = new Set();

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-flight-apply-btn";
	applyBtn.textContent = "Получить +0 к смывке";
	applyBtn.disabled = true;

	if (!cards.length) {
		const empty = document.createElement("div");
		empty.className = "wizard-flight-empty";
		empty.textContent = "Нет карт для сброса";
		cardsWrap.appendChild(empty);
	} else {
		cards.forEach((card) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "wizard-flight-card";
			btn.dataset.cardId = card.cardId;
			const img = document.createElement("img");
			img.src = card.img;
			img.alt = card.cardId;
			img.className = "wizard-flight-card-img";
			btn.appendChild(img);
			btn.addEventListener("click", () => {
				const id = card.cardId;
				if (selected.has(id)) {
					selected.delete(id);
					btn.classList.remove("is-selected");
				} else {
					if (selected.size >= maxPick) {
						return;
					}
					selected.add(id);
					btn.classList.add("is-selected");
				}
				const n = selected.size;
				applyBtn.disabled = n <= 0;
				applyBtn.textContent = `Получить +${n} к смывке`;
				updateCounterText(n);
			});
			cardsWrap.appendChild(btn);
		});
	}

	const skipBtn = document.createElement("button");
	skipBtn.type = "button";
	skipBtn.className = "wizard-flight-skip-btn";
	skipBtn.textContent = "Не использовать заклинание";
	skipBtn.addEventListener("click", () => {
		hideWizardFlightModal();
		escapeWizardFlightPending = null;
		updateWizardFlightUi();
		socket.emit("message", { method: "EscapeFailAidSkip", seat: localSeat });
	});

	applyBtn.addEventListener("click", () => {
		if (!escapeWizardFlightPending || selected.size <= 0) {
			return;
		}
		const cardIds = Array.from(selected).slice(0, WIZARD_FLIGHT_MAX_DISCARD);
		if (!cardIds.length) {
			return;
		}
		socket.emit("message", {
			method: "WizardFlightApply",
			seat: localSeat,
			cardIds,
		});
		hideWizardFlightModal();
	});

	panel.appendChild(title);
	panel.appendChild(desc);
	panel.appendChild(counter);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	panel.appendChild(skipBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			skipBtn.click();
		}
	});
}

function hideWizardTamingModal() {
	const existing = document.getElementById("wizard-taming-modal");
	if (existing) {
		existing.remove();
	}
}

function hideWizardTamingPickModal() {
	const existing = document.getElementById("wizard-taming-pick-modal");
	if (existing) {
		existing.remove();
	}
}

function getLocalHandCardsForWizardTaming() {
	const cards = [];
	const handEl = document.querySelector('.myhand');
	if (!handEl) {
		return cards;
	}
	handEl.querySelectorAll('.card').forEach((cardEl) => {
		if (!cardEl?.id) {
			return;
		}
		const imgEl = cardEl.querySelector('.card-item');
		if (!imgEl?.src) {
			return;
		}
		cards.push({
			cardId: cardEl.id,
			img: imgEl.src,
		});
	});
	return cards;
}

function canLocalUseWizardTamingNow() {
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!battleActive || escapeActive) {
		return false;
	}
	if (!getMonsterBattleContext().hasMonster) {
		return false;
	}
	if (!isSeatWizardClassActive(localSeat)) {
		return false;
	}
	const isParticipant = Number(localSeat) === Number(getMonsterFightSeat())
		|| (acceptedHelperSeat != null && Number(localSeat) === Number(acceptedHelperSeat));
	if (!isParticipant) {
		return false;
	}
	return getLocalHandCardsForWizardTaming().length >= 3;
}

function updateWizardTamingUi() {
	const btn = document.getElementById('wizard-taming-btn');
	if (!btn) {
		return;
	}
	if (localSeat == null || localSeat < 0 || !isSeatWizardClassActive(localSeat)) {
		btn.style.display = 'none';
		btn.style.opacity = "";
		btn.style.cursor = "";
		hideWizardTamingModal();
		hideWizardTamingPickModal();
		return;
	}
	btn.style.display = 'flex';
	positionWarriorFrenzyButton(btn);
	const canUse = canLocalUseWizardTamingNow();
	if (canUse) {
		btn.style.opacity = '1';
		btn.style.cursor = '';
	} else {
		btn.style.opacity = '0.5';
		btn.style.cursor = 'not-allowed';
		hideWizardTamingModal();
		hideWizardTamingPickModal();
	}
}

function openWizardTamingPickMonsterModal(handCardIds, monsters) {
	hideWizardTamingPickModal();
	const modal = document.createElement("div");
	modal.id = "wizard-taming-pick-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Выбери монстра для усмирения";

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Усмирить выбранного монстра";
	applyBtn.disabled = true;

	let selectedMonster = null;
	monsters.forEach((m) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = m.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = m.img || "";
		img.alt = m.cardId;
		btn.appendChild(img);

		const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
		const sumEl = document.createElement("div");
		sumEl.className = "wizard-taming-pick-sum";
		sumEl.textContent = bonusSum ? `Бонус: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "Бонус: 0";
		sumEl.style.marginTop = "4px";
		sumEl.style.fontSize = "16px";
		sumEl.style.color = "#ffd37a";
		sumEl.style.textAlign = "center";
		btn.appendChild(sumEl);

		const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
		if (attachedBonuses.length > 0) {
			const bonusesWrap = document.createElement("div");
			bonusesWrap.className = "wizard-taming-pick-bonuses";
			bonusesWrap.style.display = "flex";
			bonusesWrap.style.flexWrap = "wrap";
			bonusesWrap.style.justifyContent = "center";
			bonusesWrap.style.gap = "6px";
			bonusesWrap.style.marginTop = "6px";
			attachedBonuses.forEach((bc) => {
				const bi = document.createElement("img");
				bi.className = "wizard-taming-pick-bonus-img";
				bi.src = bc.img || "";
				bi.alt = bc.cardId;
				bi.style.width = "40px";
				bi.style.height = "auto";
				bi.style.borderRadius = "6px";
				bonusesWrap.appendChild(bi);
			});
			btn.appendChild(bonusesWrap);
		}
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selectedMonster = m.cardId;
			applyBtn.disabled = !selectedMonster;
		});
		cardsWrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (!selectedMonster) {
			return;
		}
		socket.emit("message", {
			method: "WizardTamingApply",
			seat: localSeat,
			handCardIds,
			monsterCardId: selectedMonster,
		});
		modal.remove();
	});

	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
}

function openWizardTamingModal() {
	if (!canLocalUseWizardTamingNow()) {
		return;
	}
	hideWizardTamingModal();
	hideWizardTamingPickModal();
	const handCards = getLocalHandCardsForWizardTaming();
	const modal = document.createElement("div");
	modal.id = "wizard-taming-modal";
	modal.className = "wizard-taming-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-title";
	title.textContent = "Заклинание Усмирения";
	const desc = document.createElement("div");
	desc.className = "wizard-taming-desc";
	desc.textContent = "Сбрось всю руку (минимум 3 карты), чтобы усмирить монстра: без уровня, но бой с ним прекращается.";
	const counter = document.createElement("div");
	counter.className = "wizard-taming-counter";
	counter.textContent = `Карт в руке: ${handCards.length}. Нужно минимум 3.`;

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-hand-cards";
	handCards.forEach((c) => {
		const card = document.createElement("div");
		card.className = "wizard-taming-hand-card";
		const img = document.createElement("img");
		img.className = "wizard-taming-hand-card-img";
		img.src = c.img;
		img.alt = c.cardId;
		card.appendChild(img);
		cardsWrap.appendChild(card);
	});
	if (!handCards.length) {
		const empty = document.createElement("div");
		empty.className = "wizard-taming-empty";
		empty.textContent = "Нет карт в руке";
		cardsWrap.appendChild(empty);
	}

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-apply-btn";
	applyBtn.textContent = "Применить заклинание";
	applyBtn.disabled = handCards.length < 3;
	applyBtn.addEventListener("click", () => {
		const monsters = getMonsterBattleContext().monsters;
		const handCardIds = handCards.map((x) => x.cardId);
		if (!handCardIds.length || handCardIds.length < 3) {
			return;
		}
		if (monsters.length <= 1) {
			socket.emit("message", {
				method: "WizardTamingApply",
				seat: localSeat,
				handCardIds,
				monsterCardId: "",
			});
		} else {
			openWizardTamingPickMonsterModal(handCardIds, monsters);
		}
		hideWizardTamingModal();
	});

	panel.appendChild(title);
	panel.appendChild(desc);
	panel.appendChild(counter);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideWizardTamingModal();
		}
	});
}

function getLocalPlayerAllCardsForThiefTrimDiscard() {
	const cards = [];
	const cardIds = new Set();
	const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
	const protectedEquippedThiefIds = new Set();
	if (main) {
		main.querySelectorAll('.card').forEach((cardEl) => {
			const doorCard = window.doors?.find((d) => d.name === cardEl.id);
			if (doorCard?.kind === "Thief") {
				protectedEquippedThiefIds.add(cardEl.id);
			}
		});
	}
	const pushFromZone = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll('.card').forEach((cardEl) => {
			if (!cardEl?.id || cardIds.has(cardEl.id)) {
				return;
			}
			if (zoneEl === main && protectedEquippedThiefIds.has(cardEl.id)) {
				return;
			}
			const imgEl = cardEl.querySelector('.card-item');
			if (!imgEl?.src) {
				return;
			}
			cardIds.add(cardEl.id);
			cards.push({
				cardId: cardEl.id,
				img: imgEl.src,
			});
		});
	};
	const handEl = document.querySelector('.myhand');
	pushFromZone(handEl);
	pushFromZone(side);
	pushFromZone(main);
	return cards;
}

function isValidThiefTrimVictimSeat(seat) {
	if (seat == null || seat < 0) {
		return false;
	}
	if (seat === getMonsterFightSeat()) {
		return true;
	}
	if (acceptedHelperSeat != null && seat === acceptedHelperSeat) {
		return true;
	}
	return false;
}

/**
 * @param {number} thiefSeat
 * @param {Array<{ victimSeat: number, cardId: string }>} assignments
 */
function applyThiefTrimDiscardAndDebuff(thiefSeat, assignments) {
	const parsedThief = parseInt(thiefSeat, 10);
	if (Number.isNaN(parsedThief) || parsedThief < 0 || parsedThief > 2) {
		return;
	}
	if (!Array.isArray(assignments) || !assignments.length) {
		return;
	}
	// Снятие с боя: штрафы оставляем, новые сбросы снимаем проверкой isSeatThiefClassActive при подтверждении на клиенте-источнике; при приёме штраф применяем.
	const list = [];
	assignments.forEach((row) => {
		const v = parseInt(row?.victimSeat, 10);
		const c = row?.cardId;
		if (Number.isNaN(v) || v < 0 || v > 2 || !c) {
			return;
		}
		if (v === parsedThief) {
			return;
		}
		if (!isValidThiefTrimVictimSeat(v)) {
			return;
		}
		if (victimThiefTrimUsedBySeat[v]) {
			return;
		}
		if (list.some((e) => e.victimSeat === v)) {
			return;
		}
		if (list.some((e) => e.cardId === c)) {
			return;
		}
		list.push({ victimSeat: v, cardId: c });
	});
	if (!list.length) {
		return;
	}
	list.forEach(({ victimSeat, cardId }) => {
		if (!document.getElementById(cardId)) {
			return;
		}
		moveCardToDiscardById(cardId);
		victimThiefTrimUsedBySeat[victimSeat] = 1;
		thiefBackstabDebuffBySeat[victimSeat] = (thiefBackstabDebuffBySeat[victimSeat] || 0) + 2;
	});
	recalculateAllPowerDisplays();
}

function openThiefTrimModal() {
	if (!canLocalUseThiefTrimNow()) {
		return;
	}
	hideThiefTrimModal();
	const victims = getValidThiefTrimVictims();
	if (!victims.length) {
		return;
	}
	const cards = getLocalPlayerAllCardsForThiefTrimDiscard();
	/** По одной карте на ещё не «подрезанного» воющего, не больше двух. */
	const maxTargets = Math.min(victims.length, 2);

	const modal = document.createElement("div");
	modal.id = "thief-trim-modal";
	modal.className = "thief-trim-modal";
	const panel = document.createElement("div");
	panel.className = "thief-trim-panel";

	const title = document.createElement("div");
	title.className = "thief-trim-title";
	title.textContent = "Подрезка";

	const counter = document.createElement("div");
	counter.className = "thief-trim-counter";
	counter.textContent = "Одна карта = −2 силе выбранного в бою соперника (один раз на жертву за бой)";

	const hint = document.createElement("div");
	hint.className = "thief-trim-hint";
	hint.textContent = `Можно выбрать до ${maxTargets} карт(ы).`;

	const applyBtn = document.createElement("button");
	applyBtn.className = "thief-trim-apply-btn";
	applyBtn.disabled = true;
	applyBtn.textContent = "Подрезать: 0 карт(ы) = −2 за каждую выбранную карту";

	const selected = new Set();

	const refreshApply = () => {
		const n = selected.size;
		applyBtn.disabled = n <= 0;
		applyBtn.textContent = `Подрезать: ${n} карт(ы) = −2 за каждую выбранную карту`;
	};

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "thief-trim-cards";

	if (!cards.length) {
		const empty = document.createElement("div");
		empty.className = "thief-trim-empty";
		empty.textContent = "Нет карт для сброса";
		cardsWrap.appendChild(empty);
	} else {
		cards.forEach((card) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "thief-trim-card";
			btn.dataset.cardId = card.cardId;
			const img = document.createElement("img");
			img.src = card.img;
			img.alt = card.cardId;
			img.className = "thief-trim-card-img";
			btn.appendChild(img);
			btn.addEventListener("click", () => {
				const cardId = card.cardId;
				if (!cardId) {
					return;
				}
				if (selected.has(cardId)) {
					selected.delete(cardId);
					btn.classList.remove("is-selected");
				} else {
					if (selected.size >= maxTargets) {
						return;
					}
					selected.add(cardId);
					btn.classList.add("is-selected");
				}
				refreshApply();
			});
			cardsWrap.appendChild(btn);
		});
	}

	applyBtn.addEventListener("click", () => {
		if (selected.size <= 0) {
			return;
		}
		const cardIds = Array.from(selected);
		const assignments = cardIds.map((cardId, i) => ({
			victimSeat: victims[i],
			cardId,
		}));
		socket.emit("message", {
			method: "ThiefTrimApply",
			seat: localSeat,
			assignments,
		});
		hideThiefTrimModal();
	});

	panel.appendChild(title);
	panel.appendChild(counter);
	panel.appendChild(hint);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideThiefTrimModal();
		}
	});
	refreshApply();
}

function applyWarriorFrenzyDiscardAndBonus(seat, cardIds) {
	const parsedSeat = parseInt(seat, 10);
	if (Number.isNaN(parsedSeat) || parsedSeat < 0 || parsedSeat >= warriorFrenzyUsedBySeat.length) {
		return;
	}
	if (!isSeatWarriorClassActive(parsedSeat)) {
		return;
	}
	const alreadyUsed = warriorFrenzyUsedBySeat[parsedSeat] || 0;
	const remaining = Math.max(0, 3 - alreadyUsed);
	if (remaining <= 0) {
		return;
	}
	const sourceIds = Array.isArray(cardIds) ? cardIds.filter(Boolean) : [];
	const uniqueIds = [];
	sourceIds.forEach((id) => {
		if (uniqueIds.indexOf(id) === -1) {
			uniqueIds.push(id);
		}
	});
	const acceptedIds = uniqueIds.slice(0, remaining).filter((id) => !!document.getElementById(id));
	if (!acceptedIds.length) {
		return;
	}
	acceptedIds.forEach((cardId) => moveCardToDiscardById(cardId));
	const gain = acceptedIds.length;
	warriorFrenzyUsedBySeat[parsedSeat] = alreadyUsed + gain;
	warriorFrenzyBonusBySeat[parsedSeat] = (warriorFrenzyBonusBySeat[parsedSeat] || 0) + gain;
	recalculateAllPowerDisplays();
}

function getLocalPlayerAllCardsForClericExorcismDiscard() {
	const cards = [];
	const cardIds = new Set();
	const { main, side } = getMainAndSideZoneElementsForSeat(localSeat);
	const protectedEquippedClericIds = new Set();
	if (main) {
		main.querySelectorAll('.card').forEach((cardEl) => {
			const doorCard = window.doors?.find(d => d.name === cardEl.id);
			if (doorCard?.kind === "Cleric") {
				protectedEquippedClericIds.add(cardEl.id);
			}
		});
	}
	const pushFromZone = (zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll('.card').forEach((cardEl) => {
			if (!cardEl?.id || cardIds.has(cardEl.id)) {
				return;
			}
			// Нельзя сбрасывать экипированную карту класса Cleric.
			if (zoneEl === main && protectedEquippedClericIds.has(cardEl.id)) {
				return;
			}
			const imgEl = cardEl.querySelector('.card-item');
			if (!imgEl?.src) {
				return;
			}
			cardIds.add(cardEl.id);
			cards.push({
				cardId: cardEl.id,
				img: imgEl.src,
			});
		});
	};
	const handEl = document.querySelector('.myhand');
	pushFromZone(handEl);
	pushFromZone(side);
	pushFromZone(main);
	return cards;
}

function applyClericExorcismDiscardAndBonus(seat, cardIds) {
	const parsedSeat = parseInt(seat, 10);
	if (Number.isNaN(parsedSeat) || parsedSeat < 0 || parsedSeat >= clericExorcismUsedBySeat.length) {
		return;
	}
	if (!isSeatClericClassActive(parsedSeat)) {
		return;
	}
	const alreadyUsed = clericExorcismUsedBySeat[parsedSeat] || 0;
	const remaining = Math.max(0, 3 - alreadyUsed);
	if (remaining <= 0) {
		return;
	}
	const sourceIds = Array.isArray(cardIds) ? cardIds.filter(Boolean) : [];
	const uniqueIds = [];
	sourceIds.forEach((id) => {
		if (uniqueIds.indexOf(id) === -1) {
			uniqueIds.push(id);
		}
	});
	const acceptedIds = uniqueIds.slice(0, remaining).filter((id) => !!document.getElementById(id));
	if (!acceptedIds.length) {
		return;
	}
	acceptedIds.forEach((cardId) => moveCardToDiscardById(cardId));
	const gain = acceptedIds.length;
	clericExorcismUsedBySeat[parsedSeat] = alreadyUsed + gain;
	clericExorcismBonusBySeat[parsedSeat] = (clericExorcismBonusBySeat[parsedSeat] || 0) + gain;
	recalculateAllPowerDisplays();
}

function openClericExorcismModal() {
	if (!canLocalUseClericExorcismNow()) {
		return;
	}
	hideClericExorcismModal();
	const remaining = Math.max(0, 3 - (clericExorcismUsedBySeat[localSeat] || 0));
	const cards = getLocalPlayerAllCardsForClericExorcismDiscard();

	const modal = document.createElement('div');
	modal.id = 'cleric-exorcism-modal';
	modal.className = 'cleric-exorcism-modal';
	const panel = document.createElement('div');
	panel.className = 'cleric-exorcism-panel';

	const title = document.createElement('div');
	title.className = 'cleric-exorcism-title';
	title.textContent = 'Изгнание: сбрось до 3 карт в бою против Андедов, каждая дает +3 Бонус';

	const counter = document.createElement('div');
	counter.className = 'cleric-exorcism-counter';
	counter.textContent = `Можно скинуть ${remaining} карт`;

	const cardsWrap = document.createElement('div');
	cardsWrap.className = 'cleric-exorcism-cards';

	const applyBtn = document.createElement('button');
	applyBtn.className = 'cleric-exorcism-apply-btn';
	applyBtn.disabled = true;
	applyBtn.textContent = 'Получить бонус +0';

	const selected = new Set();
	const updateApplyButton = () => {
		const y = selected.size;
		applyBtn.disabled = y <= 0;
		applyBtn.textContent = `Получить бонус +${y * 3}`;
	};

	if (!cards.length) {
		const empty = document.createElement('div');
		empty.className = 'cleric-exorcism-empty';
		empty.textContent = 'Нет карт для сброса';
		cardsWrap.appendChild(empty);
	} else {
		cards.forEach((card) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'cleric-exorcism-card';
			btn.dataset.cardId = card.cardId;
			const img = document.createElement('img');
			img.src = card.img;
			img.alt = card.cardId;
			img.className = 'cleric-exorcism-card-img';
			btn.appendChild(img);
			btn.addEventListener('click', () => {
				const cardId = btn.dataset.cardId;
				if (!cardId) {
					return;
				}
				if (selected.has(cardId)) {
					selected.delete(cardId);
					btn.classList.remove('is-selected');
				} else {
					if (selected.size >= remaining) {
						return;
					}
					selected.add(cardId);
					btn.classList.add('is-selected');
				}
				updateApplyButton();
			});
			cardsWrap.appendChild(btn);
		});
	}

	applyBtn.addEventListener('click', () => {
		if (selected.size <= 0) {
			return;
		}
		socket.emit("message", {
			method: "ClericExorcismApply",
			seat: localSeat,
			cardIds: Array.from(selected),
		});
		hideClericExorcismModal();
	});

	panel.appendChild(title);
	panel.appendChild(counter);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	modal.addEventListener('click', (event) => {
		if (event.target === modal) {
			hideClericExorcismModal();
		}
	});
}

function openWarriorFrenzyModal() {
	if (!canLocalUseWarriorFrenzyNow()) {
		return;
	}
	hideWarriorFrenzyModal();
	const remaining = Math.max(0, 3 - (warriorFrenzyUsedBySeat[localSeat] || 0));
	const cards = getLocalPlayerAllCardsForWarriorFrenzyDiscard();

	const modal = document.createElement('div');
	modal.id = 'warrior-frenzy-modal';
	modal.className = 'warrior-frenzy-modal';
	const panel = document.createElement('div');
	panel.className = 'warrior-frenzy-panel';

	const title = document.createElement('div');
	title.className = 'warrior-frenzy-title';
	title.textContent = 'Буйство: сбрось до 3 карт в бою, каждая дает +1 Бонус';

	const counter = document.createElement('div');
	counter.className = 'warrior-frenzy-counter';
	counter.textContent = `Можно скинуть ${remaining} карт`;

	const cardsWrap = document.createElement('div');
	cardsWrap.className = 'warrior-frenzy-cards';

	const applyBtn = document.createElement('button');
	applyBtn.className = 'warrior-frenzy-apply-btn';
	applyBtn.disabled = true;
	applyBtn.textContent = 'Получить бонус +0';

	const selected = new Set();
	const updateApplyButton = () => {
		const y = selected.size;
		applyBtn.disabled = y <= 0;
		applyBtn.textContent = `Получить бонус +${y}`;
	};

	if (!cards.length) {
		const empty = document.createElement('div');
		empty.className = 'warrior-frenzy-empty';
		empty.textContent = 'Нет карт для сброса';
		cardsWrap.appendChild(empty);
	} else {
		cards.forEach((card) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'warrior-frenzy-card';
			btn.dataset.cardId = card.cardId;
			const img = document.createElement('img');
			img.src = card.img;
			img.alt = card.cardId;
			img.className = 'warrior-frenzy-card-img';
			btn.appendChild(img);
			btn.addEventListener('click', () => {
				const cardId = btn.dataset.cardId;
				if (!cardId) {
					return;
				}
				if (selected.has(cardId)) {
					selected.delete(cardId);
					btn.classList.remove('is-selected');
				} else {
					if (selected.size >= remaining) {
						return;
					}
					selected.add(cardId);
					btn.classList.add('is-selected');
				}
				updateApplyButton();
			});
			cardsWrap.appendChild(btn);
		});
	}

	applyBtn.addEventListener('click', () => {
		if (selected.size <= 0) {
			return;
		}
		socket.emit("message", {
			method: "WarriorFrenzyApply",
			seat: localSeat,
			cardIds: Array.from(selected),
		});
		hideWarriorFrenzyModal();
	});

	panel.appendChild(title);
	panel.appendChild(counter);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	modal.addEventListener('click', (event) => {
		if (event.target === modal) {
			hideWarriorFrenzyModal();
		}
	});
}

function hideEscapeMonsterPicker() {
	const existing = document.getElementById("escape-monster-picker");
	if (existing) {
		existing.remove();
	}
}

function hideEscapeAidOptionsModal(skipResumeMonsterPick) {
	const had = Boolean(document.getElementById("escape-aid-options-modal"));
	const soloClose = had && instantWallSoloAidWaitingEmitted;
	instantWallSoloAidWaitingEmitted = false;
	removeInstantWallSoloAidWaitingBanner();
	const a = document.getElementById("escape-aid-options-modal");
	if (a) {
		a.remove();
	}
	if (soloClose && typeof socket !== "undefined" && socket && typeof socket.emit === "function") {
		socket.emit("message", { method: "InstantWallSoloAidClose" });
	}
	if (!skipResumeMonsterPick) {
		maybeResumeEscapeMonsterPickAfterAidClosed();
	}
}

function hideEscapeFailAidModal() {
	const a = document.getElementById("escape-fail-aid-modal");
	if (a) {
		a.remove();
	}
}

function hideEscapeRatMonsterPickModal() {
	const m = document.getElementById("escape-rat-monster-modal");
	if (m) {
		m.remove();
	}
}

const INSTANT_WALL_OFFER_WAITING_ID = "instant-wall-offer-waiting-banner";
const INSTANT_WALL_HELPER_WAITING_ID = "instant-wall-helper-waiting-banner";
const INSTANT_WALL_SOLO_AID_WAITING_ID = "instant-wall-solo-aid-waiting-banner";

function removeInstantWallSoloAidWaitingBanner() {
	const el = document.getElementById(INSTANT_WALL_SOLO_AID_WAITING_ID);
	if (el) {
		el.remove();
	}
}

function removeInstantWallHelperWaitingBanner() {
	const el = document.getElementById(INSTANT_WALL_HELPER_WAITING_ID);
	if (el) {
		el.remove();
	}
}

function removeInstantWallOfferWaitingBanner() {
	const el = document.getElementById(INSTANT_WALL_OFFER_WAITING_ID);
	if (el) {
		el.remove();
	}
}

function removeInstantWallWaitingBanners() {
	removeInstantWallHelperWaitingBanner();
	removeInstantWallOfferWaitingBanner();
}

/** Сравнение места: Number(null)===0, поэтому без проверки null «помощник 0» ломал плашки для части клиентов. */
function localSeatMatchesSeat(seat) {
	if (localSeat == null || localSeat === "") {
		return false;
	}
	return Number(localSeat) === Number(seat);
}

function isLocalInstantWallPickModalOpen() {
	const m = document.getElementById("instant-wall-modal");
	return Boolean(m && m.isConnected);
}

function isEscapeAidOptionsModalOpenForLocal() {
	const m = document.getElementById("escape-aid-options-modal");
	return Boolean(m && m.isConnected);
}

/** После закрытия aid-модалки снова показать выбор монстра, если фаза выбора ещё актуальна. */
function maybeResumeEscapeMonsterPickAfterAidClosed() {
	if (!escapeActive || !escapeMonsterPickSession || typeof escapeMonsterPickSession !== "object") {
		return;
	}
	const pickSeat = Number(escapeMonsterPickSession.seat);
	if (!localSeatMatchesSeat(pickSeat)) {
		return;
	}
	if (document.getElementById("escape-aid-options-modal") || document.getElementById("escape-rat-monster-modal")) {
		return;
	}
	if (document.getElementById("instant-wall-modal") || document.getElementById("flask-glue-modal")) {
		return;
	}
	if (shouldSuppressEscapeMonsterPickBannerForSeat(pickSeat)) {
		return;
	}
	const queueIdSet = new Set((escapeMonsterQueue || []).map((m) => String(m?.cardId || "")));
	const raw = escapeMonsterPickSession.monsters || [];
	const monstersForPicker = raw.filter((m) => queueIdSet.has(String(m?.cardId || "")));
	if (monstersForPicker.length <= 0) {
		return;
	}
	showBattleResult("Выбери монстра, от которого будешь смываться.");
	showEscapeMonsterPicker(monstersForPicker, (cardId) => {
		hideEscapeMonsterPicker();
		socket.emit("message", {
			method: "EscapeMonsterChosen",
			seat: localSeat,
			cardId,
		});
	});
}

/** Не показывать плашку «выбор монстра», пока открыта стенка/aid/клей или ждём решение помощника / лидера по стенке до выбора монстра. */
function shouldSuppressEscapeMonsterPickBannerForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s)) {
		return false;
	}
	if (localSeatMatchesSeat(s) && isLocalInstantWallPickModalOpen()) {
		return true;
	}
	if (localSeatMatchesSeat(s) && isEscapeAidOptionsModalOpenForLocal()) {
		return true;
	}
	if (
		escapeInstantWallGate
		&& Number.isFinite(Number(escapeInstantWallGate.helperSeat))
		&& Number(escapeInstantWallGate.helperSeat) === s
	) {
		return true;
	}
	if (
		escapeInstantWallGate
		&& Number.isFinite(Number(escapeInstantWallGate.loserSeat))
		&& Number(escapeInstantWallGate.loserSeat) === s
	) {
		return true;
	}
	return false;
}

/** Союзник решает, воспользоваться ли стенкой для авто-смывки (модалка у toSeat). */
function showInstantWallOfferWaitingBanner(fromSeat, toSeat) {
	removeInstantWallHelperWaitingBanner();
	hideBattleResult();
	const fs = Number(fromSeat);
	const ts = Number(toSeat);
	if (!Number.isFinite(fs) || !Number.isFinite(ts)) {
		return;
	}
	const bar = document.createElement("div");
	bar.id = INSTANT_WALL_OFFER_WAITING_ID;
	bar.className = "escape-glue-waiting-banner instant-wall-waiting-banner";
	bar.setAttribute("role", "status");
	bar.textContent = `${getSeatLabel(ts)} решает, воспользоваться ли мгновенной стенкой для автоматической смывки.`;
	document.body.appendChild(bar);
}

/** Помощник решает, применять ли стенку до начала смывки лидера. */
function showInstantWallHelperWaitingBanner(helperSeat) {
	removeInstantWallOfferWaitingBanner();
	hideBattleResult();
	const hs = Number(helperSeat);
	if (!Number.isFinite(hs)) {
		return;
	}
	const bar = document.createElement("div");
	bar.id = INSTANT_WALL_HELPER_WAITING_ID;
	bar.className = "escape-glue-waiting-banner instant-wall-waiting-banner";
	bar.setAttribute("role", "status");
	bar.textContent = `${getSeatLabel(hs)} решает, применять ли мгновенную стенку перед смывкой.`;
	document.body.appendChild(bar);
}

function showInstantWallSoloAidWaitingBanner(deciderSeat) {
	removeInstantWallSoloAidWaitingBanner();
	hideBattleResult();
	const ds = Number(deciderSeat);
	if (!Number.isFinite(ds)) {
		return;
	}
	const bar = document.createElement("div");
	bar.id = INSTANT_WALL_SOLO_AID_WAITING_ID;
	bar.className = "escape-glue-waiting-banner instant-wall-waiting-banner";
	bar.setAttribute("role", "status");
	bar.textContent = `${getSeatLabel(ds)} решает, использовать ли карту «Мгновенная стенка».`;
	document.body.appendChild(bar);
}

function hideInstantWallModal() {
	const m = document.getElementById("instant-wall-modal");
	if (m) {
		m.remove();
	}
}

function hideLoadedDieModals() {
	const a = document.getElementById("loaded-die-confirm-modal");
	if (a) a.remove();
	const b = document.getElementById("loaded-die-pick-modal");
	if (b) b.remove();
}

function getLoadedDieTreasureCardIdsForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const out = [];
	const seen = new Set();
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s);
	[hand, main, side].forEach((zoneEl) => {
		if (!zoneEl) return;
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const cid = String(cardEl?.id || "");
			if (!cid || !cid.includes("treasure") || seen.has(cid)) return;
			if (!isTreasureSpecial(cid, "Loaded die")) return;
			seen.add(cid);
			out.push(cid);
		});
	});
	return out;
}

function hideFlaskOfGlueModal() {
	const m = document.getElementById("flask-glue-modal");
	if (m) {
		m.remove();
	}
}

const ESCAPE_GLUE_WAITING_BANNER_ID = "escape-glue-waiting-banner";

function removeEscapeGlueWaitingBanner() {
	const el = document.getElementById(ESCAPE_GLUE_WAITING_BANNER_ID);
	if (el) {
		el.remove();
	}
}

/** Плашка для соперников: кто-то с открытой модалкой клея принимает решение. У игрока с модалкой не показываем. */
function showEscapeGlueWaitingBanner(key, actingSeat) {
	const k = String(key || "");
	const act = Number(actingSeat);
	if (!k || !Number.isFinite(act)) {
		return;
	}
	removeEscapeGlueWaitingBanner();
	hideBattleResult();
	escapeGlueWaitingKey = k;
	const bar = document.createElement("div");
	bar.id = ESCAPE_GLUE_WAITING_BANNER_ID;
	bar.className = "escape-glue-waiting-banner";
	bar.setAttribute("role", "status");
	bar.textContent = `${getSeatLabel(act)} решает, использовать ли тюбик клея.`;
	document.body.appendChild(bar);
}

function getFlaskOfGlueTreasureCardIdsForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const out = [];
	const seen = new Set();
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s);
	[hand, main, side].forEach((zoneEl) => {
		if (!zoneEl) return;
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const cid = String(cardEl?.id || "");
			if (!cid || !cid.includes("treasure") || seen.has(cid)) return;
			if (!isTreasureSpecial(cid, "Flask of glue")) return;
			seen.add(cid);
			out.push(cid);
		});
	});
	return out;
}

function openFlaskOfGlueConfirmModal({ promptKey, escapedSeat, monsterCardId, viaInstantWall, wallFleeSeats }) {
	const escaped = Number(escapedSeat);
	const mon = String(monsterCardId || "");
	const viaWall = Boolean(viaInstantWall);
	if (!Number.isFinite(escaped) || (!mon && !viaWall)) {
		return;
	}
	const wallFleeUnique = Array.from(
		new Set(
			(Array.isArray(wallFleeSeats) ? wallFleeSeats : [])
				.map((x) => Number(x))
				.filter((x) => Number.isFinite(x)),
		),
	);
	const wallFleeSet = new Set(wallFleeUnique.length ? wallFleeUnique : [escaped]);
	// Жертвы смывки по стенке не выбирают применение клея (клей играет соперник).
	if (wallFleeSet.has(Number(localSeat))) {
		return;
	}
	const ids = getFlaskOfGlueTreasureCardIdsForSeat(localSeat);
	if (!ids.length) {
		return;
	}
	hideBattleResult();
	hideFlaskOfGlueModal();
	const glueId = ids[0];
	const tr = window.treasures?.find((t) => t.name === glueId);
	const modal = document.createElement("div");
	modal.id = "flask-glue-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	const names = Array.from(wallFleeSet)
		.sort((a, b) => a - b)
		.map((s) => getSeatLabel(s))
		.join(" и ");
	const succ =
		wallFleeSet.size > 1
			? `${names} успешно смылись.`
			: `${getSeatLabel(escaped)} успешно смылся.`;
	title.textContent = `${succ} Использовать тюбик клея, чтобы снова смываться${viaWall ? ". После стенки — от всех монстров" : ""}?`;
	const cardImg = document.createElement("img");
	cardImg.className = "wizard-taming-pick-card-img";
	cardImg.src = tr?.img || "";
	cardImg.alt = glueId;
	cardImg.style.display = "block";
	cardImg.style.margin = "0 auto";
	cardImg.style.maxWidth = "160px";
	const yesBtn = document.createElement("button");
	yesBtn.type = "button";
	yesBtn.className = "wizard-taming-pick-apply-btn";
	yesBtn.textContent = "Да, использовать";
	const noBtn = document.createElement("button");
	noBtn.type = "button";
	noBtn.className = "wizard-taming-pick-apply-btn";
	noBtn.textContent = "Нет";

	const sendDecision = (used) => {
		hideFlaskOfGlueModal();
		socket.emit("message", {
			method: "EscapeGlueDecision",
			key: String(promptKey || ""),
			used: Boolean(used),
			actingSeat: Number(localSeat),
			targetSeat: escaped,
			monsterCardId: mon,
			viaInstantWall: viaWall,
			cardId: used ? glueId : null,
			wallFleeSeats: Array.from(wallFleeSet),
		});
	};
	yesBtn.addEventListener("click", () => sendDecision(true));
	noBtn.addEventListener("click", () => sendDecision(false));

	panel.appendChild(title);
	panel.appendChild(cardImg);
	panel.appendChild(yesBtn);
	panel.appendChild(noBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			sendDecision(false);
		}
	});
	pushOpenModalsToServerDebounced();
}

function promptLoadedDieAfterRoll({ seat, rawRoll, onFinalize }) {
	const s = Number(seat);
	const r = Number(rawRoll);
	if (!Number.isFinite(s) || !Number.isFinite(r) || r < 1 || r > 6) {
		onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
		return;
	}
	const ids = getLoadedDieTreasureCardIdsForSeat(s);
	if (!ids.length) {
		onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
		return;
	}
	hideLoadedDieModals();
	const dieCardId = ids[0];

	const confirm = document.createElement("div");
	confirm.id = "loaded-die-confirm-modal";
	confirm.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = `Выпало: ${r}. Хочешь сбросить читерский кубик и выбрать другое значение?`;
	const tr = window.treasures?.find((t) => t.name === dieCardId);
	const cardImg = document.createElement("img");
	cardImg.className = "wizard-taming-pick-card-img";
	cardImg.src = tr?.img || "";
	cardImg.alt = dieCardId;
	cardImg.style.display = "block";
	cardImg.style.margin = "0 auto";
	cardImg.style.maxWidth = "160px";
	const yesBtn = document.createElement("button");
	yesBtn.type = "button";
	yesBtn.className = "wizard-taming-pick-apply-btn";
	yesBtn.textContent = "Да, изменить";
	const noBtn = document.createElement("button");
	noBtn.type = "button";
	noBtn.className = "wizard-taming-pick-apply-btn";
	noBtn.textContent = "Нет";

	const openPick = () => {
		confirm.remove();
		const pick = document.createElement("div");
		pick.id = "loaded-die-pick-modal";
		pick.className = "wizard-taming-pick-modal";
		const pPanel = document.createElement("div");
		pPanel.className = "wizard-taming-pick-panel";
		const pTitle = document.createElement("div");
		pTitle.className = "wizard-taming-pick-title";
		pTitle.textContent = "Loaded die: выбери значение";
		const pCards = document.createElement("div");
		pCards.className = "wizard-taming-pick-cards";
		const applyBtn = document.createElement("button");
		applyBtn.type = "button";
		applyBtn.className = "wizard-taming-pick-apply-btn";
		applyBtn.textContent = "Подтвердить";
		applyBtn.disabled = true;
		let picked = null;
		for (let v = 1; v <= 6; v += 1) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "wizard-taming-pick-card";
			btn.dataset.value = String(v);
			const dieEl = createDice(v);
			dieEl.style.margin = "10px auto";
			btn.appendChild(dieEl);
			btn.addEventListener("click", () => {
				pCards.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
				btn.classList.add("is-selected");
				picked = v;
				applyBtn.disabled = false;
			});
			pCards.appendChild(btn);
		}
		applyBtn.addEventListener("click", () => {
			if (!picked) return;
			hideLoadedDieModals();
			socket.emit("message", { method: "LoadedDieDiscard", seat: s, cardId: dieCardId });
			const finalPicked = applyDicePenaltyForSeat(seat, picked);
			onFinalize?.(finalPicked);
			// Если это "обычный" бросок (не смывка/не кража), синхронизируем отображение кубика у остальных игроков.
			if (!escapeActive && !thiefTheftBoardDicePending && Number(finalPicked) !== Number(rawRoll)) {
				socket.emit("message", { method: "RandDice", digit: Number(finalPicked) });
			}
		});
		pPanel.appendChild(pTitle);
		pPanel.appendChild(pCards);
		pPanel.appendChild(applyBtn);
		pick.appendChild(pPanel);
		document.body.appendChild(pick);
		pick.addEventListener("click", (e) => {
			if (e.target === pick) {
				hideLoadedDieModals();
				onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
			}
		});
		pushOpenModalsToServerDebounced();
	};

	yesBtn.addEventListener("click", openPick);
	noBtn.addEventListener("click", () => {
		hideLoadedDieModals();
		onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
	});
	panel.appendChild(title);
	panel.appendChild(cardImg);
	panel.appendChild(yesBtn);
	panel.appendChild(noBtn);
	confirm.appendChild(panel);
	document.body.appendChild(confirm);
	confirm.addEventListener("click", (e) => {
		if (e.target === confirm) {
			hideLoadedDieModals();
			onFinalize?.(applyDicePenaltyForSeat(seat, rawRoll));
		}
	});
	pushOpenModalsToServerDebounced();
}

function getInstantWallCardIdsForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const out = [];
	const seen = new Set();
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s);
	[hand, main, side].forEach((zoneEl) => {
		if (!zoneEl) return;
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const cid = String(cardEl?.id || "");
			if (!cid || !cid.includes("treasure") || seen.has(cid)) return;
			if (!isTreasureSpecial(cid, "Instant wall")) return;
			seen.add(cid);
			out.push(cid);
		});
	});
	return out;
}

function openInstantWallPickModal({ title, seat, onPick, onSkip }) {
	removeInstantWallWaitingBanners();
	hideBattleResult();
	hideInstantWallModal();
	const ids = getInstantWallCardIdsForSeat(seat);
	if (!ids.length) {
		if (typeof onSkip === "function") onSkip();
		return;
	}
	const modal = document.createElement("div");
	modal.id = "instant-wall-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const titleEl = document.createElement("div");
	titleEl.className = "wizard-taming-pick-title";
	titleEl.textContent = title || "Instant wall";
	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Применить";
	applyBtn.disabled = true;
	const skipBtn = document.createElement("button");
	skipBtn.type = "button";
	skipBtn.className = "wizard-taming-pick-apply-btn";
	skipBtn.textContent = "Не применять";

	let selected = null;
	ids.forEach((cid) => {
		const tr = window.treasures?.find((t) => t.name === cid);
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = cid;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = tr?.img || "";
		img.alt = cid;
		btn.appendChild(img);
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selected = cid;
			applyBtn.disabled = !selected;
		});
		cardsWrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (!selected) return;
		hideInstantWallModal();
		if (typeof onPick === "function") onPick(selected);
	});
	skipBtn.addEventListener("click", () => {
		hideInstantWallModal();
		if (typeof onSkip === "function") onSkip();
	});

	panel.appendChild(titleEl);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	panel.appendChild(skipBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideInstantWallModal();
			if (typeof onSkip === "function") onSkip();
		}
	});
	pushOpenModalsToServerDebounced();
}

function openInstantWallOfferModal({ fromSeat, toSeat }) {
	removeInstantWallWaitingBanners();
	hideBattleResult();
	hideInstantWallModal();
	const modal = document.createElement("div");
	modal.id = "instant-wall-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const titleEl = document.createElement("div");
	titleEl.className = "wizard-taming-pick-title";
	titleEl.textContent = `Instant wall: воспользоваться стенкой от игрока ${getSeatLabel(fromSeat)}?`;
	const yesBtn = document.createElement("button");
	yesBtn.type = "button";
	yesBtn.className = "wizard-taming-pick-apply-btn";
	yesBtn.textContent = "Да, смыться автоматически";
	const noBtn = document.createElement("button");
	noBtn.type = "button";
	noBtn.className = "wizard-taming-pick-apply-btn";
	noBtn.textContent = "Нет, смываться как обычно";

	yesBtn.addEventListener("click", () => {
		hideInstantWallModal();
		socket.emit("message", { method: "InstantWallOfferDecision", fromSeat, toSeat, accept: true });
	});
	noBtn.addEventListener("click", () => {
		hideInstantWallModal();
		socket.emit("message", { method: "InstantWallOfferDecision", fromSeat, toSeat, accept: false });
	});

	panel.appendChild(titleEl);
	panel.appendChild(yesBtn);
	panel.appendChild(noBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	socket.emit("message", {
		method: "InstantWallOfferWaiting",
		fromSeat,
		toSeat,
	});
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideInstantWallModal();
			socket.emit("message", { method: "InstantWallOfferDecision", fromSeat, toSeat, accept: false });
		}
	});
	pushOpenModalsToServerDebounced();
}

function openHalflingRetryModalNow(seat) {
	hideEscapeAidOptionsModal(true);
	hideEscapeRatMonsterPickModal();
	hideEscapeFailAidModal();
	const s = parseInt(seat, 10);
	if (Number.isNaN(s)) {
		return;
	}
	hideEscapeHalflingRetryModal();
	if (localSeat !== s) {
		showBattleResult(`${getSeatLabel(s)} решает, использовать ли способность халфлинга...`);
		return;
	}

	const cards = getLocalPlayerAllCardsForHalflingDiscard();
	const modal = document.createElement("div");
	modal.id = "escape-halfling-retry-modal";
	modal.className = "escape-halfling-retry-modal";

	const panel = document.createElement("div");
	panel.className = "escape-halfling-retry-panel";

	const title = document.createElement("div");
	title.className = "escape-halfling-retry-title";
	title.textContent = "Халфлинг может сбросить карту, чтобы попытаться смыться повторно. Выбери карту и нажми «Подтвердить», либо откажись от способности.";

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "escape-halfling-retry-cards";

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "escape-halfling-retry-skip-btn";
	applyBtn.textContent = "Подтвердить сброс";
	applyBtn.disabled = true;

	const skipBtn = document.createElement("button");
	skipBtn.type = "button";
	skipBtn.className = "escape-halfling-retry-skip-btn";
	skipBtn.textContent = "Не использовать способность";

	let selectedCardId = "";

	const markHalflingAttemptConsumed = () => {
		escapeHalflingRetryUsedForCurrentAttempt = true;
	};

	const sendDecision = (useAbility, cardId = "") => {
		markHalflingAttemptConsumed();
		socket.emit("message", {
			method: "EscapeHalflingRetryDecision",
			seat: localSeat,
			useAbility,
			cardId,
		});
		hideEscapeHalflingRetryModal();
	};

	if (!cards.length) {
		const empty = document.createElement("div");
		empty.className = "escape-halfling-retry-empty";
		empty.textContent = "Нет карт для сброса";
		cardsWrap.appendChild(empty);
	} else {
		cards.forEach((card) => {
			const cardBtn = document.createElement("button");
			cardBtn.type = "button";
			cardBtn.className = "escape-halfling-retry-card";
			const img = document.createElement("img");
			img.src = card.img;
			img.alt = card.cardId;
			img.className = "escape-halfling-retry-card-img";
			cardBtn.appendChild(img);
			cardBtn.addEventListener("click", () => {
				cardsWrap.querySelectorAll(".escape-halfling-retry-card").forEach((x) => x.classList.remove("is-selected"));
				cardBtn.classList.add("is-selected");
				selectedCardId = String(card.cardId || "");
				applyBtn.disabled = !selectedCardId;
			});
			cardsWrap.appendChild(cardBtn);
		});
	}

	applyBtn.addEventListener("click", () => {
		if (!selectedCardId) {
			return;
		}
		sendDecision(true, selectedCardId);
	});

	skipBtn.addEventListener("click", () => sendDecision(false));

	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	panel.appendChild(skipBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);

	modal.addEventListener("click", (event) => {
		if (event.target === modal) {
			sendDecision(false);
		}
	});
	pushOpenModalsToServerDebounced();
}

/** Карты «Invisibility potion» в руке/main/side места (для модалки помощи после провала смывки). */
function getInvisibilityPotionTreasureCardIdsForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const out = [];
	const seen = new Set();
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s);
	[hand, main, side].forEach((zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const cid = String(cardEl?.id || "");
			if (!cid || !cid.includes("treasure") || seen.has(cid)) {
				return;
			}
			if (!isTreasureSpecial(cid, "Invisibility potion")) {
				return;
			}
			seen.add(cid);
			out.push(cid);
		});
	});
	return out;
}

function getMagicLampTreasureCardIdsForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const out = [];
	const seen = new Set();
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s);
	[hand, main, side].forEach((zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const cid = String(cardEl?.id || "");
			if (!cid || !cid.includes("treasure") || seen.has(cid)) {
				return;
			}
			if (!isTreasureSpecial(cid, "Magic lamp")) {
				return;
			}
			seen.add(cid);
			out.push(cid);
		});
	});
	return out;
}

function openEscapeFailAidModal({ seat, attemptNumber }) {
	hideEscapeFailAidModal();
	const s = Number(seat);
	if (!Number.isFinite(s) || Number(localSeat) !== Number(s)) {
		return;
	}
	const monId = String(escapeFailAidPending?.payload?.monsterCardId || "");
	const isWizard = String(characterBySeat?.[s]?.kind || "") === "Wizard";
	const wizardCards = getLocalPlayerAllCardsForWizardFlightDiscard();
	const canWizard = isWizard && wizardCards.length > 0;
	const canHalfling =
		Number(attemptNumber) === 1
		&& seatHasRace(s, "Halfling")
		&& !escapeHalflingRetryUsedForCurrentAttempt
		&& getLocalPlayerAllCardsForHalflingDiscard().length > 0;
	const invIds = getInvisibilityPotionTreasureCardIdsForSeat(s);
	const canInvis = invIds.length > 0 && Boolean(monId);
	const invTreasure = invIds.length ? window.treasures?.find((t) => t.name === invIds[0]) : null;
	const lampIds = getMagicLampTreasureCardIdsForSeat(s);
	const canLamp = lampIds.length > 0 && Boolean(monId) && Number(currentTurnSeat) === Number(s);
	const lampTreasure = lampIds.length ? window.treasures?.find((t) => t.name === lampIds[0]) : null;

	const entries = [];
	if (canInvis) {
		entries.push({
			key: "invis",
			cardId: invIds[0],
			img: invTreasure?.img || "",
			imageOnly: true,
			desc: "Сбрось зелье невидимости: автоматически смываешься от монстра, от которого только что не смог смыться. Карта уходит в сброс.",
		});
	}
	if (canLamp) {
		entries.push({
			key: "lamp",
			cardId: lampIds[0],
			img: lampTreasure?.img || "",
			imageOnly: true,
			desc: "Прогоняет одного выбранного монстра.",
		});
	}
	if (canWizard) {
		entries.push({
			key: "wizard",
			title: "Волшебник: Заклинание полета",
			desc: `Заклинание Полёта: сбрось до 3 карт - каждая даёт +1 к смывке (сейчас доступно карт: ${wizardCards.length})`,
		});
	}
	if (canHalfling) {
		entries.push({
			key: "halfling",
			title: "Халфлинг",
			desc: "Сбрось одну карту, чтобы бросить кубик на смывку ещё раз.",
		});
	}

	const modal = document.createElement("div");
	modal.id = "escape-fail-aid-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Смывка не удалась: помощь";
	const desc = document.createElement("div");
	desc.id = "escape-fail-aid-desc";
	desc.className = "wizard-taming-desc";
	desc.textContent = entries.length
		? "Выбери карту или способность ниже, затем нажми «Подтвердить»."
		: "Нет доступных карт и способностей для этой ситуации.";
	const wrap = document.createElement("div");
	wrap.className = "wizard-taming-pick-cards";

	let selected = null;
	const applyPick = () => {
		if (!selected) {
			return;
		}
		hideEscapeFailAidModal();
		if (selected.key === "invis") {
			const cardId = selected.cardId;
			if (!cardId || !monId) {
				return;
			}
			socket.emit("message", {
				method: "EscapeInvisibilityPotionApply",
				cardId,
				actingSeat: s,
				monsterCardId: monId,
			});
			return;
		}
		if (selected.key === "lamp") {
			const cardId = selected.cardId;
			if (!cardId || !monId) {
				return;
			}
			socket.emit("message", {
				method: "EscapeMagicLampBanish",
				cardId,
				actingSeat: s,
				monsterCardId: monId,
			});
			return;
		}
		if (selected.key === "wizard") {
			escapeWizardFlightPending = escapeFailAidPending?.payload ? { ...escapeFailAidPending.payload } : null;
			openWizardFlightModal();
			return;
		}
		if (selected.key === "halfling") {
			openHalflingRetryModalNow(s);
		}
	};

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Подтвердить";
	applyBtn.disabled = true;

	const cont = document.createElement("button");
	cont.type = "button";
	cont.className = "wizard-taming-pick-apply-btn";
	cont.textContent = "Продолжить без помощи";
	cont.addEventListener("click", () => {
		hideEscapeFailAidModal();
		socket.emit("message", { method: "EscapeFailAidSkip", seat: localSeat });
	});

	entries.forEach((ent) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.pickKey = ent.key;
		if (ent.imageOnly && ent.img) {
			const img = document.createElement("img");
			img.className = "wizard-taming-pick-card-img";
			img.src = ent.img;
			img.alt = "Invisibility potion";
			btn.appendChild(img);
		} else {
			const label = document.createElement("div");
			label.className = "wizard-taming-pick-sum";
			label.textContent = ent.title || ent.key;
			label.style.textAlign = "center";
			label.style.fontSize = "16px";
			label.style.color = "#e6e6e6";
			label.style.padding = "10px 8px";
			label.style.lineHeight = "1.25";
			btn.appendChild(label);
		}
		btn.addEventListener("click", () => {
			wrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selected = ent;
			desc.textContent = ent.desc || "";
			applyBtn.disabled = false;
		});
		wrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (applyBtn.disabled || !selected) {
			return;
		}
		applyPick();
	});

	panel.appendChild(title);
	panel.appendChild(desc);
	panel.appendChild(wrap);
	panel.appendChild(applyBtn);
	panel.appendChild(cont);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			cont.click();
		}
	});
	pushOpenModalsToServerDebounced();
}

/** Игрок, который сейчас смывается (очередь смывки), в т.ч. до выбора монстра. */
function getFleeingSeatForEscapeAid() {
	if (!escapeActive) {
		return null;
	}
	if (Array.isArray(escapeQueue) && escapeQueueIndex >= 0 && escapeQueueIndex < escapeQueue.length) {
		const s = escapeQueue[escapeQueueIndex];
		if (s != null && !Number.isNaN(Number(s))) {
			return Number(s);
		}
	}
	return null;
}

/**
 * «Уровень» монстра для правил вроде Rat on a stick (≤8): в данных это сила на карте (`power`),
 * а не `level` у Card_door (там часто число уровней/награды за победу).
 */
function getMonsterRatingForRatOnStick(cardId) {
	const id = String(cardId || "");
	if (!id) {
		return null;
	}
	const el = document.getElementById(id);
	const door = window.doors?.find((d) => d.name === id);
	if (!door) {
		return null;
	}
	const ratingFromDoor = (d) => {
		if (!d) {
			return null;
		}
		const p = Number(d.power);
		const l = Number(d.level);
		const pow = Number.isFinite(p) ? p : 0;
		const lvl = Number.isFinite(l) ? l : 0;
		const r = Math.max(pow, lvl);
		return r > 0 ? r : null;
	};
	if (String(door.special || "") === "Mate") {
		const srcId = String(el?.dataset?.mateSourceMonsterId || "");
		const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
		if (!srcDoor || String(srcDoor.race || "") !== "monster") {
			return null;
		}
		return ratingFromDoor(srcDoor);
	}
	if (String(door.race || "") !== "monster") {
		return null;
	}
	return ratingFromDoor(door);
}

function getPendingEscapeMonsterIdsForRat() {
	const ids = new Set();
	if (escapeCurrentMonsterCardId) {
		ids.add(String(escapeCurrentMonsterCardId));
	}
	(escapeMonsterQueue || []).forEach((m) => {
		if (m?.cardId) {
			ids.add(String(m.cardId));
		}
	});
	return ids;
}

/** Монстры 1–8 ур., от которых ещё предстоит смывка (текущий + очередь). */
function getRatOnStickEligibleMonstersForEscape() {
	const out = [];
	const monsterZone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
	getPendingEscapeMonsterIdsForRat().forEach((id) => {
		const el = document.getElementById(id);
		if (!el || !monsterZone || el.parentElement?.id !== "zone_monster") {
			return;
		}
		const rating = getMonsterRatingForRatOnStick(id);
		if (rating == null || rating < 1 || rating > 8) {
			return;
		}
		const door = window.doors?.find((d) => d.name === id);
		out.push({
			cardId: id,
			level: rating,
			img: door?.img || "",
		});
	});
	return out;
}

function removeMonsterIdFromEscapeQueues(monsterCardId) {
	const id = String(monsterCardId || "");
	if (!id) {
		return;
	}
	const strip = (arr) => {
		if (!Array.isArray(arr)) {
			return;
		}
		for (let i = arr.length - 1; i >= 0; i--) {
			if (String(arr[i]?.cardId || "") === id) {
				arr.splice(i, 1);
			}
		}
	};
	strip(escapeMonsterQueue);
	strip(escapeMonsterTemplateQueue);
}

function collectEscapeAidCardEntriesForSeat(seat) {
	const s = Number(seat);
	if (!Number.isFinite(s) || s < 0) {
		return [];
	}
	const canUseRat = getRatOnStickEligibleMonstersForEscape().length > 0;
	const out = [];
	const seen = new Set();
	const hand = getHandElementForPlayerSeat(s);
	const { main, side } = getMainAndSideZoneElementsForSeat(s);
	[hand, main, side].forEach((zoneEl) => {
		if (!zoneEl) {
			return;
		}
		zoneEl.querySelectorAll(".card").forEach((cardEl) => {
			const cid = cardEl?.id;
			if (!cid || !String(cid).includes("treasure") || seen.has(cid)) {
				return;
			}
			const tr = window.treasures?.find((t) => t.name === cid);
			if (canUseRat && isTreasureSpecial(cid, "Rat on a stick")) {
				seen.add(cid);
				out.push({
					cardId: cid,
					img: tr?.img || "",
					title: tr?.card_name || "Rat on a stick",
					aidKind: "rat_on_stick",
					desc: "Сбрось карту: автоматически смываешься без броска кубика от выбранного монстра 8 уровня или ниже. После активации карта уходит в сброс.",
				});
				return;
			}
			if (isTreasureSpecial(cid, "Instant wall")) {
				seen.add(cid);
				out.push({
					cardId: cid,
					img: tr?.img || "",
					title: tr?.card_name || "Instant wall",
					aidKind: "instant_wall",
					desc: "Сбрось карту: автоматически смываешься от ВСЕХ монстров в этом бою. Может сработать для одного или двух игроков (второму игроку придёт запрос принять стенку).",
				});
			}
		});
	});
	return out;
}

function openEscapeRatMonsterPickModal({ ratCardId, onCancel }) {
	hideEscapeRatMonsterPickModal();
	const monsters = getRatOnStickEligibleMonstersForEscape();
	if (!ratCardId || monsters.length <= 0) {
		return;
	}
	const modal = document.createElement("div");
	modal.id = "escape-rat-monster-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Крыса на палочке: выбери монстра (ур. 8 или ниже)";
	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Смыться от выбранного";
	applyBtn.disabled = true;
	let selectedMonster = null;
	monsters.forEach((m) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = m.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = m.img || "";
		img.alt = m.cardId;
		btn.appendChild(img);
		const sumEl = document.createElement("div");
		sumEl.className = "wizard-taming-pick-sum";
		sumEl.textContent = `Уровень: ${m.level}`;
		sumEl.style.marginTop = "4px";
		sumEl.style.fontSize = "16px";
		sumEl.style.color = "#ffd37a";
		sumEl.style.textAlign = "center";
		btn.appendChild(sumEl);
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selectedMonster = m.cardId;
			applyBtn.disabled = !selectedMonster;
		});
		cardsWrap.appendChild(btn);
	});
	applyBtn.addEventListener("click", () => {
		if (!selectedMonster) {
			return;
		}
		socket.emit("message", {
			method: "EscapeRatOnStickApply",
			ratCardId: String(ratCardId),
			monsterCardId: String(selectedMonster),
			actingSeat: Number(getFleeingSeatForEscapeAid()),
		});
		hideEscapeRatMonsterPickModal();
	});
	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideEscapeRatMonsterPickModal();
			if (typeof onCancel === "function") {
				onCancel();
			}
		}
	});
	pushOpenModalsToServerDebounced();
}

function openEscapeAidOptionsModal() {
	hideEscapeAidOptionsModal(true);
	hideBattleResult();
	const fleeSeat = getFleeingSeatForEscapeAid();
	if (fleeSeat == null || Number.isNaN(Number(fleeSeat)) || Number(localSeat) !== Number(fleeSeat)) {
		return;
	}
	if (!escapeActive) {
		return;
	}
	const inDicePhase = Boolean(escapeWaitingForRoll && escapeCurrentSeat != null && Number(escapeCurrentSeat) === fleeSeat);
	const inPickPhase = Boolean(!escapeWaitingForRoll && escapeMonsterPickSession && Number(escapeMonsterPickSession.seat) === fleeSeat);
	if (!inDicePhase && !inPickPhase) {
		return;
	}
	const entries = collectEscapeAidCardEntriesForSeat(fleeSeat);
	if (!entries.length) {
		return;
	}
	const modal = document.createElement("div");
	modal.id = "escape-aid-options-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Смывка: особые способы";
	const desc = document.createElement("div");
	desc.id = "escape-aid-options-desc";
	desc.className = "wizard-taming-desc";
	desc.textContent = "Выдели карту или способ, чтобы увидеть описание.";
	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Подтвердить выбор";
	applyBtn.disabled = true;
	let selected = null;
	entries.forEach((ent) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = ent.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = ent.img || "";
		img.alt = ent.cardId;
		btn.appendChild(img);
		const cap = document.createElement("div");
		cap.className = "wizard-taming-pick-sum";
		cap.textContent = ent.title || ent.cardId;
		cap.style.marginTop = "4px";
		cap.style.fontSize = "15px";
		cap.style.color = "#e6e6e6";
		cap.style.textAlign = "center";
		btn.appendChild(cap);
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selected = ent;
			desc.textContent = ent.desc || "";
			applyBtn.disabled = !selected;
		});
		cardsWrap.appendChild(btn);
	});
	applyBtn.addEventListener("click", () => {
		if (!selected) {
			return;
		}
		if (selected.aidKind === "rat_on_stick") {
			const ratId = String(selected.cardId || "");
			if (!document.getElementById(ratId)) {
				return;
			}
			hideEscapeAidOptionsModal(true);
			openEscapeRatMonsterPickModal({
				ratCardId: ratId,
				onCancel: () => {
					maybeTryOpenEscapeAidOptionsModal();
				},
			});
			return;
		}
		if (selected.aidKind === "instant_wall") {
			const fleeSeat = getFleeingSeatForEscapeAid();
			if (fleeSeat == null) {
				return;
			}
			const cid = String(selected.cardId || "");
			if (!cid) {
				return;
			}
			hideEscapeAidOptionsModal(true);
			socket.emit("message", { method: "InstantWallUse", cardId: cid, actingSeat: Number(fleeSeat) });
		}
	});
	panel.appendChild(title);
	panel.appendChild(desc);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	const hasWallAid = entries.some((e) => e && e.aidKind === "instant_wall");
	// Плашку видят все, кроме смывающегося: и в соло, и когда в очереди 2+ игрока (лидер выбирает стенку из aid-модалки).
	if (hasWallAid && Number.isFinite(Number(fleeSeat))) {
		instantWallSoloAidWaitingEmitted = true;
		socket.emit("message", { method: "InstantWallSoloAidWaiting", deciderSeat: Number(fleeSeat) });
	}
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			hideEscapeAidOptionsModal();
		}
	});
	pushOpenModalsToServerDebounced();
}

function maybeTryOpenEscapeAidOptionsModal() {
	if (!escapeActive) {
		return;
	}
	const fleeSeat = getFleeingSeatForEscapeAid();
	if (fleeSeat == null || Number(localSeat) !== fleeSeat) {
		return;
	}
	const inDicePhase = Boolean(escapeWaitingForRoll && escapeCurrentSeat != null && Number(escapeCurrentSeat) === fleeSeat);
	const inPickPhase = Boolean(!escapeWaitingForRoll && escapeMonsterPickSession && Number(escapeMonsterPickSession.seat) === fleeSeat);
	if (!inDicePhase && !inPickPhase) {
		return;
	}
	if (inDicePhase && escapeRollInProgress) {
		return;
	}
	if (document.getElementById("escape-aid-options-modal") || document.getElementById("escape-rat-monster-modal")) {
		return;
	}
	const entries = collectEscapeAidCardEntriesForSeat(fleeSeat);
	if (entries.length <= 0) {
		return;
	}
	setTimeout(() => {
		if (!escapeActive || Number(localSeat) !== fleeSeat) {
			return;
		}
		const inD = Boolean(escapeWaitingForRoll && escapeCurrentSeat != null && Number(escapeCurrentSeat) === fleeSeat);
		const inP = Boolean(!escapeWaitingForRoll && escapeMonsterPickSession && Number(escapeMonsterPickSession.seat) === fleeSeat);
		if (!inD && !inP) {
			return;
		}
		if (document.getElementById("escape-aid-options-modal") || document.getElementById("escape-rat-monster-modal")) {
			return;
		}
		openEscapeAidOptionsModal();
	}, 80);
}

function applyEscapeRatOnStickFromNetwork({ ratCardId, monsterCardId, actingSeat }) {
	const rat = String(ratCardId || "");
	const mon = String(monsterCardId || "");
	const act = Number(actingSeat);
	if (!rat || !mon || !Number.isFinite(act)) {
		return;
	}
	if (!escapeActive) {
		return;
	}
	const rating = getMonsterRatingForRatOnStick(mon);
	if (rating == null || rating < 1 || rating > 8) {
		return;
	}
	const pending = getPendingEscapeMonsterIdsForRat();
	if (!pending.has(mon)) {
		return;
	}
	// Сброс крысы: всегда по месту actingSeat (рука/экип соперника), не только когда локальная очередь смывки совпала.
	moveTreasureCardToDiscard(rat, { ownerSeat: act });
	hideEscapeAidOptionsModal(true);
	hideEscapeRatMonsterPickModal();
	adjustCardWidth(".myhand");
	adjustCardWidth(".zone2");
	adjustCardWidth(".zone5");
	adjustCardWidth(".opponenthand");
	adjustCardWidth(".opponent2hand");
	adjustCardWidth(".opponent3hand");
	UpdatebackImgTreasure();

	const fleeSeat = getFleeingSeatForEscapeAid();
	if (fleeSeat == null || Number(act) !== Number(fleeSeat)) {
		recalculateAllPowerDisplays();
		pushOpenModalsToServerDebounced();
		return;
	}

	if (mon === String(escapeCurrentMonsterCardId)) {
		escapeWaitingForRoll = false;
		escapeRollInProgress = false;
		const payload = {
			method: "EscapeRollResult",
			seat: act,
			rawRoll: 6,
			equipRemover: getSeatEquipmentRemover(act),
			monsterRemover: escapeMonsterRemover,
			totalRoll: ESCAPE_TARGET_ROLL,
			escaped: true,
			badStaffPenalty: null,
			monsterCardId: escapeCurrentMonsterCardId,
			viaRatOnStick: true,
		};
		if (localSeat === escapeOwnerSeat) {
			emitEscapeRollResultAndAdvance(payload);
		}
	} else {
		removeMonsterIdFromEscapeQueues(mon);
		showBattleResult("Крыса на палочке: ты сбежал от монстра без броска!");
		setTimeout(() => hideBattleResult(), 1600);
		flushTurnStateSyncToServer();
		const pickSeat = escapeMonsterPickSession != null ? Number(escapeMonsterPickSession.seat) : null;
		const stillInMonsterPick = !escapeWaitingForRoll && pickSeat != null && Number(act) === pickSeat;
		if (stillInMonsterPick) {
			const q = escapeMonsterQueue || [];
			hideEscapeMonsterPicker();
			if (q.length === 1 && localSeat === escapeOwnerSeat) {
				clearEscapeMonsterPickSession();
				socket.emit("message", {
					method: "EscapeMonsterChosen",
					seat: pickSeat,
					cardId: q[0].cardId,
				});
			} else if (q.length > 1 && Number(localSeat) === pickSeat) {
				showBattleResult("Выбери монстра, от которого будешь смываться.");
				showEscapeMonsterPicker(q, (cardId) => {
					hideEscapeMonsterPicker();
					socket.emit("message", {
						method: "EscapeMonsterChosen",
						seat: localSeat,
						cardId,
					});
				});
				escapeMonsterPickSession = {
					seat: pickSeat,
					monsters: cloneTurnStateJson(q) || [],
				};
				flushTurnStateSyncToServer();
			}
		}
	}
	recalculateAllPowerDisplays();
	pushOpenModalsToServerDebounced();
}

function clearEscapeMonsterPickSession() {
	escapeMonsterPickSession = null;
}

function showEscapeMonsterPicker(monsters, onPick) {
	hideEscapeMonsterPicker();
	const root = document.createElement("div");
	root.id = "escape-monster-picker";
	root.style.position = "fixed";
	root.style.left = "0";
	root.style.top = "0";
	root.style.width = "100vw";
	root.style.height = "100vh";
	root.style.background = "rgba(0,0,0,0.55)";
	root.style.zIndex = "1000";
	root.style.display = "flex";
	root.style.flexDirection = "column";
	root.style.alignItems = "center";
	root.style.justifyContent = "center";
	root.style.gap = "16px";

	const title = document.createElement("div");
	title.textContent = "Выбери монстра, от которого будешь смываться";
	title.style.color = "#fff";
	title.style.fontSize = "28px";
	title.style.textAlign = "center";
	root.appendChild(title);

	const row = document.createElement("div");
	row.style.display = "flex";
	row.style.gap = "14px";
	row.style.flexWrap = "wrap";
	row.style.justifyContent = "center";
	row.style.maxWidth = "90vw";

	monsters.forEach((m) => {
		const card = document.createElement("div");
		card.style.width = "270px";
		card.style.height = "383px";
		card.style.overflow = "hidden";
		card.style.cursor = "pointer";
		card.style.transition = "transform 0.18s ease";
		card.style.transformOrigin = "center";
		const img = document.createElement("img");
		img.src = m.img || "";
		img.style.width = "100%";
		img.style.height = "100%";
		img.style.objectFit = "contain";
		img.style.objectPosition = "center";
		card.appendChild(img);
		card.addEventListener("mouseenter", () => {
			card.style.transform = "scale(1.08)";
		});
		card.addEventListener("mouseleave", () => {
			card.style.transform = "scale(1)";
		});
		card.addEventListener("click", () => onPick(m.cardId));
		row.appendChild(card);
	});

	root.appendChild(row);
	document.body.appendChild(root);
}

function setCurrentEscapeMonsterById(cardId) {
	if (!cardId) {
		return;
	}
	const idx = escapeMonsterQueue.findIndex(m => m.cardId === cardId);
	let selected = null;
	if (idx >= 0) {
		selected = escapeMonsterQueue[idx];
		escapeMonsterQueue.splice(idx, 1);
	} else {
		selected = { cardId, remover: 0, badStaff: null, img: "" };
	}
	escapeCurrentMonsterCardId = selected.cardId;
	escapeMonsterRemover = Number(selected.remover) || 0;
	escapeMonsterBadStaff = normalizeBadStaff(selected.badStaff);
}

function selectMonsterAndStartEscapeTurn(cardId, seat) {
	setCurrentEscapeMonsterById(cardId);
	escapeAttemptNumber = 0;
	escapeHalflingRetryUsedForCurrentAttempt = false;
	escapeHalflingRetryPending = null;
	hideEscapeHalflingRetryModal();
	socket.emit("message", {
		method: "EscapeTurnStart",
		seat,
		index: escapeQueueIndex,
		isRetry: false,
	});
}

function finishEscapeSequenceAndBroadcast() {
	socket.emit("message", {
		method: "EscapeSequenceFinished",
	});
}

function runNextEscapeAttemptAndBroadcast() {
	if (!escapeActive) {
		return;
	}
	// Логика смывки по нескольким монстрам для сценария одного игрока.
	if (escapeQueue.length <= 1) {
		escapeQueueIndex = 0;
	} else if (escapeQueueIndex < 0) {
		escapeQueueIndex = 0;
		escapeMonsterQueue = escapeMonsterTemplateQueue.slice();
	}

	const seat = escapeQueue[escapeQueueIndex];
	if (seat === null || seat === undefined) {
		finishEscapeSequenceAndBroadcast();
		return;
	}

	// Instant wall: для отмеченных мест смывка всегда успешна и не требует действий игрока.
	if (escapeInstantWallAutoSeats && escapeInstantWallAutoSeats.has(Number(seat))) {
		// Автоматически выбираем первого монстра в очереди (нет смысла показывать выбор — стенка работает от всех).
		const nextMonsterId = escapeMonsterQueue?.[0]?.cardId;
		if (!nextMonsterId) {
			// Нет монстров — продвигаем очередь.
			escapeQueueIndex += 1;
			escapeMonsterQueue = escapeMonsterTemplateQueue.slice();
			runNextEscapeAttemptAndBroadcast();
			return;
		}
		selectMonsterAndStartEscapeTurn(nextMonsterId, Number(seat));
		// После EscapeTurnStart сразу публикуем успех.
		setTimeout(() => {
			const payload = {
				method: "EscapeRollResult",
				seat: Number(seat),
				rawRoll: 6,
				equipRemover: getSeatEquipmentRemover(Number(seat)),
				monsterRemover: escapeMonsterRemover,
				totalRoll: ESCAPE_TARGET_ROLL,
				escaped: true,
				badStaffPenalty: null,
				monsterCardId: escapeCurrentMonsterCardId,
				viaInstantWall: true,
			};
			if (Number(localSeat) === Number(escapeOwnerSeat)) {
				emitEscapeRollResultAndAdvance(payload);
			}
		}, 120);
		return;
	}

	if (escapeMonsterQueue.length <= 0) {
		escapeQueueIndex += 1;
		if (escapeQueueIndex >= escapeQueue.length) {
			finishEscapeSequenceAndBroadcast();
			return;
		}
		escapeMonsterQueue = escapeMonsterTemplateQueue.slice();
		runNextEscapeAttemptAndBroadcast();
		return;
	}

	const forcePickerEachTime = escapeMonsterInitialCount >= 2;
	if (!forcePickerEachTime && escapeMonsterQueue.length === 1) {
		selectMonsterAndStartEscapeTurn(escapeMonsterQueue[0].cardId, seat);
		return;
	}

	socket.emit("message", {
		method: "EscapeMonsterPickStart",
		seat,
		monsters: escapeMonsterQueue,
	});
}

function startEscapeSequenceAndBroadcast(loserSeat, helperSeat, monsterRemover) {
	const parsedLoserSeat = parseInt(loserSeat, 10);
	const parsedHelperSeat = parseInt(helperSeat, 10);
	if (Number.isNaN(parsedLoserSeat)) {
		return;
	}
	// Instant wall должен действовать только в рамках одной последовательности смывки (одного боя).
	escapeInstantWallGate = null;
	escapeInstantWallOfferPending = null;
	escapeInstantWallAutoSeats = new Set();

	const queue = [parsedLoserSeat];
	if (!Number.isNaN(parsedHelperSeat) && parsedHelperSeat !== parsedLoserSeat) {
		queue.push(parsedHelperSeat);
	}
	escapeActive = true;
	escapeQueue = queue;
	escapeQueueIndex = -1;
	escapeMonsterInitialCount = escapeMonsterQueue.length;
	escapeMonsterTemplateQueue = escapeMonsterQueue.slice();
	escapeMonsterRemover = Number(monsterRemover) || 0;
	escapeOwnerSeat = parsedLoserSeat;
	escapeRollInProgress = false;
	escapeCurrentMonsterCardId = null;
	escapeWizardFlightPending = null;

	socket.emit("message", {
		method: "EscapeSequenceStart",
		queue,
		monsterRemover: escapeMonsterRemover,
		monsterBadStaff: escapeMonsterBadStaff,
		monsterQueue: escapeMonsterQueue,
		monsterTemplateQueue: escapeMonsterTemplateQueue,
		monsterInitialCount: escapeMonsterInitialCount,
		ownerSeat: escapeOwnerSeat,
	});
	// Приоритет Instant wall у помощника: если есть помощник, даём ему шанс решить ДО старта смывки лидера.
	if (!Number.isNaN(parsedHelperSeat) && parsedHelperSeat !== parsedLoserSeat) {
		escapeInstantWallGate = { helperSeat: parsedHelperSeat, loserSeat: parsedLoserSeat };
		socket.emit("message", { method: "InstantWallHelperPrompt", helperSeat: parsedHelperSeat, loserSeat: parsedLoserSeat });
		// Плашку «помощник решает» шлёт владелец очереди — так её получают все клиенты (в т.ч. второй участник боя).
		socket.emit("message", { method: "InstantWallHelperWaiting", helperSeat: parsedHelperSeat, loserSeat: parsedLoserSeat });
		return;
	}
	runNextEscapeAttemptAndBroadcast();
}

function resolveEscapeRollAndBroadcast(seat, rawRoll) {
	if (!escapeActive || !escapeWaitingForRoll || seat !== escapeCurrentSeat) {
		return;
	}
	escapeAttemptNumber += 1;
	const equipRemover = getSeatEquipmentRemover(seat);
	const totalRoll = rawRoll + equipRemover + escapeMonsterRemover;
	const escaped = totalRoll >= ESCAPE_TARGET_ROLL;
	let badStaffPenalty = escaped ? null : normalizeBadStaff(escapeMonsterBadStaff);
	// Fallback: если по какой-то причине badStaff текущего монстра не проставился в escapeMonsterBadStaff,
	// берём его напрямую по id текущего монстра. Без этого смерть может не сработать.
	if (!escaped && !badStaffPenalty && escapeCurrentMonsterCardId) {
		const door = window.doors?.find((d) => d.name === escapeCurrentMonsterCardId);
		if (door && String(door.special || "") === "Mate") {
			const mateEl = document.getElementById(escapeCurrentMonsterCardId);
			const srcId = String(mateEl?.dataset?.mateSourceMonsterId || "");
			const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
			if (srcDoor?.bad_staff) {
				badStaffPenalty = normalizeBadStaff(srcDoor.bad_staff);
			}
		} else if (door?.bad_staff) {
			badStaffPenalty = normalizeBadStaff(door.bad_staff);
		}
	}
	escapeWaitingForRoll = false;
	escapeRollInProgress = false;

	socket.emit("message", {
		method: "RandDice",
		digit: rawRoll,
	});
	const resultPayload = {
		method: "EscapeRollResult",
		seat,
		rawRoll,
		equipRemover,
		monsterRemover: escapeMonsterRemover,
		totalRoll,
		escaped,
		badStaffPenalty,
		monsterCardId: escapeCurrentMonsterCardId,
	};
	// После провала смывки всегда даём игроку окно "помочь смывке" (пока: Волшебник и Халфлинг).
	if (!escaped) {
		escapeFailAidPending = { seat, payload: resultPayload, attemptNumber: escapeAttemptNumber };
		socket.emit("message", { method: "EscapeCloseAidModals" });
		setTimeout(() => {
			socket.emit("message", {
				method: "EscapeFailAidPrompt",
				seat,
				attemptNumber: escapeAttemptNumber,
				payload: resultPayload,
			});
		}, 300);
		return;
	}
	emitEscapeRollResultAndAdvance(resultPayload);
}

function canLocalPlayerRollEscapeNow() {
	if (!escapeActive || !escapeWaitingForRoll) {
		return false;
	}
	if (escapeCurrentSeat === null || escapeCurrentSeat === undefined) {
		return false;
	}
	if (localSeat === null || localSeat === undefined) {
		return false;
	}
	return Number(localSeat) === Number(escapeCurrentSeat);
}

function resolveCombatAndBroadcast() {
	const { hasMonster, levelSum, removerSum, badStaffSum, monsters } = getMonsterBattleContext();
	const helperSeatSnapshot = acceptedHelperSeat;
	const fightSeat = getMonsterFightSeat();

	if (!hasMonster) {
		socket.emit("message", {
			method: "CombatResolved",
			winner: "none",
			seat: fightSeat,
			helperSeat: helperSeatSnapshot,
			text: "",
		});
		return;
	}

	const playerPower = getNumericText('.MyBonus');
	const monsterPower = getEffectiveMonsterPower();
	const helperSeat = Number.isInteger(helperSeatSnapshot) ? helperSeatSnapshot : parseInt(helperSeatSnapshot, 10);
	const activeIsWarrior = isSeatWarriorClassActive(fightSeat);
	const helperIsWarrior = !Number.isNaN(helperSeat) && helperSeat >= 0 && isSeatWarriorClassActive(helperSeat);
	const warriorInBattle = activeIsWarrior || helperIsWarrior;

	if (warriorInBattle ? playerPower >= monsterPower : playerPower > monsterPower) {
		const seatToLevelMap = getSeatToLevelMap();
		const activeLevelSelector = seatToLevelMap[fightSeat];
		const activeLevel = activeLevelSelector ? getNumericText(activeLevelSelector) : 0;
		const nextLevel = activeLevel + levelSum;
		let helperLevel = null;
		let helperLevelGain = 0;
		if (!Number.isNaN(helperSeat) && helperSeat >= 0) {
			if (seatHasRace(helperSeat, "Elf")) {
				helperLevelGain = monsters.length;
				if (helperLevelGain > 0) {
					const helperLevelSelector = seatToLevelMap[helperSeat];
					const helperCurrentLevel = helperLevelSelector ? getNumericText(helperLevelSelector) : (levelBySeat[helperSeat] || 1);
					helperLevel = helperCurrentLevel + helperLevelGain;
				}
			}
		}

		setLevelBySeat(fightSeat, nextLevel);
		if (helperLevel !== null) {
			setLevelBySeat(helperSeat, helperLevel);
		}
		recalculateAllPowerDisplays();
		showBattleResult("Монстр повержен");

		socket.emit("message", {
			method: "CombatResolved",
			winner: "player",
			seat: fightSeat,
			level: nextLevel,
			helperSeat: helperSeatSnapshot,
			helperLevel,
			helperLevelGain,
			text: "Монстр повержен",
		});
		return;
	}

	showBattleResult("Победил монстр");
	socket.emit("message", {
		method: "CombatResolved",
		winner: "monster",
		seat: fightSeat,
		helperSeat: helperSeatSnapshot,
		monsterRemover: removerSum,
		monsterBadStaff: badStaffSum,
		monsterQueue: monsters,
		text: "Победил монстр",
	});
}

function recalculateMyBonusDisplay() {
	const seatToPowerMap = getSeatToPowerMap();
	const powerSeat = battleActive ? getMonsterFightSeat() : currentTurnSeat;
	const activePowerSelector = seatToPowerMap[powerSeat];
	const activeCharacterPower = activePowerSelector ? getNumericText(activePowerSelector) : 0;
	const zone3BonusPower = getTreasurePowerSum('.zone3');
	const doppelInZone3 = Boolean(document.querySelector(".zone3 #treasure47"));
	const doppelDoublingActive = battleActive
		&& acceptedHelperSeat === null
		&& doppelInZone3;
	const ch = powerSeat != null ? characterBySeat[powerSeat] : null;
	const equipPow = Number(ch?.equipmentPower) || 0;
	let activeCombatPower = activeCharacterPower;
	let zone3CombatPower = zone3BonusPower;
	if (doppelDoublingActive) {
		activeCombatPower = activeCharacterPower + equipPow;
		zone3CombatPower = 2 * zone3BonusPower;
	}
	// Change sex: -5 к силе в одном бою (когда игрок участвует в бою).
	if (battleActive && powerSeat != null && changeSexActiveBySeat.has(powerSeat) && isSeatParticipantInCurrentMonsterBattle(powerSeat)) {
		activeCombatPower -= 5;
	}
	let helpersBonusPower = 0;
	let frenzyBonusPower = 0;
	let exorcismBonusPower = 0;
	let yuppieWaterBonusPower = 0;
	const activeIsWarrior = String(characterBySeat[powerSeat]?.kind || "") === "Warrior";
	const activeIsCleric = String(characterBySeat[powerSeat]?.kind || "") === "Cleric";
	if (battleActive && powerSeat != null) {
		frenzyBonusPower += activeIsWarrior ? (Number(warriorFrenzyBonusBySeat[powerSeat]) || 0) : 0;
		exorcismBonusPower += activeIsCleric ? ((Number(clericExorcismBonusBySeat[powerSeat]) || 0) * 3) : 0;
	}
	if (battleActive && acceptedHelperSeat !== null) {
		helpersBonusPower += getSeatCombatPower(acceptedHelperSeat);
		const helperIsWarrior = String(characterBySeat[acceptedHelperSeat]?.kind || "") === "Warrior";
		const helperIsCleric = String(characterBySeat[acceptedHelperSeat]?.kind || "") === "Cleric";
		frenzyBonusPower += helperIsWarrior ? (Number(warriorFrenzyBonusBySeat[acceptedHelperSeat]) || 0) : 0;
		exorcismBonusPower += helperIsCleric ? ((Number(clericExorcismBonusBySeat[acceptedHelperSeat]) || 0) * 3) : 0;
	}
	// Yuppie water в zone3: +2 каждому эльфу в этом бою.
	if (battleActive && Boolean(document.querySelector(".zone3 #treasure51")) && powerSeat != null) {
		let elfCount = 0;
		if (seatHasRace(powerSeat, "Elf")) {
			elfCount += 1;
		}
		if (acceptedHelperSeat !== null && seatHasRace(acceptedHelperSeat, "Elf")) {
			elfCount += 1;
		}
		yuppieWaterBonusPower = 2 * elfCount;
	}
	let trimDebuffActive = 0;
	let trimDebuffHelper = 0;
	if (battleActive && powerSeat != null) {
		trimDebuffActive = Number(thiefBackstabDebuffBySeat[powerSeat]) || 0;
	}
	if (battleActive && acceptedHelperSeat !== null) {
		trimDebuffHelper = Number(thiefBackstabDebuffBySeat[acceptedHelperSeat]) || 0;
	}
	const myBonusValue = activeCombatPower + zone3CombatPower - trimDebuffActive
		+ (helpersBonusPower - trimDebuffHelper) + frenzyBonusPower + exorcismBonusPower + yuppieWaterBonusPower;

	setPowerText('.MyBonus', myBonusValue);
	return myBonusValue;
}

function applyTurnHighlight() {
	ALL_ICON_SELECTORS.forEach(selector => {
		const element = document.querySelector(selector);
		if (element) {
			element.style.filter = 'none';
		}
	});

	const seatToIconMap = getSeatToIconMap();
	const activeIconSelector = seatToIconMap[currentTurnSeat];
	const activeIcon = activeIconSelector ? document.querySelector(activeIconSelector) : null;
	if (activeIcon) {
		activeIcon.style.filter = ACTIVE_TURN_FILTER;
	}
	if (battleActive && acceptedHelperSeat !== null) {
		const helperIconSelector = seatToIconMap[acceptedHelperSeat];
		const helperIcon = helperIconSelector ? document.querySelector(helperIconSelector) : null;
		if (helperIcon) {
			helperIcon.style.filter = HELPER_FILTER;
		}
	}
}

function setCurrentTurn(seat, shouldBroadcast = false) {
	currentTurnSeat = seat;
	turnAwaitingManualEnd = false;
	clearThiefTheftBoardDicePrompt();
	escapeWizardFlightPending = null;
	hideWizardFlightModal();
	if (seat >= 0 && seat < halflingDoubleSellUsedBySeat.length) {
		halflingDoubleSellUsedBySeat[seat] = false;
	}
	for (let i = 0; i < warriorFrenzyUsedBySeat.length; i++) {
		warriorFrenzyUsedBySeat[i] = 0;
		warriorFrenzyBonusBySeat[i] = 0;
		clericExorcismUsedBySeat[i] = 0;
		clericExorcismBonusBySeat[i] = 0;
		victimThiefTrimUsedBySeat[i] = 0;
		thiefBackstabDebuffBySeat[i] = 0;
	}
	battleActive = false;
	battleTurnSeat = null;
	pendingHelpSeats.clear();
	acceptedHelperSeat = null;
	monsterFightSeat = null;
	applyTurnHighlight();
	recalculateMyBonusDisplay();
	updateHelpUi();
	updateWarriorFrenzyUi();
	updateClericExorcismUi();
	updateWizardTamingUi();
	updateWizardFlightUi();
	updateThiefTrimUi();
	updateThiefTheftUi();
	updateTurnActionButtons(false);

	if (shouldBroadcast) {
		const updateTurnData = {
			method: "SetTurn",
			seat: currentTurnSeat,
		};
		socket.emit("message", updateTurnData);
	}
}

function setRandomFirstTurn() {
	if (!num || num < 1) {
		return;
	}

	const randomSeat = Math.floor(Math.random() * num);
	setCurrentTurn(randomSeat, true);
}

function advanceTurnClockwise() {
	if (!num || num < 1) {
		return;
	}

	const nextSeat = (currentTurnSeat - 1 + num) % num;
	setCurrentTurn(nextSeat, true);
}

function getLocalHandCardCount() {
	const myHand = document.querySelector('.myhand');
	return myHand ? myHand.querySelectorAll('.card').length : 0;
}

function updateTurnActionButtons(isTimerRunning) {
	const foldButton = document.getElementById('fold');
	const endTurnButton = document.getElementById('end-turn');
	if (!foldButton || !endTurnButton) {
		return;
	}
	const isMyTurn = Number(localSeat) === Number(currentTurnSeat);
	const showFold = isTimerRunning && !turnAwaitingManualEnd;
	const showEndTurn = !isTimerRunning && isMyTurn && turnAwaitingManualEnd;
	foldButton.style.display = showFold ? "flex" : "none";
	endTurnButton.style.display = showEndTurn ? "flex" : "none";
}

/** Завершение хода вне боя (ручной конец хода). Должно работать и без вызова {@link timer}, иначе после refresh нет onclick. */
function tryCompleteManualTurnEnd() {
	if (Number(localSeat) !== Number(currentTurnSeat)) {
		return;
	}
	if (!turnAwaitingManualEnd) {
		return;
	}
	const handCount = getLocalHandCardCount();
	const handLimit = isSeatDwarfRaceActive(localSeat) ? 6 : 5;
	if (handCount > handLimit) {
		showBattleResult(`Сбрось лишние карты с руки (максимум ${handLimit}).`);
		setTimeout(() => {
			hideBattleResult();
		}, 1500);
		return;
	}
	hideBattleResult();
	turnAwaitingManualEnd = false;
	updateTurnActionButtons(false);
	advanceTurnClockwise();
}

function getNumericText(selector) {
	const element = document.querySelector(selector);
	const value = parseInt(element?.textContent ?? '0', 10);
	return Number.isNaN(value) ? 0 : value;
}

function getTreasurePowerSum(zoneSelector) {
	const cards = document.querySelectorAll(`${zoneSelector} .card`);
	let power = 0;

	cards.forEach(card => {
		const foundCard = window.treasures?.find(item => item.name === card.id);
		const cardPower = Number(foundCard?.power) || 0;
		if (cardPower > 0) {
			power += cardPower;
		}
	});

	return power;
}

function setPowerText(selector, value) {
	const element = document.querySelector(selector);
	if (element) {
		element.textContent = value;
	}
}

function applyMoveCardLocally(move) {
	const card = document.getElementById(move?.cardId);
	const target = move?.targetId ? document.getElementById(move.targetId) : null;
	let zone = null;
	if (move?.zoneId) {
		const z = String(move.zoneId);
		const handMatch = z.match(/^hand(\d)$/);
		const mainMatch = z.match(/^main(\d)$/);
		const sideMatch = z.match(/^side(\d)$/);
		if (handMatch) {
			zone = getHandElementForPlayerSeat(parseInt(handMatch[1], 10));
		} else if (mainMatch) {
			zone = getMainAndSideZoneElementsForSeat(parseInt(mainMatch[1], 10))?.main || null;
		} else if (sideMatch) {
			zone = getMainAndSideZoneElementsForSeat(parseInt(sideMatch[1], 10))?.side || null;
		} else {
			zone = document.getElementById(z);
		}
	}
	if (!card || !zone) {
		return;
	}
	if (target && zone.contains(target)) {
		zone.insertBefore(card, target.nextSibling);
	} else {
		zone.appendChild(card);
	}
	adjustCardWidth('.myhand');
	adjustCardWidth('.zone2');
	adjustCardWidth('.zone5');
	adjustCardHeight('.zone3');
	adjustCardHeight('.zone_monster');
	adjustCardWidth('.opponenthand');
	adjustCardWidth('.zone_opponent');
	adjustCardWidth('.zone_opponent_side');
	adjustCardWidth('.opponent2hand');
	adjustCardWidth('.zone_opponent2');
	adjustCardWidth('.zone_opponent2_side');
	adjustCardWidth('.opponent3hand');
	adjustCardWidth('.zone_opponent3');
	adjustCardWidth('.zone_opponent3_side');
	UpdatebackImgTreasure();
	UpdatebackImgDoor();
	recalculateAllPowerDisplays();
}

// Снапшоты от клиентов отключены: состояние комнаты хранит сервер.

function clearAllNonPlaceholderCards() {
	document.querySelectorAll('.cards-zone .card').forEach((el) => {
		if (el?.id && el.id !== "card") {
			el.remove();
		}
	});
}

function ensureDecksFilledForSnapshot(state) {
	// Если карт ещё нет — заполняем зоны колод.
	const anyDoor = document.querySelector('#zone_doors .card[id^="door"]');
	const anyTreasure = document.querySelector('#zone_treasure .card[id^="treasure"]');
	if (anyDoor || anyTreasure) {
		return;
	}
	window.doors = Array.isArray(state.deckDoors) ? state.deckDoors : (window.doors || []);
	window.treasures = Array.isArray(state.deckTreasure) ? state.deckTreasure : (window.treasures || []);
	window.zonedoor = document.querySelector('.zone_doors');
	window.zoneTreasure = document.querySelector('.zone_treasure');
	if (window.zonedoor && window.zoneTreasure) {
		Deck_filling(window.doors, window.zonedoor);
		UpdatebackImgDoor();
		Deck_filling(window.treasures, window.zoneTreasure);
		UpdatebackImgTreasure();
		UpdateZones();
		window.allCards = document.querySelectorAll('.card');
	}
}

function applyRoomStateFromServer(state) {
	const zoneDoors = document.getElementById("zone_doors");
	const zoneTreasure = document.getElementById("zone_treasure");
	if (!zoneDoors || !zoneTreasure) {
		setTimeout(() => applyRoomStateFromServer(state), 80);
		return;
	}

	clearAllNonPlaceholderCards();
	ensureDecksFilledForSnapshot(state);

	// Переносим карты по зонам.
	// ВАЖНО: порядок в сбросах восстанавливаем строго по targetId-цепочкам (а не по порядку ключей объекта).
	const cards = state.cards && typeof state.cards === "object" ? state.cards : {};
	/** @type {{ id: string, el: HTMLElement, zoneEl: HTMLElement, targetId: string | null }[]} */
	const items = [];
	Object.entries(cards).forEach(([cardId, pos]) => {
		const el = document.getElementById(cardId);
		if (!el) return;
		const zoneId = String(pos?.zoneId || "");
		const targetId = pos?.targetId ? String(pos.targetId) : null;
		let zoneEl = null;
		const handMatch = zoneId.match(/^hand(\d)$/);
		const mainMatch = zoneId.match(/^main(\d)$/);
		const sideMatch = zoneId.match(/^side(\d)$/);
		if (handMatch) {
			zoneEl = getHandElementForPlayerSeat(parseInt(handMatch[1], 10));
		} else if (mainMatch) {
			zoneEl = getMainAndSideZoneElementsForSeat(parseInt(mainMatch[1], 10))?.main || null;
		} else if (sideMatch) {
			zoneEl = getMainAndSideZoneElementsForSeat(parseInt(sideMatch[1], 10))?.side || null;
		} else {
			zoneEl = zoneId ? document.getElementById(zoneId) : null;
		}
		if (!zoneEl) return;
		items.push({ id: cardId, el, zoneEl, targetId });
	});

	const byZone = new Map();
	items.forEach((it) => {
		const key = it.zoneEl;
		const arr = byZone.get(key) || [];
		arr.push(it);
		byZone.set(key, arr);
	});

	const isDiscardZoneId = (zoneEl) => {
		const id = String(zoneEl?.id || "");
		return id === "zone_doors_drop" || id === "zone_treasure_drop";
	};

	byZone.forEach((zoneItems, zoneEl) => {
		if (isDiscardZoneId(zoneEl)) {
			// Критично: верх сброса должен соответствовать "последним moveCard" на сервере.
			// Сервер поддерживает порядок ключей state.cards как историю последних перемещений,
			// поэтому для сброса восстанавливаем строго в этом порядке (без targetId-графов).
			zoneItems.forEach((it) => zoneEl.appendChild(it.el));
			return;
		}
		// Для не-сбросов порядок не критичен: вставляем по targetId, иначе append.
		zoneItems.forEach((it) => {
			if (it.targetId) {
				const target = document.getElementById(it.targetId);
				if (target && target !== it.el && zoneEl.contains(target)) {
					zoneEl.insertBefore(it.el, target.nextSibling);
					return;
				}
			}
			zoneEl.appendChild(it.el);
		});
	});

	// Восстанавливаем привязки Cheat/Наёмничка.
	const cheat = state.cheatAttachments && typeof state.cheatAttachments === "object" ? state.cheatAttachments : {};
	Object.entries(cheat).forEach(([cheatId, trId]) => {
		if (cheatId && trId) {
			setCheatAttachment(String(cheatId), String(trId));
		}
	});
	const hire = state.hirelingAttachments && typeof state.hirelingAttachments === "object" ? state.hirelingAttachments : {};
	Object.entries(hire).forEach(([hId, trId]) => {
		if (hId && trId) {
			setHirelingAttachment(String(hId), String(trId));
		}
	});

	const mba = state.monsterBonusAttachments && typeof state.monsterBonusAttachments === "object" ? state.monsterBonusAttachments : {};
	lastMonsterBonusAttachmentsJson = JSON.stringify(mba);
	Object.entries(mba).forEach(([bonusId, monsterId]) => {
		if (bonusId && monsterId) {
			setBonusPowerMonsterAttachment(String(bonusId), String(monsterId));
		}
	});

	// Обновляем UI.
	// Важно: после refresh мог остаться "disabled" стиль зон от setZoneInteractivityByPlayers(0),
	// поэтому принудительно включаем интерактивность под текущее число игроков.
	const nPlayers = Number(state?.num) || window.num || num || 0;
	updatePlayersUiVisibility(nPlayers);
	bindSeatIconHoverTooltips();
	UpdatebackImgDoor();
	UpdatebackImgTreasure();
	UpdateZones();
	adjustCardWidth('.myhand');
	adjustCardWidth('.zone2');
	adjustCardWidth('.zone5');
	adjustCardHeight('.zone3');
	adjustCardHeight('.zone_monster');
	adjustCardWidth('.opponenthand');
	recalculateAllPowerDisplays();
	applyTurnHighlight();

	// После раскладки карт DOM заметно меняется — перевязываем drag&drop и сбрасываем визуальные "залипания".
	try { window.dispatchEvent(new Event("munchkin:zonesChanged")); } catch {}

	gameStarted = true;
	// Восстанавливаем только то, что хранит сервер-авторитет.
	const g = state.game && typeof state.game === "object" ? state.game : null;
	if (g) {
		if (Number.isFinite(Number(g.currentTurnSeat))) currentTurnSeat = Number(g.currentTurnSeat);
		// Уровни игроков
		if (Array.isArray(g.levelBySeat)) {
			g.levelBySeat.forEach((lvl, i) => {
				setLevelBySeat(i, lvl);
			});
		}
		// Бонусы от способностей (Warrior/Cleric/Thief)
		if (Array.isArray(g.warriorFrenzyUsedBySeat)) {
			g.warriorFrenzyUsedBySeat.forEach((v, i) => { warriorFrenzyUsedBySeat[i] = Number(v) || 0; });
		}
		if (Array.isArray(g.warriorFrenzyBonusBySeat)) {
			g.warriorFrenzyBonusBySeat.forEach((v, i) => { warriorFrenzyBonusBySeat[i] = Number(v) || 0; });
		}
		if (Array.isArray(g.clericExorcismUsedBySeat)) {
			g.clericExorcismUsedBySeat.forEach((v, i) => { clericExorcismUsedBySeat[i] = Number(v) || 0; });
		}
		if (Array.isArray(g.clericExorcismBonusBySeat)) {
			g.clericExorcismBonusBySeat.forEach((v, i) => { clericExorcismBonusBySeat[i] = Number(v) || 0; });
		}
		if (Array.isArray(g.victimThiefTrimUsedBySeat)) {
			g.victimThiefTrimUsedBySeat.forEach((v, i) => { victimThiefTrimUsedBySeat[i] = Number(v) || 0; });
		}
		if (Array.isArray(g.thiefBackstabDebuffBySeat)) {
			g.thiefBackstabDebuffBySeat.forEach((v, i) => { thiefBackstabDebuffBySeat[i] = Number(v) || 0; });
		}
		// Бонусы на поле
		if (Number.isFinite(Number(g.myBonus))) {
			const el = document.getElementById("MyBonus");
			if (el) el.textContent = String(Number(g.myBonus) || 0);
		}
		if (Number.isFinite(Number(g.monsterBasePower))) {
			setMonsterBasePower(Number(g.monsterBasePower) || 0);
		}
		if (g.turnPhase && typeof g.turnPhase === "object" && g.turnPhase.v === 1) {
			applyTurnPhaseFromServer(g.turnPhase);
		}
		applyTurnHighlight();
		if (g.timerRunning && Number(g.turnStartedAt) > 0 && Number(g.turnDurationMs) > 0) {
			const remainingMs = Number(g.turnDurationMs) - (Date.now() - Number(g.turnStartedAt));
			const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
			updateTurnActionButtons(true);
			timer(remainingSec, true);
		} else {
			updateTurnActionButtons(false);
		}
		lastTurnStateSyncJson = JSON.stringify(serializeTurnPhaseForServer());
	}

	const endTurnEl = document.getElementById("end-turn");
	if (endTurnEl) {
		endTurnEl.onclick = tryCompleteManualTurnEnd;
	}

	// После refresh нужно заново инициализировать интерактивный UI (кубик/кнопки/продажа),
	// т.к. обработчик StartGame на этом клиенте не выполнялся.
	initializeSellTreasuresUi();
	const thiefTheftInitBtn = document.getElementById("thief-theft-btn");
	if (thiefTheftInitBtn) {
		thiefTheftInitBtn.onclick = () => openThiefTheftModal();
	}
	const thiefTrimInitBtn = document.getElementById("thief-trim-btn");
	if (thiefTrimInitBtn) {
		thiefTrimInitBtn.onclick = () => openThiefTrimModal();
	}
	const wizardTamingInitBtn = document.getElementById("wizard-taming-btn");
	if (wizardTamingInitBtn) {
		wizardTamingInitBtn.onclick = () => openWizardTamingModal();
	}
	updateWizardTamingUi();
	updateWizardFlightUi();
	updateThiefTheftUi();
	updateThiefTrimUi();
	setupMunchkinDiceAfterGameStart();
	// Если кнопка "Начать игру" ещё есть — убираем.
	// Всегда ищем в document: после «назад/вперёд» React смонтирует новую кнопку, а window.button
	// может указывать на старый уже отсоединённый узел — тогда remove() не трогает новую кнопку.
	try {
		document.querySelector(".button_start_game")?.remove?.();
		window.button = null;
	} catch {}

	ensureRoomOpenModalsMutationObserver();
	if (g) {
		restoreOpenModalsFromServerGameState(g);
	}
	reopenEphemeralUiAfterTurnPhaseRestore();
}

function getMonsterBasePower() {
	const el = document.querySelector('.MonsterBonus');
	if (!el) {
		return 0;
	}
	const fromDataset = Number(el.dataset?.basePower);
	if (Number.isFinite(fromDataset)) {
		return fromDataset;
	}
	// База силы должна быть независима от advantage и от того, что уже показано в DOM.
	// Берём сумму power карт, лежащих в зоне монстра.
	const base = computeMonsterZoneBasePower();
	el.dataset.basePower = String(base);
	return base;
}

function setMonsterBasePower(value) {
	const el = document.querySelector('.MonsterBonus');
	if (!el) {
		return;
	}
	let v = Number(value) || 0;
	el.dataset.basePower = String(v);
	// Отображаем всегда «эффективную» силу (с учётом advantage).
	updateEffectiveMonsterBonusDisplay();
}

function computeMonsterZoneBasePower() {
	const zoneCards = document.querySelectorAll('.zone_monster .card');
	let sum = 0;
	zoneCards.forEach((cardEl) => {
		const door = window.doors?.find((d) => d.name === cardEl.id);
		if (door) {
			// В зоне монстра могут лежать:
			// - монстры (door.race === "monster") → всегда считаем power
			// - модификаторы силы монстра (special === "bonus_power_monster") → считаем только если привязаны
			if (door.race === "monster") {
				sum += Number(door.power) || 0;
				return;
			}
			// Mate: второй монстр копирует выбранного монстра по силе.
			if (String(door.special || "") === "Mate") {
				const srcId = String(cardEl.dataset?.mateSourceMonsterId || "");
				if (!srcId) {
					return;
				}
				const srcDoor = window.doors?.find((d) => d.name === srcId);
				if (srcDoor && String(srcDoor.race || "") === "monster") {
					sum += Number(srcDoor.power) || 0;
				}
				return;
			}
			if (String(door.special || "") === "bonus_power_monster") {
				const attachedTo = cardEl.dataset?.attachedMonsterId;
				if (attachedTo) {
					// Учитываем только если привязка указывает на реально лежащего монстра/пару.
					const targetEl = document.getElementById(attachedTo);
					const targetDoor = targetEl ? window.doors?.find((d) => d.name === targetEl.id) : null;
					const isTargetInMonsterZone = Boolean(targetEl?.closest?.(".zone_monster"));
					const isTargetMonsterLike = Boolean(
						(targetDoor && targetDoor.race === "monster")
						|| (targetDoor && String(targetDoor.special || "") === "Mate" && String(targetEl.dataset?.mateSourceMonsterId || ""))
					);
					if (isTargetInMonsterZone && isTargetMonsterLike) {
						// Если у монстра есть Mate-пара — бонус действует на обоих.
						const mult = getMateBonusMultiplierForTargetEl(targetEl);
						sum += (Number(door.power) || 0) * mult;
					}
				}
				return;
			}
			// Остальные двери в зоне монстра не влияют на силу напрямую.
			return;
		}
		// Сокровища в зоне монстра не учитываем (здесь только двери/модификаторы).
	});
	return sum;
}

function isActiveMatePairId(pairId) {
	if (!pairId) {
		return false;
	}
	const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
	if (!zone) {
		return false;
	}
	let count = 0;
	zone.querySelectorAll(".card").forEach((el) => {
		if (String(el?.dataset?.matePairId || "") === String(pairId)) {
			count += 1;
		}
	});
	return count >= 2;
}

function getMateBonusMultiplierForTargetEl(targetEl) {
	const pairId = String(targetEl?.dataset?.matePairId || "");
	return isActiveMatePairId(pairId) ? 2 : 1;
}

function setBonusPowerMonsterAttachment(cardId, monsterCardId) {
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	el.dataset.attachedMonsterId = monsterCardId || "";
	recalculateAllPowerDisplays();
}

function collectMonsterBonusAttachmentsFromDom() {
	const out = {};
	const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
	if (!zone) {
		return out;
	}
	zone.querySelectorAll(".card").forEach((el) => {
		const id = el?.id;
		if (!id) {
			return;
		}
		const door = window.doors?.find((d) => d.name === id);
		if (!door || String(door.special || "") !== "bonus_power_monster") {
			return;
		}
		const att = String(el.dataset?.attachedMonsterId || "").trim();
		if (att) {
			out[String(id)] = att;
		}
	});
	return out;
}

let lastMonsterBonusAttachmentsJson = "";
function pushMonsterBonusAttachmentsToServer() {
	if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
		return;
	}
	const attachments = collectMonsterBonusAttachmentsFromDom();
	const json = JSON.stringify(attachments);
	if (json === lastMonsterBonusAttachmentsJson) {
		return;
	}
	lastMonsterBonusAttachmentsJson = json;
	socket.emit("message", { method: "MonsterBonusState", attachments });
}

function collectVisibleModalIdsForRoomUiSync() {
	const out = [];
	const seen = new Set();
	document.querySelectorAll("[id]").forEach((el) => {
		const id = el.id;
		if (!id || seen.has(id)) {
			return;
		}
		if (!id.includes("modal") && id !== "escape-monster-picker") {
			return;
		}
		// Эфемерные модалки стенки/клея не синхронизируем — иначе у других клиентов может «всплыть» старая стенка после выбора монстра.
		if (id === "instant-wall-modal" || id === "flask-glue-modal") {
			return;
		}
		seen.add(id);
		if (!el.isConnected) {
			return;
		}
		const st = window.getComputedStyle(el);
		if (st.display === "none" || st.visibility === "hidden") {
			return;
		}
		out.push(id);
	});
	return out;
}

let openModalsSyncTimer = null;
let lastOpenModalIdsJson = "";
function pushOpenModalsToServerDebounced() {
	if (openModalsSyncTimer) {
		clearTimeout(openModalsSyncTimer);
	}
	openModalsSyncTimer = setTimeout(() => {
		openModalsSyncTimer = null;
		if (typeof socket === "undefined" || !socket || typeof socket.emit !== "function") {
			return;
		}
		if (localSeat == null || Number.isNaN(Number(localSeat))) {
			return;
		}
		const ids = collectVisibleModalIdsForRoomUiSync();
		const json = JSON.stringify(ids);
		if (json === lastOpenModalIdsJson) {
			return;
		}
		lastOpenModalIdsJson = json;
		socket.emit("message", { method: "RoomUiState", seat: localSeat, openModalIds: ids });
	}, 200);
}

let openModalsObserverStarted = false;
function ensureRoomOpenModalsMutationObserver() {
	if (openModalsObserverStarted || typeof MutationObserver === "undefined") {
		return;
	}
	if (!document.body) {
		return;
	}
	openModalsObserverStarted = true;
	const obs = new MutationObserver(() => pushOpenModalsToServerDebounced());
	obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "id"] });
}

/**
 * Окна, которые зависят от turnPhase (deathLoot, смывка волшебника), а не только из openModalsBySeat.
 * Вызывать после applyTurnPhaseFromServer и раскладки карт (doors/treasures в памяти).
 */
function reopenEphemeralUiAfterTurnPhaseRestore() {
	if (deathLootActive && deathLootState && typeof deathLootState === "object") {
		const ix = Number(deathLootState.index);
		const idx = Number.isFinite(ix) ? ix : 0;
		const order = Array.isArray(deathLootState.lootersOrder) ? deathLootState.lootersOrder : [];
		const looterSeat = order[idx];
		const deadSeat = Number(deathLootState.deadSeat);
		const remaining = Array.isArray(deathLootState.remaining) ? deathLootState.remaining.filter(Boolean) : [];
		if (localSeat != null && !Number.isNaN(Number(localSeat)) && Number(localSeat) === Number(looterSeat) && remaining.length > 0 && !Number.isNaN(deadSeat)) {
			openDeathLootPickModal(deadSeat, looterSeat, remaining.slice());
			showLootStatus(`Твоя очередь грабить ${getSeatLabel(deadSeat)}`);
		} else {
			const lootModal = document.getElementById("death-loot-pick-modal");
			if (lootModal) {
				lootModal.remove();
			}
		}
	} else {
		const lootModal = document.getElementById("death-loot-pick-modal");
		if (lootModal) {
			lootModal.remove();
		}
	}
	if (canLocalUseWizardFlightNow()) {
		openWizardFlightModal();
	}
	if (escapeActive && escapeWaitingForRoll && escapeCurrentSeat != null && !Number.isNaN(Number(escapeCurrentSeat))) {
		hideEscapeMonsterPicker();
		showEscapeTurnText(escapeCurrentSeat);
		if (localSeat != null && Number(localSeat) === Number(escapeCurrentSeat)) {
			escapeRollInProgress = false;
		}
	}
	const queueIdSet = new Set((escapeMonsterQueue || []).map((m) => String(m?.cardId || "")));
	const rawPickMonsters = escapeMonsterPickSession && Array.isArray(escapeMonsterPickSession.monsters)
		? escapeMonsterPickSession.monsters
		: [];
	const monstersForPicker = rawPickMonsters.filter((m) => queueIdSet.has(String(m?.cardId || "")));
	if (
		escapeActive
		&& !escapeWaitingForRoll
		&& escapeMonsterPickSession
		&& typeof escapeMonsterPickSession === "object"
		&& monstersForPicker.length > 0
		&& Number(localSeat) === Number(escapeMonsterPickSession.seat)
	) {
		const pickSeat = Number(escapeMonsterPickSession.seat);
		const aidEntries = collectEscapeAidCardEntriesForSeat(pickSeat);
		const hasAid = aidEntries.length > 0;
		if (hasAid) {
			openEscapeAidOptionsModal();
		} else {
			maybeTryOpenEscapeAidOptionsModal();
		}
		if (!hasAid && !shouldSuppressEscapeMonsterPickBannerForSeat(pickSeat)) {
			showBattleResult("Выбери монстра, от которого будешь смываться.");
			showEscapeMonsterPicker(monstersForPicker, (cardId) => {
				hideEscapeMonsterPicker();
				socket.emit("message", {
					method: "EscapeMonsterChosen",
					seat: localSeat,
					cardId,
				});
			});
		}
	} else if (escapeMonsterPickSession && Number(localSeat) !== Number(escapeMonsterPickSession.seat)) {
		hideEscapeMonsterPicker();
		const pickSeat = Number(escapeMonsterPickSession.seat);
		if (monstersForPicker.length > 0 && !shouldSuppressEscapeMonsterPickBannerForSeat(pickSeat)) {
			showBattleResult(`${getSeatLabel(escapeMonsterPickSession.seat)} выбирает монстра для смывки...`);
		}
	} else {
		hideEscapeMonsterPicker();
		if (!escapeActive) {
			clearEscapeMonsterPickSession();
		} else if (escapeMonsterPickSession && monstersForPicker.length === 0) {
			clearEscapeMonsterPickSession();
		}
	}
	maybeTryOpenEscapeAidOptionsModal();
}

function restoreOpenModalsFromServerGameState(g) {
	if (!g || typeof g.openModalsBySeat !== "object") {
		return;
	}
	if (localSeat == null || Number.isNaN(Number(localSeat))) {
		return;
	}
	const ids = Array.isArray(g.openModalsBySeat[String(localSeat)]) ? g.openModalsBySeat[String(localSeat)] : [];
	lastOpenModalIdsJson = JSON.stringify(ids);
	ids.forEach((id) => {
		if (!id || document.getElementById(id)) {
			return;
		}
		try {
			switch (id) {
				case "sell-treasures-modal":
					openSellTreasuresModal();
					break;
				case "player-profile-modal":
					openPlayerProfileModal();
					break;
				case "warrior-frenzy-modal":
					openWarriorFrenzyModal();
					break;
				case "cleric-exorcism-modal":
					openClericExorcismModal();
					break;
				case "thief-theft-modal":
					openThiefTheftModal();
					break;
				case "thief-theft-steal-modal":
					openThiefTheftStealModal();
					break;
				case "thief-trim-modal":
					openThiefTrimModal();
					break;
				case "wizard-flight-modal":
					openWizardFlightModal();
					break;
				case "wizard-taming-modal":
					openWizardTamingModal();
					break;
				case "escape-aid-options-modal":
					maybeTryOpenEscapeAidOptionsModal();
					break;
				case "escape-rat-monster-modal":
					maybeTryOpenEscapeAidOptionsModal();
					break;
				default:
					break;
			}
		} catch {
			// Модалка могла потребовать контекст (смывка/выбор), который после refresh недоступен.
		}
	});
}

function cloneTurnStateJson(value) {
	if (value == null) {
		return null;
	}
	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return null;
	}
}

function serializeTurnPhaseForServer() {
	return {
		v: 1,
		currentTurnSeat: Number.isFinite(Number(currentTurnSeat)) ? Number(currentTurnSeat) : 0,
		battleActive: Boolean(battleActive),
		battleTurnSeat: battleTurnSeat == null || Number.isNaN(Number(battleTurnSeat)) ? null : Number(battleTurnSeat),
		monsterFightSeat: monsterFightSeat == null || Number.isNaN(Number(monsterFightSeat)) ? null : Number(monsterFightSeat),
		turnAwaitingManualEnd: Boolean(turnAwaitingManualEnd),
		pendingHelpSeats: Array.from(pendingHelpSeats || []).map((x) => Number(x)).filter((x) => !Number.isNaN(x)),
		acceptedHelperSeat: acceptedHelperSeat == null || Number.isNaN(Number(acceptedHelperSeat)) ? null : Number(acceptedHelperSeat),
		escapeActive: Boolean(escapeActive),
		escapeQueue: Array.isArray(escapeQueue) ? escapeQueue.map((x) => Number(x)).filter((x) => !Number.isNaN(x)) : [],
		escapeQueueIndex: Number.isFinite(Number(escapeQueueIndex)) ? Number(escapeQueueIndex) : -1,
		escapeMonsterRemover: Number(escapeMonsterRemover) || 0,
		escapeMonsterBadStaff: cloneTurnStateJson(escapeMonsterBadStaff),
		escapeMonsterQueue: Array.isArray(escapeMonsterQueue) ? cloneTurnStateJson(escapeMonsterQueue) : [],
		escapeMonsterInitialCount: Number(escapeMonsterInitialCount) || 0,
		escapeMonsterTemplateQueue: Array.isArray(escapeMonsterTemplateQueue) ? cloneTurnStateJson(escapeMonsterTemplateQueue) : [],
		escapeCurrentMonsterCardId: escapeCurrentMonsterCardId == null ? null : String(escapeCurrentMonsterCardId),
		escapeCurrentSeat: escapeCurrentSeat == null || Number.isNaN(Number(escapeCurrentSeat)) ? null : Number(escapeCurrentSeat),
		escapeWaitingForRoll: Boolean(escapeWaitingForRoll),
		escapeOwnerSeat: escapeOwnerSeat == null || Number.isNaN(Number(escapeOwnerSeat)) ? null : Number(escapeOwnerSeat),
		escapeRollInProgress: Boolean(escapeRollInProgress),
		escapeAttemptNumber: Number(escapeAttemptNumber) || 0,
		escapeHalflingRetryUsedForCurrentAttempt: Boolean(escapeHalflingRetryUsedForCurrentAttempt),
		escapeHalflingRetryPending: cloneTurnStateJson(escapeHalflingRetryPending),
		escapeWizardFlightPending: cloneTurnStateJson(escapeWizardFlightPending),
		escapeMonsterPickSession:
			escapeWaitingForRoll || escapeCurrentMonsterCardId != null
				? null
				: cloneTurnStateJson(escapeMonsterPickSession),
		deathLootActive: Boolean(deathLootActive),
		deathLootState: cloneTurnStateJson(deathLootState),
		resumeEscapeAfterLoot: Boolean(resumeEscapeAfterLoot),
		deathLootAwaitingEscapeFinish: Boolean(deathLootAwaitingEscapeFinish),
		thiefTheftBoardDicePending: Boolean(thiefTheftBoardDicePending),
		thiefTheftBoardDiceInProgress: Boolean(thiefTheftBoardDiceInProgress),
		foldCount: Number(window.FoldCount) || 0,
		foldedOnTurnSeat: foldedOnTurnSeat == null || Number.isNaN(Number(foldedOnTurnSeat)) ? null : Number(foldedOnTurnSeat),
		halflingDoubleSellUsedBySeat: halflingDoubleSellUsedBySeat.map((x) => Boolean(x)),
		sellTreasuresDelegated: Boolean(sellTreasuresDelegated),
		warriorFrenzyUsedBySeat: warriorFrenzyUsedBySeat.map((x) => Number(x) || 0),
		warriorFrenzyBonusBySeat: warriorFrenzyBonusBySeat.map((x) => Number(x) || 0),
		clericExorcismUsedBySeat: clericExorcismUsedBySeat.map((x) => Number(x) || 0),
		clericExorcismBonusBySeat: clericExorcismBonusBySeat.map((x) => Number(x) || 0),
		victimThiefTrimUsedBySeat: victimThiefTrimUsedBySeat.map((x) => Number(x) || 0),
		thiefBackstabDebuffBySeat: thiefBackstabDebuffBySeat.map((x) => Number(x) || 0),
	};
}

function applyTurnPhaseFromServer(tp) {
	if (!tp || typeof tp !== "object" || Number(tp.v) !== 1) {
		return;
	}
	if (Number.isFinite(Number(tp.currentTurnSeat))) {
		currentTurnSeat = Number(tp.currentTurnSeat);
	}
	battleActive = Boolean(tp.battleActive);
	battleTurnSeat = tp.battleTurnSeat == null || tp.battleTurnSeat === "" || Number.isNaN(Number(tp.battleTurnSeat)) ? null : Number(tp.battleTurnSeat);
	monsterFightSeat = !battleActive
		? null
		: (tp.monsterFightSeat == null || tp.monsterFightSeat === "" || Number.isNaN(Number(tp.monsterFightSeat))
			? null
			: Number(tp.monsterFightSeat));
	turnAwaitingManualEnd = Boolean(tp.turnAwaitingManualEnd);
	pendingHelpSeats = new Set(Array.isArray(tp.pendingHelpSeats) ? tp.pendingHelpSeats.filter((x) => Number.isFinite(Number(x))).map(Number) : []);
	acceptedHelperSeat = tp.acceptedHelperSeat == null || tp.acceptedHelperSeat === "" || Number.isNaN(Number(tp.acceptedHelperSeat)) ? null : Number(tp.acceptedHelperSeat);
	escapeActive = Boolean(tp.escapeActive);
	escapeQueue = Array.isArray(tp.escapeQueue) ? tp.escapeQueue.map(Number).filter((x) => !Number.isNaN(x)) : [];
	escapeQueueIndex = Number.isFinite(Number(tp.escapeQueueIndex)) ? Number(tp.escapeQueueIndex) : -1;
	escapeMonsterRemover = Number(tp.escapeMonsterRemover) || 0;
	escapeMonsterBadStaff = tp.escapeMonsterBadStaff == null ? null : normalizeBadStaff(tp.escapeMonsterBadStaff);
	escapeMonsterQueue = Array.isArray(tp.escapeMonsterQueue) ? tp.escapeMonsterQueue.slice() : [];
	escapeMonsterInitialCount = Number(tp.escapeMonsterInitialCount) || 0;
	escapeMonsterTemplateQueue = Array.isArray(tp.escapeMonsterTemplateQueue) ? tp.escapeMonsterTemplateQueue.slice() : [];
	escapeCurrentMonsterCardId = tp.escapeCurrentMonsterCardId == null || tp.escapeCurrentMonsterCardId === "" ? null : String(tp.escapeCurrentMonsterCardId);
	escapeCurrentSeat = tp.escapeCurrentSeat == null || tp.escapeCurrentSeat === "" || Number.isNaN(Number(tp.escapeCurrentSeat)) ? null : Number(tp.escapeCurrentSeat);
	escapeWaitingForRoll = Boolean(tp.escapeWaitingForRoll);
	escapeOwnerSeat = tp.escapeOwnerSeat == null || tp.escapeOwnerSeat === "" || Number.isNaN(Number(tp.escapeOwnerSeat)) ? null : Number(tp.escapeOwnerSeat);
	escapeRollInProgress = Boolean(tp.escapeRollInProgress);
	escapeAttemptNumber = Number(tp.escapeAttemptNumber) || 0;
	escapeHalflingRetryUsedForCurrentAttempt = Boolean(tp.escapeHalflingRetryUsedForCurrentAttempt);
	escapeHalflingRetryPending = cloneTurnStateJson(tp.escapeHalflingRetryPending);
	escapeWizardFlightPending = cloneTurnStateJson(tp.escapeWizardFlightPending);
	escapeMonsterPickSession =
		tp.escapeMonsterPickSession && typeof tp.escapeMonsterPickSession === "object" && tp.escapeMonsterPickSession.seat != null && tp.escapeMonsterPickSession.seat !== ""
			? cloneTurnStateJson(tp.escapeMonsterPickSession)
			: null;
	if (escapeMonsterPickSession && (escapeWaitingForRoll || escapeCurrentMonsterCardId != null)) {
		clearEscapeMonsterPickSession();
	}
	deathLootActive = Boolean(tp.deathLootActive);
	deathLootState = cloneTurnStateJson(tp.deathLootState);
	resumeEscapeAfterLoot = Boolean(tp.resumeEscapeAfterLoot);
	deathLootAwaitingEscapeFinish = Boolean(tp.deathLootAwaitingEscapeFinish);
	thiefTheftBoardDicePending = Boolean(tp.thiefTheftBoardDicePending);
	thiefTheftBoardDiceInProgress = Boolean(tp.thiefTheftBoardDiceInProgress);
	window.FoldCount = Number(tp.foldCount) || 0;
	foldedOnTurnSeat = tp.foldedOnTurnSeat == null || tp.foldedOnTurnSeat === "" || Number.isNaN(Number(tp.foldedOnTurnSeat)) ? null : Number(tp.foldedOnTurnSeat);
	if (Array.isArray(tp.halflingDoubleSellUsedBySeat)) {
		tp.halflingDoubleSellUsedBySeat.forEach((v, i) => {
			if (i < halflingDoubleSellUsedBySeat.length) {
				halflingDoubleSellUsedBySeat[i] = Boolean(v);
			}
		});
	}
	if (typeof tp.sellTreasuresDelegated === "boolean") {
		sellTreasuresDelegated = tp.sellTreasuresDelegated;
	}
	if (Array.isArray(tp.warriorFrenzyUsedBySeat)) {
		tp.warriorFrenzyUsedBySeat.forEach((v, i) => {
			if (i < warriorFrenzyUsedBySeat.length) {
				warriorFrenzyUsedBySeat[i] = Number(v) || 0;
			}
		});
	}
	if (Array.isArray(tp.warriorFrenzyBonusBySeat)) {
		tp.warriorFrenzyBonusBySeat.forEach((v, i) => {
			if (i < warriorFrenzyBonusBySeat.length) {
				warriorFrenzyBonusBySeat[i] = Number(v) || 0;
			}
		});
	}
	if (Array.isArray(tp.clericExorcismUsedBySeat)) {
		tp.clericExorcismUsedBySeat.forEach((v, i) => {
			if (i < clericExorcismUsedBySeat.length) {
				clericExorcismUsedBySeat[i] = Number(v) || 0;
			}
		});
	}
	if (Array.isArray(tp.clericExorcismBonusBySeat)) {
		tp.clericExorcismBonusBySeat.forEach((v, i) => {
			if (i < clericExorcismBonusBySeat.length) {
				clericExorcismBonusBySeat[i] = Number(v) || 0;
			}
		});
	}
	if (Array.isArray(tp.victimThiefTrimUsedBySeat)) {
		tp.victimThiefTrimUsedBySeat.forEach((v, i) => {
			if (i < victimThiefTrimUsedBySeat.length) {
				victimThiefTrimUsedBySeat[i] = Number(v) || 0;
			}
		});
	}
	if (Array.isArray(tp.thiefBackstabDebuffBySeat)) {
		tp.thiefBackstabDebuffBySeat.forEach((v, i) => {
			if (i < thiefBackstabDebuffBySeat.length) {
				thiefBackstabDebuffBySeat[i] = Number(v) || 0;
			}
		});
	}
	applyTurnHighlight();
	updateHelpUi();
	updateThiefTheftUi();
	updateWizardFlightUi();
	updateThiefTrimUi();
	updateWarriorFrenzyUi();
	updateClericExorcismUi();
	updateWizardTamingUi();
}

let turnStateSyncTimer = null;
let lastTurnStateSyncJson = "";
function scheduleTurnStateSync() {
	if (!gameStarted) {
		return;
	}
	if (turnStateSyncTimer) {
		clearTimeout(turnStateSyncTimer);
	}
	turnStateSyncTimer = setTimeout(() => {
		turnStateSyncTimer = null;
		const turnPhase = serializeTurnPhaseForServer();
		const json = JSON.stringify(turnPhase);
		if (json === lastTurnStateSyncJson) {
			return;
		}
		lastTurnStateSyncJson = json;
		socket.emit("message", { method: "TurnStateSync", turnPhase });
	}, 380);
}

/** Немедленная отправка turnPhase (смывка/выбор монстра), чтобы до F5 не «зависал» устаревший escapeMonsterPickSession в debounce. */
function flushTurnStateSyncToServer() {
	if (!gameStarted) {
		return;
	}
	if (turnStateSyncTimer) {
		clearTimeout(turnStateSyncTimer);
		turnStateSyncTimer = null;
	}
	const turnPhase = serializeTurnPhaseForServer();
	const json = JSON.stringify(turnPhase);
	lastTurnStateSyncJson = json;
	if (typeof socket !== "undefined" && socket && typeof socket.emit === "function") {
		socket.emit("message", { method: "TurnStateSync", turnPhase });
	}
}

function getMonsterCardsInBattleZone() {
	const monsters = [];
	document.querySelectorAll('.zone_monster .card').forEach((el) => {
		const door = window.doors?.find((d) => d.name === el.id);
		if (door && (door.race === "monster" || (String(door.special || "") === "Mate" && String(el.dataset?.mateSourceMonsterId || "")))) {
			// В модалках/выборе показываем реальную картинку карты (Mate должен выглядеть как Mate).
			monsters.push({ cardId: el.id, img: door.img || "" });
		}
	});
	return monsters;
}

function getAttachedMonsterBonusCards(monsterCardId) {
	if (!monsterCardId) {
		return [];
	}
	const zone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
	if (!zone) {
		return [];
	}
	// Mate: бонусы общие для пары.
	const groupIds = new Set([String(monsterCardId)]);
	const monsterEl = document.getElementById(monsterCardId);
	const pairId = String(monsterEl?.dataset?.matePairId || "");
	if (pairId && isActiveMatePairId(pairId)) {
		zone.querySelectorAll(".card").forEach((zEl) => {
			if (String(zEl?.dataset?.matePairId || "") === pairId && zEl?.id) {
				groupIds.add(String(zEl.id));
			}
		});
	}
	const out = [];
	zone.querySelectorAll(".card").forEach((el) => {
		const cardId = el?.id;
		if (!cardId) {
			return;
		}
		const door = window.doors?.find((d) => d.name === cardId);
		if (!door || String(door.special || "") !== "bonus_power_monster") {
			return;
		}
		if (!groupIds.has(String(el.dataset?.attachedMonsterId || ""))) {
			return;
		}
		out.push({ cardId, img: door.img || "" });
	});
	return out;
}

function getAttachedMonsterBonusPowerSum(monsterCardId) {
	return getAttachedMonsterBonusCards(monsterCardId).reduce((acc, c) => {
		const door = window.doors?.find((d) => d.name === c.cardId);
		return acc + (Number(door?.power) || 0);
	}, 0);
}

function openMonsterBonusAttachModal(bonusCardId) {
	const monsters = getMonsterCardsInBattleZone();
	if (monsters.length <= 0) {
		return;
	}
	// Если монстр один — привязываем автоматически.
	if (monsters.length === 1) {
		socket.emit("message", {
			method: "MonsterBonusAttach",
			bonusCardId,
			monsterCardId: monsters[0].cardId,
		});
		return;
	}

	const existing = document.getElementById("monster-bonus-attach-modal");
	if (existing) {
		existing.remove();
	}
	const modal = document.createElement("div");
	modal.id = "monster-bonus-attach-modal";
	// По размерам/оформлению делаем как модалку выбора монстра для «Усмирения».
	modal.className = "wizard-taming-pick-modal monster-bonus-attach-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel monster-bonus-attach-panel";
	const title = document.createElement("div");
	title.className = "monster-bonus-attach-title";
	title.textContent = "Выбери монстра для бонуса";
	const cardsContainer = document.createElement("div");
	cardsContainer.className = "wizard-taming-pick-cards";

	monsters.forEach((m) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = "wizard-taming-pick-card";
		b.dataset.cardId = m.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = m.img;
		img.alt = m.cardId;
		b.appendChild(img);

		const bonusSum = getAttachedMonsterBonusPowerSum(m.cardId);
		const sumEl = document.createElement("div");
		sumEl.className = "monster-bonus-attach-sum";
		sumEl.textContent = bonusSum ? `Бонус: ${bonusSum > 0 ? `+${bonusSum}` : String(bonusSum)}` : "Бонус: 0";
		sumEl.style.marginTop = "4px";
		sumEl.style.fontSize = "16px";
		sumEl.style.color = "#ffd37a";
		sumEl.style.textAlign = "center";
		b.appendChild(sumEl);

		const attachedBonuses = getAttachedMonsterBonusCards(m.cardId);
		if (attachedBonuses.length > 0) {
			const bonusesWrap = document.createElement("div");
			bonusesWrap.className = "monster-bonus-attach-bonuses";
			bonusesWrap.style.display = "flex";
			bonusesWrap.style.flexWrap = "wrap";
			bonusesWrap.style.justifyContent = "center";
			bonusesWrap.style.gap = "6px";
			bonusesWrap.style.marginTop = "6px";
			attachedBonuses.forEach((bc) => {
				const bi = document.createElement("img");
				bi.className = "monster-bonus-attach-bonus-img";
				bi.src = bc.img || "";
				bi.alt = bc.cardId;
				bi.style.width = "40px";
				bi.style.height = "auto";
				bi.style.borderRadius = "6px";
				bonusesWrap.appendChild(bi);
			});
			b.appendChild(bonusesWrap);
		}

		b.addEventListener("click", () => {
			socket.emit("message", {
				method: "MonsterBonusAttach",
				bonusCardId,
				monsterCardId: m.cardId,
			});
			modal.remove();
		});
		cardsContainer.appendChild(b);
	});

	panel.appendChild(title);
	panel.appendChild(cardsContainer);
	modal.appendChild(panel);
	document.body.appendChild(modal);
}

export function scheduleMonsterBonusAttachIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	// Эти карты играются в зону бонусов МОНСТРА.
	const isMonsterBonusZone = zoneEl.id === "zone_monster" || zoneEl.classList?.contains("zone_monster");
	if (!isMonsterBonusZone) {
		return;
	}
	const door = window.doors?.find((d) => d.name === cardId);
	if (!door || String(door.special || "") !== "bonus_power_monster") {
		return;
	}
	// Нужен хотя бы один монстр в зоне монстров.
	if (getMonsterCardsInBattleZone().length <= 0) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	// Уже привязано.
	if (el.dataset?.attachedMonsterId) {
		return;
	}
	// Открываем выбор только локальному игроку (который перетаскивает карту).
	setTimeout(() => {
		// Перепроверяем, что карта всё ещё в зоне3.
		const cardEl = document.getElementById(cardId);
		if (!cardEl) {
			return;
		}
		const inMonsterZoneNow = !!cardEl.closest?.(".zone_monster") || cardEl.parentElement?.id === "zone_monster";
		if (!inMonsterZoneNow) {
			return;
		}
		openMonsterBonusAttachModal(cardId);
	}, 30);
}

function hideWanderingMonsterPickModal() {
	const existing = document.getElementById("wandering-monster-pick-modal");
	if (existing) {
		existing.remove();
	}
}

function getLocalHandMonsterCardsForWanderingMonster() {
	const cards = [];
	const handEl = document.querySelector(".myhand");
	if (!handEl) {
		return cards;
	}
	handEl.querySelectorAll(".card").forEach((cardEl) => {
		const cardId = cardEl?.id;
		if (!cardId) {
			return;
		}
		const door = window.doors?.find((d) => d.name === cardId);
		if (!door || String(door.race || "") !== "monster") {
			return;
		}
		cards.push({
			cardId,
			img: door.img || "",
		});
	});
	return cards;
}

function openWanderingMonsterPickModal(wanderingCardId) {
	hideWanderingMonsterPickModal();
	const monstersInHand = getLocalHandMonsterCardsForWanderingMonster();
	if (monstersInHand.length <= 0) {
		showBattleResult("В руке нет монстров для Wandering Monster.");
		setTimeout(hideBattleResult, 1800);
		return;
	}
	const modal = document.createElement("div");
	modal.id = "wandering-monster-pick-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Wandering Monster: выбери монстра из руки";

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";
	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Добавить выбранного монстра в бой";
	applyBtn.disabled = true;

	let selectedMonster = null;
	monstersInHand.forEach((m) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = m.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = m.img || "";
		img.alt = m.cardId;
		btn.appendChild(img);
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selectedMonster = m.cardId;
			applyBtn.disabled = !selectedMonster;
		});
		cardsWrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (!selectedMonster) {
			return;
		}
		// Чтобы не открывать модалку повторно на этой же карте.
		const wmEl = document.getElementById(wanderingCardId);
		if (wmEl) {
			wmEl.dataset.wanderingUsed = "1";
		}
		socket.emit("message", {
			method: "moveCard",
			cardId: selectedMonster,
			targetId: null,
			zoneId: "zone_monster",
		});
		modal.remove();
	});

	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
}

export function scheduleWanderingMonsterIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	const isMonsterZone = zoneEl.id === "zone_monster" || zoneEl.classList?.contains("zone_monster");
	if (!isMonsterZone) {
		return;
	}
	const door = window.doors?.find((d) => d.name === cardId);
	if (!door || String(door.special || "") !== "Wandering Monster") {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el) {
		return;
	}
	if (el.dataset?.wanderingUsed) {
		return;
	}
	setTimeout(() => {
		const cardEl = document.getElementById(cardId);
		if (!cardEl) {
			return;
		}
		const inMonsterZoneNow = !!cardEl.closest?.(".zone_monster") || cardEl.parentElement?.id === "zone_monster";
		if (!inMonsterZoneNow) {
			return;
		}
		if (cardEl.dataset?.wanderingUsed) {
			return;
		}
		openWanderingMonsterPickModal(cardId);
	}, 30);
}

function isDoorSpecial(cardId, specialValue) {
	const door = window.doors?.find((d) => d.name === cardId);
	return Boolean(door && String(door.special || "") === String(specialValue || ""));
}

function isTreasureSpecial(cardId, specialValue) {
	const tr = window.treasures?.find((t) => t.name === cardId);
	return Boolean(tr && String(tr.special || "") === String(specialValue || ""));
}

/**
 * Doppleganger в zone3: в бою без помощника удваивает вклад силы от экипировки и от карт в зоне бонусов (см. recalculateMyBonusDisplay).
 * Боец — {@link getMonsterFightSeat()} (в т.ч. после Transferral potion), не обязательно владелец хода.
 */
export function canPlaceDopplegangerTreasureInBonusZone(cardEl, zoneEl) {
	if (!cardEl || !zoneEl || String(zoneEl.id) !== "zone3") {
		return true;
	}
	if (!isTreasureSpecial(cardEl.id, "Doppleganger")) {
		return true;
	}
	if (localSeat == null || localSeat < 0) {
		return false;
	}
	if (!battleActive) {
		return false;
	}
	if (acceptedHelperSeat !== null) {
		return false;
	}
	if (Number(localSeat) !== Number(getMonsterFightSeat())) {
		return false;
	}
	return true;
}

export function canPlaceYuppieWaterTreasureInBonusZone(cardEl, zoneEl) {
	if (!cardEl || !zoneEl || String(zoneEl.id) !== "zone3") {
		return true;
	}
	if (!isTreasureSpecial(cardEl.id, "Yuppie water")) {
		return true;
	}
	// Можно класть в бонусы игрока только когда идёт бой и в бою есть хотя бы один Elf (боец или помощник).
	if (!battleActive) {
		return false;
	}
	const fightSeat = getMonsterFightSeat();
	const hasElfFighter = fightSeat != null && seatHasRace(fightSeat, "Elf");
	const hasElfHelper = acceptedHelperSeat != null && seatHasRace(acceptedHelperSeat, "Elf");
	return Boolean(hasElfFighter || hasElfHelper);
}

function getHirelingCardInMainForSeat(seat) {
	const { main } = getMainAndSideZoneElementsForSeat(seat);
	if (!main) {
		return null;
	}
	const candidates = Array.from(main.querySelectorAll(".card"));
	return candidates.find((el) => isTreasureSpecial(el.id, "Hireling")) || null;
}

function setHirelingAttachment(hirelingCardId, treasureCardId) {
	const hirelingEl = document.getElementById(hirelingCardId);
	const trEl = document.getElementById(treasureCardId);
	if (!hirelingEl || !trEl) {
		return;
	}
	hirelingEl.dataset.hirelingAttachedTreasureId = treasureCardId || "";
	trEl.dataset.hirelingCardId = hirelingCardId || "";
	recalculateAllPowerDisplays();
}

function clearHirelingAttachment(hirelingCardId, treasureCardId) {
	const hirelingEl = hirelingCardId ? document.getElementById(hirelingCardId) : null;
	const trEl = treasureCardId ? document.getElementById(treasureCardId) : null;
	if (hirelingEl && String(hirelingEl.dataset?.hirelingAttachedTreasureId || "") === String(treasureCardId || "")) {
		hirelingEl.dataset.hirelingAttachedTreasureId = "";
	}
	if (trEl && String(trEl.dataset?.hirelingCardId || "") === String(hirelingCardId || "")) {
		trEl.dataset.hirelingCardId = "";
	}
	recalculateAllPowerDisplays();
}

function canEquipTreasureToMainStrict(seat, treasureEl) {
	const treasure = window.treasures?.find((t) => t.name === treasureEl?.id);
	if (!treasure) {
		return true;
	}
	const { main, side } = getMainAndSideZoneElementsForSeat(seat);
	if (!main) {
		return true;
	}
	// Ограничения должны соблюдаться.
	if (!doesTreasureRestrictionsAllowSeat(treasure, seat)) {
		return false;
	}
	// Big лимит считаем по main+side, игнорируя уже "читнутые" и выданные наёмничку шмотки.
	const allPlayerCards = [];
	const pushUnique = (cardEl) => {
		if (cardEl && allPlayerCards.indexOf(cardEl) === -1) {
			allPlayerCards.push(cardEl);
		}
	};
	main.querySelectorAll(".card").forEach(pushUnique);
	side?.querySelectorAll?.(".card")?.forEach(pushUnique);
	let existingBigTotal = 0;
	allPlayerCards.forEach((el) => {
		if (!el || el === treasureEl) {
			return;
		}
		if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
			return;
		}
		const t = window.treasures?.find((tr) => tr.name === el.id);
		if (t) {
			existingBigTotal += Number(t.big) || 0;
		}
	});
	const draggedBig = Number(treasure.big) || 0;
	const nextBigTotal = existingBigTotal + draggedBig;
	const dwarfUnlimitedBig = isSeatDwarfRaceActive(seat);
	if (!dwarfUnlimitedBig && nextBigTotal > 1) {
		return false;
	}

	// Слоты считаем только по main, игнорируя cheated/hireling items.
	const mainCards = Array.from(main.querySelectorAll(".card"));
	let body = 0;
	let hand = 0;
	let footwear = 0;
	let hat = 0;
	let big = 0;
	mainCards.forEach((el) => {
		if (!el || el === treasureEl) {
			return;
		}
		if (el?.dataset?.cheatCardId || el?.dataset?.hirelingCardId) {
			return;
		}
		const t = window.treasures?.find((tr) => tr.name === el.id);
		if (t) {
			body += Number(t.body) || 0;
			hand += Number(t.hand) || 0;
			footwear += Number(t.footwear) || 0;
			hat += Number(t.hat) || 0;
			big += Number(t.big) || 0;
		}
	});
	body += Number(treasure.body) || 0;
	hand += Number(treasure.hand) || 0;
	footwear += Number(treasure.footwear) || 0;
	hat += Number(treasure.hat) || 0;
	big += Number(treasure.big) || 0;
	return isEquipmentSumsValid(body, hand, footwear, hat, big);
}

function hideHirelingOfferModal() {
	const existing = document.getElementById("hireling-offer-modal");
	if (existing) {
		existing.remove();
	}
}

function openHirelingOfferModal({ seat, treasureCardId, fromZoneId }) {
	hideHirelingOfferModal();
	if (seat == null || !treasureCardId) {
		return;
	}
	const hirelingEl = getHirelingCardInMainForSeat(seat);
	if (!hirelingEl) {
		return;
	}

	const modal = document.createElement("div");
	modal.id = "hireling-offer-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Наёмничек: отдать ему шмотку?";

	const buttons = document.createElement("div");
	buttons.style.display = "flex";
	buttons.style.gap = "10px";
	buttons.style.justifyContent = "center";

	const yesBtn = document.createElement("button");
	yesBtn.type = "button";
	yesBtn.className = "wizard-taming-pick-apply-btn";
	yesBtn.textContent = "Да";

	const noBtn = document.createElement("button");
	noBtn.type = "button";
	noBtn.className = "wizard-taming-pick-apply-btn";
	noBtn.textContent = "Нет";

	yesBtn.addEventListener("click", () => {
		socket.emit("message", {
			method: "MercenaryAttach",
			seat,
			hirelingCardId: hirelingEl.id,
			treasureCardId,
		});
		modal.remove();
	});

	noBtn.addEventListener("click", () => {
		const trEl = document.getElementById(treasureCardId);
		const okNormally = trEl ? canEquipTreasureToMainStrict(seat, trEl) : true;
		if (!okNormally) {
			const backZoneId = fromZoneId || getHandElementForPlayerSeat(seat)?.id || null;
			if (backZoneId) {
				socket.emit("message", {
					method: "moveCard",
					cardId: treasureCardId,
					targetId: null,
					zoneId: backZoneId,
				});
			}
		}
		modal.remove();
	});

	buttons.appendChild(yesBtn);
	buttons.appendChild(noBtn);
	panel.appendChild(title);
	panel.appendChild(buttons);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
}

function applyCheatVisualPlacement(cheatCardId, treasureCardId) {
	const cheatEl = document.getElementById(cheatCardId);
	const trEl = document.getElementById(treasureCardId);
	if (!cheatEl || !trEl) {
		return;
	}

	// ВАЖНО: не вкладываем реальную карту Cheat внутрь шмотки.
	// Иначе при ужатии/раскладке (когда >3 карт) ломается позиционирование и подсчёт карточек.
	// Вместо этого рисуем Cheat как "подложку" через ::after у шмотки.
	const cheatImgEl = cheatEl.querySelector?.(".card-item");
	const cheatImgSrc = cheatImgEl?.src || "";
	if (cheatImgSrc) {
		trEl.style.setProperty("--cheat-img", `url("${cheatImgSrc}")`);
	}
	trEl.classList.add("cheat-host-card");
	// Сама карта Cheat в зоне больше не должна влиять на раскладку.
	cheatEl.classList.add("cheat-attached-hidden");
	cheatEl.draggable = false;
}

function clearCheatVisualPlacement(cheatCardId, treasureCardId) {
	const cheatEl = cheatCardId ? document.getElementById(cheatCardId) : null;
	const trEl = treasureCardId ? document.getElementById(treasureCardId) : null;
	if (cheatEl) {
		cheatEl.classList.remove("cheat-attached-hidden");
		cheatEl.draggable = true;
	}
	if (trEl) {
		trEl.classList.remove("cheat-host-card");
		trEl.style.removeProperty("--cheat-img");
	}
}

function setCheatAttachment(cheatCardId, treasureCardId) {
	const cheatEl = document.getElementById(cheatCardId);
	const trEl = document.getElementById(treasureCardId);
	if (!cheatEl || !trEl) {
		return;
	}
	cheatEl.dataset.cheatAttachedTreasureId = treasureCardId || "";
	trEl.dataset.cheatCardId = cheatCardId || "";
	applyCheatVisualPlacement(cheatCardId, treasureCardId);
	recalculateAllPowerDisplays();
}

function hideCheatAttachModal() {
	const existing = document.getElementById("cheat-attach-modal");
	if (existing) {
		existing.remove();
	}
}

function openCheatAttachModal(cheatCardId, seat) {
	hideCheatAttachModal();
	if (!cheatCardId || seat == null) {
		return;
	}
	const { main, side } = getMainAndSideZoneElementsForSeat(seat);
	const handEl = Number(seat) === Number(localSeat) ? document.querySelector(".myhand") : null;
	if (!main) {
		return;
	}

	const options = [];
	const pushTreasureOption = (cardId, from, fromZoneId = null) => {
		const tr = window.treasures?.find((t) => t.name === cardId);
		// Cheat можно применить к любой шмотке/предмету сокровищ (для тестов — ко всем treasure-картам).
		if (!tr) {
			return;
		}
		// Cheat нельзя применять на разовые шмотки.
		if (tr.oneTime) {
			return;
		}
		options.push({ cardId, img: tr.img || "", from, fromZoneId });
	};

	// Из экипировки (main+side)
	main.querySelectorAll(".card").forEach((el) => pushTreasureOption(el.id, "equip", main.id || null));
	side?.querySelectorAll?.(".card")?.forEach((el) => pushTreasureOption(el.id, "equip", side?.id || null));
	// Из руки (чтобы можно было “зачитить” и сразу экипировать)
	handEl?.querySelectorAll?.(".card")?.forEach((el) => pushTreasureOption(el.id, "hand", handEl?.id || null));

	if (options.length <= 0) {
		showBattleResult("Нет шмоток, к которым можно применить Cheat.");
		setTimeout(hideBattleResult, 1800);
		return;
	}

	const modal = document.createElement("div");
	modal.id = "cheat-attach-modal";
	modal.className = "wizard-taming-pick-modal";
	const panel = document.createElement("div");
	panel.className = "wizard-taming-pick-panel";
	const title = document.createElement("div");
	title.className = "wizard-taming-pick-title";
	title.textContent = "Cheat: выбери шмотку";

	const cardsWrap = document.createElement("div");
	cardsWrap.className = "wizard-taming-pick-cards";

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.className = "wizard-taming-pick-apply-btn";
	applyBtn.textContent = "Применить Cheat";
	applyBtn.disabled = true;

	let selected = null;
	options.forEach((o) => {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "wizard-taming-pick-card";
		btn.dataset.cardId = o.cardId;
		const img = document.createElement("img");
		img.className = "wizard-taming-pick-card-img";
		img.src = o.img || "";
		img.alt = o.cardId;
		btn.appendChild(img);
		btn.addEventListener("click", () => {
			cardsWrap.querySelectorAll(".wizard-taming-pick-card").forEach((x) => x.classList.remove("is-selected"));
			btn.classList.add("is-selected");
			selected = o;
			applyBtn.disabled = !selected;
		});
		cardsWrap.appendChild(btn);
	});

	applyBtn.addEventListener("click", () => {
		if (!selected?.cardId) {
			return;
		}

		// Если шмотка была в руке ИЛИ в боковой зоне — сначала перемещаем её в main,
		// а привязку Cheat делаем только после того, как карта реально окажется в main (иначе инвариант сразу сбросит Cheat).
		const needsMoveToMain = selected.from === "hand"
			|| (selected.from === "equip" && selected.fromZoneId && side?.id && selected.fromZoneId === side.id);
		const cheatEl = document.getElementById(cheatCardId);
		if (needsMoveToMain) {
			// ВАЖНО: пока Cheat ещё не привязан, перемещение шмотки в main может вызвать модалку наёмничка.
			// Помечаем шмотку как "Cheat pending", чтобы не предлагать отдать её наёмничку.
			const trEl = document.getElementById(selected.cardId);
			if (trEl) {
				trEl.dataset.cheatPendingIncoming = "1";
			}
			if (cheatEl) {
				cheatEl.dataset.cheatPendingTreasureId = selected.cardId;
			}
			socket.emit("message", {
				method: "moveCard",
				cardId: selected.cardId,
				targetId: null,
				zoneId: main.id,
			});
		} else {
			// Уже в main — можно привязывать сразу.
			socket.emit("message", {
				method: "CheatAttach",
				seat,
				cheatCardId,
				treasureCardId: selected.cardId,
			});
		}

		modal.remove();
	});

	panel.appendChild(title);
	panel.appendChild(cardsWrap);
	panel.appendChild(applyBtn);
	modal.appendChild(panel);
	document.body.appendChild(modal);
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
}

export function scheduleCheatIfNeeded(cardId, zoneEl) {
	if (!cardId || !zoneEl) {
		return;
	}
	// Cheat активируется только когда его кладут в ОСНОВНУЮ зону экипировки (main).
	if (!isMainEquipmentZoneElement(zoneEl)) {
		return;
	}
	if (!isDoorSpecial(cardId, "Cheat")) {
		return;
	}
	const seat = getGlobalSeatForPlayZone(zoneEl);
	if (seat == null || Number(seat) !== Number(localSeat)) {
		return;
	}
	const el = document.getElementById(cardId);
	if (!el || el.dataset?.cheatUsed) {
		return;
	}
	setTimeout(() => {
		const cheatEl = document.getElementById(cardId);
		if (!cheatEl) {
			return;
		}
		// всё ещё в ОСНОВНОЙ зоне экипировки этого игрока
		const stillInMainEquip = isMainEquipmentZoneElement(cheatEl.parentElement);
		if (!stillInMainEquip) {
			return;
		}
		if (cheatEl.dataset?.cheatUsed) {
			return;
		}
		cheatEl.dataset.cheatUsed = "1";
		openCheatAttachModal(cardId, seat);
	}, 30);
}

function normalizeAdvantageTargets(typeValue) {
	if (!typeValue) {
		return [];
	}
	if (Array.isArray(typeValue)) {
		return typeValue.map(String).map((s) => s.trim()).filter(Boolean);
	}
	const str = String(typeValue);
	// На случай если в данных записали через запятую.
	return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function computeMonsterAdvantageBonus() {
	const { hasMonster } = getMonsterBattleContext();
	if (!battleActive || !hasMonster) {
		return 0;
	}

	// Важно: класс/раса могут поменяться прямо в бою — пересчитываем каждый раз.
	updateCharacterStatesFromBoard();

	const participantRaces = new Set();
	const participantKinds = new Set();
	let ignoreAdvantage = false;
	const fightSeat = getMonsterFightSeat();
	const active = characterBySeat[fightSeat];
	if (active) {
		const races = getCharacterRaces(active);
		const kinds = getCharacterKinds(active);
		races.forEach((r) => participantRaces.add(r));
		kinds.forEach((k) => participantKinds.add(k));
		ignoreAdvantage = ignoreAdvantage
			|| (Boolean(active.hasHalfBreed) && String(active.race2 || "").trim() === "Human")
			|| (Boolean(active.hasSuperMunchkin) && getCharacterKinds(active).length === 1);
	}
	if (acceptedHelperSeat !== null && acceptedHelperSeat !== undefined && acceptedHelperSeat >= 0) {
		const helper = characterBySeat[acceptedHelperSeat];
		if (helper) {
			const races = getCharacterRaces(helper);
			const kinds = getCharacterKinds(helper);
			races.forEach((r) => participantRaces.add(r));
			kinds.forEach((k) => participantKinds.add(k));
			ignoreAdvantage = ignoreAdvantage
				|| (Boolean(helper.hasHalfBreed) && String(helper.race2 || "").trim() === "Human")
				|| (Boolean(helper.hasSuperMunchkin) && getCharacterKinds(helper).length === 1);
		}
	}

	if (participantRaces.size === 0 && participantKinds.size === 0) {
		return 0;
	}

	// Half-breed + 1 раса: advantage монстров не действует.
	if (ignoreAdvantage) {
		return 0;
	}

	let total = 0;
	const zoneCards = document.querySelectorAll('.zone_monster .card');
	zoneCards.forEach((el) => {
		const door = window.doors?.find((d) => d.name === el.id);
		let effectiveDoor = door;
		if (door && String(door.special || "") === "Mate") {
			const srcId = String(el.dataset?.mateSourceMonsterId || "");
			const srcDoor = srcId ? window.doors?.find((d) => d.name === srcId) : null;
			if (srcDoor) {
				effectiveDoor = srcDoor;
			}
		}
		if (!effectiveDoor || String(effectiveDoor.race || "") !== 'monster' || !effectiveDoor.advantage) {
			return;
		}
		const targets = normalizeAdvantageTargets(effectiveDoor.advantage.type);
		const bonus = Number(effectiveDoor.advantage.power) || 0;
		if (targets.length === 0 || bonus === 0) {
			return;
		}
		const matched = targets.some((t) => participantRaces.has(t) || participantKinds.has(t));
		// Если в бою есть и помощник, а у монстра преимущество над обоими — добавляем один раз.
		if (matched) {
			total += bonus;
		}
	});
	return total;
}

function getEffectiveMonsterPower() {
	return getMonsterBasePower() + computeMonsterAdvantageBonus();
}

function updateEffectiveMonsterBonusDisplay() {
	const el = document.querySelector('.MonsterBonus');
	if (!el) {
		return;
	}
	// Каждый раз актуализируем базу по фактическим картам монстра,
	// чтобы base не зависела от предыдущих перерисовок/сообщений.
	const base = computeMonsterZoneBasePower();
	el.dataset.basePower = String(base);
	const effective = getEffectiveMonsterPower();
	el.textContent = String(effective);
}

function getSeatCombatPower(seat) {
	// Берем уже пересчитанную отображаемую силу по месту игрока.
	// Это гарантирует одинаковое значение у всех клиентов, независимо от локальной перестановки зон.
	const seatToPowerMap = getSeatToPowerMap();
	const powerSelector = seatToPowerMap[seat];
	if (powerSelector) {
		let base = getNumericText(powerSelector);
		if (battleActive && changeSexActiveBySeat.has(seat) && isSeatParticipantInCurrentMonsterBattle(seat)) {
			base -= 5;
		}
		return base;
	}

	// Fallback, если селектор не найден (не должно происходить в штатном сценарии).
	const seatToLevelMap = getSeatToLevelMap();
	const levelSelector = seatToLevelMap[seat];
	return levelSelector ? getNumericText(levelSelector) : 0;
}

function updateCharacterStatesFromBoard() {
	for (let seat = 0; seat < characterBySeat.length; seat++) {
		const character = characterBySeat[seat];
		if (!character) {
			continue;
		}
		character.setLevel(levelBySeat[seat] ?? 1);

		const { main: mainEl, side: sideEl } = getMainAndSideZoneElementsForSeat(seat);
		const mainCards = mainEl ? Array.from(mainEl.querySelectorAll('.card')) : [];
		const sideCards = sideEl ? Array.from(sideEl.querySelectorAll('.card')) : [];

		// Раса/класс берутся только из экипированных карт (main).
		// Side-зона — это "отложенная" экипировка/мелкая шмотка и не должна давать расу/класс.
		// Если таких карт нет, значения сбрасываются к дефолту.
		let nextRace = "Human";
		let nextRace2 = "";
		let hasHalfBreed = false;
		let nextKind = "";
		let nextKind2 = "";
		let hasSuperMunchkin = false;
		let doorRemoverBonus = 0;
		const raceCardsInMain = [];
		const raceCardElByRace = new Map();
		const kindCardsInMain = [];
		const kindCardElByKind = new Map();
		let halfBreedCardEl = null;
		let superMunchkinCardEl = null;
		mainCards.forEach((cardEl) => {
			const doorCard = window.doors?.find(d => d.name === cardEl.id);
			if (!doorCard) {
				return;
			}
			if (String(doorCard.special || "") === "Half-breed" || String(doorCard.card_name || "") === "Half-breed") {
				hasHalfBreed = true;
				halfBreedCardEl = halfBreedCardEl || cardEl;
			}
			if (String(doorCard.special || "") === "Super Munchkin" || String(doorCard.card_name || "") === "Super Munchkin") {
				hasSuperMunchkin = true;
				superMunchkinCardEl = superMunchkinCardEl || cardEl;
			}
			if (doorCard.race) {
				const r = String(doorCard.race);
				// Запрет на 2 одинаковые расы при Half-breed: откат в руку игрока.
				if (hasHalfBreed) {
					if (raceCardElByRace.has(r)) {
						appendCardToSeatHand(cardEl.id, seat);
						return;
					}
					raceCardElByRace.set(r, cardEl);
				}
				raceCardsInMain.push(r);
			}
			if (doorCard.kind) {
				const k = String(doorCard.kind);
				// Запрет на 2 одинаковых класса при Super Munchkin: откат в руку игрока.
				if (hasSuperMunchkin) {
					if (kindCardElByKind.has(k)) {
						appendCardToSeatHand(cardEl.id, seat);
						return;
					}
					kindCardElByKind.set(k, cardEl);
				}
				kindCardsInMain.push(k);
			}
			doorRemoverBonus += Number(doorCard.remover) || 0;
		});

		// Уникализируем расы, сохраняя порядок.
		const uniqueRaces = [];
		raceCardsInMain.forEach((r) => {
			if (!r) {
				return;
			}
			if (uniqueRaces.includes(r)) {
				return;
			}
			uniqueRaces.push(r);
		});

		// Пока Half-breed НЕ экипирована — нельзя иметь больше одной расы.
		// Если кто-то попытался экипировать вторую расу, откатываем лишние карты обратно в руку.
		if (!hasHalfBreed) {
			const raceEls = [];
			mainCards.forEach((cardEl) => {
				const doorCard = window.doors?.find(d => d.name === cardEl.id);
				if (doorCard?.race) {
					raceEls.push(cardEl);
				}
			});
			if (raceEls.length > 1) {
				for (let i = 0; i < raceEls.length - 1; i++) {
					appendCardToSeatHand(raceEls[i].id, seat);
				}
			}
		}

		// Пока Super Munchkin НЕ экипирован — нельзя иметь больше одного класса.
		if (!hasSuperMunchkin) {
			const kindEls = [];
			mainCards.forEach((cardEl) => {
				const doorCard = window.doors?.find(d => d.name === cardEl.id);
				if (doorCard?.kind) {
					kindEls.push(cardEl);
				}
			});
			if (kindEls.length > 1) {
				for (let i = 0; i < kindEls.length - 1; i++) {
					appendCardToSeatHand(kindEls[i].id, seat);
				}
			}
		}

		// Правило сброса: если экипирована Half-breed, но реальной расы нет — Half-breed тоже уходит в сброс.
		if (hasHalfBreed && uniqueRaces.length === 0 && halfBreedCardEl) {
			const dropZone = document.getElementById('zone_doors_drop');
			if (dropZone && halfBreedCardEl.parentElement && halfBreedCardEl.parentElement.id !== 'zone_doors_drop') {
				dropZone.appendChild(halfBreedCardEl);
			}
			hasHalfBreed = false;
		}

		// Правило сброса: если экипирован Super Munchkin, но класса нет — Super Munchkin тоже уходит в сброс.
		if (hasSuperMunchkin && kindCardsInMain.length === 0 && superMunchkinCardEl) {
			const dropZone = document.getElementById('zone_doors_drop');
			if (dropZone && superMunchkinCardEl.parentElement && superMunchkinCardEl.parentElement.id !== 'zone_doors_drop') {
				dropZone.appendChild(superMunchkinCardEl);
			}
			hasSuperMunchkin = false;
		}

		if (!hasHalfBreed) {
			// Без Half-breed: считаем активной последнюю расу (если их вдруг несколько — поведение как раньше).
			nextRace = uniqueRaces.length > 0 ? uniqueRaces[uniqueRaces.length - 1] : "Human";
			nextRace2 = "";
		} else {
			// Half-breed: 2 расы.
			// Если надета одна карта расы → вторая раса считается Human.
			if (uniqueRaces.length === 1) {
				nextRace = uniqueRaces[0];
				nextRace2 = "Human";
			} else {
				// Если 2+ разных расы → берём последние две.
				const r1 = uniqueRaces[uniqueRaces.length - 2];
				const r2 = uniqueRaces[uniqueRaces.length - 1];
				nextRace = r1;
				nextRace2 = r2;
			}
		}

		// Классы: без Super Munchkin берём последний; с ним — до 2 классов (если 1, то второй пустой).
		if (!hasSuperMunchkin) {
			nextKind = kindCardsInMain.length > 0 ? kindCardsInMain[kindCardsInMain.length - 1] : "";
			nextKind2 = "";
		} else {
			const uniqueKinds = [];
			kindCardsInMain.forEach((k) => {
				if (!k) {
					return;
				}
				if (uniqueKinds.includes(k)) {
					return;
				}
				uniqueKinds.push(k);
			});
			if (uniqueKinds.length === 1) {
				nextKind = uniqueKinds[0];
				nextKind2 = "";
			} else {
				nextKind = uniqueKinds[uniqueKinds.length - 2];
				nextKind2 = uniqueKinds[uniqueKinds.length - 1];
			}
		}

		character.race = nextRace;
		character.race2 = nextRace2;
		character.hasHalfBreed = hasHalfBreed;
		character.kind = nextKind;
		character.kind2 = nextKind2;
		character.hasSuperMunchkin = hasSuperMunchkin;

		// Теперь, когда race/kind уже актуальны, считаем силу от шмоток (часть может зависеть от расы).
		const malignMirrorRestrict = Boolean(malignMirrorActiveBySeat.has(seat))
			&& isSeatParticipantInCurrentMonsterBattle(seat);
		const equippedTreasures = mainCards
			.map((cardEl) => {
				const t = window.treasures?.find((tr) => tr.name === cardEl.id);
				if (!t) {
					return null;
				}
				const isHireling = isTreasureSpecial(cardEl.id, "Hireling");
				const isArmor = Number(t.body) === 1;

				// Malign mirrror: в бою бонус дают только броник (body=1) и наёмничек.
				// Броня с Cheat по-прежнему даёт бонус (Cheat не меняет body), броня у наёмничка тоже даёт бонус.
				if (malignMirrorRestrict && !isArmor && !isHireling) {
					// Слоты/типы оставляем как у карты, но бонус силы обнуляем.
					return { ...t, power: 0, powerByRace: null };
				}
				// Шмотка, выданная наёмничку, не занимает слоты/big и игнорирует ограничения.
				if (cardEl?.dataset?.hirelingCardId) {
					// Важно: даже если это броня (body=1), под Malign mirrror она должна продолжать давать бонус.
					// Поэтому power НЕ трогаем здесь (он уже обнулён выше только для не-armor).
					return { ...t, body: 0, hand: 0, footwear: 0, hat: 0, big: 0, restrictions: null };
				}
				// Разовые шмотки можно класть в экипировку, но бонус силы они не дают.
				// Слоты/типы при этом остаются как у обычной шмотки.
				if (t.oneTime) {
					return { ...t, power: 0, powerByRace: null };
				}
				return t;
			})
			.filter(Boolean);
		character.applyEquipmentCards(equippedTreasures);
		character.remover += doorRemoverBonus;
	}
}

function hideAllAcceptHelpButtons() {
	for (let s = 0; s < 3; s++) {
		const btn = document.getElementById(`accept-help-seat-${s}`);
		if (btn) {
			btn.style.display = 'none';
		}
	}
}

function ensureAcceptHelpButtonForSeat(seat) {
	const seatToPowerMap = getSeatToPowerMap();
	const powerSelector = seatToPowerMap[seat];
	const powerElement = powerSelector ? document.querySelector(powerSelector) : null;
	if (!powerElement || !powerElement.parentElement) {
		return null;
	}

	let btn = document.getElementById(`accept-help-seat-${seat}`);
	if (!btn) {
		btn = document.createElement('button');
		btn.id = `accept-help-seat-${seat}`;
		btn.innerHTML = 'Принять<br>помощь';
		btn.style.display = 'none';
		btn.style.marginLeft = '0';
		btn.style.padding = '2px 6px';
		btn.style.minWidth = '86px';
		btn.style.fontSize = '16px';
		btn.style.lineHeight = '1.05';
		btn.style.whiteSpace = 'normal';
		btn.style.textAlign = 'center';
		btn.style.cursor = 'pointer';
		btn.addEventListener('click', () => {
			if (!battleActive || localSeat !== getMonsterFightSeat() || acceptedHelperSeat !== null) {
				return;
			}
			socket.emit("message", {
				method: "AcceptHelp",
				helperSeat: seat,
				turnSeat: getMonsterFightSeat(),
			});
		});
		powerElement.parentElement.appendChild(btn);
	}
	return btn;
}

function positionAcceptHelpButtonForSeat(seat, btn) {
	if (!btn) {
		return;
	}
	// Единственный корректный источник позиции аватаров по месту игрока.
	const seatToIconMap = getSeatToIconMap();
	const iconSelector = seatToIconMap[seat];
	if (!iconSelector) {
		btn.style.position = '';
		btn.style.left = '';
		btn.style.top = '';
		btn.style.transform = '';
		btn.style.zIndex = '';
		return;
	}
	const iconElement = document.querySelector(iconSelector);
	if (!iconElement) {
		return;
	}
	const rect = iconElement.getBoundingClientRect();
	btn.style.position = 'fixed';
	btn.style.left = '';
	btn.style.right = '';
	if (iconSelector === '.image-top-right') {
		// Для правой верхней иконки позиционируем от правого края — проще держать симметрию.
		btn.style.right = '46px';
		btn.style.transform = 'translateX(50%)';
	} else {
		const left = rect.left + rect.width / 2;
		btn.style.left = `${left}px`;
		btn.style.transform = 'translateX(-50%)';
	}
	btn.style.top = `${rect.bottom + 28}px`;
	btn.style.zIndex = '30';
}

function updateHelpUi() {
	const offerHelpButton = document.getElementById('offer-help');
	if (!offerHelpButton) {
		return;
	}

	const fightSeat = getMonsterFightSeat();
	const alreadyOffered = localSeat !== null && localSeat !== undefined && pendingHelpSeats.has(localSeat);
	const helpAlreadyAccepted = acceptedHelperSeat !== null;
	const canOffer = battleActive
		&& localSeat !== null
		&& localSeat !== undefined
		&& Number(localSeat) !== Number(fightSeat)
		&& !alreadyOffered
		&& !helpAlreadyAccepted;
	offerHelpButton.style.display = canOffer ? 'flex' : 'none';

	if (battleActive && localSeat === fightSeat && acceptedHelperSeat === null) {
		pendingHelpSeats.forEach(seat => {
			const btn = ensureAcceptHelpButtonForSeat(seat);
			if (btn) {
				btn.style.display = 'inline-block';
				positionAcceptHelpButtonForSeat(seat, btn);
			}
		});
	} else {
		hideAllAcceptHelpButtons();
	}
	updateWarriorFrenzyUi();
	updateClericExorcismUi();
	updateThiefTrimUi();
	updateThiefTheftUi();
}

export function recalculateAllPowerDisplays() {
	// Malign mirrror: если карта проклятия больше не в экипировке/side у игрока, эффект снимаем.
	// Это чисто производное от DOM-состояния, поэтому безопасно выполнять на всех клиентах.
	for (const [seat, curseId] of malignMirrorPendingBySeat.entries()) {
		if (curseId && !isCardInSeatMainOrSide(curseId, seat)) {
			malignMirrorPendingBySeat.delete(seat);
		}
	}
	for (const [seat, curseId] of malignMirrorActiveBySeat.entries()) {
		if (curseId && !isCardInSeatMainOrSide(curseId, seat)) {
			malignMirrorActiveBySeat.delete(seat);
		}
	}

	// Change sex: если карта проклятия больше не в экипировке/side у игрока, эффект/ожидание снимаем.
	for (const [seat, curseId] of changeSexPendingBySeat.entries()) {
		// Проклятие действует до конца боя или пока карту не уберут в сброс.
		const el = curseId ? document.getElementById(curseId) : null;
		const inDiscard = el && String(el.parentElement?.id || "") === "zone_doors_drop";
		if (curseId && inDiscard) {
			changeSexPendingBySeat.delete(seat);
		}
	}
	for (const [seat, curseId] of changeSexActiveBySeat.entries()) {
		const el = curseId ? document.getElementById(curseId) : null;
		const inDiscard = el && String(el.parentElement?.id || "") === "zone_doors_drop";
		if (curseId && inDiscard) {
			changeSexActiveBySeat.delete(seat);
		}
	}

	// До пересчёта силы актуализируем состояние проклятия Malign mirrror по текущему бою.
	// Это важно, потому что сама сила/шмотки считаются внутри updateCharacterStatesFromBoard.
	if (battleActive) {
		for (let seat = 0; seat < characterBySeat.length; seat++) {
			if (malignMirrorActiveBySeat.has(seat)) {
				continue;
			}
			if (!malignMirrorPendingBySeat.has(seat)) {
				continue;
			}
			// Для помощника acceptedHelperSeat может не успеть синхронизироваться на всех клиентах,
			// поэтому дополнительно считаем участником боя по факту: если бой активен и место игрока — либо ведущий,
			// либо у него на столе есть принятая помощь (acceptedHelperSeat), либо его сила учитывается в бою.
			// Здесь берём самое надёжное: isSeatParticipantInCurrentMonsterBattle.
			if (isSeatParticipantInCurrentMonsterBattle(seat)) {
				malignMirrorActiveBySeat.set(seat, malignMirrorPendingBySeat.get(seat));
				malignMirrorPendingBySeat.delete(seat);
			}
		}
	}
	// Change sex: активация штрафа при входе в бой.
	if (getMonsterBattleContext().hasMonster) {
		for (let seat = 0; seat < characterBySeat.length; seat++) {
			if (changeSexActiveBySeat.has(seat)) continue;
			if (!changeSexPendingBySeat.has(seat)) continue;
			if (isSeatParticipantInCurrentMonsterBattle(seat)) {
				changeSexActiveBySeat.set(seat, changeSexPendingBySeat.get(seat));
				changeSexPendingBySeat.delete(seat);
			}
		}
	}
	updateCharacterStatesFromBoard();
	// Fail-safe: после любого пересчёта держим Cheat в консистентном состоянии.
	enforceCheatAttachmentsInvariant();
	// Fail-safe: наёмничек всегда таскает свою шмотку за собой.
	enforceHirelingFollowInvariant();

	const seatToPowerMap = getSeatToPowerMap();
	Object.entries(seatToPowerMap).forEach(([seatKey, selector]) => {
		const seat = parseInt(seatKey, 10);
		if (Number.isNaN(seat) || !characterBySeat[seat]) {
			return;
		}
		setPowerText(selector, characterBySeat[seat].power);
	});

	const powerPlayer5 = getNumericText('.level-bottom-left');
	setPowerText('.PowerPlayer5', powerPlayer5);

	const powerPlayer6 = getNumericText('.level-bottom-right');
	setPowerText('.PowerPlayer6', powerPlayer6);
	recalculateMyBonusDisplay();
	// Может меняться во время боя из-за смены рас/классов.
	updateEffectiveMonsterBonusDisplay();
	updateWarriorFrenzyUi();
	updateClericExorcismUi();
	updateWizardTamingUi();
	updateWizardFlightUi();
	updateThiefTrimUi();
	updateThiefTheftUi();

	return characterBySeat[localSeat ?? 0]?.power ?? 0;
}

/** Клик по кубику вешается только в StartGame; после refresh нужно заново. */
function setupMunchkinDiceAfterGameStart() {
	const diceContainer = document.querySelector(".dice-container");
	if (!diceContainer) {
		return;
	}
	const NUMBER_OF_DICE = 1;
	if (diceContainer.dataset.munchkinDiceBound === "1") {
		randomizeDice(diceContainer, NUMBER_OF_DICE);
		return;
	}
	diceContainer.dataset.munchkinDiceBound = "1";
	diceContainer.dataset.hasDice = "1";
	randomizeDice(diceContainer, NUMBER_OF_DICE);
	diceContainer.addEventListener("click", () => {
		if (thiefTheftBoardDicePending) {
			if (thiefTheftBoardDiceInProgress) {
				return;
			}
			if (localSeat == null || !isSeatThiefClassActive(localSeat)) {
				return;
			}
			thiefTheftBoardDiceInProgress = true;
			hideBattleResult();
			thiefTheftBoardDicePending = false;
			const interval = setInterval(() => {
				const preview = Math.floor((Math.random() * 6) + 1);
				diceContainer.innerHTML = "";
				diceContainer.appendChild(createDice(preview));
			}, 50);
			setTimeout(() => {
				clearInterval(interval);
				const rawRoll = Math.floor((Math.random() * 6) + 1);
				diceContainer.innerHTML = "";
				diceContainer.appendChild(createDice(rawRoll));
				promptLoadedDieAfterRoll({
					seat: localSeat,
					rawRoll,
					onFinalize: (finalRoll) => {
						socket.emit("message", {
							method: "ThiefTheftRoll",
							seat: localSeat,
							value: Number(finalRoll),
						});
					},
				});
			}, 1000);
			return;
		}
		if (escapeActive) {
			if (!canLocalPlayerRollEscapeNow() || escapeRollInProgress) {
				return;
			}
			escapeRollInProgress = true;
			const interval = setInterval(() => {
				const preview = Math.floor((Math.random() * 6) + 1);
				diceContainer.innerHTML = "";
				diceContainer.appendChild(createDice(preview));
			}, 50);
			setTimeout(() => {
				clearInterval(interval);
				const rawRoll = Math.floor((Math.random() * 6) + 1);
				diceContainer.innerHTML = "";
				diceContainer.appendChild(createDice(rawRoll));
				promptLoadedDieAfterRoll({
					seat: localSeat,
					rawRoll,
					onFinalize: (finalRoll) => {
						if (localSeat === escapeOwnerSeat) {
							resolveEscapeRollAndBroadcast(localSeat, Number(finalRoll));
						} else {
							socket.emit("message", {
								method: "EscapeRollSubmit",
								seat: localSeat,
								rawRoll: Number(finalRoll),
							});
						}
					},
				});
			}, 1000);
			return;
		}
		const interval = setInterval(() => {
			randomizeDice(diceContainer, NUMBER_OF_DICE);
		}, 50);

		setTimeout(() => {
			clearInterval(interval);
			const rawRoll = Math.floor((Math.random() * 6) + 1);
			diceContainer.innerHTML = "";
			diceContainer.appendChild(createDice(rawRoll));
			promptLoadedDieAfterRoll({
				seat: localSeat,
				rawRoll,
				onFinalize: (finalRoll) => {
					diceContainer.innerHTML = "";
					diceContainer.appendChild(createDice(Number(finalRoll)));
				},
			});
		}, 1000);
		window.flag_dice = true;
	});
}

/**
 * Каноническая раскладка стола для 3 игроков (как у хоста seat 0 до сообщения 3Players).
 * id элементов не меняются — только классы `… cards-zone`.
 */
function resetThreePlayerLayoutToSeatZero() {
	const set = (id, c) => {
		const el = document.getElementById(id);
		if (el) {
			el.className = `${c} cards-zone`;
		}
	};
	set("myhand", "myhand");
	set("opponent2hand", "opponent2hand");
	set("opponent3hand", "opponent3hand");
	set("zone2", "zone2");
	set("zone5", "zone5");
	set("zone_opponent2", "zone_opponent2");
	set("zone_opponent2_side", "zone_opponent2_side");
	set("zone_opponent3", "zone_opponent3");
	set("zone_opponent3_side", "zone_opponent3_side");
}

/** Дублирует перестановки из 3Players при fl=="2player" (локальный seat 1). Нужна стартовая каноническая раскладка. */
function applyThreePlayerLayoutSeat1AsInJoinMessage() {
	const opponent2hand = document.getElementById("opponent2hand");
	const opponent3hand = document.getElementById("opponent3hand");
	const myhand = document.getElementById("myhand");
	const zone_opponent2 = document.getElementById("zone_opponent2");
	const zone_opponent3 = document.getElementById("zone_opponent3");
	const zone2 = document.getElementById("zone2");
	const zone_opponent2_side = document.getElementById("zone_opponent2_side");
	const zone5 = document.getElementById("zone5");
	const zone_opponent3_side = document.getElementById("zone_opponent3_side");
	if (!opponent2hand || !opponent3hand || !myhand || !zone_opponent2 || !zone_opponent3 || !zone2 || !zone_opponent2_side || !zone5 || !zone_opponent3_side) {
		return;
	}
	opponent3hand.classList.remove("opponent3hand");
	opponent3hand.classList.add("myhand");
	myhand.classList.remove("myhand");
	myhand.classList.add("opponent3hand");

	zone_opponent3.classList.remove("zone_opponent3");
	zone_opponent3.classList.add("zone2");
	zone2.classList.remove("zone2");
	zone2.classList.add("zone_opponent3");

	zone_opponent3_side.classList.remove("zone_opponent3_side");
	zone_opponent3_side.classList.add("zone5");
	zone5.classList.remove("zone5");
	zone5.classList.add("zone_opponent3_side");

	opponent2hand.classList.remove("opponent2hand");
	opponent2hand.classList.add("myhand");
	opponent3hand.classList.remove("myhand");
	opponent3hand.classList.add("opponent2hand");

	zone_opponent2.classList.remove("zone_opponent2");
	zone_opponent2.classList.add("zone2");
	zone_opponent3.classList.remove("zone2");
	zone_opponent3.classList.add("zone_opponent2");

	zone_opponent2_side.classList.remove("zone_opponent2_side");
	zone_opponent2_side.classList.add("zone5");
	zone_opponent3_side.classList.remove("zone5");
	zone_opponent3_side.classList.add("zone_opponent2_side");
}

/** Дублирует перестановки из 3Players при fl=="3player" (локальный seat 2). Нужна стартовая каноническая раскладка. */
function applyThreePlayerLayoutSeat2AsInJoinMessage() {
	const opponent2hand = document.getElementById("opponent2hand");
	const opponent3hand = document.getElementById("opponent3hand");
	const myhand = document.getElementById("myhand");
	const zone_opponent2 = document.getElementById("zone_opponent2");
	const zone_opponent3 = document.getElementById("zone_opponent3");
	const zone2 = document.getElementById("zone2");
	const zone_opponent2_side = document.getElementById("zone_opponent2_side");
	const zone5 = document.getElementById("zone5");
	const zone_opponent3_side = document.getElementById("zone_opponent3_side");
	if (!opponent2hand || !opponent3hand || !myhand || !zone_opponent2 || !zone_opponent3 || !zone2 || !zone_opponent2_side || !zone5 || !zone_opponent3_side) {
		return;
	}
	opponent3hand.classList.remove("opponent3hand");
	opponent3hand.classList.add("opponent2hand");
	opponent2hand.classList.remove("opponent2hand");
	opponent2hand.classList.add("opponent3hand");

	zone_opponent3.classList.remove("zone_opponent3");
	zone_opponent3.classList.add("zone_opponent2");
	zone_opponent2.classList.remove("zone_opponent2");
	zone_opponent2.classList.add("zone_opponent3");

	zone_opponent3_side.classList.remove("zone_opponent3_side");
	zone_opponent3_side.classList.add("zone_opponent2_side");
	zone_opponent2_side.classList.remove("zone_opponent2_side");
	zone_opponent2_side.classList.add("zone_opponent3_side");

	myhand.classList.remove("myhand");
	myhand.classList.add("opponent2hand");
	opponent3hand.classList.remove("opponent2hand");
	opponent3hand.classList.add("myhand");

	zone2.classList.remove("zone2");
	zone2.classList.add("zone_opponent2");
	zone_opponent3.classList.remove("zone_opponent2");
	zone_opponent3.classList.add("zone2");

	zone5.classList.remove("zone5");
	zone5.classList.add("zone_opponent2_side");
	zone_opponent3_side.classList.remove("zone_opponent2_side");
	zone_opponent3_side.classList.add("zone5");
}

let gameStarted = false;
// mercTestDealt removed (no test deal)
socket.on("message", response => {

	function applySeatLayoutForRestore(seat, players) {
		if (!players || players < 2) return;
		const setZoneClass = (id, zoneClass) => {
			const el = document.getElementById(id);
			if (!el) return;
			el.className = `${zoneClass} cards-zone`;
		};

		if (players === 2) {
			// seat 0: default, seat 1: зеркалим "my" и "opponent" по классам.
			if (seat === 0) {
				setZoneClass("myhand", "myhand");
				setZoneClass("opponenthand", "opponenthand");
				setZoneClass("zone2", "zone2");
				setZoneClass("zone_opponent", "zone_opponent");
				setZoneClass("zone5", "zone5");
				setZoneClass("zone_opponent_side", "zone_opponent_side");
			} else if (seat === 1) {
				setZoneClass("myhand", "opponenthand");
				setZoneClass("opponenthand", "myhand");
				setZoneClass("zone2", "zone_opponent");
				setZoneClass("zone_opponent", "zone2");
				setZoneClass("zone5", "zone_opponent_side");
				setZoneClass("zone_opponent_side", "zone5");
			}
			return;
		}

		if (players === 3) {
			// Должно совпадать с сообщением 3Players: там другая последовательность swap, чем у простой перестановки пар.
			resetThreePlayerLayoutToSeatZero();
			if (seat === 0) {
				return;
			}
			if (seat === 1) {
				applyThreePlayerLayoutSeat1AsInJoinMessage();
				return;
			}
			if (seat === 2) {
				applyThreePlayerLayoutSeat2AsInJoinMessage();
			}
		}
	}

	// Восстановление seat после refresh (без побочных эффектов "1"/"2Players"/"3Players").
	if (response.method === "RestoreSeat") {
		const seat = parseInt(response.seat, 10);
		const n = parseInt(response.num, 10);
		if (Number.isNaN(seat) || seat < 0) {
			return;
		}
		console.log("[restore] RestoreSeat received", { seat, num: n });
		localSeat = seat;
		if (!Number.isNaN(n) && n > 0) {
			num = n;
			window.num = n;
		}
		applySeatLayoutForRestore(seat, num);
		// После смены классов зон нужно заново привязать drag&drop к текущим DOM-элементам.
		try { window.dispatchEvent(new Event("munchkin:zonesChanged")); } catch {}
		console.log("[restore] layout applied", {
			seat,
			players: num,
			myhand: document.getElementById("myhand")?.className,
			opponent2hand: document.getElementById("opponent2hand")?.className,
			opponent3hand: document.getElementById("opponent3hand")?.className,
			zone2: document.getElementById("zone2")?.className,
			zone5: document.getElementById("zone5")?.className,
			zone_opponent2: document.getElementById("zone_opponent2")?.className,
			zone_opponent3: document.getElementById("zone_opponent3")?.className,
		});
		ensureLocalPlayerProfileChosen();
		updatePlayersUiVisibility(num);
		recalculateAllPowerDisplays();
		applyTurnHighlight();
	}

	// Восстановление состояния комнаты с сервера (сервер-авторитет).
	if (response.method === "RoomState") {
		const state = response.state;
		if (!state || typeof state !== "object") {
			return;
		}
		// RoomState может прийти раньше RestoreSeat — берём seat прямо из сообщения.
		const seatFromMsg = parseInt(response.seat, 10);
		if ((localSeat === null || localSeat === undefined) && !Number.isNaN(seatFromMsg) && seatFromMsg >= 0) {
			localSeat = seatFromMsg;
		}
		// num мог быть ещё не проставлен — берём из state.
		const nPlayers = Number(state?.num) || window.num || num || 0;
		if (nPlayers > 0) {
			num = nPlayers;
			window.num = nPlayers;
		}
		console.log("[restore] RoomState received", { num: state.num, cards: Object.keys(state.cards || {}).length, hasGame: Boolean(state.game) });
		// На случай, если RoomState придёт раньше RestoreSeat — всё равно пытаемся применить раскладку.
		if (localSeat !== null && localSeat !== undefined) {
			applySeatLayoutForRestore(localSeat, window.num || num || state?.num);
			// После смены классов зон нужно заново привязать drag&drop к текущим DOM-элементам.
			try { window.dispatchEvent(new Event("munchkin:zonesChanged")); } catch {}
		}
		console.log("[restore] before applyRoomStateFromServer", {
			localSeat,
			myhand: document.getElementById("myhand")?.className,
			opponent2hand: document.getElementById("opponent2hand")?.className,
			opponent3hand: document.getElementById("opponent3hand")?.className,
			zone2: document.getElementById("zone2")?.className,
			zone5: document.getElementById("zone5")?.className,
		});
		applyRoomStateFromServer(state);
		console.log("[restore] after applyRoomStateFromServer", {
			localSeat,
			myhand: document.getElementById("myhand")?.className,
			opponent2hand: document.getElementById("opponent2hand")?.className,
			opponent3hand: document.getElementById("opponent3hand")?.className,
			zone2: document.getElementById("zone2")?.className,
			zone5: document.getElementById("zone5")?.className,
		});
		return;
	}

	const maybeNum = parseInt(response.num, 10);
	if (!Number.isNaN(maybeNum) && maybeNum > 0) {
		num = maybeNum;
		window.num = maybeNum;
	}
	//console.log(response);
	
  if (response.method === "moveCard") {
    const card = document.getElementById(response.cardId);
    const target = response.targetId ? document.getElementById(response.targetId) : null;
	let zone = null;
	if (response.zoneId) {
		const z = String(response.zoneId);
		const handMatch = z.match(/^hand(\d)$/);
		const mainMatch = z.match(/^main(\d)$/);
		const sideMatch = z.match(/^side(\d)$/);
		if (handMatch) {
			zone = getHandElementForPlayerSeat(parseInt(handMatch[1], 10));
		} else if (mainMatch) {
			zone = getMainAndSideZoneElementsForSeat(parseInt(mainMatch[1], 10))?.main || null;
		} else if (sideMatch) {
			zone = getMainAndSideZoneElementsForSeat(parseInt(sideMatch[1], 10))?.side || null;
		} else {
			zone = document.getElementById(z);
		}
	}
	// Важно: отправитель двигает карту локально ещё до прихода этого сообщения.
	// Поэтому для корректной логики "вышло из экипировки" используем fromZoneId, если он есть.
	const fromZone = response.fromZoneId ? document.getElementById(response.fromZoneId) : null;
	const prevParent = fromZone || card?.parentElement || null;
	const prevWasEquip = isPlayerPlayZoneElement(prevParent);
		
    if (card && zone) {
      if (target && zone.contains(target)) {
        zone.insertBefore(card, target.nextSibling);
      } else {
        zone.appendChild(card);
      }
    }

		// Change sex: как только карта проклятия оказалась в сбросе дверей, её можно применять снова.
		if (response.zoneId === "zone_doors_drop" && card && String(card.dataset?.changeSexUsedNotDiscarded || "") === "1") {
			card.dataset.changeSexUsedNotDiscarded = "";
		}
		
    adjustCardWidth('.myhand');
    adjustCardWidth('.zone2');
    adjustCardWidth('.zone5');
    adjustCardHeight('.zone3');
    adjustCardHeight('.zone_monster');
    adjustCardWidth('.opponenthand');
    adjustCardWidth('.zone_opponent');
    adjustCardWidth('.zone_opponent_side');
	adjustCardWidth('.opponent2hand');
	adjustCardWidth('.zone_opponent2');
	adjustCardWidth('.zone_opponent2_side');
	adjustCardWidth('.opponent3hand');
	adjustCardWidth('.zone_opponent3');
	adjustCardWidth('.zone_opponent3_side');
    UpdatebackImgTreasure();
    UpdatebackImgDoor();
		// Важно: не пересчитываем здесь, потому что ниже есть "инварианты" (Cheat/Наёмничек),
		// которые должны сначала обработать привязки/отвязки, иначе при снятии шмотки с наёмничка
		// она может "прыгнуть" обратно.

		// Если кто-то переместил цель в main (из руки/side), и у Cheat есть "ожидающая" привязка — выполняем её сейчас.
		if (card && String(card.id || "").includes("treasure") && isMainEquipmentZoneElement(zone)) {
			const seat = getGlobalSeatForPlayZone(zone);
			if (seat != null && Number(seat) === Number(localSeat)) {
				zone.querySelectorAll?.(".card")?.forEach((maybeCheatEl) => {
					if (!maybeCheatEl?.id) {
						return;
					}
					const door = window.doors?.find((d) => d.name === maybeCheatEl.id);
					if (!door || String(door.special || "") !== "Cheat") {
						return;
					}
					const pending = String(maybeCheatEl.dataset?.cheatPendingTreasureId || "");
					if (pending && pending === card.id) {
						maybeCheatEl.dataset.cheatPendingTreasureId = "";
						socket.emit("message", { method: "CheatAttach", seat, cheatCardId: maybeCheatEl.id, treasureCardId: pending });
					}
				});
			}
		}

		// Cheat действует только пока шмотка в ОСНОВНОЙ зоне экипировки.
		// Если шмотка уходит из main (в side или куда угодно) — Cheat уходит в сброс.
		if (card && isMainEquipmentZoneElement(prevParent) && !isMainEquipmentZoneElement(zone)) {
			const attachedCheatId = String(card.dataset?.cheatCardId || "");
			if (attachedCheatId) {
				// Очищаем связь на шмотке сразу, чтобы не было "висящих" ограничений.
				card.dataset.cheatCardId = "";
				clearCheatVisualPlacement(attachedCheatId, card.id);
				// Надёжно: если Cheat ещё не в сбросе, отправляем его в сброс (дубликаты moveCard не страшны).
				const cheatEl = document.getElementById(attachedCheatId);
				const alreadyInDrop = cheatEl?.parentElement?.id === "zone_doors_drop";
				if (!alreadyInDrop) {
					socket.emit("message", {
						method: "moveCard",
						cardId: attachedCheatId,
						targetId: null,
						zoneId: "zone_doors_drop",
					});
				}
			}
		}

		// Наёмничек: если шмотка, выданная наёмничку, ушла из main — отвязываем.
		if (card && isMainEquipmentZoneElement(prevParent) && !isMainEquipmentZoneElement(zone)) {
			const hId = String(card.dataset?.hirelingCardId || "");
			if (hId) {
				// Помечаем карту как "только что снятую" — чтобы не открыть модалку "отдать ли шмотку"
				// в результате промежуточных перемещений/инвариантов.
				card.dataset.hirelingJustDetached = "1";
				setTimeout(() => {
					const el = document.getElementById(card.id);
					if (el) {
						el.dataset.hirelingJustDetached = "";
					}
				}, 800);

				card.dataset.hirelingCardId = "";
				const hEl = document.getElementById(hId);
				if (hEl && String(hEl.dataset?.hirelingAttachedTreasureId || "") === String(card.id || "")) {
					hEl.dataset.hirelingAttachedTreasureId = "";
					// Короткий "cooldown" на предложение, чтобы снятие не запускало окно.
					hEl.dataset.hirelingSuppressOffer = "1";
					setTimeout(() => {
						const hh = document.getElementById(hId);
						if (hh) {
							hh.dataset.hirelingSuppressOffer = "";
						}
					}, 800);
				}
				socket.emit("message", { method: "MercenaryDetach", seat: getGlobalSeatForPlayZone(prevParent), hirelingCardId: hId, treasureCardId: card.id });
			}
		}

		// Если переместили наёмничка — его шмотка должна уйти вместе с ним в ту же зону.
		if (card && isTreasureSpecial(card.id, "Hireling")) {
			const attachedId = String(card.dataset?.hirelingAttachedTreasureId || "");
			if (attachedId && zone?.id) {
				const trEl = document.getElementById(attachedId);
				if (trEl && trEl.parentElement?.id !== zone.id) {
					socket.emit("message", { method: "moveCard", cardId: attachedId, targetId: null, zoneId: zone.id });
				}
			}
		}

		// Divine intervention: как только карта вышла из колоды — через 1с в сброс и +1 уровень всем клирикам.
		if (card && zone) {
			// Если карта оказалась в сбросе — снимаем флаг, чтобы её можно было применить повторно позже.
			if (isDoorSpecial(card.id, "Divine intervention") && zone.id === "zone_doors_drop") {
				card.dataset.divineScheduled = "";
			}
			scheduleDivineInterventionIfNeeded(card.id, zone);
		}

		// Mate: если карта вышла из зоны монстров/поля боя — отвязываем пару и даём возможность применить заново.
		if (card && zone && isDoorSpecial(card.id, "Mate")) {
			const prevId = prevParent?.id || "";
			const wasOnBattle = prevId === "zone_monster" || prevId === "zone3";
			const nowOnBattle = zone.id === "zone_monster" || zone.id === "zone3";
			if (wasOnBattle && !nowOnBattle) {
				const mateId = card.id;
				const pairId = String(card.dataset?.matePairId || "");
				const srcId = String(card.dataset?.mateSourceMonsterId || "");
				const monsterZone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");

				// Снимаем matePairId со всех карт пары.
				if (monsterZone && pairId) {
					monsterZone.querySelectorAll(".card").forEach((el) => {
						if (String(el?.dataset?.matePairId || "") === pairId) {
							el.dataset.matePairId = "";
						}
					});
				}

				// Если бонусы были привязаны к Mate — перевешиваем обратно на исходного монстра (если он ещё на поле).
				if (monsterZone) {
					const srcEl = srcId ? document.getElementById(srcId) : null;
					const canReattach = Boolean(srcEl && (srcEl.parentElement?.id === "zone_monster"));
					monsterZone.querySelectorAll(".card").forEach((el) => {
						const bId = el?.id;
						if (!bId) {
							return;
						}
						const bDoor = window.doors?.find((d) => d.name === bId);
						if (!bDoor || String(bDoor.special || "") !== "bonus_power_monster") {
							return;
						}
						if (String(el.dataset?.attachedMonsterId || "") === String(mateId)) {
							el.dataset.attachedMonsterId = canReattach ? srcId : "";
						}
					});
				}

				// Чистим состояние на Mate, чтобы её можно было применить заново на любого монстра.
				card.dataset.mateUsed = "";
				card.dataset.mateSourceMonsterId = "";
				card.dataset.matePairId = "";
			}
		}
		// Mate: при уходе в сброс сбрасываем состояние, чтобы карту можно было использовать повторно.
		// Важно: это должно идти ПОСЛЕ отвязки пары (иначе потеряем pairId и не очистим srcEl.dataset.matePairId).
		if (card && zone && isDoorSpecial(card.id, "Mate") && zone.id === "zone_doors_drop") {
			card.dataset.mateUsed = "";
			card.dataset.mateSourceMonsterId = "";
			card.dataset.matePairId = "";
			const door = window.doors?.find((d) => d.name === card.id);
			const imgEl = card.querySelector?.(".card-item");
			if (imgEl && door?.img) {
				imgEl.src = door.img;
			}
		}
		// Mate: если положили в бонусы игрока — автоматически переносим в зону монстров.
		if (card && zone && isDoorSpecial(card.id, "Mate") && zone.id === "zone3") {
			if (!card.dataset?.mateRelocating) {
				card.dataset.mateRelocating = "1";
				socket.emit("message", { method: "moveCard", cardId: card.id, targetId: null, zoneId: "zone_monster", fromZoneId: "zone3" });
			}
		}
		if (card && zone && isDoorSpecial(card.id, "Mate") && zone.id === "zone_monster") {
			card.dataset.mateRelocating = "";
		}
		// Out to lunch: если карту положили на поле боя (к бонусам) — через 1с сбросить всё поле боя и закончить бой.
		if (card && zone) {
			if (isDoorSpecial(card.id, "Out to lunch") && zone.id === "zone_doors_drop") {
				card.dataset.outToLunchScheduled = "";
			}
			scheduleOutToLunchIfNeeded(card.id, zone);
		}

		// Friendship potion: работает как Out to lunch, но другая надпись (treasure-карта).
		if (card && zone) {
			if (isTreasureSpecial(card.id, "Friendship potion") && zone.id === "zone_treasure_drop") {
				card.dataset.friendshipPotionScheduled = "";
			}
			scheduleFriendshipPotionIfNeeded(card.id, zone);
		}

		// Wand of dowsing: основная экипировка, зона монстра или зона бонусов игрока (zone3) на поле боя.
		if (card && zone) {
			scheduleWandOfDowsingIfNeeded(card.id, zone, response.playedBySeat);
		}

		// Transferral potion: те же зоны активации, что у штыря (экипировка / поле боя / zone3).
		if (card && zone) {
			scheduleTransferralPotionIfNeeded(card.id, zone, response.playedBySeat);
		}

		// Зелья/лампа/штырь: при уходе в сброс сокровищ — сбрасываем флаги, чтобы карту можно было применить снова.
		if (card && zone && zone.id === "zone_treasure_drop") {
			const tr = window.treasures?.find((t) => t.name === card.id);
			if (tr && (String(tr.special || "") === "Magic lamp" || String(tr.special || "") === "Pollymorth Potion")) {
				card.dataset.potionUsed = "";
			}
			if (isTreasureSpecial(card.id, "Wand of dowsing")) {
				card.dataset.wandDowsingScheduled = "";
			}
			if (isTreasureSpecial(card.id, "Transferral potion")) {
				card.dataset.transferralPotionScheduled = "";
			}
		}

		// Когда в main кладут шмотку (не разовую) и есть наёмничек — спрашиваем "дать ему?".
		if (card && String(card.id || "").includes("treasure") && isMainEquipmentZoneElement(zone)) {
			const seat = getGlobalSeatForPlayZone(zone);
			if (seat != null && Number(seat) === Number(localSeat)) {
				// Если это карта, которую мы только что снимали с наёмничка — не предлагаем сразу же обратно.
				if (card.dataset?.hirelingJustDetached) {
					return;
				}
				const tr = window.treasures?.find((t) => t.name === card.id);
				const alreadyBound = Boolean(card.dataset?.hirelingCardId) || Boolean(card.dataset?.cheatCardId) || Boolean(card.dataset?.cheatPendingIncoming);
				const isHireling = isTreasureSpecial(card.id, "Hireling");
				if (tr && !tr.oneTime && !alreadyBound && !isHireling) {
					const hEl = getHirelingCardInMainForSeat(seat);
					if (hEl && !String(hEl.dataset?.hirelingAttachedTreasureId || "") && !hEl.dataset?.hirelingSuppressOffer) {
						openHirelingOfferModal({ seat, treasureCardId: card.id, fromZoneId: response.fromZoneId || null });
					}
				}
			}
		}

		// Fail-safe: даже если "fromZoneId" не прилетел (способность/локальный перенос),
		// как только шмотка с cheatCardId НЕ находится в main — Cheat должен уйти в сброс.
		if (card && card.dataset?.cheatCardId && !isMainEquipmentZoneElement(zone)) {
			const attachedCheatId = String(card.dataset.cheatCardId || "");
			card.dataset.cheatCardId = "";
			clearCheatVisualPlacement(attachedCheatId, card.id);
			const cheatEl = document.getElementById(attachedCheatId);
			const alreadyInDrop = cheatEl?.parentElement?.id === "zone_doors_drop";
			if (attachedCheatId && !alreadyInDrop) {
				socket.emit("message", {
					method: "moveCard",
					cardId: attachedCheatId,
					targetId: null,
					zoneId: "zone_doors_drop",
				});
			}
		}

		// Если сам Cheat куда-то переехал — чистим его привязку (чтобы не “висела”).
		const movedDoor = window.doors?.find((d) => d.name === response.cardId);
		if (movedDoor && String(movedDoor.special || "") === "Cheat") {
			const movedEl = document.getElementById(response.cardId);
			if (movedEl) {
				// Если Cheat ушёл в сброс — его можно применять повторно.
				if (response.zoneId === "zone_doors_drop") {
					movedEl.dataset.cheatUsed = "";
				}
				// Если Cheat ушёл в сброс — обязательно отвязываем его от шмотки.
				if (response.zoneId === "zone_doors_drop") {
					const trId = String(movedEl.dataset?.cheatAttachedTreasureId || "");
					if (trId) {
						const trEl = document.getElementById(trId);
						if (trEl) {
							trEl.dataset.cheatCardId = "";
						}
					}
					clearCheatVisualPlacement(movedEl.id, trId);
					movedEl.dataset.cheatAttachedTreasureId = "";
				} else if (!isPlayerPlayZoneElement(zone)) {
					// В остальных не-экипировочных перемещениях тоже не держим старую привязку.
					clearCheatVisualPlacement(movedEl.id, String(movedEl.dataset?.cheatAttachedTreasureId || ""));
					movedEl.dataset.cheatAttachedTreasureId = "";
				}
			}
		}

		// Если карта-модификатор монстра вышла из зоны бонусов монстра (или ушла в сброс) — сбрасываем привязку,
		// чтобы её можно было привязать заново к новому монстру.
		if (movedDoor && String(movedDoor.special || "") === "bonus_power_monster") {
			const movedEl = document.getElementById(response.cardId);
			if (movedEl && response.zoneId !== "zone_monster") {
				movedEl.dataset.attachedMonsterId = "";
			}
		}

		pushMonsterBonusAttachmentsToServer();

		// Все пост-эффекты отработали — теперь безопасно пересчитать силы/инварианты.
		recalculateAllPowerDisplays();
		UpdateZones();
	
	
  }
  if (response.method === "UpdatePower") {
		recalculateAllPowerDisplays();
	}
	if (response.method === "PlayerMeta") {
		const seat = parseInt(response.seat, 10);
		if (Number.isNaN(seat) || seat < 0) {
			return;
		}
		const name = String(response.name || "").trim();
		const gender = String(response.gender || "");
		if (characterBySeat?.[seat]) {
			characterBySeat[seat].name = name;
			characterBySeat[seat].gender = gender === "Male" || gender === "Female" ? gender : "";
		}
		// Обновляем тексты, где могли использоваться имена.
		recalculateAllPowerDisplays();
		// Тултип берёт данные динамически, но при смене пола/имени лучше скрыть, чтобы не было "старого" текста.
		hideSeatIconTooltip();
	}
	if (response.method === "CheatAttach") {
		const seat = parseInt(response.seat, 10);
		const cheatCardId = String(response.cheatCardId || "");
		const treasureCardId = String(response.treasureCardId || "");
		if (Number.isNaN(seat) || seat < 0 || !cheatCardId || !treasureCardId) {
			return;
		}
		setCheatAttachment(cheatCardId, treasureCardId);
		const trEl = document.getElementById(treasureCardId);
		if (trEl) {
			trEl.dataset.cheatPendingIncoming = "";
		}
	}
	if (response.method === "MercenaryAttach") {
		const seat = parseInt(response.seat, 10);
		const hirelingCardId = String(response.hirelingCardId || "");
		const treasureCardId = String(response.treasureCardId || "");
		if (Number.isNaN(seat) || seat < 0 || !hirelingCardId || !treasureCardId) {
			return;
		}
		setHirelingAttachment(hirelingCardId, treasureCardId);
	}
	if (response.method === "MercenaryDetach") {
		const seat = parseInt(response.seat, 10);
		const hirelingCardId = String(response.hirelingCardId || "");
		const treasureCardId = String(response.treasureCardId || "");
		if (Number.isNaN(seat) || seat < 0 || !hirelingCardId || !treasureCardId) {
			return;
		}
		clearHirelingAttachment(hirelingCardId, treasureCardId);
	}
	if (response.method === "DivineInterventionResolve") {
		const cardId = String(response.cardId || "");
		if (!cardId) {
			return;
		}
		applyDivineInterventionResolve(cardId);
	}
	if (response.method === "OutToLunchResolve") {
		const cardId = String(response.cardId || "");
		if (!cardId) {
			return;
		}
		applyOutToLunchResolve(cardId);
	}
	if (response.method === "FriendshipPotionResolve") {
		const cardId = String(response.cardId || "");
		if (!cardId) {
			return;
		}
		applyFriendshipPotionResolve(cardId);
	}
	if (response.method === "WandOfDowsingResolve") {
		const wandCardId = String(response.wandCardId || "");
		const pickedCardId = String(response.pickedCardId || "");
		const actorSeat = parseInt(response.actorSeat, 10);
		if (!wandCardId || Number.isNaN(actorSeat) || actorSeat < 0) {
			return;
		}
		applyWandOfDowsingResolve({ wandCardId, pickedCardId, actorSeat });
	}
	if (response.method === "TransferralPotionResolve") {
		const potionCardId = String(response.potionCardId || "");
		const newFighterSeat = parseInt(response.newFighterSeat, 10);
		if (!potionCardId || Number.isNaN(newFighterSeat) || newFighterSeat < 0) {
			return;
		}
		applyTransferralPotionResolve({ potionCardId, newFighterSeat });
	}
	if (response.method === "PotionResolve") {
		const potionCardId = String(response.potionCardId || "");
		const monsterCardId = String(response.monsterCardId || "");
		if (!potionCardId || !monsterCardId) {
			return;
		}
		applyPotionDiscardMonster({ potionCardId, monsterCardId });
		hidePotionPickMonsterModal();
	}
	if (response.method === "PotionResolveSingleMonster") {
		const potionCardId = String(response.potionCardId || "");
		if (!potionCardId) {
			return;
		}
		const el = document.getElementById(potionCardId);
		if (el) {
			el.dataset.potionUsed = "";
		}
		// У всех игроков: очистить поле боя и закончить бой без победителей.
		endBattleNoWinnerAndDropBattlefield(null, 0);
		hidePotionPickMonsterModal();
	}
	if (response.method === "IllusionResolve") {
		const illusionCardId = String(response.illusionCardId || "");
		const discardMonsterId = String(response.discardMonsterId || "");
		const addMonsterId = String(response.addMonsterId || "");
		if (!illusionCardId || !discardMonsterId || !addMonsterId) {
			return;
		}
		// 1) монстр в сброс (с бонусами)
		moveCardToDiscardById(discardMonsterId);
		// 2) карта Illusion в сброс
		moveBadStaffCardToDiscard(illusionCardId);
		const illEl = document.getElementById(illusionCardId);
		if (illEl) {
			illEl.dataset.illusionUsed = "";
		}
		// 3) добавить нового монстра из руки в бой
		const addEl = document.getElementById(addMonsterId);
		const monsterZone = document.getElementById("zone_monster") || document.querySelector(".zone_monster");
		if (addEl && monsterZone) {
			monsterZone.appendChild(addEl);
			UpdatebackImgDoor();
			adjustCardHeight('.zone_monster');
		}
		// Пересчитываем базовую силу монстров после замены.
		setMonsterBasePower(computeMonsterZoneBasePower());
		recalculateAllPowerDisplays();

		// Закрываем локальные модалки на клиенте-источнике (если ещё висят).
		hidePotionPickMonsterModal();
		const m = document.getElementById("illusion-pick-hand-monster-modal");
		if (m) {
			m.remove();
		}
	}
	if (response.method === "MateApply") {
		const mateCardId = String(response.mateCardId || "");
		const sourceMonsterId = String(response.sourceMonsterId || "");
		const pairId = String(response.pairId || "");
		if (!mateCardId || !sourceMonsterId || !pairId) {
			return;
		}
		const mateEl = document.getElementById(mateCardId);
		const srcEl = document.getElementById(sourceMonsterId);
		const srcDoor = window.doors?.find((d) => d.name === sourceMonsterId);
		if (!mateEl || !srcEl || !srcDoor || String(srcDoor.race || "") !== "monster") {
			return;
		}
		// Не даём дублировать, если у выбранного монстра уже есть пара.
		if (srcEl.dataset?.matePairId) {
			mateEl.dataset.mateUsed = "";
			return;
		}
		srcEl.dataset.matePairId = pairId;
		mateEl.dataset.matePairId = pairId;
		mateEl.dataset.mateSourceMonsterId = sourceMonsterId;

		// Важно: НЕ меняем картинку карты Mate.
		setMonsterBasePower(computeMonsterZoneBasePower());
		recalculateAllPowerDisplays();
		hideMatePickModal();
	}
	if (response.method === "SetTurn") {
		const nextSeat = parseInt(response.seat, 10);
		if (!Number.isNaN(nextSeat)) {
			setCurrentTurn(nextSeat, false);
		}
	}
	if (response.method === "WarriorFrenzyApply") {
		applyWarriorFrenzyDiscardAndBonus(response.seat, response.cardIds);
	}
	if (response.method === "ClericExorcismApply") {
		applyClericExorcismDiscardAndBonus(response.seat, response.cardIds);
	}
	if (response.method === "ThiefTrimApply") {
		applyThiefTrimDiscardAndDebuff(response.seat, response.assignments);
	}
	if (response.method === "ThiefTheftStart") {
		applyThiefTheftStartDiscard(response.seat, response.cardId);
	}
	if (response.method === "ThiefTheftRoll") {
		applyThiefTheftRollResult(response.seat, response.value);
	}
	if (response.method === "ThiefTheftTake") {
		applyThiefTheftStolenCardMove(response.thiefSeat, response.fromSeat, response.cardId);
	}
	if (response.method === "WizardFlightApply") {
		applyWizardFlightDiscardAndResolve(response.seat, response.cardIds);
	}
	if (response.method === "WizardTamingApply") {
		applyWizardTaming(response.seat, response.handCardIds, response.monsterCardId);
	}
	if (response.method === "OfferHelp") {
		const helperSeat = parseInt(response.helperSeat, 10);
		const turnSeat = parseInt(response.turnSeat, 10);
		// ВАЖНО: acceptedHelperSeat/pendingHelpSeats должны синхронизироваться на всех клиентах,
		// даже если локальный battleActive временно не проставлен (например, у помощника).
		// Принимаем факт боя/ведущего из сообщения, не полагаясь на локальные battle-флаги.
		if (!Number.isNaN(helperSeat) && !Number.isNaN(turnSeat) && acceptedHelperSeat === null) {
			pendingHelpSeats.add(helperSeat);
			updateHelpUi();
		}
	}
	if (response.method === "AcceptHelp") {
		const helperSeat = parseInt(response.helperSeat, 10);
		const turnSeat = parseInt(response.turnSeat, 10);
		if (!Number.isNaN(helperSeat) && !Number.isNaN(turnSeat) && acceptedHelperSeat === null) {
			acceptedHelperSeat = helperSeat;
			pendingHelpSeats.clear();
			applyTurnHighlight();
			// Важно: помощь влияет и на MyBonus, и на advantage/weakness монстров (через race/kind помощника),
			// поэтому пересчитываем всё, чтобы гарантированно обновить PlayerCharacterState всех мест.
			recalculateAllPowerDisplays();
			updateHelpUi();
		}
		// Malign mirrror: если проклятие было применено заранее, а игрок стал помощником позже — активируем сейчас.
		// Это особенно важно на клиенте помощника, где acceptedHelperSeat/боевые флаги могли обновиться вне recalculate.
		if (!Number.isNaN(helperSeat) && Number(localSeat) === Number(helperSeat)) {
			tryActivateMalignMirrorForSeat(helperSeat);
			recalculateAllPowerDisplays();
		}
	}
	if (response.method === "CombatResolved") {
		const resolvedSeat = parseInt(response.seat, 10);
		if (response.winner === "player") {
			const updatedLevel = parseInt(response.level, 10);
			if (!Number.isNaN(updatedLevel)) {
				setLevelBySeat(response.seat, updatedLevel);
				recalculateAllPowerDisplays();
			}
			const helperSeat = parseInt(response.helperSeat, 10);
			const helperLevel = parseInt(response.helperLevel, 10);
			const helperLevelGain = Number(response.helperLevelGain) || 0;
			if (!Number.isNaN(helperSeat) && !Number.isNaN(helperLevel) && helperLevelGain > 0) {
				setLevelBySeat(helperSeat, helperLevel);
				recalculateAllPowerDisplays();
			}
		}

		if (response.winner === "monster" && !Number.isNaN(resolvedSeat)) {
			showBattleResult(`Победил монстр, ${getSeatLabel(resolvedSeat)} кинь кубик, чтобы смыться от монстра.`);
		} else if (response.winner === "player") {
			showBattleResult(response.text || (response.winner === "player" ? "Монстр повержен" : "Победил монстр"));
			setTimeout(() => {
				hideBattleResult();
			}, 1500);
		} else {
			hideBattleResult();
		}
		pendingHelpSeats.clear();
		acceptedHelperSeat = null;
		monsterFightSeat = null;
		battleActive = false;
		battleTurnSeat = null;
		// Malign mirrror: после завершения боя проклятие уходит в сброс.
		// Эмитит только владелец места, иначе будет задвоение moveCard.
		for (const [seat, curseId] of malignMirrorActiveBySeat.entries()) {
			if (Number(localSeat) === Number(seat) && curseId) {
				syncDoorCardMoveToDiscard(curseId);
			}
		}
		// После боя проклятие больше не должно действовать/висеть.
		malignMirrorPendingBySeat.clear();
		malignMirrorActiveBySeat.clear();

		// Change sex: после одного боя штраф снимается, карта уходит в сброс.
		// Важно: карта должна уйти в сброс даже если штраф не успел перейти из pending -> active
		// (например, на помощнике при рассинхроне acceptedHelperSeat).
		for (const [seat, curseId] of changeSexPendingBySeat.entries()) {
			if (Number(localSeat) === Number(seat) && curseId) {
				syncDoorCardMoveToDiscard(curseId);
			}
		}
		for (const [seat, curseId] of changeSexActiveBySeat.entries()) {
			if (Number(localSeat) === Number(seat) && curseId) {
				syncDoorCardMoveToDiscard(curseId);
			}
		}
		changeSexPendingBySeat.clear();
		changeSexActiveBySeat.clear();
		applyTurnHighlight();
		updateHelpUi();
		if (response.winner === "player") {
			MoveMonstersToDrop();
			turnAwaitingManualEnd = true;
			updateTurnActionButtons(false);
		} else if (response.winner === "none") {
			MoveMonstersToDrop();
			turnAwaitingManualEnd = true;
			updateTurnActionButtons(false);
		} else if (!Number.isNaN(resolvedSeat) && localSeat === resolvedSeat) {
			escapeMonsterBadStaff = normalizeBadStaff(response.monsterBadStaff);
			escapeMonsterQueue = Array.isArray(response.monsterQueue) ? response.monsterQueue.slice() : [];
			startEscapeSequenceAndBroadcast(response.seat, response.helperSeat, response.monsterRemover);
		}
		recalculateAllPowerDisplays();
	}
	if (response.method === "DeathStart") {
		const deadSeat = parseInt(response.deadSeat, 10);
		const ownerSeat = parseInt(response.ownerSeat, 10);
		const lootersOrder = Array.isArray(response.lootersOrder) ? response.lootersOrder.map((x) => parseInt(x, 10)).filter((x) => !Number.isNaN(x)) : [];
		const lootCardIds = Array.isArray(response.lootCardIds) ? response.lootCardIds.filter(Boolean) : [];
		if (Number.isNaN(deadSeat) || deadSeat < 0) {
			return;
		}

		// Смерть = бой закончен, смывка не нужна.
		deathLootActive = true;
		deathLootState = {
			deadSeat,
			ownerSeat: !Number.isNaN(ownerSeat) ? ownerSeat : deadSeat,
			lootersOrder,
			remaining: lootCardIds.slice(),
			index: 0,
		};

		// Умершему смывка больше не нужна, но если в бою был помощник, ему ещё нужно смыться.
		// Поэтому не сбрасываем всю смывку — просто исключаем умершего из очереди.
		removeSeatFromEscapeQueue(deadSeat);
		battleActive = false;
		battleTurnSeat = null;
		pendingHelpSeats.clear();
		acceptedHelperSeat = null;
		monsterFightSeat = null;
		applyTurnHighlight();
		updateHelpUi();
		updateTurnActionButtons(false);

		if (localSeat === deadSeat) {
			showLootStatus("Ты умер.");
		} else {
			showLootStatus(`${getSeatLabel(deadSeat)} погиб. Начинается грабёж.`);
		}

		// Складываем лут в скрытый контейнер (через moveCard, чтобы синхронизировать всем одинаково).
		const lootZone = ensureDeathLootZoneElement();
		lootZone.replaceChildren();
		if (deathLootState && Number(localSeat) === Number(deathLootState.ownerSeat)) {
			let prevId = null;
			lootCardIds.forEach((id) => {
				const move = {
					method: "moveCard",
					cardId: id,
					targetId: prevId,
					zoneId: "death-loot-zone",
				};
				applyMoveCardLocally(move);
				socket.emit("message", move);
				prevId = id;
			});
		}
		adjustCardWidth('.zone_doors_drop');
		adjustCardWidth('.zone_treasure_drop');
		recalculateAllPowerDisplays();

		// Если грабить нечего — сразу завершаем грабёж (без открытия модалок).
		if (deathLootState && Number(localSeat) === Number(deathLootState.ownerSeat) && lootCardIds.length === 0) {
			socket.emit("message", {
				method: "DeathLootFinished",
				deadSeat,
				remainingCardIds: [],
			});
			return;
		}

		// Ведущий (ownerSeat) запускает первый ход грабежа.
		if (deathLootState && Number(localSeat) === Number(deathLootState.ownerSeat)) {
			socket.emit("message", {
				method: "DeathLootTurn",
				deadSeat,
				ownerSeat: deathLootState.ownerSeat,
				looterSeat: lootersOrder[0] ?? null,
				remainingCardIds: lootCardIds.slice(),
			});
		}
	}
	if (response.method === "DeathLootTurn") {
		const deadSeat = parseInt(response.deadSeat, 10);
		const ownerSeat = parseInt(response.ownerSeat, 10);
		const looterSeat = parseInt(response.looterSeat, 10);
		const remainingCardIds = Array.isArray(response.remainingCardIds) ? response.remainingCardIds.filter(Boolean) : [];
		if (Number.isNaN(deadSeat) || Number.isNaN(looterSeat)) {
			return;
		}
		if (!deathLootActive || !deathLootState || Number(deathLootState.deadSeat) !== Number(deadSeat)) {
			deathLootActive = true;
			deathLootState = {
				deadSeat,
				ownerSeat: !Number.isNaN(ownerSeat) ? ownerSeat : (deathLootState?.ownerSeat ?? escapeOwnerSeat ?? deadSeat),
				lootersOrder: [],
				remaining: remainingCardIds.slice(),
				index: 0,
			};
		} else {
			deathLootState.remaining = remainingCardIds.slice();
			// Никогда не теряем ownerSeat — он нужен, чтобы после грабежа гарантированно продолжить смывку.
			if (deathLootState.ownerSeat == null && !Number.isNaN(ownerSeat)) {
				deathLootState.ownerSeat = ownerSeat;
			}
		}
		if (localSeat === deadSeat) {
			showLootStatus("Ты умер.");
		} else if (localSeat === looterSeat) {
			showLootStatus(`Твоя очередь грабить ${getSeatLabel(deadSeat)}`);
		} else {
			showLootStatus(`Сейчас грабит ${getSeatLabel(looterSeat)} (${getSeatLabel(deadSeat)})`);
		}
		if (localSeat === looterSeat) {
			// Если карт нет — модалку не показываем.
			if (!remainingCardIds.length) {
				return;
			}
			openDeathLootPickModal(deadSeat, looterSeat, remainingCardIds);
		} else {
			const modal = document.getElementById("death-loot-pick-modal");
			if (modal) {
				modal.remove();
			}
		}
	}
	if (response.method === "DeathLootPicked") {
		const deadSeat = parseInt(response.deadSeat, 10);
		const looterSeat = parseInt(response.looterSeat, 10);
		const cardId = response.cardId;
		const remainingCardIds = Array.isArray(response.remainingCardIds) ? response.remainingCardIds.filter(Boolean) : [];
		if (Number.isNaN(deadSeat) || Number.isNaN(looterSeat) || !cardId) {
			return;
		}
		// DOM-перемещение карты выполняется через стандартное сетевое moveCard,
		// чтобы не было рассинхрона/«копий» между клиентами.
		if (deathLootState && Number(deathLootState.deadSeat) === Number(deadSeat)) {
			deathLootState.remaining = remainingCardIds.slice();
		}
		const modal = document.getElementById("death-loot-pick-modal");
		if (modal) {
			modal.remove();
		}
		recalculateAllPowerDisplays();
	}
	if (response.method === "DeathLootFinished") {
		const deadSeat = parseInt(response.deadSeat, 10);
		const remainingCardIds = Array.isArray(response.remainingCardIds) ? response.remainingCardIds.filter(Boolean) : [];
		if (Number.isNaN(deadSeat)) {
			return;
		}
		const lootOwnerSeatSnapshot = deathLootState?.ownerSeat;
		remainingCardIds.forEach((id) => moveCardIdToDiscard(id));
		deathLootActive = false;
		deathLootState = null;
		clearDeathLootUi();
		showLootStatus(`Грабёж завершён. ${getSeatLabel(deadSeat)} возрождается без карт.`);
		setTimeout(() => {
			hideBattleResult();
		}, 1800);
		recalculateAllPowerDisplays();
		// Решение "продолжать смывку или сбрасывать монстров" принимает владелец очереди смывки,
		// и сообщает всем клиентам, чтобы не было рассинхрона.
		const canResumeEscape =
			escapeActive
			&& Array.isArray(escapeQueue)
			&& escapeQueue.length > 0
			// Во время грабежа индекс мог быть сброшен, но это не значит, что смывка не нужна.
			// Главное — чтобы после нормализации индекс указывал на существующего участника.
			&& (escapeQueueIndex < 0 || escapeQueueIndex < escapeQueue.length);
		// Продолжение смывки после грабежа запускает именно ведущий грабежа (ownerSeat из DeathStart),
		// чтобы не зависеть от возможной рассинхронизации escapeOwnerSeat между клиентами.
		if (canResumeEscape && lootOwnerSeatSnapshot != null && Number(localSeat) === Number(lootOwnerSeatSnapshot)) {
			if (!escapeActive) {
				escapeActive = true;
			}
			if (escapeQueueIndex < 0) {
				escapeQueueIndex = 0;
			}
			deathLootAwaitingEscapeFinish = true;
			socket.emit("message", {
				method: "DeathLootResumeEscape",
				ownerSeat: lootOwnerSeatSnapshot,
			});
			return;
		}
		if (lootOwnerSeatSnapshot != null && Number(localSeat) === Number(lootOwnerSeatSnapshot)) {
			socket.emit("message", {
				method: "DeathLootDropMonsters",
			});
		}
	}
	if (response.method === "DeathLootResumeEscape") {
		const ownerSeat = parseInt(response.ownerSeat, 10);
		deathLootAwaitingEscapeFinish = true;
		if (!Number.isNaN(ownerSeat) && ownerSeat >= 0) {
			escapeOwnerSeat = ownerSeat;
		}
		if (!escapeActive) {
			escapeActive = true;
		}
		if (escapeQueueIndex < 0) {
			escapeQueueIndex = 0;
		}
		turnAwaitingManualEnd = false;
		updateTurnActionButtons(false);
		setTimeout(() => {
			if (!Number.isNaN(ownerSeat) && Number(localSeat) === Number(ownerSeat)) {
				runNextEscapeAttemptAndBroadcast();
			}
		}, 500);
	}
	if (response.method === "DeathLootDropMonsters") {
		deathLootAwaitingEscapeFinish = false;
		MoveMonstersToDrop();
		turnAwaitingManualEnd = true;
		updateTurnActionButtons(false);
		recalculateAllPowerDisplays();
	}
	if (response.method === "MonsterBonusAttach") {
		const bonusCardId = response.bonusCardId;
		const monsterCardId = response.monsterCardId;
		if (bonusCardId && monsterCardId) {
			setBonusPowerMonsterAttachment(bonusCardId, monsterCardId);
		}
	}
	if (response.method === "EscapeSequenceStart") {
		const incomingOwnerSeat = parseInt(response.ownerSeat, 10);
		hideEscapeAidOptionsModal(true);
		hideEscapeRatMonsterPickModal();
		// Владелец смывки уже инициализировал очередь локально.
		// Если повторно применить этот же старт из сети, индекс сбросится и первый игрок получит второй бросок.
		if (escapeActive && escapeQueue.length > 0 && !Number.isNaN(incomingOwnerSeat) && localSeat === incomingOwnerSeat) {
			return;
		}
		escapeActive = true;
		escapeQueue = Array.isArray(response.queue) ? response.queue.slice() : [];
		escapeQueueIndex = -1;
		escapeMonsterRemover = Number(response.monsterRemover) || 0;
		escapeMonsterBadStaff = normalizeBadStaff(response.monsterBadStaff);
		escapeMonsterQueue = Array.isArray(response.monsterQueue) ? response.monsterQueue.slice() : [];
		escapeMonsterTemplateQueue = Array.isArray(response.monsterTemplateQueue) ? response.monsterTemplateQueue.slice() : escapeMonsterQueue.slice();
		escapeMonsterInitialCount = Number(response.monsterInitialCount) || escapeMonsterQueue.length;
		escapeOwnerSeat = incomingOwnerSeat;
		escapeAttemptNumber = 0;
		escapeHalflingRetryUsedForCurrentAttempt = false;
		escapeHalflingRetryPending = null;
		escapeWizardFlightPending = null;
		hideWizardFlightModal();
		hideEscapeHalflingRetryModal();
		// Очередь смывки при 2 участниках: [лидер, помощник] — тот же гейт, что при старте у владельца (для UI «не монстр, а стенка»).
		escapeInstantWallGate = null;
		if (Array.isArray(escapeQueue) && escapeQueue.length === 2) {
			const a = Number(escapeQueue[0]);
			const b = Number(escapeQueue[1]);
			if (Number.isFinite(a) && Number.isFinite(b) && a !== b) {
				escapeInstantWallGate = { loserSeat: a, helperSeat: b };
			}
		}
		recalculateAllPowerDisplays();
	}
	if (response.method === "EscapeMonsterPickStart") {
		const seat = parseInt(response.seat, 10);
		const monsters = Array.isArray(response.monsters) ? response.monsters : [];
		hideEscapeRatMonsterPickModal();
		hideEscapeMonsterPicker();
		if (!Number.isNaN(seat) && monsters.length > 0) {
			escapeMonsterPickSession = {
				seat,
				monsters: cloneTurnStateJson(monsters) || [],
			};
			flushTurnStateSyncToServer();
		} else {
			clearEscapeMonsterPickSession();
		}
		if (!Number.isNaN(seat) && localSeat === seat) {
			const aidEntries = collectEscapeAidCardEntriesForSeat(seat);
			const hasAid = aidEntries.length > 0;
			if (hasAid) {
				openEscapeAidOptionsModal();
			} else {
				maybeTryOpenEscapeAidOptionsModal();
			}
			if (!hasAid && !shouldSuppressEscapeMonsterPickBannerForSeat(seat)) {
				showBattleResult("Выбери монстра, от которого будешь смываться.");
				showEscapeMonsterPicker(monsters, (cardId) => {
					hideEscapeMonsterPicker();
					socket.emit("message", {
						method: "EscapeMonsterChosen",
						seat: localSeat,
						cardId,
					});
				});
			}
		} else if (!Number.isNaN(seat) && !shouldSuppressEscapeMonsterPickBannerForSeat(seat)) {
			showBattleResult(`${getSeatLabel(seat)} выбирает монстра для смывки...`);
		}
	}
	if (response.method === "EscapeMonsterChosen") {
		clearEscapeMonsterPickSession();
		hideEscapeMonsterPicker();
		const chosenSeat = parseInt(response.seat, 10);
		const pickedId = response.cardId ? String(response.cardId) : "";
		if (!Number.isNaN(chosenSeat) && pickedId) {
			setCurrentEscapeMonsterById(pickedId);
		}
		if (localSeat === escapeOwnerSeat && !Number.isNaN(chosenSeat) && chosenSeat === escapeQueue[escapeQueueIndex]) {
			socket.emit("message", {
				method: "EscapeTurnStart",
				seat: chosenSeat,
				index: escapeQueueIndex,
				isRetry: false,
			});
		}
		flushTurnStateSyncToServer();
	}
	if (response.method === "EscapeTurnStart") {
		clearEscapeMonsterPickSession();
		const seat = parseInt(response.seat, 10);
		const isRetry = Boolean(response.isRetry);
		if (!Number.isNaN(seat)) {
			escapeCurrentSeat = seat;
			escapeWaitingForRoll = true;
			escapeRollInProgress = false;
			if (!isRetry) {
				escapeAttemptNumber = 0;
				escapeHalflingRetryUsedForCurrentAttempt = false;
				escapeHalflingRetryPending = null;
			}
			hideEscapeHalflingRetryModal();
			showEscapeTurnText(seat);
		}
		flushTurnStateSyncToServer();
		maybeTryOpenEscapeAidOptionsModal();
	}
	if (response.method === "EscapeCloseAidModals") {
		hideEscapeAidOptionsModal(true);
		hideEscapeRatMonsterPickModal();
	}
	if (response.method === "EscapeFailAidPrompt") {
		const seat = parseInt(response.seat, 10);
		const attemptNumber = Number(response.attemptNumber) || 0;
		const payload = response.payload && typeof response.payload === "object" ? response.payload : null;
		if (Number.isNaN(seat) || !payload) {
			return;
		}
		// Сохраняем pending на всех клиентах, но модалку показываем только тому, кто смывается.
		escapeFailAidPending = { seat, payload: cloneTurnStateJson(payload) || { ...payload }, attemptNumber };
		if (Number(localSeat) === Number(seat)) {
			openEscapeFailAidModal({ seat, attemptNumber });
		} else {
			showBattleResult(`${getSeatLabel(seat)} выбирает, как помочь смывке...`);
		}
	}
	if (response.method === "EscapeFailAidSkip") {
		// Скип обрабатывает владелец очереди смывки.
		if (Number(localSeat) !== Number(escapeOwnerSeat)) {
			return;
		}
		const seat = parseInt(response.seat, 10);
		if (Number.isNaN(seat) || !escapeFailAidPending || Number(escapeFailAidPending.seat) !== Number(seat) || !escapeFailAidPending.payload) {
			return;
		}
		const pendingPayload = { ...escapeFailAidPending.payload };
		escapeFailAidPending = null;
		emitEscapeRollResultAndAdvance(pendingPayload);
	}
	if (response.method === "EscapeInvisibilityPotionApply") {
		const actingSeat = Number(response.actingSeat);
		const cardId = String(response.cardId || "");
		if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(actingSeat)) {
			escapeFailAidPending = null;
		}
		hideEscapeFailAidModal();
		hideWizardFlightModal();
		updateWizardFlightUi();
		if (cardId && Number.isFinite(actingSeat)) {
			moveTreasureCardToDiscard(cardId, { ownerSeat: actingSeat });
		}
		adjustCardWidth(".myhand");
		adjustCardWidth(".zone2");
		adjustCardWidth(".zone5");
		adjustCardWidth(".opponenthand");
		adjustCardWidth(".opponent2hand");
		adjustCardWidth(".opponent3hand");
		UpdatebackImgTreasure();
		if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && Number.isFinite(actingSeat) && Number(actingSeat) === Number(escapeCurrentSeat)) {
			const payload = {
				method: "EscapeRollResult",
				seat: actingSeat,
				rawRoll: 6,
				equipRemover: getSeatEquipmentRemover(actingSeat),
				monsterRemover: escapeMonsterRemover,
				totalRoll: ESCAPE_TARGET_ROLL,
				escaped: true,
				badStaffPenalty: null,
				monsterCardId: escapeCurrentMonsterCardId,
				viaInvisibilityPotion: true,
			};
			emitEscapeRollResultAndAdvance(payload);
		}
	}
	if (response.method === "EscapeMagicLampBanish") {
		const actingSeat = Number(response.actingSeat);
		const lampId = String(response.cardId || "");
		const monsterId = String(response.monsterCardId || "");
		if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(actingSeat)) {
			escapeFailAidPending = null;
		}
		hideEscapeFailAidModal();
		hideWizardFlightModal();
		updateWizardFlightUi();
		if (lampId && Number.isFinite(actingSeat)) {
			moveTreasureCardToDiscard(lampId, { ownerSeat: actingSeat });
		}
		if (monsterId) {
			moveCardToDiscardById(monsterId);
			setMonsterBasePower(computeMonsterZoneBasePower());
		}
		showBattleResult(`Монстр прогнан волшебной лампой!`);
		setTimeout(() => hideBattleResult(), 1600);

		// Обновляем очереди смывки (у всех клиентов одинаково).
		if (monsterId) {
			removeMonsterIdFromEscapeQueues(monsterId);
		}
		if (monsterId && String(escapeCurrentMonsterCardId) === monsterId) {
			escapeCurrentMonsterCardId = null;
			escapeWaitingForRoll = false;
			escapeRollInProgress = false;
		}
		recalculateAllPowerDisplays();
		pushOpenModalsToServerDebounced();

		// Продолжение смывки запускает владелец очереди.
		if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive) {
			setTimeout(() => {
				runNextEscapeAttemptAndBroadcast();
			}, 250);
		}
	}
	if (response.method === "LoadedDieDiscard") {
		const seat = Number(response.seat);
		const cardId = String(response.cardId || "");
		hideLoadedDieModals();
		if (cardId && Number.isFinite(seat) && cardId.includes("treasure")) {
			moveTreasureCardToDiscard(cardId, { ownerSeat: seat });
		} else if (cardId) {
			moveCardToDiscardById(cardId);
		}
		recalculateAllPowerDisplays();
	}
	if (response.method === "EscapeGluePrompt") {
		const key = String(response.key || "");
		const escapedSeat = Number(response.escapedSeat);
		const monsterCardId = String(response.monsterCardId || "");
		const viaInstantWall = Boolean(response.viaInstantWall);
		const wallFleeRaw = Array.isArray(response.wallFleeSeats) ? response.wallFleeSeats : [];
		const wallFleeSet = new Set(
			wallFleeRaw
				.map((x) => Number(x))
				.filter((x) => Number.isFinite(x)),
		);
		if (!wallFleeSet.size && Number.isFinite(escapedSeat)) {
			wallFleeSet.add(Number(escapedSeat));
		}
		if (!key || !Number.isFinite(escapedSeat) || (!monsterCardId && !viaInstantWall)) {
			return;
		}
		// Опрос клея заменяет фазу выбора монстра — иначе после стенки остаётся открытое окно выбора.
		clearEscapeMonsterPickSession();
		hideEscapeMonsterPicker();
		// Участники, которых «приклеили» (в т.ч. оба после стенки), не участвуют в выборе клея.
		if (wallFleeSet.has(Number(localSeat))) {
			return;
		}
		const ids = getFlaskOfGlueTreasureCardIdsForSeat(localSeat);
		if (!ids.length) {
			socket.emit("message", { method: "EscapeGlueDecision", key, used: false, actingSeat: Number(localSeat) });
			return;
		}
		// Сообщение всем: этот игрок сейчас решает по тюбику клея.
		socket.emit("message", { method: "EscapeGlueWaiting", key, actingSeat: Number(localSeat) });
		openFlaskOfGlueConfirmModal({
			promptKey: key,
			escapedSeat,
			monsterCardId,
			viaInstantWall,
			wallFleeSeats: Array.from(wallFleeSet),
		});
	}
	if (response.method === "EscapeGlueWaiting") {
		const key = String(response.key || "");
		const actingSeat = Number(response.actingSeat);
		if (!key || !Number.isFinite(actingSeat)) {
			return;
		}
		// У решающего игрока открыта модалка — дублирующую плашку не показываем.
		if (Number(localSeat) === Number(actingSeat)) {
			return;
		}
		showEscapeGlueWaitingBanner(key, actingSeat);
	}
	if (response.method === "EscapeGlueClose") {
		hideFlaskOfGlueModal();
		const key = String(response.key || "");
		if (key && escapeGlueWaitingKey && key === escapeGlueWaitingKey) {
			escapeGlueWaitingKey = null;
			removeEscapeGlueWaitingBanner();
			// Не вызываем hideBattleResult — иначе сотрём подсказку «кинь кубик», пришедшую сразу после EscapeTurnStart.
		}
	}
	if (response.method === "EscapeGlueDecision") {
		// Сброс клея должен отобразиться у всех клиентов (не только у владельца очереди).
		const usedAny = Boolean(response.used);
		const actingSeatAny = Number(response.actingSeat);
		const glueIdAny = String(response.cardId || "");
		if (usedAny && glueIdAny && Number.isFinite(actingSeatAny) && glueIdAny.includes("treasure")) {
			moveTreasureCardToDiscard(glueIdAny, { ownerSeat: actingSeatAny });
			recalculateAllPowerDisplays();
		}

		// Решение применяет владелец очереди смывки.
		if (Number(localSeat) !== Number(escapeOwnerSeat) || !escapeGluePromptState) {
			return;
		}
		const key = String(response.key || "");
		if (!key || key !== String(escapeGluePromptState.key || "")) {
			return;
		}
		const actingSeat = Number(response.actingSeat);
		if (!Number.isFinite(actingSeat)) {
			return;
		}
		escapeGluePromptState.pending?.delete?.(actingSeat);
		const used = Boolean(response.used);
		if (used) {
			escapeGluePromptState.resolved = true;
			const targetSeat = Number(response.targetSeat);
			const glueId = String(response.cardId || "");
			const monsterId = String(response.monsterCardId || "");
			const wasInstantWall = Boolean(escapeGluePromptState.viaInstantWall);
			const victimsFromMsg = Array.isArray(response.wallFleeSeats)
				? response.wallFleeSeats.map((x) => Number(x)).filter((x) => Number.isFinite(x))
				: [];
			const victimsFromState = Array.isArray(escapeGluePromptState.wallFleeSeats)
				? escapeGluePromptState.wallFleeSeats.map((x) => Number(x)).filter((x) => Number.isFinite(x))
				: [];
			const victims = (victimsFromMsg.length ? victimsFromMsg : victimsFromState.length ? victimsFromState : (Number.isFinite(targetSeat) ? [targetSeat] : []));
			socket.emit("message", { method: "EscapeGlueClose", key });
			if (glueId && Number.isFinite(actingSeat)) {
				moveTreasureCardToDiscard(glueId, { ownerSeat: actingSeat });
			}
			if (monsterId || wasInstantWall) {
				const lab = victims.map((s) => getSeatLabel(s)).join(" и ");
				showBattleResult(
					victims.length > 1
						? `Тюбик клея! ${lab} снова смываются.`
						: `Тюбик клея! ${lab || getSeatLabel(targetSeat)} смывается снова.`,
				);
				// Не скрываем через таймер: на владельце очереди таймер стирал бы плашку «кинь кубик» после EscapeTurnStart.
			}
			// Перезапуск смывки. Если смывка была по Instant wall — нужно смываться от ВСЕХ монстров.
			escapeAttemptNumber = 0;
			escapeHalflingRetryUsedForCurrentAttempt = false;
			escapeHalflingRetryPending = null;
			escapeWizardFlightPending = null;
			escapeFailAidPending = null;
			hideEscapeFailAidModal();
			hideWizardFlightModal();
			updateWizardFlightUi();
			escapeRollInProgress = false;
			escapeGluePromptState = null;

			if (wasInstantWall) {
				// Снимаем автосмывку стенки у всех, кто ушёл со стенкой; очередь смывки с начала.
				victims.forEach((s) => {
					try {
						escapeInstantWallAutoSeats?.delete?.(Number(s));
					} catch {}
				});
				escapeCurrentMonsterCardId = null;
				escapeMonsterQueue = (escapeMonsterTemplateQueue || []).slice();
				escapeMonsterInitialCount = escapeMonsterQueue.length;
				escapeQueueIndex = 0;
				escapeWaitingForRoll = false;
				escapeCurrentSeat = null;
				runNextEscapeAttemptAndBroadcast();
			} else {
				// Обычный случай: смывка заново от того же монстра.
				setCurrentEscapeMonsterById(monsterId);
				escapeCurrentSeat = Number(targetSeat);
				escapeWaitingForRoll = true;
				socket.emit("message", {
					method: "EscapeTurnStart",
					seat: Number(targetSeat),
					index: escapeQueueIndex,
					isRetry: false,
				});
			}
			return;
		}
		// Если все ответили "нет" — продолжаем.
		if (!escapeGluePromptState.resolved && escapeGluePromptState.pending && escapeGluePromptState.pending.size <= 0) {
			const k = escapeGluePromptState.key;
			const finishAfter = Boolean(escapeGluePromptState.finishAfter);
			escapeGluePromptState = null;
			socket.emit("message", { method: "EscapeGlueClose", key: k });
			setTimeout(() => {
				if (finishAfter) {
					finishEscapeSequenceAndBroadcast();
				} else {
					runNextEscapeAttemptAndBroadcast();
				}
			}, 1200);
		}
	}
	if (response.method === "EscapeHalflingRetryPrompt") {
		openHalflingRetryModalNow(response.seat);
	}
	if (response.method === "EscapeHalflingRetryDecision") {
		if (localSeat !== escapeOwnerSeat) {
			return;
		}
		const seat = parseInt(response.seat, 10);
		if (Number.isNaN(seat) || seat !== escapeCurrentSeat) {
			return;
		}
		let pendingPayload = escapeHalflingRetryPending;
		if (!pendingPayload && escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(seat) && escapeFailAidPending.payload) {
			pendingPayload = escapeFailAidPending.payload;
		}
		if (!pendingPayload) {
			return;
		}

		const clearEscapePendingForSeat = () => {
			escapeHalflingRetryPending = null;
			if (escapeFailAidPending && Number(escapeFailAidPending.seat) === Number(seat)) {
				escapeFailAidPending = null;
			}
		};

		const useAbility = Boolean(response.useAbility);
		const cardId = response.cardId;
		if (!useAbility) {
			const failedPayload = { ...pendingPayload };
			clearEscapePendingForSeat();
			emitEscapeRollResultAndAdvance(failedPayload);
			return;
		}

		if (!cardId) {
			const failedPayload = { ...pendingPayload };
			clearEscapePendingForSeat();
			emitEscapeRollResultAndAdvance(failedPayload);
			return;
		}

		clearEscapePendingForSeat();
		socket.emit("message", {
			method: "HalflingEscapeDiscard",
			cardId,
			seat,
		});
		escapeWaitingForRoll = true;
		escapeRollInProgress = false;
		socket.emit("message", {
			method: "EscapeTurnStart",
			seat,
			index: escapeQueueIndex,
			isRetry: true,
		});
	}
	if (response.method === "HalflingEscapeDiscard") {
		const cid = String(response.cardId || "");
		const seat = Number(response.seat);
		if (cid.includes("treasure") && Number.isFinite(seat)) {
			moveTreasureCardToDiscard(cid, { ownerSeat: seat });
		} else if (cid) {
			moveCardToDiscardById(cid);
		}
	}
	if (response.method === "EscapeRollSubmit") {
		const seat = parseInt(response.seat, 10);
		const rawRoll = Number(response.rawRoll);
		if (!Number.isNaN(seat) && Number.isFinite(rawRoll) && localSeat === escapeOwnerSeat) {
			resolveEscapeRollAndBroadcast(seat, rawRoll);
		}
	}
	if (response.method === "EscapeRollResult") {
		hideEscapeAidOptionsModal(true);
		hideEscapeRatMonsterPickModal();
		escapeWizardFlightPending = null;
		hideWizardFlightModal();
		updateWizardFlightUi();
		escapeWaitingForRoll = false;
		escapeRollInProgress = false;
		const seat = parseInt(response.seat, 10);
		const rawRoll = Number(response.rawRoll);
		const equipRemover = Number(response.equipRemover) || 0;
		const monsterRemover = Number(response.monsterRemover) || 0;
		const totalRoll = Number(response.totalRoll);
		const escaped = Boolean(response.escaped);
		const monsterCardId = String(response.monsterCardId || "");
		const badStaffPenalty = normalizeBadStaff(response.badStaffPenalty);
		if (!Number.isNaN(seat) && Number.isFinite(rawRoll) && Number.isFinite(totalRoll)) {
			showBattleResult(escaped ? "Смывка удалась!" : "Смывка не удалась");
			if (!escaped && badStaffPenalty) {
				applyBadStaffToSeat(seat, badStaffPenalty);
			}
		}
		// Flask of glue обрабатывается через EscapeGluePrompt (без таймеров).
	}
	if (response.method === "EscapeSequenceFinished") {
		hideEscapeAidOptionsModal(true);
		hideEscapeRatMonsterPickModal();
		removeInstantWallWaitingBanners();
		removeInstantWallSoloAidWaitingBanner();
		instantWallSoloAidWaitingEmitted = false;
		hideInstantWallModal();
		hideFlaskOfGlueModal();
		removeEscapeGlueWaitingBanner();
		escapeGlueWaitingKey = null;
		clearEscapeMonsterPickSession();
		escapeActive = false;
		escapeQueue = [];
		escapeQueueIndex = -1;
		escapeMonsterRemover = 0;
		escapeMonsterBadStaff = null;
		escapeMonsterQueue = [];
		escapeMonsterInitialCount = 0;
		escapeMonsterTemplateQueue = [];
		escapeCurrentMonsterCardId = null;
		escapeCurrentSeat = null;
		escapeWaitingForRoll = false;
		escapeOwnerSeat = null;
		escapeRollInProgress = false;
		escapeAttemptNumber = 0;
		escapeHalflingRetryUsedForCurrentAttempt = false;
		escapeHalflingRetryPending = null;
		escapeWizardFlightPending = null;
		escapeInstantWallGate = null;
		escapeInstantWallOfferPending = null;
		escapeInstantWallAutoSeats = new Set();
		hideWizardFlightModal();
		hideEscapeMonsterPicker();
		hideEscapeHalflingRetryModal();
		// Если смывка была после смерти (ждём конца смывки помощника), то теперь можно сбросить монстров.
		if (!deathLootActive) {
			MoveMonstersToDrop();
			turnAwaitingManualEnd = true;
			updateTurnActionButtons(false);
			recalculateAllPowerDisplays();
			setTimeout(() => {
				hideBattleResult();
			}, 1500);
		}
		deathLootAwaitingEscapeFinish = false;
	}
	if (response.method === "EscapeOwnerTransfer") {
		const nextOwner = parseInt(response.ownerSeat, 10);
		if (!Number.isNaN(nextOwner) && nextOwner >= 0) {
			escapeOwnerSeat = nextOwner;
		}
	}
	if (response.method === "IncomeTaxStart") {
		handleIncomeTaxStart(response);
	}
	if (response.method === "IncomeTaxInitiatorPick") {
		handleIncomeTaxInitiatorPick(response);
	}
	if (response.method === "IncomeTaxInsufficientDumpSync") {
		handleIncomeTaxInsufficientDumpSync(response);
	}
	if (response.method === "IncomeTaxResponderSubmit") {
		handleIncomeTaxResponderSubmit(response);
	}
	if (response.method === "IncomeTaxCurseFinished") {
		const cid = String(response.curseCardId || "").trim();
		finishIncomeTaxCurse(cid);
	}
	if (response.method === "BadStaffLevel") {
		applyBadStaffLevelFromNetwork(response);
	}
	if (response.method === "CurseWishingRingOffer") {
		handleCurseWishingRingOffer(response);
	}
	if (response.method === "CurseWishingRingResponse") {
		handleCurseWishingRingResponse(response);
	}
	if (response.method === "CurseWishingRingAllSkippedApply") {
		handleCurseWishingRingAllSkippedApply(response);
	}
	if (response.method === "MalignMirrorApply") {
		const seat = Number(response.seat);
		const curseId = String(response.curseCardId || "").trim();
		if (Number.isFinite(seat) && seat >= 0 && curseId) {
			// Ставим pending (если уже active/pending — не перетираем).
			if (!malignMirrorActiveBySeat.has(seat) && !malignMirrorPendingBySeat.has(seat)) {
				malignMirrorPendingBySeat.set(seat, curseId);
			}
			// Если игрок уже участвует в текущем бою — активируем сразу.
			tryActivateMalignMirrorForSeat(seat);
			recalculateAllPowerDisplays();
		}
	}
	if (response.method === "ChangeSexApply") {
		const seat = Number(response.seat);
		const curseId = String(response.curseCardId || "").trim();
		const gender = String(response.gender || "").trim();
		if (Number.isFinite(seat) && seat >= 0 && curseId && (gender === "Male" || gender === "Female")) {
			// Фиксируем, что карта использована и до сброса повторно не применяется.
			const curseEl = document.getElementById(curseId);
			if (curseEl) {
				curseEl.dataset.changeSexUsedNotDiscarded = "1";
			}
			// Меняем пол у всех клиентов.
			if (characterBySeat?.[seat]) {
				characterBySeat[seat].gender = gender;
			}
			// Плашка для всех: у игрока сменён пол.
			showBattleResult(`${getSeatLabel(seat)}: пол сменён`);
			setTimeout(() => hideBattleResult(), 2000);
			hideSeatIconTooltip();
			// Штраф -5 на один бой: pending, либо активируем сразу если уже участвует в бою.
			if (!changeSexActiveBySeat.has(seat) && !changeSexPendingBySeat.has(seat)) {
				changeSexPendingBySeat.set(seat, curseId);
			}
			tryActivateChangeSexPenaltyForSeat(seat);
			recalculateAllPowerDisplays();
		}
	}
	if (response.method === "LoseYourClassResolve") {
		resolveLoseYourClassCurse({
			seat: response.seat,
			curseCardId: response.curseCardId,
			chosenClassCardId: response.chosenClassCardId,
		});
	}
	if (response.method === "LevelAdjust") {
		const seat = Number(response.seat);
		const delta = Number(response.delta) || 0;
		if (Number.isFinite(seat) && seat >= 0 && Number.isFinite(delta) && delta !== 0) {
			let cur = levelBySeat[seat];
			if (cur == null || Number.isNaN(cur)) {
				cur = 1;
			}
			cur = Math.max(1, cur);
			setLevelBySeat(seat, Math.max(1, cur + delta));
			recalculateAllPowerDisplays();
		}
	}
	if (response.method === "TreasureLevel") {
		const seat = parseInt(response.seat, 10);
		const levelGain = Number(response.level);
		const cardId = response.cardId;
		if (!Number.isNaN(seat) && Number.isFinite(levelGain) && levelGain > 0 && cardId) {
			applyTreasureLevelToSeat(seat, levelGain);
			moveTreasureCardToDiscard(cardId);
		}
	}
	if (response.method === "Treasure65LevelSwap") {
		const fromSeat = parseInt(response.fromSeat, 10);
		const toSeat = parseInt(response.toSeat, 10);
		const cardId = response.cardId;
		const cardName = response.card_name;
		if (!Number.isNaN(fromSeat) && !Number.isNaN(toSeat) && cardName === STEAL_LEVEL_CARD_NAME && cardId) {
			applyTreasure65LevelSwap(fromSeat, toSeat);
			moveTreasureCardToDiscard(cardId);
		}
	}
	if (response.method === "SellTreasures") {
		applyTreasureSellResult(response.seat, response.cardIds, response.totalCost);
	}
	if (response.method === "UpdateBonus") {
		recalculateMyBonusDisplay();
	}

	if (response.method === "UpdateMonster") {
		// console.log('обнова силы');
		const CurrentPower = response.power;
		setMonsterBasePower(CurrentPower);
	}
	if (response.method === "UpdateTimer") {
		// const timerElement = document.getElementById('timer');
		// timerElement.textContent = ""
		timer()
	}

	if (response.method === "DeathLootPick") {
		// Валидируем и применяем только у ведущего грабежа.
		if (!deathLootState || Number(localSeat) !== Number(deathLootState.ownerSeat)) {
			return;
		}
		const deadSeat = parseInt(response.deadSeat, 10);
		const looterSeat = parseInt(response.looterSeat, 10);
		const cardId = response.cardId;
		const handZoneId = response.handZoneId;
		if (Number.isNaN(deadSeat) || Number.isNaN(looterSeat) || !cardId) {
			return;
		}
		if (!deathLootActive || !deathLootState || Number(deathLootState.deadSeat) !== Number(deadSeat)) {
			return;
		}
		const state = deathLootState;
		const expectedLooter = state.lootersOrder?.[state.index];
		if (Number(expectedLooter) !== Number(looterSeat)) {
			return;
		}
		if (state.remaining.indexOf(cardId) === -1) {
			return;
		}

		// Двигаем карту в руку грабителя через moveCard (ид зоны пришёл от грабителя).
		if (handZoneId && typeof handZoneId === "string") {
			const move = {
				method: "moveCard",
				cardId,
				targetId: null,
				zoneId: handZoneId,
			};
			applyMoveCardLocally(move);
			socket.emit("message", move);
		}

		// Убираем карту из пула.
		state.remaining = state.remaining.filter((x) => x !== cardId);

		socket.emit("message", {
			method: "DeathLootPicked",
			deadSeat,
			looterSeat,
			cardId,
			remainingCardIds: state.remaining.slice(),
		});

		// Переходим к следующему грабителю или заканчиваем.
		state.index += 1;
		if (state.remaining.length <= 0 || state.index >= (state.lootersOrder?.length || 0)) {
			socket.emit("message", {
				method: "DeathLootFinished",
				deadSeat,
				remainingCardIds: state.remaining.slice(),
			});
			return;
		}
		socket.emit("message", {
			method: "DeathLootTurn",
			deadSeat,
			ownerSeat: state.ownerSeat ?? escapeOwnerSeat ?? deadSeat,
			looterSeat: state.lootersOrder[state.index],
			remainingCardIds: state.remaining.slice(),
		});
	}
  
  if (response.method === "shuffleDeck") {
    //нужно передать перемешанный массив doors
		// console.log('перемешиваем')
		window.doors = response.deckDoors;
		window.treasures = response.deckTreasure;
		// Старт игры теперь инициирует сервер (сервер-авторитет).
  }
	if (response.method === "1") {
		//console.log("первый")
    fl = response.fl;
		localSeat = 0;
		ensureLocalPlayerProfileChosen();
		updatePlayersUiVisibility(num);
		recalculateAllPowerDisplays();
		applyTurnHighlight();
		for (let i = 1; i <= 95; i++) {
			const door = eval(`door${i}`);
			window.doors.push(door);
		}
		for (let i = 1; i <= 73; i++) {
			const treasure = eval(`treasure${i}`);
			window.treasures.push(treasure);
		}
		shuffle(window.doors);
		shuffle(window.treasures);

		const shuffleDeck = {
			method: "shuffleDeck",
			deckDoors: window.doors,
			deckTreasure: window.treasures,
		};
		socket.emit("message",shuffleDeck);
		// Тестовая раздача: два хотельных кольца в руку первого игрока.
		socket.emit("message", { method: "MateTestDeal", seat: 0, cardId: "treasure42" });
		socket.emit("message", { method: "MateTestDeal", seat: 0, cardId: "treasure43" });
		
		
  }
	if (response.method === "2Players") {
		//console.log("второй или третий ")
    fl = response.fl;
		localSeat = 1;
		ensureLocalPlayerProfileChosen();
		num = 2;
		window.num = num;
		const opponenthand = document.getElementById("opponenthand");
		const myhand = document.getElementById("myhand");
		const zone_opponent = document.getElementById("zone_opponent");
		const zone2 = document.getElementById("zone2");
		const zone_opponent_side = document.getElementById("zone_opponent_side");
		const zone5 = document.getElementById("zone5");


		// Определяем, является ли пользователь вторым игроком
		if (fl==true) {
			//console.log(myhand);
			// Если пользователь второй игрок, меняем классы элементов
			opponenthand.classList.remove("opponenthand");
			opponenthand.classList.add("myhand");
			myhand.classList.remove("myhand");
			myhand.classList.add("opponenthand");

			zone_opponent.classList.remove("zone_opponent");
			zone_opponent.classList.add("zone2");
			zone2.classList.remove("zone2");
			zone2.classList.add("zone_opponent");
			
			zone_opponent_side.classList.remove("zone_opponent_side");
			zone_opponent_side.classList.add("zone5");
			zone5.classList.remove("zone5");
			zone5.classList.add("zone_opponent_side");


			fl=false;
		}
		updatePlayersUiVisibility(num);
		recalculateAllPowerDisplays();
		applyTurnHighlight();
		
  }
	if (response.method === "3Players") {
		//console.log("второй или третий ")
		fl = response.fl;
		localSeat = fl === "3player" ? 2 : 1;
		ensureLocalPlayerProfileChosen();
		num = 3;
		window.num = num;
		// Та же раскладка, что после refresh (RestoreSeat / RoomState), иначе оппоненты «меняются местами».
		resetThreePlayerLayoutToSeatZero();
		if (localSeat === 1) {
			applyThreePlayerLayoutSeat1AsInJoinMessage();
		} else if (localSeat === 2) {
			applyThreePlayerLayoutSeat2AsInJoinMessage();
		}
		updatePlayersUiVisibility(num);
		recalculateAllPowerDisplays();
		applyTurnHighlight();
	}
	if (response.method === "RandDice"){
		const rand = response.digit;
		const NUMBER_OF_DICE = 1;
		const diceContainer = document.querySelector(".dice-container");
		window.flag_dice = false;
		randomizeDice(diceContainer, 0);
		const dice = createDice(rand);
		diceContainer.appendChild(dice);

		// diceContainer.addEventListener("click", () => {
		// 	const interval = setInterval(() => {
		// 		randomizeDice(diceContainer, NUMBER_OF_DICE);
		// 	}, 50);

		// 	setTimeout(() => clearInterval(interval), 1000);
		// });
	}

	if (response.method === "StartGame" && gameStarted == false) {
		// Сервер-авторитет присылает колоды: по ним создаём DOM карт.
		if (Array.isArray(response.deckDoors)) {
			window.doors = response.deckDoors;
		}
		if (Array.isArray(response.deckTreasure)) {
			window.treasures = response.deckTreasure;
		}
		num = response.num;
		window.num = num;
		//console.log(`${num} игроков`);
		updatePlayersUiVisibility(num);
		bindSeatIconHoverTooltips();
		recalculateAllPowerDisplays();
		applyTurnHighlight();
		// Раздачу/перемещения теперь делает сервер через moveCard.
		// Здесь только создаём карты колод в DOM.
		window.zonedoor = document.querySelector('.zone_doors');
		window.zoneTreasure = document.querySelector('.zone_treasure');
		if (window.zonedoor && window.zoneTreasure) {
			Deck_filling(window.doors, window.zonedoor);
			UpdatebackImgDoor();
			Deck_filling(window.treasures, window.zoneTreasure);
			UpdatebackImgTreasure();
			UpdateZones();
			window.allCards = document.querySelectorAll('.card');
		}
		// Тестовую раздачу наёмничка убрали.
		recalculateAllPowerDisplays();
		applyTurnHighlight();
		window.button.remove();
		window.button = null;
		UpdatebackImgDoor()
		UpdatebackImgTreasure()
		UpdateZones();
		initializeSellTreasuresUi();
		adjustCardWidth('.myhand');
		adjustCardWidth('.zone2');
		adjustCardWidth('.zone5');
		adjustCardHeight('.zone3');
		adjustCardHeight('.zone_monster');
		adjustCardWidth('.opponenthand');
		// Обработчики классов: timer() не вызывается вне боя, поэтому вешаем клик здесь.
		const thiefTheftInitBtn = document.getElementById("thief-theft-btn");
		if (thiefTheftInitBtn) {
			thiefTheftInitBtn.onclick = () => openThiefTheftModal();
		}
		const thiefTrimInitBtn = document.getElementById("thief-trim-btn");
		if (thiefTrimInitBtn) {
			thiefTrimInitBtn.onclick = () => openThiefTrimModal();
		}
		const wizardTamingInitBtn = document.getElementById("wizard-taming-btn");
		if (wizardTamingInitBtn) {
			wizardTamingInitBtn.onclick = () => openWizardTamingModal();
		}
		updateWizardTamingUi();
		updateWizardFlightUi();
		updateThiefTheftUi();
		updateThiefTrimUi();
		gameStarted = true;
		ensureRoomOpenModalsMutationObserver();
		if (localSeat === 0) {
			setRandomFirstTurn();
		}

		setupMunchkinDiceAfterGameStart();

	}
	if (response.method === "EscapeRatOnStickApply") {
		applyEscapeRatOnStickFromNetwork({
			ratCardId: response.ratCardId,
			monsterCardId: response.monsterCardId,
			actingSeat: response.actingSeat,
		});
	}
	if (response.method === "InstantWallHelperPrompt") {
		const helperSeat = Number(response.helperSeat);
		const loserSeat = Number(response.loserSeat);
		if (!Number.isFinite(helperSeat) || !Number.isFinite(loserSeat)) {
			return;
		}
		// Окно должно открыться у помощника ДО начала смывки лидера.
		if (!localSeatMatchesSeat(helperSeat)) {
			return;
		}
		openInstantWallPickModal({
			title: "Instant wall: применить стенку мгновенку?",
			seat: helperSeat,
			onPick: (cardId) => {
				socket.emit("message", { method: "InstantWallHelperDecision", helperSeat, loserSeat, used: true, cardId });
			},
			onSkip: () => {
				socket.emit("message", { method: "InstantWallHelperDecision", helperSeat, loserSeat, used: false, cardId: null });
			},
		});
	}
	if (response.method === "InstantWallHelperWaiting") {
		const helperSeat = Number(response.helperSeat);
		if (!Number.isFinite(helperSeat)) {
			return;
		}
		if (localSeatMatchesSeat(helperSeat)) {
			return;
		}
		showInstantWallHelperWaitingBanner(helperSeat);
	}
	if (response.method === "InstantWallOfferWaiting") {
		const fromSeat = Number(response.fromSeat);
		const toSeat = Number(response.toSeat);
		if (!Number.isFinite(fromSeat) || !Number.isFinite(toSeat)) {
			return;
		}
		// Плашку показываем всем, кроме того, у кого открыта модалка принятия/отказа (toSeat).
		if (localSeatMatchesSeat(toSeat)) {
			return;
		}
		showInstantWallOfferWaitingBanner(fromSeat, toSeat);
	}
	if (response.method === "InstantWallSoloAidWaiting") {
		const deciderSeat = Number(response.deciderSeat);
		if (!Number.isFinite(deciderSeat)) {
			return;
		}
		if (localSeatMatchesSeat(deciderSeat)) {
			return;
		}
		showInstantWallSoloAidWaitingBanner(deciderSeat);
	}
	if (response.method === "InstantWallSoloAidClose") {
		removeInstantWallSoloAidWaitingBanner();
	}
	if (response.method === "InstantWallHelperDecision") {
		removeInstantWallWaitingBanners();
		hideInstantWallModal();
		const helperSeat = Number(response.helperSeat);
		const loserSeat = Number(response.loserSeat);
		const used = Boolean(response.used);
		const cardId = response.cardId ? String(response.cardId) : "";
		if (used && cardId) {
			moveTreasureCardToDiscard(cardId, { ownerSeat: helperSeat });
		}
		const gateMatch = Boolean(
			escapeInstantWallGate
			&& Number.isFinite(helperSeat)
			&& Number(escapeInstantWallGate.helperSeat) === helperSeat,
		);
		escapeInstantWallGate = null;
		// Продолжение смывки контролирует владелец очереди.
		if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && gateMatch) {
			if (!used) {
				runNextEscapeAttemptAndBroadcast();
			} else {
				escapeInstantWallOfferPending = { helperSeat, loserSeat };
				socket.emit("message", { method: "InstantWallOffer", fromSeat: helperSeat, toSeat: loserSeat });
			}
		}
	}
	if (response.method === "InstantWallUse") {
		const cardId = response.cardId ? String(response.cardId) : "";
		const actingSeat = Number(response.actingSeat);
		if (cardId && Number.isFinite(actingSeat)) {
			moveTreasureCardToDiscard(cardId, { ownerSeat: actingSeat });
		}
		// Владелец очереди предлагает второму игроку (если он есть) уйти тоже, иначе просто заканчиваем/двигаем очередь.
		if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive && Number.isFinite(actingSeat)) {
			const otherSeat = (Array.isArray(escapeQueue) ? escapeQueue : []).find((s) => Number(s) !== Number(actingSeat));
			if (otherSeat != null && Number.isFinite(Number(otherSeat))) {
				socket.emit("message", { method: "InstantWallOffer", fromSeat: actingSeat, toSeat: Number(otherSeat) });
			} else if (
				!startEscapeGluePromptFromOwner({
					escapedSeat: Number(actingSeat),
					monsterCardId: "",
					viaInstantWall: true,
					finishAfter: true,
					wallFleeSeats: [Number(actingSeat)],
				})
			) {
				finishEscapeSequenceAndBroadcast();
			}
		}
	}
	if (response.method === "InstantWallOffer") {
		const fromSeat = Number(response.fromSeat);
		const toSeat = Number(response.toSeat);
		if (!Number.isFinite(fromSeat) || !Number.isFinite(toSeat)) {
			return;
		}
		if (!localSeatMatchesSeat(toSeat)) {
			return;
		}
		openInstantWallOfferModal({ fromSeat, toSeat });
	}
	if (response.method === "InstantWallOfferDecision") {
		removeInstantWallWaitingBanners();
		hideInstantWallModal();
		const fromSeat = Number(response.fromSeat);
		const toSeat = Number(response.toSeat);
		const accept = Boolean(response.accept);
		if (!Number.isFinite(fromSeat) || !Number.isFinite(toSeat)) {
			return;
		}
		// Решение применяет владелец очереди смывки.
		if (Number(localSeat) === Number(escapeOwnerSeat) && escapeActive) {
			if (accept) {
				// Instant wall: оба игрока считаются успешно смывшимися. Перед завершением боя даём шанс "тюбику клея".
				const monsterPick = String(escapeCurrentMonsterCardId || (escapeMonsterTemplateQueue?.[0]?.cardId) || "__instant_wall__");
				if (
					!startEscapeGluePromptFromOwner({
						escapedSeat: Number(toSeat),
						monsterCardId: monsterPick,
						viaInstantWall: true,
						finishAfter: true,
						wallFleeSeats: [Number(fromSeat), Number(toSeat)],
					})
				) {
					finishEscapeSequenceAndBroadcast();
				}
				return;
			}
			// Лидер отказался: помощник всё равно должен смыться автоматически, но на СВОЕЙ очереди (без кубика).
			try {
				escapeInstantWallAutoSeats?.add?.(Number(fromSeat));
			} catch {}
			runNextEscapeAttemptAndBroadcast();
		}
	}
	if (response.method === "MateTestDeal") {
		const seat = parseInt(response.seat, 10);
		const cardId = String(response.cardId || "");
		if (Number.isNaN(seat) || seat < 0 || !cardId) {
			return;
		}
		const card = document.getElementById(cardId);
		const hand = getHandElementForPlayerSeat(seat);
		if (card && hand) {
			hand.appendChild(card);
			UpdatebackImgDoor();
			adjustCardWidth('.myhand');
			adjustCardWidth('.opponenthand');
			adjustCardWidth('.opponent2hand');
			adjustCardWidth('.opponent3hand');
		}
	}
	if (response.method === "FoldCount"){
		const turnSeat = parseInt(response.turnSeat, 10);
		// Игнорируем старые/задвоенные события паса от прошлого хода.
		if (!Number.isNaN(turnSeat) && turnSeat === currentTurnSeat) {
			window.FoldCount++;
		}
	}

	scheduleTurnStateSync();
});


function createDice(number) {
	const dotPositionMatrix = {
		1: [
			[50, 50]
		],
		2: [
			[20, 20],
			[80, 80]
		],
		3: [
			[20, 20],
			[50, 50],
			[80, 80]
		],
		4: [
			[20, 20],
			[20, 80],
			[80, 20],
			[80, 80]
		],
		5: [
			[20, 20],
			[20, 80],
			[50, 50],
			[80, 20],
			[80, 80]
		],
		6: [
			[20, 20],
			[20, 80],
			[50, 20],
			[50, 80],
			[80, 20],
			[80, 80]
		]
	};

	const dice = document.createElement("div");

	dice.classList.add("dice");

	for (const dotPosition of dotPositionMatrix[number]) {
		const dot = document.createElement("div");

		dot.classList.add("dice-dot");
		dot.style.setProperty("--top", dotPosition[0] + "%");
		dot.style.setProperty("--left", dotPosition[1] + "%");
		dice.appendChild(dot);
	}

	return dice;
}

function randomizeDice(diceContainer, numberOfDice) {
	diceContainer.innerHTML = "";
	let random = Math.floor((Math.random() * 6) + 1);
	for (let i = 0; i < numberOfDice; i++) {
	
		const dice = createDice(random);

		diceContainer.appendChild(dice);
	}
	if(window.flag_dice){
		const messageUpdateData = {
			method: "RandDice",
			digit: random,
		};
		socket.emit("message",messageUpdateData);
	}

}


class Card_treasure {
  constructor(name = "", card_name = "", img = "", backimg = "", power = 0, cost = 0, body = 0, hand = 0, footwear = 0, hat = 0, big = 0, level = 0, special = "", remover = 0, restrictions = null, oneTime = false) {
    this.name = name;
	this.card_name = card_name;
	this.img = img;
    this.backimg = backimg;
    this.power = power;
    this.cost = cost;
    this.body = body;
    this.hand = hand;
    this.footwear = footwear;
    this.hat = hat;
	this.big = big;
	this.level = level;
	this.special = special;
	this.remover = remover;
	this.restrictions = restrictions;
	this.oneTime = Boolean(oneTime); // true = разовая, false = нет
  }
}

// Создание экземпляров класса "сокровища"

const treasure1 = new Card_treasure("treasure1", "", "../img/treasure1/card0096.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 1, 0, 0, "", 0, [{ mode: "only", race: ["Human"] }]);
const treasure3 = new Card_treasure("treasure3", "",  "../img/treasure1/card0098.png", "../img/treasure1/cardBack_Treasure.png", 1, 600, 0, 0, 0, 1);
// card0098: эльф получает +3, остальные +1
treasure3.powerByRace = { Elf: 3 };
const treasure2 = new Card_treasure("treasure2", "",  "../img/treasure1/card0097.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 0, 0, 0, 1);
const treasure4 = new Card_treasure("treasure4", "",  "../img/treasure1/card0099.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 1, 0, 0, "", 0, [{ mode: "only", kind: ["Wizard"] }]);
const treasure5 = new Card_treasure("treasure5", "",  "../img/treasure1/card0100.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 1, 0, 0, 0);
const treasure6 = new Card_treasure("treasure6", "",  "../img/treasure1/card0101.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 1, 0, 0, 0);
const treasure7 = new Card_treasure("treasure7", "",  "../img/treasure1/card0102.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 1, 0, 0, 0, 1, 0, "", 0, [{ mode: "not", kind: ["Wizard"] }]);
const treasure8 = new Card_treasure("treasure8", "",  "../img/treasure1/card0103.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 1, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Dwarf"] }]);
const treasure9 = new Card_treasure("treasure9", "",  "../img/treasure1/card0104.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 1, 0, 0, 0);
const treasure10 = new Card_treasure("treasure10", "",  "../img/treasure1/card0105.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 0, 0, 1, 0);
const treasure11 = new Card_treasure("treasure11", "",  "../img/treasure1/card0106.png", "../img/treasure1/cardBack_Treasure.png", 0, 400, 0, 0, 1, 0, 0, 0, "", 2);
const treasure12 = new Card_treasure("treasure12", "",  "../img/treasure1/card0107.png", "../img/treasure1/cardBack_Treasure.png", 0, 700, 0, 0, 1, 0);
const treasure13 = new Card_treasure("treasure13", "",  "../img/treasure1/card0108.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", gender: ["Female"] }]);
const treasure14 = new Card_treasure("treasure14", "",  "../img/treasure1/card0109.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", gender: ["Male"] }]);
const treasure15 = new Card_treasure("treasure15", "",  "../img/treasure1/card0110.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Elf"] }]);
const treasure16 = new Card_treasure("treasure16", "",  "../img/treasure1/card0111.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Cleric"] }]);
const treasure17 = new Card_treasure("treasure17", "",  "../img/treasure1/card0112.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Thief"] }]);
const treasure18 = new Card_treasure("treasure18", "",  "../img/treasure1/card0113.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Dwarf"] }]);
const treasure19 = new Card_treasure("treasure19", "",  "../img/treasure1/card0114.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Cleric"] }]);
const treasure20 = new Card_treasure("treasure20", "",  "../img/treasure1/card0115.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 0, 1, 0, 0);
const treasure21 = new Card_treasure("treasure21", "",  "../img/treasure1/card0116.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 1, 0, "", 0, [{ mode: "only", kind: ["Warrior"] }]);
const treasure22 = new Card_treasure("treasure22", "",  "../img/treasure1/card0117.png", "../img/treasure1/cardBack_Treasure.png", 2, 400, 0, 1, 0, 0);
const treasure23 = new Card_treasure("treasure23", "",  "../img/treasure1/card0118.png", "../img/treasure1/cardBack_Treasure.png", 5, 800, 0, 1, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Wizard"] }]);
const treasure24 = new Card_treasure("treasure24", "",  "../img/treasure1/card0119.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 1, 0, 0, 1, 0, "", 3);
// Не oneTime: иначе в основной экипировке сила обнуляется (см. updateCharacterStatesFromBoard). Сброс — только эффект карты.
const treasure25 = new Card_treasure("treasure25", "Rat on a stick", "../img/treasure1/card0120.png", "../img/treasure1/cardBack_Treasure.png", 1, 0, 0, 1, 0, 0, 0, 0, "Rat on a stick", 0, null, false);
const treasure26 = new Card_treasure("treasure26", "",  "../img/treasure1/card0121.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 0, 2, 0, 0, 1);
const treasure27 = new Card_treasure("treasure27", "",  "../img/treasure1/card0122.png", "../img/treasure1/cardBack_Treasure.png", 4, 800, 0, 2, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Elf"] }]);
const treasure28 = new Card_treasure("treasure28", "",  "../img/treasure1/card0123.png", "../img/treasure1/cardBack_Treasure.png", 3, 0, 0, 2, 0, 0, 1);
const treasure29 = new Card_treasure("treasure29", "",  "../img/treasure1/card0124.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 2, 0, 0, 1, 0, "", 0, [{ mode: "only", race: ["Human"] }]);
const treasure30 = new Card_treasure("treasure30", "",  "../img/treasure1/card0125.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 0, 2, 0, 0);
const treasure31 = new Card_treasure("treasure31", "",  "../img/treasure1/card0126.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure32 = new Card_treasure("treasure32", "",  "../img/treasure1/card0127.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure33 = new Card_treasure("treasure33", "",  "../img/treasure1/card0128.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure34 = new Card_treasure("treasure34", "",  "../img/treasure1/card0129.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure35 = new Card_treasure("treasure35", "",  "../img/treasure1/card0130.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure36 = new Card_treasure("treasure36", "",  "../img/treasure1/card0131.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure37 = new Card_treasure("treasure37", "",  "../img/treasure1/card0132.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure38 = new Card_treasure("treasure38", "",  "../img/treasure1/card0133.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure39 = new Card_treasure("treasure39", "",  "../img/treasure1/card0134.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 1, "", 0, null, true);
const treasure40 = new Card_treasure("treasure40", "",  "../img/treasure1/card0135.png", "../img/treasure1/cardBack_Treasure.png", 1, -1, 0, 0, 0, 0, 0, 0, "Hireling", 0, null);
// card0136: Instant wall — позволяет автоматически смыться от всех монстров в бою (одному или двум игрокам).
const treasure41 = new Card_treasure("treasure41", "Instant wall",  "../img/treasure1/card0136.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Instant wall", 0, null, true);
const treasure42 = new Card_treasure("treasure42", "Wishing ring", "../img/treasure1/card0137.png", "../img/treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0, 0, 0, "Wishing ring", 0, null, true);
const treasure43 = new Card_treasure("treasure43", "Wishing ring", "../img/treasure1/card0138.png", "../img/treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0, 0, 0, "Wishing ring", 0, null, true);
// card0139: Loaded die — читерский кубик (меняет результат броска после того как он выпал).
const treasure44 = new Card_treasure("treasure44", "Loaded die",  "../img/treasure1/card0139.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Loaded die", 0, null, true);
const treasure45 = new Card_treasure("treasure45", "Magic lamp",  "../img/treasure1/card0140.png", "../img/treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0, 0, 0, "Magic lamp", 0, null, true);
const treasure46 = new Card_treasure("treasure46", "Wand of dowsing", "../img/treasure1/card0141.png", "../img/treasure1/cardBack_Treasure.png", 0, 1100, 0, 0, 0, 0, 0, 0, "Wand of dowsing", 0, null, true);
const treasure47 = new Card_treasure("treasure47", "Doppleganger", "../img/treasure1/card0142.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Doppleganger", 0, null, true);
// card0143: Flask of glue — после успешной смывки заставляет смываться снова от этого монстра.
const treasure48 = new Card_treasure("treasure48", "Flask of glue",  "../img/treasure1/card0143.png", "../img/treasure1/cardBack_Treasure.png", 0, 100, 0, 0, 0, 0, 0, 0, "Flask of glue", 0, null, true);
const treasure49 = new Card_treasure("treasure49", "",  "../img/treasure1/card0144.png", "../img/treasure1/cardBack_Treasure.png", 5, 0, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure50 = new Card_treasure("treasure50", "",  "../img/treasure1/card0145.png", "../img/treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
// card0146: Yuppie water — в бою даёт +2 каждому эльфу (только если в бою есть хотя бы один эльф).
const treasure51 = new Card_treasure("treasure51", "Yuppie water",  "../img/treasure1/card0146.png", "../img/treasure1/cardBack_Treasure.png", 0, 100, 0, 0, 0, 0, 0, 0, "Yuppie water", 0, null, true);
const treasure52 = new Card_treasure("treasure52", "",  "../img/treasure1/card0147.png", "../img/treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure53 = new Card_treasure("treasure53", "",  "../img/treasure1/card0148.png", "../img/treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure54 = new Card_treasure("treasure54", "",  "../img/treasure1/card0149.png", "../img/treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
// card0150: зелье невидимости — после провала смывки можно автоматически смыться от текущего монстра.
const treasure55 = new Card_treasure("treasure55", "Invisibility potion", "../img/treasure1/card0150.png", "../img/treasure1/cardBack_Treasure.png", 0, 200, 0, 0, 0, 0, 0, 0, "Invisibility potion", 0, null, true);
const treasure56 = new Card_treasure("treasure56", "",  "../img/treasure1/card0151.png", "../img/treasure1/cardBack_Treasure.png", 5, 200, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure57 = new Card_treasure("treasure57", "Pollymorth Potion",  "../img/treasure1/card0152.png", "../img/treasure1/cardBack_Treasure.png", 0, 1300, 0, 0, 0, 0, 0, 0, "Pollymorth Potion", 0, null, true);
const treasure58 = new Card_treasure("treasure58", "Transferral potion", "../img/treasure1/card0153.png", "../img/treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0, 0, 0, "Transferral potion", 0, null, true);
const treasure59 = new Card_treasure("treasure59", "",  "../img/treasure1/card0154.png", "../img/treasure1/cardBack_Treasure.png", 5, 300, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure60 = new Card_treasure("treasure60", "",  "../img/treasure1/card0155.png", "../img/treasure1/cardBack_Treasure.png", 2, 200, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure61 = new Card_treasure("treasure61", "",  "../img/treasure1/card0156.png", "../img/treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure62 = new Card_treasure("treasure62", "",  "../img/treasure1/card0157.png", "../img/treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure63 = new Card_treasure("treasure63", "Friendship potion",  "../img/treasure1/card0158.png", "../img/treasure1/cardBack_Treasure.png", 0, 200, 0, 0, 0, 0, 0, 0, "Friendship potion", 0, null, true);
const treasure64 = new Card_treasure("treasure64", "",  "../img/treasure1/card0159.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure65 = new Card_treasure("treasure65", "Steal a level",  "../img/treasure1/card0160.png", "../img/treasure1/cardBack_Treasure.png", 0, -1, 0, 0, 0, 0, 0, 0, "", 0, null, true);
const treasure66 = new Card_treasure("treasure66", "",  "../img/treasure1/card0161.png", "../img/treasure1/cardBack_Treasure.png", 1, 200, 0, 0, 0, 0);
const treasure67 = new Card_treasure("treasure67", "",  "../img/treasure1/card0162.png", "../img/treasure1/cardBack_Treasure.png", 2, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "not", kind: ["Thief"] }]);
const treasure68 = new Card_treasure("treasure68", "",  "../img/treasure1/card0163.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Halfling"] }]);
const treasure69 = new Card_treasure("treasure69", "",  "../img/treasure1/card0164.png", "../img/treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", race: ["Halfling"] }]);
const treasure70 = new Card_treasure("treasure70", "",  "../img/treasure1/card0165.png", "../img/treasure1/cardBack_Treasure.png", 3, 0, 0, 0, 0, 0);
const treasure71 = new Card_treasure("treasure71", "",  "../img/treasure1/card0166.png", "../img/treasure1/cardBack_Treasure.png", 3, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "not", kind: ["Warrior"] }]);
const treasure72 = new Card_treasure("treasure72", "",  "../img/treasure1/card0167.png", "../img/treasure1/cardBack_Treasure.png", 4, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "only", kind: ["Thief"] }]);
const treasure73 = new Card_treasure("treasure73", "",  "../img/treasure1/card0168.png", "../img/treasure1/cardBack_Treasure.png", 0, 600, 0, 0, 0, 0, 0, 0, "", 0, [{ mode: "not", kind: ["Cleric"] }]);

class Card_door {
  constructor(name = "", card_name = "", img = "", backimg = "", power = 0, race = "", kind = "", special = "", level = 0, bad_staff = null, remover = 0, weakness = null, advantage = null) {
    this.name = name;
	this.card_name = card_name;
	this.img = img;
    this.backimg = backimg;	
	this.power = power;
    this.race = race;
    this.kind = kind;
    this.special = special;
    this.level = level;
    this.bad_staff = bad_staff;
	this.remover = remover;
	this.weakness = weakness;
	this.advantage = advantage;
  }
}
// Создание экземпляров класса "дверь"
const door1 = new Card_door("door1", "",  "../img/doors1/card0001.png", "../img/doors1/cardBack_Doors.png", 0, "", "Cleric");
const door2 = new Card_door("door2", "",  "../img/doors1/card0002.png", "../img/doors1/cardBack_Doors.png", 0, "", "Cleric");
const door3 = new Card_door("door3", "",  "../img/doors1/card0003.png", "../img/doors1/cardBack_Doors.png", 0, "", "Thief");
const door4 = new Card_door("door4", "",  "../img/doors1/card0004.png", "../img/doors1/cardBack_Doors.png", 0, "", "Thief");
const door5 = new Card_door("door5", "",  "../img/doors1/card0005.png", "../img/doors1/cardBack_Doors.png", 0, "", "Thief");
const door6 = new Card_door("door6", "",  "../img/doors1/card0006.png", "../img/doors1/cardBack_Doors.png", 0, "", "Warrior");
const door7 = new Card_door("door7", "",  "../img/doors1/card0007.png", "../img/doors1/cardBack_Doors.png", 0, "", "Warrior");
const door8 = new Card_door("door8", "",  "../img/doors1/card0008.png", "../img/doors1/cardBack_Doors.png", 0, "", "Warrior");
const door9 = new Card_door("door9", "",  "../img/doors1/card0009.png", "../img/doors1/cardBack_Doors.png", 0, "", "Wizard");
const door10 = new Card_door("door10", "",  "../img/doors1/card0010.png", "../img/doors1/cardBack_Doors.png", 0, "", "Wizard");
const door11 = new Card_door("door11", "",  "../img/doors1/card0010.png", "../img/doors1/cardBack_Doors.png", 0, "", "Wizard");
const door12 = new Card_door("door12", "",  "../img/doors1/card0012.png", "../img/doors1/cardBack_Doors.png", 0, "Dwarf");
const door13 = new Card_door("door13", "",  "../img/doors1/card0013.png", "../img/doors1/cardBack_Doors.png", 0, "Dwarf");
const door14 = new Card_door("door14", "",  "../img/doors1/card0014.png", "../img/doors1/cardBack_Doors.png", 0, "Dwarf");
const door15 = new Card_door("door15", "",  "../img/doors1/card0015.png", "../img/doors1/cardBack_Doors.png", 0, "Elf", "", "", 0, 0, 1);
const door16 = new Card_door("door16", "",  "../img/doors1/card0016.png", "../img/doors1/cardBack_Doors.png", 0, "Elf", "", "", 0, 0, 1);
const door17 = new Card_door("door17", "",  "../img/doors1/card0017.png", "../img/doors1/cardBack_Doors.png", 0, "Elf", "", "", 0, 0, 1);
const door18 = new Card_door("door18", "",  "../img/doors1/card0018.png", "../img/doors1/cardBack_Doors.png", 0, "Halfling");
const door19 = new Card_door("door19", "",  "../img/doors1/card0019.png", "../img/doors1/cardBack_Doors.png", 0, "Halfling");
const door20 = new Card_door("door20", "",  "../img/doors1/card0020.png", "../img/doors1/cardBack_Doors.png", 0, "Halfling");
const door21 = new Card_door("door21", "",  "../img/doors1/card0021.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "change class" });
const door22 = new Card_door("door22", "",  "../img/doors1/card0022.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "change race" });
const door23 = new Card_door("door23", "",  "../img/doors1/card0023.png", "../img/doors1/cardBack_Doors.png", -5, "", "", "Curse", 0, { type: "change sex" });
const door24 = new Card_door("door24", "",  "../img/doors1/card0024.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "chicken on your head" });
const door25 = new Card_door("door25", "",  "../img/doors1/card0025.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose_levels", levels: 2 });
const door26 = new Card_door("door26", "",  "../img/doors1/card0026.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "income tax" });
const door27 = new Card_door("door27", "",  "../img/doors1/card0027.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door28 = new Card_door("door28", "",  "../img/doors1/card0028.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose_levels", levels: 1 });
const door29 = new Card_door("door29", "",  "../img/doors1/card0029.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose_levels", levels: 1 });
const door30 = new Card_door("door30", "",  "../img/doors1/card0030.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door31 = new Card_door("door31", "",  "../img/doors1/card0031.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door32 = new Card_door("door32", "",  "../img/doors1/card0032.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door33 = new Card_door("door33", "",  "../img/doors1/card0033.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door34 = new Card_door("door34", "",  "../img/doors1/card0034.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door35 = new Card_door("door35", "",  "../img/doors1/card0035.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door36 = new Card_door("door36", "",  "../img/doors1/card0036.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose your class" });
const door37 = new Card_door("door37", "",  "../img/doors1/card0037.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "lose your race" });
const door38 = new Card_door("door38", "",  "../img/doors1/card0038.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse", 0, { type: "malign mirrror" });
const door39 = new Card_door("door39", "",  "../img/doors1/card0039.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Curse");
const door40 = new Card_door("door40", "",  "../img/doors1/card0040.png", "../img/doors1/cardBack_Doors.png", 10, "", "", "bonus_power_monster");
const door41 = new Card_door("door41", "",  "../img/doors1/card0041.png", "../img/doors1/cardBack_Doors.png", -5, "", "", "bonus_power_monster");
const door42 = new Card_door("door42", "",  "../img/doors1/card0042.png", "../img/doors1/cardBack_Doors.png", 5, "", "", "bonus_power_monster");
const door43 = new Card_door("door43", "",  "../img/doors1/card0043.png", "../img/doors1/cardBack_Doors.png", 10, "", "", "bonus_power_monster");
const door44 = new Card_door("door44", "",  "../img/doors1/card0044.png", "../img/doors1/cardBack_Doors.png", 5, "", "", "bonus_power_monster");
const door45 = new Card_door("door45", "",  "../img/doors1/card0045.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, 0);
const door46 = new Card_door("door46", "",  "../img/doors1/card0046.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 1);
const door47 = new Card_door("door47", "",  "../img/doors1/card0047.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, 0, { type: "Elf", power: 4 });
const door48 = new Card_door("door48", "",  "../img/doors1/card0048.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, 0);
const door49 = new Card_door("door49", "",  "../img/doors1/card0049.png", "../img/doors1/cardBack_Doors.png", 1, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, 0, { type: "Cleric", power: 3});
const door50 = new Card_door("door50", "",  "../img/doors1/card0050.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, -1);
const door51 = new Card_door("door51", "",  "../img/doors1/card0051.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, 0, 1);
const door52 = new Card_door("door52", "",  "../img/doors1/card0052.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, { type: "fire", bonus_level: 1});
const door53 = new Card_door("door53", "",  "../img/doors1/card0053.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "Undead", 1, { type: "lose_levels", levels: 2 });
const door54 = new Card_door("door54", "",  "../img/doors1/card0054.png", "../img/doors1/cardBack_Doors.png", 2, "monster", "", "", 1, { type: "lose_levels", levels: 2 });
const door55 = new Card_door("door55", "",  "../img/doors1/card0055.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "", 1, 0, 0, 0, { type: "Elf", power: 5 });
const door56 = new Card_door("door56", "",  "../img/doors1/card0056.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "", 1, 0, -2);
const door57 = new Card_door("door57", "",  "../img/doors1/card0057.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Wizard", power:5 });
const door58 = new Card_door("door58", "",  "../img/doors1/card0058.png", "../img/doors1/cardBack_Doors.png", 4, "monster", "", "Undead", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Dwarf", power: 5});
const door59 = new Card_door("door59", "",  "../img/doors1/card0059.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, 0);
const door60 = new Card_door("door60", "",  "../img/doors1/card0060.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, 0, 0, 0, { type: "Warrior", power: 6});
const door61 = new Card_door("door61", "",  "../img/doors1/card0061.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, 0, 0, { type: "level", bonus_level: 1} );
const door62 = new Card_door("door62", "",  "../img/doors1/card0062.png", "../img/doors1/cardBack_Doors.png", 6, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Wizard", power: 6});
const door63 = new Card_door("door63", "",  "../img/doors1/card0063.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
const door64 = new Card_door("door64", "",  "../img/doors1/card0064.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "lose_levels", levels: 1 }, 0, 0, { type: "Elf", power: 6});
const door65 = new Card_door("door65", "",  "../img/doors1/card0065.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
const door66 = new Card_door("door66", "",  "../img/doors1/card0066.png", "../img/doors1/cardBack_Doors.png", 8, "monster", "", "", 1, 0);
const door67 = new Card_door("door67", "",  "../img/doors1/card0067.png", "../img/doors1/cardBack_Doors.png", 10, "monster", "", "", 1, 0, 0, 0, { type: "Dwarf", power: 6});
const door68 = new Card_door("door68", "",  "../img/doors1/card0068.png", "../img/doors1/cardBack_Doors.png", 10, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
const door69 = new Card_door("door69", "",  "../img/doors1/card0069.png", "../img/doors1/cardBack_Doors.png", 10, "monster", "", "", 1, 0);
const door70 = new Card_door("door70", "",  "../img/doors1/card0070.png", "../img/doors1/cardBack_Doors.png", 12, "monster", "", "", 1, 0, 0, 0, { type: "Dwarf, Halfling", power: 3});
const door71 = new Card_door("door71", "",  "../img/doors1/card0071.png", "../img/doors1/cardBack_Doors.png", 12, "monster", "", "", 1, { type: "lose_levels", levels: 2 }, 0, 0, { type: "Cleric", power: 4});
const door72 = new Card_door("door72", "",  "../img/doors1/card0072.png", "../img/doors1/cardBack_Doors.png", 12, "monster", "", "", 1, { type: "lose_levels", levels: 3 });
const door73 = new Card_door("door73", "",  "../img/doors1/card0073.png", "../img/doors1/cardBack_Doors.png", 14, "monster", "", "", 1, { type: "death" }, 0, 0, { type: "Warrior", power: 4});
const door74 = new Card_door("door74", "",  "../img/doors1/card0074.png", "../img/doors1/cardBack_Doors.png", 14, "monster", "", "", 1, 0);
const door75 = new Card_door("door75", "",  "../img/doors1/card0075.png", "../img/doors1/cardBack_Doors.png", 14, "monster", "", "", 1, { type: "death" });
const door76 = new Card_door("door76", "",  "../img/doors1/card0076.png", "../img/doors1/cardBack_Doors.png", 16, "monster", "", "Undead", 2, 0);
const door77 = new Card_door("door77", "",  "../img/doors1/card0077.png", "../img/doors1/cardBack_Doors.png", 16, "monster", "", "", 2, 0);
const door78 = new Card_door("door78", "",  "../img/doors1/card0078.png", "../img/doors1/cardBack_Doors.png", 16, "monster", "", "Undead", 2, { type: "lose_levels", levels: 9 });
const door79 = new Card_door("door79", "",  "../img/doors1/card0079.png", "../img/doors1/cardBack_Doors.png", 18, "monster", "", "", 2, { type: "death" });
const door80 = new Card_door("door80", "",  "../img/doors1/card0080.png", "../img/doors1/cardBack_Doors.png", 18, "monster", "", "", 2, { type: "death" });
const door81 = new Card_door("door81", "",  "../img/doors1/card0081.png", "../img/doors1/cardBack_Doors.png", 20, "monster", "", "", 2, { type: "death" });
const door82 = new Card_door("door82", "Half-breed",  "../img/doors1/card0082.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Half-breed");
const door83 = new Card_door("door83", "Half-breed",  "../img/doors1/card0083.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Half-breed");
const door84 = new Card_door("door84", "Super Munchkin",  "../img/doors1/card0084.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Super Munchkin");
const door85 = new Card_door("door85", "Super Munchkin",  "../img/doors1/card0085.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Super Munchkin");
const door86 = new Card_door("door86", "Wandering Monster",  "../img/doors1/card0086.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Wandering Monster");
const door87 = new Card_door("door87", "Wandering Monster",  "../img/doors1/card0087.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Wandering Monster");
const door88 = new Card_door("door88", "Wandering Monster",  "../img/doors1/card0088.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Wandering Monster");
const door89 = new Card_door("door89", "Cheat",  "../img/doors1/card0089.png", "../img/doors1/cardBack_Doors.png", 0, "", "", "Cheat");
// card0090: вернуть как раньше (Divine intervention)
const door90 = new Card_door("door90", "Divine intervention",  "../img/doors1/card0090.png", "../img/doors1/cardBack_Doors.png",0, "", "", "Divine intervention");
const door91 = new Card_door("door91", "",  "../img/doors1/card0091.png", "../img/doors1/cardBack_Doors.png",0);
const door92 = new Card_door("door92", "Illusion",  "../img/doors1/card0092.png", "../img/doors1/cardBack_Doors.png",0, "", "", "Illusion");
const door93 = new Card_door("door93", "Mate",  "../img/doors1/card0093.png", "../img/doors1/cardBack_Doors.png",0, "", "", "Mate");
// card0094: Out to lunch
const door94 = new Card_door("door94", "Out to lunch",  "../img/doors1/card0094.png", "../img/doors1/cardBack_Doors.png",0, "", "", "Out to lunch");
const door95 = new Card_door("door95", "",  "../img/doors1/card0000.png", "../img/doors1/cardBack_Doors.png", 0, "", "Cleric");



function shuffle(array) {
  
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    };
		return array
}


function Deck_filling(deck, zone){
	// console.log(`идет заполнение ${zone}`);
	//console.log(deck);
	for (const i of deck) {
		//console.log('началось');
		const card = document.createElement('div');
		
		card.classList.add('card');
		card.setAttribute('id', i.name);
		card.setAttribute('draggable', 'true');
		
		const image = document.createElement('img');
		image.classList.add('card-item');
		image.setAttribute('src', i.img);
		
		card.appendChild(image);
		zone.appendChild(card);
		
	}
	//console.log("колоды заполнены");
	//console.log(zone);
}

export function UpdatebackImgTreasure() {
	const cards = document.querySelectorAll('.card');
	cards.forEach(card => {
		const zone_doors = card.closest('.zone_treasure');
		const opponenthand = card.closest('.opponenthand');
		const opponent2hand = card.closest('.opponent2hand');
		const opponent3hand = card.closest('.opponent3hand');
		const id = card.id;
			const imgElement = card.querySelector('.card-item');
			
			const treasure = window.treasures.find(tc => tc.name === id);
		if (zone_doors || opponenthand  ||opponent2hand || opponent3hand) {
			if (treasure) {
				imgElement.src = treasure.backimg;
			}
		}
		else{
			if (treasure) {
				imgElement.src = treasure.img;
			}
		}
	});
}
UpdatebackImgTreasure()
export function UpdatebackImgDoor() {
	const cards = document.querySelectorAll('.card');
	cards.forEach(card => {
		const zone_doors = card.closest('.zone_doors');
		const opponenthand = card.closest('.opponenthand');
		const opponent2hand = card.closest('.opponent2hand');
		const opponent3hand = card.closest('.opponent3hand');

		const id = card.id;
			const imgElement = card.querySelector('.card-item');
			
			const door = window.doors.find(dc => dc.name === id);
		if (zone_doors || opponenthand  ||opponent2hand || opponent3hand) {
			if (door) {
				imgElement.src = door.backimg;
			}
		}
		else{
			if (door) {
				imgElement.src = door.img;
			}
		}
	});
}
UpdatebackImgDoor()

function Start_game(num_players){
	//console.log(`разложены карты для игроков: ${num_players}`)
  Deck_filling(window.doors, window.zonedoor);
  UpdatebackImgDoor();
  Deck_filling(window.treasures, window.zoneTreasure);
  UpdatebackImgTreasure();
  UpdateZones();

  window.allCards = document.querySelectorAll('.card');

	//console.log(window.allCards);
  const zone_door = document.querySelectorAll('.zone_doors .card');
	//console.log(zone_door);
  const zone_treasure = document.querySelectorAll('.zone_treasure .card');
  const myhand = document.querySelector('#myhand');
  const opponenthand = document.querySelector('#opponenthand');
  const opponent2hand = document.querySelector('#opponent2hand');
  const opponent3hand = document.querySelector('#opponent3hand');

    const cardsToMoveDoors = [];
    const cardsToMoveTreasure = [];
    // Переносим первые 4 карты из каждой зоны в массив cardsToMove
    for(let i = 0; i < 4*num_players; i++) {
      cardsToMoveDoors.push(zone_door[i]);
      cardsToMoveTreasure.push(zone_treasure[i]);
    }
		//console.log(cardsToMoveDoors);

    
    if (num_players === 2) {
				//console.log(`${num_players} игрока получили карты`);
				//console.log(card);
        // Перемещаем карты из массива cardsToMove в myhand и opponenthand
        cardsToMoveDoors.forEach((card, index) => {
          if (index % 2 === 0) {
            myhand.appendChild(card);
          } else {
            opponenthand.appendChild(card);
          }
        });
        cardsToMoveTreasure.forEach((card, index) => {
          if (index % 2 === 0) {
            myhand.appendChild(card);
          } else {
            opponenthand.appendChild(card);
          }
        });
    } else if (num_players === 3) {
				//console.log(card);
				// console.log(`${num_players} игрока получили карты`);
				
        // Перемещаем карты из массива cardsToMove в myhand, opponenthand и opponent2hand
        cardsToMoveDoors.forEach((card, index) => {
          if (index % 3 === 0) {
            myhand.appendChild(card);
          } else if (index % 3 === 1) {
            opponent2hand.appendChild(card);
          } else {
            opponent3hand.appendChild(card);
          }
        });
        
        cardsToMoveTreasure.forEach((card, index) => {
          if (index % 3 === 0) {
            myhand.appendChild(card);
          } else if (index % 3 === 1) {
            opponent2hand.appendChild(card);
          } else {
            opponent3hand.appendChild(card);
          }
        });
    }

}
document.addEventListener('DOMContentLoaded', function() {
  function initialize() {
	// Если игра уже восстановлена/запущена — не трогаем интерактивность зон и не запускаем ретраи.
	// Иначе при refresh можно попасть в цикл, где initialize() каждые 1с снова вызывает
	// setZoneInteractivityByPlayers(0) (особенно если кнопка старта удалена при restore).
	if (gameStarted) {
		document.querySelector(".button_start_game")?.remove?.();
		window.button = null;
		return;
	}
	// Получаем элемент кнопки по классу
	window.button = document.querySelector('.button_start_game');
	window.zonedoor = document.querySelector('.zone_doors');
	window.zoneTreasure = document.querySelector('.zone_treasure');
	// До старта игры отключаем лишние зоны.
	setZoneInteractivityByPlayers(0);
	if (!window.button) { // Проверка наличия элемента
		// Если кнопки нет, но игра ещё не стартовала, попробуем позже.
		// (Если игра восстановится через RoomState, gameStarted станет true и ретраи прекратятся.)
		setTimeout(initialize, 1000);

	} else {
		// Добавляем обработчик события 'click' на кнопку
		window.button.addEventListener('click', function() {
			// Вызываем функцию Start_game() при нажатии на кнопку
			const Start = {
				method: "Start",
				num: num
			};
			socket.emit("message", Start);
			//console.log(`начало игры для ${num}`);
		});
	}
}
// Вызов функциb инициализации сразу после загрузки DOM
initialize();
initializeSellTreasuresUi();

});

let countdownInterval;
let flag = false;
window.FoldCount = 0;
let foldedOnTurnSeat = null;
let battleTurnSeat = null;
let timerSecondsRemaining = 0;
let timerRunning = false;
export function timer(initialSeconds = 30, restoring = false) {
  const timerElement = document.getElementById('timer');
  const foldButton = document.getElementById('fold'); 
  const endTurnButton = document.getElementById('end-turn');
  const warriorFrenzyButton = document.getElementById('warrior-frenzy-btn');
  const clericExorcismButton = document.getElementById('cleric-exorcism-btn');
  const wizardTamingButton = document.getElementById('wizard-taming-btn');
  const thiefTheftButton = document.getElementById('thief-theft-btn');
  const thiefTrimButton = document.getElementById('thief-trim-btn');
  const offerHelpButton = document.getElementById('offer-help');
	let turnResolved = false;
	hideBattleResult();

	// Если по какой-то причине осталась активной смывка с прошлого боя,
	// сбрасываем её: иначе UI способностей классов скрывается из-за escapeActive.
	// При восстановлении таймера после refresh не трогаем смывку — иначе теряется RoomState.turnPhase.
	if (escapeActive && !restoring) {
		resetEscapeStateNow();
	}

  if (!foldButton || !endTurnButton || !warriorFrenzyButton || !clericExorcismButton || !wizardTamingButton || !thiefTheftButton || !thiefTrimButton) {
    console.error("Error: Could not find action buttons");
    return; 
  }

  let secondsRemaining = Math.max(1, parseInt(initialSeconds, 10) || 30);
  timerSecondsRemaining = secondsRemaining;
  timerRunning = true;
  flag = true;
  // Старт нового боевого таймера всегда возвращает фазу "Пас" (кроме восстановления из RoomState.turnPhase).
  if (!restoring) {
		turnAwaitingManualEnd = false;
	}
  const isSameBattleTurn = battleActive && battleTurnSeat === currentTurnSeat;
  if (!restoring) {
		battleActive = true;
		battleTurnSeat = currentTurnSeat;
	}
  if (!restoring && !isSameBattleTurn) {
    window.FoldCount = 0;
    foldedOnTurnSeat = null;
    pendingHelpSeats.clear();
    acceptedHelperSeat = null;
	monsterFightSeat = null;
	for (let i = 0; i < warriorFrenzyUsedBySeat.length; i++) {
		warriorFrenzyUsedBySeat[i] = 0;
		warriorFrenzyBonusBySeat[i] = 0;
		clericExorcismUsedBySeat[i] = 0;
		clericExorcismBonusBySeat[i] = 0;
		victimThiefTrimUsedBySeat[i] = 0;
		thiefBackstabDebuffBySeat[i] = 0;
	}
	hideWarriorFrenzyModal();
	hideClericExorcismModal();
	hideWizardTamingModal();
	hideWizardTamingPickModal();
	hideThiefTheftModal();
	hideThiefTheftStealModal();
	clearThiefTheftBoardDicePrompt();
	escapeWizardFlightPending = null;
	hideWizardFlightModal();
	hideThiefTrimModal();
  }
  updateHelpUi();

  clearInterval(countdownInterval);

  // Назначаем обработчик на каждый новый запуск таймера.
  // Так исключаем "протухшее" замыкание от старого хода.
  foldButton.onclick = handleFoldButtonClick;
  endTurnButton.onclick = handleEndTurnClick;
  warriorFrenzyButton.onclick = handleWarriorFrenzyClick;
  clericExorcismButton.onclick = handleClericExorcismClick;
  wizardTamingButton.onclick = handleWizardTamingClick;
  thiefTheftButton.onclick = handleThiefTheftClick;
  thiefTrimButton.onclick = handleThiefTrimClick;

  // Функция обработчика нажатия
  function handleFoldButtonClick() {
	if (foldedOnTurnSeat === currentTurnSeat || turnResolved) {
		return;
	}
	foldedOnTurnSeat = currentTurnSeat;
    window.FoldCount++;
    flag = false;
	// if (!flag) {
	// 	foldButton.style.display = "none";
	//   }
    console.log(window.FoldCount);
	const messageUpdateData = {
		method: "FoldCount",
		turnSeat: currentTurnSeat,
	};
	socket.emit("message",messageUpdateData);


  }

  function handleEndTurnClick() {
	tryCompleteManualTurnEnd();
  }

  function handleOfferHelpClick() {
	if (!battleActive || localSeat === null || localSeat === undefined) {
		return;
	}
	if (Number(localSeat) === Number(getMonsterFightSeat())) {
		return;
	}
	socket.emit("message", {
		method: "OfferHelp",
		helperSeat: localSeat,
		turnSeat: getMonsterFightSeat(),
	});
	if (offerHelpButton) {
		offerHelpButton.style.display = "none";
	}
  }

  function handleWarriorFrenzyClick() {
	openWarriorFrenzyModal();
  }

  function handleClericExorcismClick() {
	openClericExorcismModal();
  }

  function handleWizardTamingClick() {
	openWizardTamingModal();
  }

  function handleThiefTheftClick() {
	openThiefTheftModal();
  }

  function handleThiefTrimClick() {
	openThiefTrimModal();
  }

  if (offerHelpButton) {
	offerHelpButton.onclick = handleOfferHelpClick;
  }

  const finishTurn = () => {
		if (turnResolved) {
			return;
		}

		turnResolved = true;
		clearInterval(countdownInterval);
		timerRunning = false;
		timerSecondsRemaining = 0;
		timerElement.textContent = "";
		window.FoldCount = 0;
		foldedOnTurnSeat = null;
		flag = false;
		pendingHelpSeats.clear();
		applyTurnHighlight();
		updateHelpUi();
		updateTurnActionButtons(false);
		if (localSeat === 0) {
			resolveCombatAndBroadcast();
		}
	};

  // Запускаем интервал
  countdownInterval = setInterval(() => {
    secondsRemaining--;
	timerSecondsRemaining = secondsRemaining;
    timerElement.textContent = formatTime(secondsRemaining);
	if (window.FoldCount >= window.num) {
		secondsRemaining = 0;
		finishTurn();
	  }
    if (secondsRemaining === 0) {
      finishTurn();
    }

	updateTurnActionButtons(flag);
	// На случай если во время боя сняли/положили расу/класс: advantage должен меняться сразу.
	updateEffectiveMonsterBonusDisplay();
	updateWarriorFrenzyUi();
	updateClericExorcismUi();
	updateWizardTamingUi();
	updateWizardFlightUi();
	updateThiefTheftUi();
	updateThiefTrimUi();
  }, 1000);
}
 
function MoveMonstersToDrop() {
	const monsterZone = document.querySelector(".zone_monster");
	const BonusZone = document.querySelector(".zone3");
	const zone_doors_drop = document.querySelector(".zone_doors_drop");
	const zone_treasure_drop = document.querySelector(".zone_treasure_drop");

	if (monsterZone && BonusZone && zone_doors_drop && zone_treasure_drop) {
		// Объединяем карты из monsterZone и BonusZone
		const cards = [...monsterZone.querySelectorAll(".card"), ...BonusZone.querySelectorAll(".card")];
		cards.forEach((card) => {
			const fromZoneId = card.parentElement?.id || null;
			if (card.id.includes("door")) {
				// Сохраняем порядок в сбросе: targetId = текущая верхняя карта сброса (последняя в DOM, не плейсхолдер).
				// ВАЖНО: считаем ДО вставки, иначе можно "поймать" не тот порядок.
				let targetId = null;
				{
					const dropEls = Array.from(zone_doors_drop.querySelectorAll(".card"));
					for (let i = dropEls.length - 1; i >= 0; i--) {
						const id = dropEls[i]?.id;
						if (!id || id === "card" || id === card.id) continue;
						targetId = id;
						break;
					}
				}
				zone_doors_drop.appendChild(card);
				socket.emit("message", {
					method: "moveCard",
					cardId: card.id,
					targetId,
					zoneId: "zone_doors_drop",
					fromZoneId,
				});
			} else if (card.id.includes("treasure")) {
				let targetId = null;
				{
					const dropEls = Array.from(zone_treasure_drop.querySelectorAll(".card"));
					for (let i = dropEls.length - 1; i >= 0; i--) {
						const id = dropEls[i]?.id;
						if (!id || id === "card" || id === card.id) continue;
						targetId = id;
						break;
					}
				}
				zone_treasure_drop.appendChild(card);
				socket.emit("message", {
					method: "moveCard",
					cardId: card.id,
					targetId,
					zoneId: "zone_treasure_drop",
					fromZoneId,
				});
			}
		});
	}
	const MonsterBonus = document.querySelector('.MonsterBonus');
	if (MonsterBonus) {
		MonsterBonus.dataset.basePower = "0";
		MonsterBonus.textContent = "0";
	}
	const MyBonus = document.querySelector('.MyBonus');
	MyBonus.textContent = 0;
	
}

function initializeSellTreasuresUi() {
	if (!sellTreasuresDelegated) {
		document.addEventListener('click', (event) => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			if (target.closest('.MoneyBag')) {
				openSellTreasuresModal();
			}
		});
		sellTreasuresDelegated = true;
	}

	const moneyBag = document.querySelector('.MoneyBag');
	if (!moneyBag) {
		return;
	}
	moneyBag.style.pointerEvents = 'auto';
	moneyBag.style.cursor = 'pointer';
}
function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


