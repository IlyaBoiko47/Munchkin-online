/**

 * Раздача и старт обучающего стола.

 * Drag-and-drop, превью в зоне и увеличение карт — card-block.js и «увеличение карточек».

 */

import { UpdateZones } from './увеличение карточек во время игры.js';

import { adjustCardWidth, adjustCardHeight } from './card-block.js';

import {
	UpdatebackImgDoor,
	UpdatebackImgTreasure,
	recalculateAllPowerDisplays,
	getMonsterBattleContext,
} from './game.js';
import {
	ensureCardCatalogLoaded,
	deckFilling,
	configureTutorialGameState,
	wireTutorialEndTurnButton,
	refreshTutorialDeckTakeRules,
	resetTutorialDeckTakeLimits,
	tryStartTutorialBattleTimer,
	syncTutorialLevelsAfterCatalog,
	applyTutorialSeatDisplayNames,
	ensureTutorialDice,
	markTutorialDeckCard,
} from './tutorial-runtime.js';



const TUTORIAL_CARD_IDS = new Set([

	'door12',

	'door36',

	'door51',

	'door9',

	'door94',

	'treasure7',

	'treasure16',

	'treasure31',

	'treasure32',

	'treasure65',

	'treasure11',

	'treasure56',

	'door45',

]);



const PLAYER_HAND = [

	'door51',

	'door94',

	'door36',

	'door12',

	'treasure65',

	'treasure32',

	'treasure7',

	'treasure16',

];

const OPPONENT_HAND = ['treasure31', 'treasure11', 'treasure56', 'door45'];

const OPPONENT_EQUIP = ['door9'];

/** Снизу вверх: проклятие «потеряй уровень», сверху — Чит. door36 — в раздаче руки. */
const TUTORIAL_DOOR_DECK_STACK = ['door28', 'door89'];

/** Снизу вверх: card0166 (шмот), сверху — card0167 (шмот). */
const TUTORIAL_TREASURE_DECK_STACK = ['treasure71', 'treasure72'];

const TUTORIAL_DECK_RESERVED_DOOR_IDS = new Set([
	...TUTORIAL_CARD_IDS,
	...TUTORIAL_DOOR_DECK_STACK,
]);

const TUTORIAL_DECK_RESERVED_TREASURE_IDS = new Set([
	...TUTORIAL_CARD_IDS,
	...TUTORIAL_TREASURE_DECK_STACK,
]);

const ZONE_HINT_WATCH_IDS = ['zone2', 'zone5', 'zone3', 'zone_monster', 'zone_opponent'];

const LAYOUT_ZONE_SELECTORS = [
	'#myhand', '#opponenthand', '#zone2', '#zone5', '#zone3', '#zone_monster',
	'#zone_doors', '#zone_treasure', '#zone_opponent',
];

function scheduleAdjustAllZonesCardLayout() {
	LAYOUT_ZONE_SELECTORS.forEach((sel) => {
		adjustCardWidth(sel);
		adjustCardHeight(sel);
	});
}

let tutorialSideHintDismissedPermanently = false;

let tutorialOpponentHintDismissedPermanently = false;

const TUTORIAL_DECK_WATCH_IDS = ['zone_doors', 'zone_treasure'];



function zoneHasAnyCard(zoneId) {

	const zone = document.getElementById(zoneId);

	if (!zone) {

		return false;

	}

	return zone.querySelectorAll(':scope > .card').length > 0;

}

function zoneOpponentHasCurse() {
	const zone = document.getElementById('zone_opponent');
	if (!zone) {
		return false;
	}
	return Array.from(zone.querySelectorAll(':scope > .card')).some((card) => {
		const door = window.doors?.find((d) => d.name === card.id);
		return String(door?.special || '').trim().toLowerCase() === 'curse';
	});
}

function isTutorialTimerVisible() {

	const timer = document.getElementById('timer');

	if (!timer) {

		return false;

	}

	return getComputedStyle(timer).display !== 'none';

}



function setHintVisible(hintId, visible) {

	const el = document.getElementById(hintId);

	if (!el) {

		return;

	}

	el.classList.toggle('is-hidden', !visible);

	el.setAttribute('aria-hidden', visible ? 'false' : 'true');

}



export function updateTutorialHints() {

	if (!window.__TUTORIAL_BOARD) {

		return;

	}



	setHintVisible('tutorial-equip-hint', !zoneHasAnyCard('zone2'));

	if (!tutorialSideHintDismissedPermanently && zoneHasAnyCard('zone5')) {
		tutorialSideHintDismissedPermanently = true;
	}
	setHintVisible('tutorial-side-hint', !tutorialSideHintDismissedPermanently);

	if (!tutorialOpponentHintDismissedPermanently && zoneOpponentHasCurse()) {
		tutorialOpponentHintDismissedPermanently = true;
	}
	setHintVisible('tutorial-opponent-target-hint', !tutorialOpponentHintDismissedPermanently);

	const battleZonesEmpty =
		!zoneHasAnyCard('zone3') && !zoneHasAnyCard('zone_monster');
	setHintVisible('tutorial-battle-center-hint', battleZonesEmpty);

	const timerActive = isTutorialTimerVisible() && getMonsterBattleContext().hasMonster;

	setHintVisible('tutorial-timer-hint', timerActive);

	setHintVisible('tutorial-battle-highlight-hint', timerActive);

}



