/**
 * Раздача и старт обучающего стола.
 * Drag-and-drop, превью в зоне и увеличение карт — card-block.js и «увеличение карточек».
 */
import { UpdateZones } from './увеличение карточек во время игры.js';
import { scheduleAdjustAllZonesCardLayout } from './card-block.js';
import {
	ensureCardCatalogLoaded,
	Deck_filling,
	UpdatebackImgDoor,
	UpdatebackImgTreasure,
	recalculateAllPowerDisplays,
	configureTutorialGameState,
	initializeSellTreasuresUi,
	wireTutorialEndTurnButton,
} from './game.js';

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
]);

const PLAYER_HAND = [
	'treasure32',
	'door36',
	'door12',
	'treasure65',
	'door51',
	'door94',
	'treasure7',
	'treasure16',
];
const OPPONENT_HAND = ['treasure31'];
const OPPONENT_EQUIP = ['door9'];

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
		Deck_filling([def], holder);
		card = holder.querySelector('.card');
	}
	if (card) {
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

	const deckDoors = window.doors.filter((d) => !TUTORIAL_CARD_IDS.has(d.name));
	const deckTreasures = window.treasures.filter((t) => !TUTORIAL_CARD_IDS.has(t.name));

	Deck_filling(deckDoors, zoneDoors);
	Deck_filling(deckTreasures, zoneTreasure);
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

	recalculateAllPowerDisplays();
	initializeSellTreasuresUi();
	wireTutorialEndTurnButton();
}
