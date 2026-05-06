import { UpdateZones } from './увеличение карточек во время игры.js';
import { UpdatebackImgTreasure, timer, recalculateAllPowerDisplays, scheduleBadStaffIfNeeded, scheduleTreasureLevelIfNeeded, scheduleTreasure65IfNeeded, scheduleMonsterBonusAttachIfNeeded, scheduleWanderingMonsterIfNeeded, scheduleCheatIfNeeded, scheduleMagicLampIfNeeded, schedulePollymorthPotionIfNeeded, canLocalPlayMagicLampToBattleZone, canPlaceTreasureInPlayerEquipment } from './game.js';
import { UpdatebackImgDoor } from './game.js';
import socket from './socket/index.js';
//import {socket} from './game.js';
// console.log("card работает");
window.allCards = null;
let currentDrag;
let dragStartedFromZone2 = false;
/** @type {{ parent: HTMLElement, next: ChildNode | null } | null} */
let dragFromSnapshot = null;
// Бежевая подложка → насыщенный красный: сначала sepia (единая тоновая основа), затем сдвиг в красные и сильный saturate
const INVALID_TREASURE_EQUIPMENT_FILTER =
	'sepia(1) saturate(10) hue-rotate(300deg) contrast(1.2) brightness(0.85)';
const INVALID_MONSTER_TO_BATTLE_FILTER = INVALID_TREASURE_EQUIPMENT_FILTER;

function isMonsterDoorCard(cardEl) {
	const id = cardEl?.id;
	if (!id) {
		return false;
	}
	const door = window.doors?.find((d) => d.name === id);
	return Boolean(door && String(door.race || "") === "monster");
}

function isWanderingMonsterCard(cardEl) {
	const id = cardEl?.id;
	if (!id) {
		return false;
	}
	const door = window.doors?.find((d) => d.name === id);
	return Boolean(door && String(door.special || "") === "Wandering Monster");
}

function canPlaceCardIntoMonsterBattleZone(cardEl, zoneEl) {
	if (!cardEl || !zoneEl) {
		return true;
	}
	const isMonsterZone = zoneEl.id === "zone_monster" || zoneEl.classList?.contains("zone_monster");
	if (!isMonsterZone) {
		return true;
	}
	// Монстров нельзя класть в бой прямо из руки обычным перетаскиванием.
	// Исключение: сама карта Wandering Monster (её можно класть в эту зону, она запускает эффект).
	const fromHand = Boolean(dragFromSnapshot?.parent?.classList?.contains("myhand"));
	if (fromHand && isMonsterDoorCard(cardEl) && !isWanderingMonsterCard(cardEl)) {
		return false;
	}
	return true;
}

function isMagicLampTreasureCard(cardEl) {
	const id = cardEl?.id;
	if (!id) {
		return false;
	}
	const tr = window.treasures?.find((t) => t.name === id);
	return Boolean(tr && String(tr.special || "") === "Magic lamp");
}

function canPlaceMagicLampIntoBattleZone(cardEl, zoneEl) {
	if (!cardEl || !zoneEl) {
		return true;
	}
	const isBattleBonusZone = zoneEl.id === "zone_monster" || zoneEl.id === "zone3";
	if (!isBattleBonusZone) {
		return true;
	}
	if (!isMagicLampTreasureCard(cardEl)) {
		return true;
	}
	return canLocalPlayMagicLampToBattleZone(zoneEl);
}

function dragend_handler(e) {
	const c = e.target && e.target.closest && e.target.closest('.card');
	if (c) {
		c.style.filter = '';
	}
}

function recalculateMyPower(shouldSync = true) {
	const newValue = recalculateAllPowerDisplays();

	if (shouldSync) {
		const messageUpdateData = {
			method: "UpdatePower",
			power: newValue
		};
		socket.emit("message", messageUpdateData);
	}

	return newValue;
}