let tutorialHintObservers = null;



function bindTutorialHintWatchers() {

	updateTutorialHints();



	if (tutorialHintObservers) {

		return;

	}

	tutorialHintObservers = [];



	const onZoneCardsChanged = () => {
		updateTutorialHints();
		refreshTutorialDeckTakeRules();
	};

	[...ZONE_HINT_WATCH_IDS, ...TUTORIAL_DECK_WATCH_IDS].forEach((zoneId) => {

		const zone = document.getElementById(zoneId);

		if (!zone) {

			return;

		}

		const observer = new MutationObserver(onZoneCardsChanged);

		observer.observe(zone, { childList: true });

		tutorialHintObservers.push(observer);

	});



	const timerEl = document.getElementById('timer');

	if (timerEl) {

		const timerObserver = new MutationObserver(() => updateTutorialHints());

		timerObserver.observe(timerEl, { attributes: true, attributeFilter: ['style', 'class'] });

		tutorialHintObservers.push(timerObserver);

	}

}



function placeCardInZone(cardId, zoneId) {

	const zone = document.getElementById(zoneId);

	if (!zone) {

		return;

	}

	let card = document.getElementById(cardId);

	if (!card) {

		const def =

			window.doors.find((d) => d.name === cardId) ||

			window.treasures.find((t) => t.name === cardId);

		if (!def) {

			return;

		}

		const holder = document.createElement('div');

		deckFilling([def], holder);

		card = holder.querySelector('.card');

	}

	if (card) {

		zone.appendChild(card);

	}

}



function appendTutorialDeckCard(def, zone) {

	if (!def || !zone) {

		return;

	}

	const holder = document.createElement('div');

		deckFilling([def], holder);

	const card = holder.querySelector('.card');

	if (card) {
		markTutorialDeckCard(card);
		zone.appendChild(card);
	}

}

function fillTutorialDecks() {

	const zoneDoors = document.getElementById('zone_doors');

	const zoneTreasure = document.getElementById('zone_treasure');

	if (!zoneDoors || !zoneTreasure) {

		return;

	}

	zoneDoors.innerHTML = '';

	zoneTreasure.innerHTML = '';



	const deckDoors = window.doors.filter((d) => !TUTORIAL_DECK_RESERVED_DOOR_IDS.has(d.name));

	const deckTreasures = window.treasures.filter((t) => !TUTORIAL_DECK_RESERVED_TREASURE_IDS.has(t.name));



	deckFilling(deckDoors, zoneDoors);

	TUTORIAL_DOOR_DECK_STACK.forEach((cardId) => {

		const def = window.doors.find((d) => d.name === cardId);

		appendTutorialDeckCard(def, zoneDoors);

	});

	deckFilling(deckTreasures, zoneTreasure);

	TUTORIAL_TREASURE_DECK_STACK.forEach((cardId) => {

		const def = window.treasures.find((t) => t.name === cardId);

		appendTutorialDeckCard(def, zoneTreasure);

	});

}



function dealTutorialHands() {

	TUTORIAL_CARD_IDS.forEach((id) => {

		const el = document.getElementById(id);

		if (el) {

			el.remove();

		}

	});



	PLAYER_HAND.forEach((id) => placeCardInZone(id, 'myhand'));

	OPPONENT_HAND.forEach((id) => placeCardInZone(id, 'opponenthand'));

	OPPONENT_EQUIP.forEach((id) => placeCardInZone(id, 'zone_opponent'));

}



export function setupTutorialScene() {

	tutorialSideHintDismissedPermanently = false;

	tutorialOpponentHintDismissedPermanently = false;

	resetTutorialDeckTakeLimits();

	configureTutorialGameState();

	ensureCardCatalogLoaded();

	fillTutorialDecks();

	dealTutorialHands();



	UpdatebackImgDoor();

	UpdatebackImgTreasure();

	UpdateZones();



	window.allCards = document.querySelectorAll('.card');

	scheduleAdjustAllZonesCardLayout();

	window.dispatchEvent(new Event('munchkin:zonesChanged'));



	bindTutorialHintWatchers();

	refreshTutorialDeckTakeRules();

	applyTutorialSeatDisplayNames();
	syncTutorialLevelsAfterCatalog();
	ensureTutorialDice();

	wireTutorialEndTurnButton();

}



window.addEventListener('munchkin:zonesChanged', () => {
	updateTutorialHints();
	refreshTutorialDeckTakeRules();
	syncTutorialLevelsAfterCatalog();
	ensureTutorialDice();
});

window.addEventListener('munchkin:tutorialTimerUiChanged', updateTutorialHints);


