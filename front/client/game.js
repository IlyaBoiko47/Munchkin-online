
import { adjustCardWidth } from './card-block.js';
import { adjustCardHeight } from './card-block.js';
import { UpdateZones } from './увеличение карточек во время игры.js';

let fl ;
window.doors = [];
const zonedoor = document.querySelector('.zone_doors');
window.treasures = [];
const zoneTreasure = document.querySelector('.zone_treasure');
let num;

export const socket = io('http://192.168.222.187:8080');
let gameStarted = false;
socket.on("message", response => {
	
	num = response.num;
	//console.log(response);

  if (response.method === "moveCard") {
    const card = document.getElementById(response.cardId);
    const target = response.targetId ? document.getElementById(response.targetId) : null;
    const zone = document.getElementById(response.zoneId);
		
    if (card && zone) {
      if (target && zone.contains(target)) {
        zone.insertBefore(card, target.nextSibling);
      } else {
        zone.appendChild(card);
      }
    }
		
    adjustCardWidth('.myhand');
    adjustCardWidth('.zone2');
    adjustCardWidth('.zone5');
    adjustCardHeight('.zone3');
    adjustCardHeight('.zone4');
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
  }
	if (response.method === "UpdatePower") {
		const CurrentPower = response.power;
		const bottomCenterElement = document.querySelector('.PowerPlayer2');
			// Обновляем текст элемента новым значением
		bottomCenterElement.textContent = CurrentPower;
	}
	
  
  if (response.method === "shuffleDeck") {
    //нужно передать перемешанный массив doors
		console.log('перемешиваем')
		doors = response.deckDoors;
		treasures = response.deckTreasure;
		
		const StartGameMethod = {
			method: "StartGame",
		};
		socket.emit("message", StartGameMethod);

  }
	if (response.method === "1") {
		//console.log("первый")
    fl = response.fl;
		for (let i = 1; i <= 94; i++) {
			const door = eval(`door${i}`);
			doors.push(door);
		}
		for (let i = 1; i <= 73; i++) {
			const treasure = eval(`treasure${i}`);
			treasures.push(treasure);
		}
		shuffle(doors);
		shuffle(treasures);

		const shuffleDeck = {
			method: "shuffleDeck",
			deckDoors: doors,
			deckTreasure: treasures,
		};
		socket.emit("message",shuffleDeck);
		
		
  }
	if (response.method === "2Players") {
		//console.log("второй или третий ")
    fl = response.fl;
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
		
  }
	if (response.method === "3Players") {
		//console.log("второй или третий ")
    fl = response.fl;
		const opponent2hand = document.getElementById("opponent2hand");
		const opponent3hand = document.getElementById("opponent3hand");
		const myhand = document.getElementById("myhand");
		const zone_opponent2 = document.getElementById("zone_opponent2");
		const zone_opponent3 = document.getElementById("zone_opponent3");
		const zone2 = document.getElementById("zone2");
		const zone_opponent2_side = document.getElementById("zone_opponent2_side");
		const zone5 = document.getElementById("zone5");
		const zone_opponent3_side = document.getElementById("zone_opponent3_side");

		// Определяем, является ли пользователь вторым игроком
		if (fl=="2player") {
			//console.log(myhand);
			// Если пользователь второй игрок, меняем классы элементов
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


			
			//console.log(myhand);
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
		
		
		if (fl=="3player") {
			//console.log(myhand);
			// Если пользователь второй игрок, меняем классы элементов
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


  }
	if (response.method === "StartGame" && gameStarted == false) {
		num = response.num;
  	//console.log(`${num} игроков`);
    Start_game(num);
		button.remove();
		UpdatebackImgDoor()
		UpdatebackImgTreasure()
		UpdateZones();
		adjustCardWidth('.myhand');
    adjustCardWidth('.zone2');
    adjustCardWidth('.zone5');
    adjustCardHeight('.zone3');
    adjustCardHeight('.zone4');
    adjustCardWidth('.opponenthand');
		gameStarted = true;
  }
});

class Card_treasure {
  constructor(name = "", img = "", backimg = "", power = 0, cost = 0, body = 0, hand = 0, footwear = 0, hat = 0, big = 0) {
    this.name = name;
		this.img = img;
    this.backimg = backimg;
    this.power = power;
    this.cost = cost;
    this.body = body;
    this.hand = hand;
    this.footwear = footwear;
    this.hat = hat;
		this.big = big;
  }
}

// Создание экземпляров класса "сокровища"

const treasure1 = new Card_treasure("treasure1", "./img/Treasure1/card0096.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 1);
const treasure3 = new Card_treasure("treasure3", "./img/Treasure1/card0098.png", "./img/Treasure1/cardBack_Treasure.png", 1, 200, 0, 0, 0, 1);
const treasure2 = new Card_treasure("treasure2", "./img/Treasure1/card0097.png", "./img/Treasure1/cardBack_Treasure.png", 1, 600, 0, 0, 0, 1);
const treasure4 = new Card_treasure("treasure4", "./img/Treasure1/card0099.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 1);
const treasure5 = new Card_treasure("treasure5", "./img/Treasure1/card0100.png", "./img/Treasure1/cardBack_Treasure.png", 2, 400, 1, 0, 0, 0);
const treasure6 = new Card_treasure("treasure6", "./img/Treasure1/card0101.png", "./img/Treasure1/cardBack_Treasure.png", 1, 200, 1, 0, 0, 0);
const treasure7 = new Card_treasure("treasure7", "./img/Treasure1/card0102.png", "./img/Treasure1/cardBack_Treasure.png", 3, 600, 1, 0, 0, 0, 1);
const treasure8 = new Card_treasure("treasure8", "./img/Treasure1/card0103.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 1, 0, 0, 0);
const treasure9 = new Card_treasure("treasure9", "./img/Treasure1/card0104.png", "./img/Treasure1/cardBack_Treasure.png", 1, 200, 1, 0, 0, 0);
const treasure10 = new Card_treasure("treasure10", "./img/Treasure1/card0105.png", "./img/Treasure1/cardBack_Treasure.png", 2, 400, 0, 0, 1, 0);
const treasure11 = new Card_treasure("treasure11", "./img/Treasure1/card0106.png", "./img/Treasure1/cardBack_Treasure.png", 0, 400, 0, 0, 1, 0);
const treasure12 = new Card_treasure("treasure12", "./img/Treasure1/card0107.png", "./img/Treasure1/cardBack_Treasure.png", 0, 700, 0, 0, 1, 0);
const treasure13 = new Card_treasure("treasure13", "./img/Treasure1/card0108.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0);
const treasure14 = new Card_treasure("treasure14", "./img/Treasure1/card0109.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0);
const treasure15 = new Card_treasure("treasure15", "./img/Treasure1/card0110.png", "./img/Treasure1/cardBack_Treasure.png", 3, 600, 0, 1, 0, 0);
const treasure16 = new Card_treasure("treasure16", "./img/Treasure1/card0111.png", "./img/Treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0);
const treasure17 = new Card_treasure("treasure17", "./img/Treasure1/card0112.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0);
const treasure18 = new Card_treasure("treasure18", "./img/Treasure1/card0113.png", "./img/Treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0);
const treasure19 = new Card_treasure("treasure19", "./img/Treasure1/card0114.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 1, 0, 0);
const treasure20 = new Card_treasure("treasure20", "./img/Treasure1/card0115.png", "./img/Treasure1/cardBack_Treasure.png", 2, 400, 0, 1, 0, 0);
const treasure21 = new Card_treasure("treasure21", "./img/Treasure1/card0116.png", "./img/Treasure1/cardBack_Treasure.png", 4, 600, 0, 1, 0, 0, 1);
const treasure22 = new Card_treasure("treasure22", "./img/Treasure1/card0117.png", "./img/Treasure1/cardBack_Treasure.png", 2, 400, 0, 1, 0, 0);
const treasure23 = new Card_treasure("treasure23", "./img/Treasure1/card0118.png", "./img/Treasure1/cardBack_Treasure.png", 5, 800, 0, 1, 0, 0);
const treasure24 = new Card_treasure("treasure24", "./img/Treasure1/card0119.png", "./img/Treasure1/cardBack_Treasure.png", 0, 300, 0, 1, 0, 0, 1);
const treasure25 = new Card_treasure("treasure25", "./img/Treasure1/card0120.png", "./img/Treasure1/cardBack_Treasure.png", 1, 0, 0, 1, 0, 0);
const treasure26 = new Card_treasure("treasure26", "./img/Treasure1/card0121.png", "./img/Treasure1/cardBack_Treasure.png", 3, 600, 0, 2, 0, 0, 1);
const treasure27 = new Card_treasure("treasure27", "./img/Treasure1/card0122.png", "./img/Treasure1/cardBack_Treasure.png", 4, 800, 0, 2, 0, 0);
const treasure28 = new Card_treasure("treasure28", "./img/Treasure1/card0123.png", "./img/Treasure1/cardBack_Treasure.png", 3, 0, 0, 2, 0, 0, 1);
const treasure29 = new Card_treasure("treasure29", "./img/Treasure1/card0124.png", "./img/Treasure1/cardBack_Treasure.png", 4, 600, 0, 2, 0, 0, 1);
const treasure30 = new Card_treasure("treasure30", "./img/Treasure1/card0125.png", "./img/Treasure1/cardBack_Treasure.png", 1, 200, 0, 2, 0, 0);
const treasure31 = new Card_treasure("treasure31", "./img/Treasure1/card0126.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure32 = new Card_treasure("treasure32", "./img/Treasure1/card0127.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure33 = new Card_treasure("treasure33", "./img/Treasure1/card0128.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure34 = new Card_treasure("treasure34", "./img/Treasure1/card0129.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure35 = new Card_treasure("treasure35", "./img/Treasure1/card0130.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure36 = new Card_treasure("treasure36", "./img/Treasure1/card0131.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure38 = new Card_treasure("treasure38", "./img/Treasure1/card0133.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure37 = new Card_treasure("treasure37", "./img/Treasure1/card0132.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure40 = new Card_treasure("treasure40", "./img/Treasure1/card0135.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure39 = new Card_treasure("treasure39", "./img/Treasure1/card0134.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure41 = new Card_treasure("treasure41", "./img/Treasure1/card0136.png", "./img/Treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0);
const treasure42 = new Card_treasure("treasure42", "./img/Treasure1/card0137.png", "./img/Treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0);
const treasure43 = new Card_treasure("treasure43", "./img/Treasure1/card0138.png", "./img/Treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0);
const treasure44 = new Card_treasure("treasure44", "./img/Treasure1/card0139.png", "./img/Treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0);
const treasure45 = new Card_treasure("treasure45", "./img/Treasure1/card0140.png", "./img/Treasure1/cardBack_Treasure.png", 0, 500, 0, 0, 0, 0);
const treasure46 = new Card_treasure("treasure46", "./img/Treasure1/card0141.png", "./img/Treasure1/cardBack_Treasure.png", 0, 1100, 0, 0, 0, 0);
const treasure47 = new Card_treasure("treasure47", "./img/Treasure1/card0142.png", "./img/Treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0);
const treasure48 = new Card_treasure("treasure48", "./img/Treasure1/card0143.png", "./img/Treasure1/cardBack_Treasure.png", 0, 100, 0, 0, 0, 0);
const treasure49 = new Card_treasure("treasure49", "./img/Treasure1/card0144.png", "./img/Treasure1/cardBack_Treasure.png", 5, 0, 0, 0, 0, 0);
const treasure50 = new Card_treasure("treasure50", "./img/Treasure1/card0145.png", "./img/Treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0);
const treasure51 = new Card_treasure("treasure51", "./img/Treasure1/card0146.png", "./img/Treasure1/cardBack_Treasure.png", 0, 100, 0, 0, 0, 0);
const treasure52 = new Card_treasure("treasure52", "./img/Treasure1/card0147.png", "./img/Treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0);
const treasure53 = new Card_treasure("treasure53", "./img/Treasure1/card0148.png", "./img/Treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0);
const treasure54 = new Card_treasure("treasure54", "./img/Treasure1/card0149.png", "./img/Treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0);
const treasure55 = new Card_treasure("treasure55", "./img/Treasure1/card0150.png", "./img/Treasure1/cardBack_Treasure.png", 0, 200, 0, 0, 0, 0);
const treasure56 = new Card_treasure("treasure56", "./img/Treasure1/card0151.png", "./img/Treasure1/cardBack_Treasure.png", 5, 200, 0, 0, 0, 0);
const treasure57 = new Card_treasure("treasure57", "./img/Treasure1/card0152.png", "./img/Treasure1/cardBack_Treasure.png", 0, 1300, 0, 0, 0, 0);
const treasure58 = new Card_treasure("treasure58", "./img/Treasure1/card0153.png", "./img/Treasure1/cardBack_Treasure.png", 0, 300, 0, 0, 0, 0);
const treasure59 = new Card_treasure("treasure59", "./img/Treasure1/card0154.png", "./img/Treasure1/cardBack_Treasure.png", 5, 300, 0, 0, 0, 0);
const treasure60 = new Card_treasure("treasure60", "./img/Treasure1/card0155.png", "./img/Treasure1/cardBack_Treasure.png", 2, 200, 0, 0, 0, 0);
const treasure61 = new Card_treasure("treasure61", "./img/Treasure1/card0156.png", "./img/Treasure1/cardBack_Treasure.png", 2, 100, 0, 0, 0, 0);
const treasure62 = new Card_treasure("treasure62", "./img/Treasure1/card0157.png", "./img/Treasure1/cardBack_Treasure.png", 3, 100, 0, 0, 0, 0);
const treasure63 = new Card_treasure("treasure63", "./img/Treasure1/card0158.png", "./img/Treasure1/cardBack_Treasure.png", 0, 200, 0, 0, 0, 0);
const treasure64 = new Card_treasure("treasure64", "./img/Treasure1/card0159.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure65 = new Card_treasure("treasure65", "./img/Treasure1/card0160.png", "./img/Treasure1/cardBack_Treasure.png", 0, 0, 0, 0, 0, 0);
const treasure66 = new Card_treasure("treasure66", "./img/Treasure1/card0161.png", "./img/Treasure1/cardBack_Treasure.png", 1, 200, 0, 0, 0, 0);
const treasure67 = new Card_treasure("treasure67", "./img/Treasure1/card0162.png", "./img/Treasure1/cardBack_Treasure.png", 2, 600, 0, 0, 0, 0);
const treasure68 = new Card_treasure("treasure68", "./img/Treasure1/card0163.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 0);
const treasure69 = new Card_treasure("treasure69", "./img/Treasure1/card0164.png", "./img/Treasure1/cardBack_Treasure.png", 3, 400, 0, 0, 0, 0);
const treasure70 = new Card_treasure("treasure70", "./img/Treasure1/card0165.png", "./img/Treasure1/cardBack_Treasure.png", 3, 0, 0, 0, 0, 0);
const treasure71 = new Card_treasure("treasure71", "./img/Treasure1/card0166.png", "./img/Treasure1/cardBack_Treasure.png", 3, 600, 0, 0, 0, 0);
const treasure72 = new Card_treasure("treasure72", "./img/Treasure1/card0167.png", "./img/Treasure1/cardBack_Treasure.png", 4, 600, 0, 0, 0, 0);
const treasure73 = new Card_treasure("treasure73", "./img/Treasure1/card0168.png", "./img/Treasure1/cardBack_Treasure.png", 0, 600, 0, 0, 0, 0);

class Card_door {
  constructor(name = "", img = "", backimg = "", race = "", kind = "", monster = 0, bonus = 0, special = "") {
    this.name = name;
		this.img = img;
    this.backimg = backimg;
    this.race = race;
    this.kind = kind;
    this.monster = monster;
    this.bonus = bonus;
    this.special = special;
  }
}
// Создание экземпляров класса "дверь"
const door1 = new Card_door("door1", "./img/doors1/card0001.png", "./img/doors1/cardBack_Doors.png");
const door2 = new Card_door("door2", "./img/doors1/card0002.png", "./img/doors1/cardBack_Doors.png");
const door3 = new Card_door("door3", "./img/doors1/card0003.png", "./img/doors1/cardBack_Doors.png");
const door4 = new Card_door("door4", "./img/doors1/card0004.png", "./img/doors1/cardBack_Doors.png");
const door5 = new Card_door("door5", "./img/doors1/card0005.png", "./img/doors1/cardBack_Doors.png");
const door6 = new Card_door("door6", "./img/doors1/card0006.png", "./img/doors1/cardBack_Doors.png");
const door7 = new Card_door("door7", "./img/doors1/card0007.png", "./img/doors1/cardBack_Doors.png");
const door8 = new Card_door("door8", "./img/doors1/card0008.png", "./img/doors1/cardBack_Doors.png");
const door9 = new Card_door("door9", "./img/doors1/card0009.png", "./img/doors1/cardBack_Doors.png");
const door10 = new Card_door("door10", "./img/doors1/card0010.png", "./img/doors1/cardBack_Doors.png");
const door11 = new Card_door("door11", "./img/doors1/card0010.png", "./img/doors1/cardBack_Doors.png");
const door12 = new Card_door("door12", "./img/doors1/card0012.png", "./img/doors1/cardBack_Doors.png");
const door13 = new Card_door("door13", "./img/doors1/card0013.png", "./img/doors1/cardBack_Doors.png");
const door14 = new Card_door("door14", "./img/doors1/card0014.png", "./img/doors1/cardBack_Doors.png");
const door15 = new Card_door("door15", "./img/doors1/card0015.png", "./img/doors1/cardBack_Doors.png");
const door16 = new Card_door("door16", "./img/doors1/card0016.png", "./img/doors1/cardBack_Doors.png");
const door17 = new Card_door("door17", "./img/doors1/card0017.png", "./img/doors1/cardBack_Doors.png");
const door18 = new Card_door("door18", "./img/doors1/card0018.png", "./img/doors1/cardBack_Doors.png");
const door19 = new Card_door("door19", "./img/doors1/card0019.png", "./img/doors1/cardBack_Doors.png");
const door20 = new Card_door("door20", "./img/doors1/card0020.png", "./img/doors1/cardBack_Doors.png");
const door21 = new Card_door("door21", "./img/doors1/card0021.png", "./img/doors1/cardBack_Doors.png");
const door22 = new Card_door("door22", "./img/doors1/card0022.png", "./img/doors1/cardBack_Doors.png");
const door23 = new Card_door("door23", "./img/doors1/card0023.png", "./img/doors1/cardBack_Doors.png");
const door24 = new Card_door("door24", "./img/doors1/card0024.png", "./img/doors1/cardBack_Doors.png");
const door25 = new Card_door("door25", "./img/doors1/card0025.png", "./img/doors1/cardBack_Doors.png");
const door26 = new Card_door("door26", "./img/doors1/card0026.png", "./img/doors1/cardBack_Doors.png");
const door27 = new Card_door("door27", "./img/doors1/card0027.png", "./img/doors1/cardBack_Doors.png");
const door28 = new Card_door("door28", "./img/doors1/card0028.png", "./img/doors1/cardBack_Doors.png");
const door29 = new Card_door("door29", "./img/doors1/card0029.png", "./img/doors1/cardBack_Doors.png");
const door30 = new Card_door("door30", "./img/doors1/card0030.png", "./img/doors1/cardBack_Doors.png");
const door31 = new Card_door("door31", "./img/doors1/card0031.png", "./img/doors1/cardBack_Doors.png");
const door32 = new Card_door("door32", "./img/doors1/card0032.png", "./img/doors1/cardBack_Doors.png");
const door33 = new Card_door("door33", "./img/doors1/card0033.png", "./img/doors1/cardBack_Doors.png");
const door34 = new Card_door("door34", "./img/doors1/card0034.png", "./img/doors1/cardBack_Doors.png");
const door35 = new Card_door("door35", "./img/doors1/card0035.png", "./img/doors1/cardBack_Doors.png");
const door36 = new Card_door("door36", "./img/doors1/card0036.png", "./img/doors1/cardBack_Doors.png");
const door37 = new Card_door("door37", "./img/doors1/card0037.png", "./img/doors1/cardBack_Doors.png");
const door38 = new Card_door("door38", "./img/doors1/card0038.png", "./img/doors1/cardBack_Doors.png");
const door39 = new Card_door("door39", "./img/doors1/card0039.png", "./img/doors1/cardBack_Doors.png");
const door40 = new Card_door("door40", "./img/doors1/card0040.png", "./img/doors1/cardBack_Doors.png");
const door41 = new Card_door("door41", "./img/doors1/card0041.png", "./img/doors1/cardBack_Doors.png");
const door42 = new Card_door("door42", "./img/doors1/card0042.png", "./img/doors1/cardBack_Doors.png");
const door43 = new Card_door("door43", "./img/doors1/card0043.png", "./img/doors1/cardBack_Doors.png");
const door44 = new Card_door("door44", "./img/doors1/card0044.png", "./img/doors1/cardBack_Doors.png");
const door45 = new Card_door("door45", "./img/doors1/card0045.png", "./img/doors1/cardBack_Doors.png");
const door46 = new Card_door("door46", "./img/doors1/card0046.png", "./img/doors1/cardBack_Doors.png");
const door47 = new Card_door("door47", "./img/doors1/card0047.png", "./img/doors1/cardBack_Doors.png");
const door48 = new Card_door("door48", "./img/doors1/card0048.png", "./img/doors1/cardBack_Doors.png");
const door49 = new Card_door("door49", "./img/doors1/card0049.png", "./img/doors1/cardBack_Doors.png");
const door50 = new Card_door("door50", "./img/doors1/card0050.png", "./img/doors1/cardBack_Doors.png");
const door51 = new Card_door("door51", "./img/doors1/card0051.png", "./img/doors1/cardBack_Doors.png");
const door52 = new Card_door("door52", "./img/doors1/card0052.png", "./img/doors1/cardBack_Doors.png");
const door53 = new Card_door("door53", "./img/doors1/card0053.png", "./img/doors1/cardBack_Doors.png");
const door54 = new Card_door("door54", "./img/doors1/card0054.png", "./img/doors1/cardBack_Doors.png");
const door55 = new Card_door("door55", "./img/doors1/card0055.png", "./img/doors1/cardBack_Doors.png");
const door56 = new Card_door("door56", "./img/doors1/card0056.png", "./img/doors1/cardBack_Doors.png");
const door57 = new Card_door("door57", "./img/doors1/card0057.png", "./img/doors1/cardBack_Doors.png");
const door58 = new Card_door("door58", "./img/doors1/card0058.png", "./img/doors1/cardBack_Doors.png");
const door59 = new Card_door("door59", "./img/doors1/card0059.png", "./img/doors1/cardBack_Doors.png");
const door60 = new Card_door("door60", "./img/doors1/card0060.png", "./img/doors1/cardBack_Doors.png");
const door61 = new Card_door("door61", "./img/doors1/card0061.png", "./img/doors1/cardBack_Doors.png");
const door62 = new Card_door("door62", "./img/doors1/card0062.png", "./img/doors1/cardBack_Doors.png");
const door63 = new Card_door("door63", "./img/doors1/card0063.png", "./img/doors1/cardBack_Doors.png");
const door64 = new Card_door("door64", "./img/doors1/card0064.png", "./img/doors1/cardBack_Doors.png");
const door65 = new Card_door("door65", "./img/doors1/card0065.png", "./img/doors1/cardBack_Doors.png");
const door66 = new Card_door("door66", "./img/doors1/card0066.png", "./img/doors1/cardBack_Doors.png");
const door67 = new Card_door("door67", "./img/doors1/card0067.png", "./img/doors1/cardBack_Doors.png");
const door68 = new Card_door("door68", "./img/doors1/card0068.png", "./img/doors1/cardBack_Doors.png");
const door69 = new Card_door("door69", "./img/doors1/card0069.png", "./img/doors1/cardBack_Doors.png");
const door70 = new Card_door("door70", "./img/doors1/card0070.png", "./img/doors1/cardBack_Doors.png");
const door71 = new Card_door("door71", "./img/doors1/card0071.png", "./img/doors1/cardBack_Doors.png");
const door72 = new Card_door("door72", "./img/doors1/card0072.png", "./img/doors1/cardBack_Doors.png");
const door73 = new Card_door("door73", "./img/doors1/card0073.png", "./img/doors1/cardBack_Doors.png");
const door74 = new Card_door("door74", "./img/doors1/card0074.png", "./img/doors1/cardBack_Doors.png");
const door75 = new Card_door("door75", "./img/doors1/card0075.png", "./img/doors1/cardBack_Doors.png");
const door76 = new Card_door("door76", "./img/doors1/card0076.png", "./img/doors1/cardBack_Doors.png");
const door77 = new Card_door("door77", "./img/doors1/card0077.png", "./img/doors1/cardBack_Doors.png");
const door78 = new Card_door("door78", "./img/doors1/card0078.png", "./img/doors1/cardBack_Doors.png");
const door79 = new Card_door("door79", "./img/doors1/card0079.png", "./img/doors1/cardBack_Doors.png");
const door80 = new Card_door("door80", "./img/doors1/card0080.png", "./img/doors1/cardBack_Doors.png");
const door81 = new Card_door("door81", "./img/doors1/card0081.png", "./img/doors1/cardBack_Doors.png");
const door82 = new Card_door("door82", "./img/doors1/card0082.png", "./img/doors1/cardBack_Doors.png");
const door83 = new Card_door("door83", "./img/doors1/card0083.png", "./img/doors1/cardBack_Doors.png");
const door84 = new Card_door("door84", "./img/doors1/card0084.png", "./img/doors1/cardBack_Doors.png");
const door85 = new Card_door("door85", "./img/doors1/card0085.png", "./img/doors1/cardBack_Doors.png");
const door86 = new Card_door("door86", "./img/doors1/card0086.png", "./img/doors1/cardBack_Doors.png");
const door87 = new Card_door("door87", "./img/doors1/card0087.png", "./img/doors1/cardBack_Doors.png");
const door88 = new Card_door("door88", "./img/doors1/card0088.png", "./img/doors1/cardBack_Doors.png");
const door89 = new Card_door("door89", "./img/doors1/card0089.png", "./img/doors1/cardBack_Doors.png");
const door90 = new Card_door("door90", "./img/doors1/card0090.png", "./img/doors1/cardBack_Doors.png");
const door91 = new Card_door("door91", "./img/doors1/card0091.png", "./img/doors1/cardBack_Doors.png");
const door92 = new Card_door("door92", "./img/doors1/card0092.png", "./img/doors1/cardBack_Doors.png");
const door93 = new Card_door("door93", "./img/doors1/card0093.png", "./img/doors1/cardBack_Doors.png");
const door94 = new Card_door("door94", "./img/doors1/card0094.png", "./img/doors1/cardBack_Doors.png");


function shuffle(array) {
  
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    };
		return array
}


function Deck_filling(deck, zone){
	console.log("идет заполнение");
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
			
			const treasure = treasures.find(tc => tc.name === id);
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
			
			const door = doors.find(dc => dc.name === id);
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
  Deck_filling(doors, zonedoor);
  UpdatebackImgDoor();
  Deck_filling(treasures, zoneTreasure);
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

		//console.log(`карт хватает`);
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
				console.log(`${num_players} игрока получили карты`);
				
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

// Получаем элемент кнопки по классу
var button = document.querySelector('.button_start_game');

// Добавляем обработчик события 'click' на кнопку
button.addEventListener('click', function() {
  // Вызываем функцию Start_game() при нажатии на кнопку
	
	const Start = {
		method: "Start",
		num: num
	};
	socket.emit("message", Start);
	//console.log(`начало игры для ${num}`);
});