function dragstart_handler(e) {
  currentDrag = e.target.closest('.card');
	//console.log('старт сработал');
	const zone = e.target.closest('.cards-zone');
	if (currentDrag && currentDrag.parentElement) {
		dragFromSnapshot = {
			parent: currentDrag.parentElement,
			next: currentDrag.nextSibling,
		};
	} else {
		dragFromSnapshot = null;
	}
	dragStartedFromZone2 = Boolean(zone?.classList.contains('zone2'));
	// console.log(zone);

	if (zone.classList.contains('zone3')) {
	// Получаем значение power из currentDrag
		const CardID = currentDrag.id;
		const foundCard = window.treasures.find(card => card.name === CardID);
		// Если карта найдена, записываем значение power в переменную
		if (foundCard){
			let power = foundCard.power;
			if (power>0) {
				// Находим элемент с классом .MyBonus
				const MyBonus = document.getElementById('MyBonus');
	
				let currentValue = parseFloat(MyBonus.textContent);
	
				// Прибавляем power к текущему значению
				let newValue = currentValue - power;
	
				// Обновляем текст элемента новым значением
				MyBonus.textContent = newValue;
	
				const messageUpdateData = {
					method: "UpdateBonus",
					power: newValue
				};
				socket.emit("message",messageUpdateData);
			}
		}

	}
	if (zone.classList.contains('zone_monster')) {
	// Получаем значение power из currentDrag
		const CardID = currentDrag.id;

		let foundCard = window.doors.find(card => card.name === CardID);
		if (foundCard == null){
			foundCard = window.treasures.find(card => card.name === CardID);
		};
		// Если карта найдена, записываем значение power в переменную
		let power = foundCard.power;
		if (power>0) {
			// Находим элемент с классом .MyBonus
			const MonsterBonus = document.getElementById('MonsterBonus');

			let currentValue = parseFloat(MonsterBonus.textContent);

			// Прибавляем power к текущему значению
			let newValue = currentValue - power;

			// Обновляем текст элемента новым значением
			MonsterBonus.textContent = newValue;

			const messageUpdateData = {
				method: "UpdateMonster",
				power: newValue
			};
			socket.emit("message",messageUpdateData);
		}
	}
  
}
function dragover_handler(e) {
	e.preventDefault();
  
	const target = e.target.closest('.card');
	const zone = e.target.closest('.cards-zone');
  
	// If dragging to a different card within the same zone
	if (target && target !== currentDrag && target.parentElement === currentDrag.parentElement) {
	  currentDrag.parentElement.insertBefore(currentDrag, target.nextSibling);
	}
	// Смена зоны: вставка относительно карты под курсором (как в drop), иначе всегда appendChild — карта в конец стопки
	else if (zone) {
	  currentDrag.remove();
	  if (target && target !== currentDrag && zone.contains(target)) {
	    if (target.nextSibling && zone.contains(target.nextSibling)) {
	      zone.insertBefore(currentDrag, target.nextSibling);
	    } else {
	      zone.appendChild(currentDrag);
	    }
	  } else {
	    zone.appendChild(currentDrag);
	  }
	}
	// dropEffect = 'none' в большинстве браузеров отменяет drop — откат в drop_handler не сработает.
	// Сила «запрета» передаётся красным filter; dropEffect оставляем 'move', чтобы сработал drop.
	e.dataTransfer.dropEffect = 'move';
	const invalidTreasureEquip = currentDrag && zone && !canPlaceTreasureInPlayerEquipment(currentDrag, zone);
	const invalidMonsterToBattle = currentDrag && zone && !canPlaceCardIntoMonsterBattleZone(currentDrag, zone);
	const invalidMagicLampToBattle = currentDrag && zone && !canPlaceMagicLampIntoBattleZone(currentDrag, zone);
	if (invalidTreasureEquip || invalidMonsterToBattle || invalidMagicLampToBattle) {
		if (currentDrag) {
			currentDrag.style.filter = invalidMonsterToBattle ? INVALID_MONSTER_TO_BATTLE_FILTER : INVALID_TREASURE_EQUIPMENT_FILTER;
		}
	} else if (currentDrag) {
		currentDrag.style.filter = '';
	}
	UpdateZones();
  }
   
  

