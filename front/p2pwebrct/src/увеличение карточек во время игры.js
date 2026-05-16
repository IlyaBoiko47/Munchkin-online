import { beginDragFromZoomImage } from "./card-block.js";
import { canDragCardFromTutorialDeck } from "./game.js";

let currentCardIndex = 0;

function getTutorialZoomableCards(zone) {
	if (!window.__TUTORIAL_BOARD || !zone) {
		return null;
	}
	const zoneId = zone.id;
	if (zoneId !== "zone_doors" && zoneId !== "zone_treasure") {
		return null;
	}
	return Array.from(zone.querySelectorAll(":scope > .card")).filter((c) =>
		canDragCardFromTutorialDeck(c),
	);
}

function addCardClickListener(card) {
	card.addEventListener("click", () => {
		const zone = card.parentNode;
		const zoomCards = getTutorialZoomableCards(zone);
		if (zoomCards) {
			if (!canDragCardFromTutorialDeck(card)) {
				return;
			}
			currentCardIndex = zoomCards.indexOf(card);
			if (currentCardIndex < 0) {
				currentCardIndex = 0;
			}
			showCard(zoomCards);
			return;
		}
		currentCardIndex = Array.from(zone.querySelectorAll(".card")).indexOf(card);
		showCard(zone.querySelectorAll(".card"));
	});
}

export function UpdateZones() {
	const zones = document.querySelectorAll(".cards-zone");
	zones.forEach((zone) => {
		const cards = zone.querySelectorAll(".card");
		cards.forEach((card) => {
			if (!card.hasAttribute("data-click-listener")) {
				addCardClickListener(card);
				card.setAttribute("data-click-listener", "true");
			}
		});
	});
}

/** Закрыть только окно увеличенного просмотра карт (не трогает другие модалки). */
export function closeCardZoomModal() {
	document.querySelectorAll(".card-zoom-modal").forEach((el) => {
		if (el._escapeHandler) {
			document.removeEventListener("keydown", el._escapeHandler);
			delete el._escapeHandler;
		}
		el.remove();
	});
}

function showCard(cards) {
	closeCardZoomModal();

	const modalContent = document.createElement("div");
	modalContent.classList.add("modal-content");
	const modalImage = document.createElement("img");
	const firstItem = cards[currentCardIndex]?.querySelector(".card-item");
	modalImage.src = firstItem ? firstItem.src : "";
	modalImage.alt = "";
	modalImage.style.width = "auto";
	modalImage.style.height = "auto";
	modalImage.style.maxHeight = "90vh";
	modalImage.style.maxWidth = "90vw";
	modalImage.style.display = "block";
	modalImage.style.margin = "auto";
	modalImage.draggable = true;
	modalImage.style.cursor = "grab";
	modalContent.appendChild(modalImage);

	const prevButton = document.createElement("prev-button");
	prevButton.id = "prev-button";
	prevButton.innerHTML = '<img src="../img/svg/стрела 2.svg" alt="">';

	const nextButton = document.createElement("next-button");
	nextButton.id = "next-button";
	nextButton.innerHTML = '<img src="../img/svg/стрела 1.svg" alt="">';

	prevButton.addEventListener("click", (ev) => {
		ev.stopPropagation();
		currentCardIndex--;
		if (currentCardIndex < 0) {
			currentCardIndex = cards.length - 1;
		}
		const item = cards[currentCardIndex]?.querySelector(".card-item");
		if (item) {
			modalImage.src = item.src;
		}
	});

	nextButton.addEventListener("click", (ev) => {
		ev.stopPropagation();
		currentCardIndex++;
		if (currentCardIndex >= cards.length) {
			currentCardIndex = 0;
		}
		const item = cards[currentCardIndex]?.querySelector(".card-item");
		if (item) {
			modalImage.src = item.src;
		}
	});

	const modal = document.createElement("div");
	modal.classList.add("modal", "card-zoom-modal");
	modal.appendChild(modalContent);
	modal.appendChild(prevButton);
	modal.appendChild(nextButton);
	document.body.appendChild(modal);

	modal.style.display = "flex";

	modalImage.addEventListener("dragstart", (e) => {
		const card = cards[currentCardIndex];
		if (!card?.classList?.contains?.("card")) {
			e.preventDefault();
			return;
		}
		modalImage.style.cursor = "grabbing";
		beginDragFromZoomImage(card, e);
	});

	modalImage.addEventListener("dragend", () => {
		modalImage.style.cursor = "grab";
	});

	/* Закрытие по клику по затемнённому фону (стол под модалкой недоступен — остальные карты не двигаются) */
	modal.addEventListener("click", (event) => {
		if (event.target === modal) {
			closeCardZoomModal();
		}
	});

	const onEscapeZoom = (e) => {
		if (e.key === "Escape") {
			document.removeEventListener("keydown", onEscapeZoom);
			closeCardZoomModal();
		}
	};
	modal._escapeHandler = onEscapeZoom;
	document.addEventListener("keydown", onEscapeZoom);
}

UpdateZones();
