import { UpdateZones } from './увеличение карточек во время игры.js';
import { UpdatebackImgTreasure } from './game.js';
import { UpdatebackImgDoor } from './game.js';
import {socket} from './game.js';

window.allCards = null;
let currentDrag;

function dragstart_handler(e) {
  currentDrag = e.target.closest('.card');
	const zone = e.target.closest('.cards-zone');
	if (zone.classList.contains('zone2')) {
    // Получаем значение power из currentDrag
    const CardID = currentDrag.id;
		
		const foundCard = window.treasures.find(card => card.name === CardID);
    // Если карта найдена, записываем значение power в переменную
    if (foundCard) {
      let power = foundCard.power;

			// Находим элемент с классом .MyPower
			const bottomCenterElement = document.getElementById('MyPower');

			let currentValue = parseFloat(bottomCenterElement.textContent);

			// Прибавляем power к текущему значению
			let newValue = currentValue - power;

			// Обновляем текст элемента новым значением
			bottomCenterElement.textContent = newValue;

			const messageUpdateData = {
				method: "UpdatePower",
				power: newValue
			};
			socket.emit("message",messageUpdateData);
			}
  }
}
function dragover_handler(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.target.closest('.card');
  const zone = e.target.closest('.cards-zone');
  if (target && target !== currentDrag) {
    if (currentDrag.parentElement && target.parentElement === currentDrag.parentElement) {
      currentDrag.parentElement.insertBefore(currentDrag, target.nextSibling);
    } else {
      const parent = currentDrag.parentElement;
      parent && parent.removeChild(currentDrag);
      target.parentElement.insertBefore(currentDrag, target.nextSibling);
    }
  } else if (target === null && zone !== null) {
    if (zone.classList.contains('cards-zone')) {
      zone.appendChild(currentDrag);
    }
  }
  UpdateZones();
}

function drop_handler(e) {
  e.preventDefault();
  const target = e.target.closest('.card');
  const zone = e.target.closest('.cards-zone');
  if (currentDrag && target && target.nextSibling && zone.contains(target.nextSibling)) {
    zone.insertBefore(currentDrag, target.nextSibling);
  } else if (currentDrag) {
    zone.appendChild(currentDrag);
  }
	// Проверяем, добавлена ли карта в зону zone2
  if (zone.classList.contains('zone2') && currentDrag) {
    // Получаем значение power из currentDrag
    const CardID = currentDrag.id;
		
		const foundCard = window.treasures.find(card => card.name === CardID);
    // Если карта найдена, записываем значение power в переменную
    if (foundCard) {
      let power = foundCard.power;
			// Находим элемент с классом .MyPower
			const bottomCenterElement = document.getElementById('MyPower');
			let currentValue = parseInt(bottomCenterElement.textContent);
			// Прибавляем power к текущему значению
			let newValue = currentValue + power;

			// Обновляем текст элемента новым значением
			bottomCenterElement.textContent = newValue;

			const messageUpdateData = {
				method: "UpdatePower",
				power: newValue
			};
			socket.emit("message",messageUpdateData);
			}
			
  }

  adjustCardWidth('.myhand');
  adjustCardWidth('.zone2');
	adjustCardHeight('.zone3');
  adjustCardHeight('.zone4');
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
  const moveData = {
    method: "moveCard",
    cardId: currentDrag.id,
    targetId: target ? target.id : null,
    zoneId: zone.id,
  };
  socket.emit("message",moveData);
}

function checkAllCards() {
  if (window.allCards != null) {
		//console.log(window.allCards)
    window.allCards.forEach(item => {
      item.addEventListener('dragstart', dragstart_handler);
      item.addEventListener('dragover', dragover_handler);
      item.addEventListener('drop', drop_handler);
    });
  } else {
    setTimeout(checkAllCards, 100);
  }
}
if (window.allCards == null){
	setTimeout(checkAllCards, 100);
}

const myhand = document.querySelector('.myhand');
myhand.addEventListener('dragover', dragover_handler);

const zone2 = document.querySelector('.zone2');
zone2.addEventListener('dragover', dragover_handler);

const opponenthand = document.querySelector('.opponenthand');
opponenthand.addEventListener('dragover', dragover_handler);

const zone_opponent = document.querySelector('.zone_opponent');
zone_opponent.addEventListener('dragover', dragover_handler);

const zone_opponent_side = document.querySelector('.zone_opponent_side');
zone_opponent_side.addEventListener('dragover', dragover_handler);

const opponent2hand = document.querySelector('.opponent2hand');
opponent2hand.addEventListener('dragover', dragover_handler);

const zone_opponent2 = document.querySelector('.zone_opponent2');
zone_opponent2.addEventListener('dragover', dragover_handler);

const zone_opponent2_side = document.querySelector('.zone_opponent2_side');
zone_opponent2_side.addEventListener('dragover', dragover_handler);

const opponent3hand = document.querySelector('.opponent3hand');
opponent3hand.addEventListener('dragover', dragover_handler);

const zone_opponent3 = document.querySelector('.zone_opponent3');
zone_opponent3.addEventListener('dragover', dragover_handler);

const zone_opponent3_side = document.querySelector('.zone_opponent3_side');
zone_opponent3_side.addEventListener('dragover', dragover_handler);

const zone3 = document.querySelector('.zone3');
zone3.addEventListener('dragover', dragover_handler);

const zone4 = document.querySelector('.zone4');
zone4.addEventListener('dragover', dragover_handler);

const zone5 = document.querySelector('.zone5');
zone5.addEventListener('dragover', dragover_handler);

const zone_doors_drop = document.querySelector('.zone_doors_drop');
zone_doors_drop.addEventListener('dragover', dragover_handler);

const zone_treasure_drop = document.querySelector('.zone_treasure_drop');
zone_treasure_drop.addEventListener('dragover', dragover_handler);

const zone_treasure = document.querySelector('.zone_treasure');
zone_treasure.addEventListener('dragover', dragover_handler);

const zone_doors = document.querySelector('.zone_doors');
zone_doors.addEventListener('dragover', dragover_handler);

var prevWidth = {};
var prevcardsCount = {};

export function adjustCardWidth(zoneSelector) {
  var cards = document.querySelectorAll(zoneSelector + ' .card');
  var totalWidth = 0;
  cards.forEach(function(card) {
    totalWidth += card.offsetWidth;
  });

  if (!prevcardsCount[zoneSelector]) {
    prevcardsCount[zoneSelector] = 0;
  }
  var cardsCount = cards.length;

  if (!prevWidth[zoneSelector]) {
    prevWidth[zoneSelector] = 0;
  }
  var newWidth = 210 / cardsCount; 

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

var prevHeight = {};
var prevcardsCount2 = {};

export function adjustCardHeight(zoneSelector) {
  var cards = document.querySelectorAll(zoneSelector + ' .card');
  var totalHeight = 0;
  cards.forEach(function(card) {
    totalHeight += card.offsetHeight;
  });
  if (!prevcardsCount2[zoneSelector]) {
    prevcardsCount2[zoneSelector] = 0;
  }
  var cardsCount = cards.length;
  if (!prevHeight[zoneSelector]) {
    prevHeight[zoneSelector] = 0;
  }
  var newHeight = 80 / cardsCount; 

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