function drop_handler(e) {
  e.preventDefault();
  const target = e.target.closest('.card');
  const zone = e.target.closest('.cards-zone');
  const invalidTreasureEquip = currentDrag && zone && !canPlaceTreasureInPlayerEquipment(currentDrag, zone);
  const invalidMonsterToBattle = currentDrag && zone && !canPlaceCardIntoMonsterBattleZone(currentDrag, zone);
  const invalidMagicLampToBattle = currentDrag && zone && !canPlaceMagicLampIntoBattleZone(currentDrag, zone);
  if (currentDrag && zone && (invalidTreasureEquip || invalidMonsterToBattle || invalidMagicLampToBattle) && dragFromSnapshot?.parent) {
	dragFromSnapshot.parent.insertBefore(currentDrag, dragFromSnapshot.next);
	if (currentDrag) {
		currentDrag.style.filter = '';
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
	const moveData = {
		method: "moveCard",
		cardId: currentDrag.id,
		targetId: currentDrag.previousElementSibling ? currentDrag.previousElementSibling.id : null,
		zoneId: currentDrag.parentElement ? currentDrag.parentElement.id : null,
		fromZoneId: dragFromSnapshot?.parent?.id || null,
	};
	socket.emit("message", moveData);
	if (currentDrag) {
		const parentZone = currentDrag.parentElement;
		if (parentZone) {
			scheduleBadStaffIfNeeded(currentDrag.id, parentZone);
			scheduleTreasureLevelIfNeeded(currentDrag.id, parentZone);
			scheduleTreasure65IfNeeded(currentDrag.id, parentZone);
			scheduleMonsterBonusAttachIfNeeded(currentDrag.id, parentZone);
			scheduleWanderingMonsterIfNeeded(currentDrag.id, parentZone);
			scheduleCheatIfNeeded(currentDrag.id, parentZone);
			scheduleMagicLampIfNeeded(currentDrag.id, parentZone);
			schedulePollymorthPotionIfNeeded(currentDrag.id, parentZone);
		}
	}
	return;
  }
  if (currentDrag && zone) {
	// Вставляем после target только если target реально в этой зоне — иначе appendChild.
	if (target && zone.contains(target)) {
		const next = target.nextSibling;
		if (next && zone.contains(next)) {
			zone.insertBefore(currentDrag, next);
		} else {
			zone.appendChild(currentDrag);
		}
	} else {
		zone.appendChild(currentDrag);
	}
  }

	const droppedToZone2 = zone.classList.contains('zone2');
	if (currentDrag && (dragStartedFromZone2 || droppedToZone2)) {
		recalculateMyPower();
	}
		
  if (zone.classList.contains('zone3') && currentDrag) {
  // Получаем значение power из currentDrag
    const CardID = currentDrag.id;
  	const foundCard = window.treasures.find(card => card.name === CardID);
 	 // Если карта найдена, записываем значение power в переменную
	if (foundCard){
		let power = foundCard.power;
		if (power>0) {
			// Находим элемент с классом .MyPower
			const MyBonus = document.getElementById('MyBonus');
			let currentValue = parseInt(MyBonus.textContent);
			// Прибавляем power к текущему значению
			let newValue = currentValue + power;
	
			// Обновляем текст элемента новым значением
			MyBonus.textContent = newValue;
	
			const messageUpdateData = {
				method: "UpdateBonus",
				power: newValue
			};
			socket.emit("message",messageUpdateData);
		}
	}
  }


  if (zone.classList.contains('zone3') && currentDrag) {
	// const timerElement = document.getElementById('timer');
	// timerElement.textContent = ""
	timer();
	const messageUpdateData = {
		method: "UpdateTimer",
	};
	socket.emit("message",messageUpdateData);
  }
  if (zone.classList.contains('zone_monster') && currentDrag) {
		// const timerElement = document.getElementById('timer');
		// timerElement.textContent = ""
		timer();
		const messageUpdateData = {
			method: "UpdateTimer",
		};
		socket.emit("message",messageUpdateData);

		const CardID = currentDrag.id;

		let foundCard = window.doors.find(card => card.name === CardID);
		if (foundCard == null){
			foundCard = window.treasures.find(card => card.name === CardID);
		};

		// Если карта найдена, записываем значение power в переменную
		let power = foundCard.power;
		if (power>0) {
		  // Находим элемент с классом .MyPower
		  const MonsterBonus = document.getElementById('MonsterBonus');
		  let currentValue = parseInt(MonsterBonus.textContent);
		  // Прибавляем power к текущему значению
		  let newValue = currentValue + power;
  
		  // Обновляем текст элемента новым значением
		  MonsterBonus.textContent = newValue;
		//   console.log('бонус отправлен')
		  const messageUpdateData = {
			  method: "UpdateMonster",
			  power: newValue
		  };
		  socket.emit("message",messageUpdateData);
	    }
		
  }
  adjustCardWidth('.myhand');
  adjustCardWidth('.zone2');
  adjustCardHeight('.zone3');
  adjustCardHeight('.zone_monster');
  adjustCardWidth('.zone5');
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

  const moveData = {
    method: "moveCard",
    cardId: currentDrag.id,
    targetId: target ? target.id : null,
    zoneId: zone.id,
	fromZoneId: dragFromSnapshot?.parent?.id || null,
  };
  socket.emit("message",moveData);

  if (currentDrag && zone) {
    scheduleBadStaffIfNeeded(currentDrag.id, zone);
    scheduleTreasureLevelIfNeeded(currentDrag.id, zone);
    scheduleTreasure65IfNeeded(currentDrag.id, zone);
    scheduleMonsterBonusAttachIfNeeded(currentDrag.id, zone);
    scheduleWanderingMonsterIfNeeded(currentDrag.id, zone);
    scheduleCheatIfNeeded(currentDrag.id, zone);
    scheduleMagicLampIfNeeded(currentDrag.id, zone);
    schedulePollymorthPotionIfNeeded(currentDrag.id, zone);
  }
}

function checkAllCards() {
  if (window.allCards != null) {
		//console.log(window.allCards)
    window.allCards.forEach(item => {
      item.addEventListener('dragstart', dragstart_handler);
			item.addEventListener('dragend', dragend_handler);
    });


  } else {
    setTimeout(checkAllCards, 100);
  }
}
if (window.allCards == null){
	setTimeout(checkAllCards, 100);
}


document.addEventListener('DOMContentLoaded', function() {
  function initialize() {
    const myhand = document.querySelector('.myhand');
		const zone2 = document.querySelector('.zone2');
		const opponenthand = document.querySelector('.opponenthand');
		const zone_opponent = document.querySelector('.zone_opponent');
		const zone_opponent_side = document.querySelector('.zone_opponent_side');
		const opponent2hand = document.querySelector('.opponent2hand');
		const zone_opponent2 = document.querySelector('.zone_opponent2');
		const zone_opponent2_side = document.querySelector('.zone_opponent2_side');
		const opponent3hand = document.querySelector('.opponent3hand');
		const zone_opponent3 = document.querySelector('.zone_opponent3');
		const zone_opponent3_side = document.querySelector('.zone_opponent3_side');
		const zone3 = document.querySelector('.zone3');
		const zone_monster = document.querySelector('.zone_monster');
		const zone5 = document.querySelector('.zone5');
		const zone_doors_drop = document.querySelector('.zone_doors_drop');
		const zone_treasure_drop = document.querySelector('.zone_treasure_drop');
		const zone_treasure = document.querySelector('.zone_treasure');
		const zone_doors = document.querySelector('.zone_doors');

		//надо будет убрать 
		// window.allCards = document.querySelectorAll('.card');
		// checkAllCards();
    if (myhand) { // Проверка наличия элемента
			//console.log(window.allCards);
      recalculateMyPower(false);
	  const zones = [
		myhand,
		zone2,
		opponenthand,
		zone_opponent,
		zone_opponent_side,
		opponent2hand,
		zone_opponent2,
		zone_opponent2_side,
		opponent3hand,
		zone_opponent3,
		zone_opponent3_side,
		zone3,
		zone_monster,
		zone5,
		zone_doors_drop,
		zone_treasure_drop,
		zone_treasure,
		zone_doors,
	  ].filter(Boolean);

	  zones.forEach(zone => {
		zone.addEventListener('dragover', dragover_handler);
		zone.addEventListener('drop', drop_handler);
	  });
	} 
	else {
      setTimeout(initialize, 1000); 
    }
  }
  // Вызов функциb инициализации сразу после загрузки DOM
  initialize();
});

let prevWidth = {};
let prevcardsCount = {};

let prevHeight = {};
let prevcardsCount2 = {};

export function adjustCardHeight(zoneSelector) {
	// Важно: берём только ПРЯМЫЕ карты в зоне, иначе вложенные "визуальные" карты (например Cheat внутри шмотки)
	// будут ломать расчёт ширины/высоты и раскладку в ряд.
	let cards = document.querySelectorAll(zoneSelector + ' > .card');
	let totalHeight = 0;
	cards.forEach(function(card) {
		totalHeight += card.offsetHeight;
	});
	if (!prevcardsCount2[zoneSelector]) {
		prevcardsCount2[zoneSelector] = 0;
	}
	let cardsCount = cards.length;
	if (!prevHeight[zoneSelector]) {
		prevHeight[zoneSelector] = 0;
	}
	let newHeight = 80 / cardsCount; 

	if (cardsCount < 4) {
		cards.forEach(function(card) {
			card.style.height = '20px';
		});
	}
	else if (cardsCount < prevcardsCount2[zoneSelector]) {
		cards.forEach(function(card) {
			card.style.height = prevHeight[zoneSelector] + 'px';
		});
	}
	else if ((totalHeight > 80) && (cardsCount >= 4)) {

		cards.forEach(function(card) {
			card.style.height = newHeight + 'px';	
		});
		
	}
	prevcardsCount2[zoneSelector] = cardsCount;
	prevHeight[zoneSelector] = newHeight;
}

export function adjustCardWidth(zoneSelector) {
	// Важно: берём только ПРЯМЫЕ карты в зоне, иначе вложенные "визуальные" карты (например Cheat внутри шмотки)
	// будут ломать расчёт ширины/высоты и раскладку в ряд.
	let cards = document.querySelectorAll(zoneSelector + ' > .card');
	let totalWidth = 0;
	cards.forEach(function(card) {
		totalWidth += card.offsetWidth;
	});

	if (!prevcardsCount[zoneSelector]) {
		prevcardsCount[zoneSelector] = 0;
	}
	let cardsCount = cards.length;

	if (!prevWidth[zoneSelector]) {
		prevWidth[zoneSelector] = 0;
	}
	let newWidth = 210 / cardsCount; 

	if (cardsCount <= 3) {
		cards.forEach(function(card) {
			card.style.width = '70px';
		});
	}
	else if (cardsCount < prevcardsCount[zoneSelector]) {
		cards.forEach(function(card) {
			card.style.width = prevWidth[zoneSelector] + 'px';
		});
	}
	else if ((totalWidth > 210) && (cardsCount > 3)) {
		cards.forEach(function(card) {
			card.style.width = newWidth + 'px';
	
		});
	}
	prevcardsCount[zoneSelector] = cardsCount;
	prevWidth[zoneSelector] = newWidth;
}