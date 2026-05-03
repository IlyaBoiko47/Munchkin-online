
let currentCardIndex = 0;

export function UpdateZones() {
  const zones = document.querySelectorAll(".cards-zone");
  
  zones.forEach((zone) => {
    const cards = zone.querySelectorAll(".card");
  
    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        currentCardIndex = index;
        showCard(cards);
      });
    });
  });
}

UpdateZones();


function showCard(cards) {
  // Проверяем наличие открытого модального окна и закрываем его, если есть
  const modall = document.querySelector(".modal");
  if (modall) {
    modall.remove();
  }

  // Создаем новое модальное окно
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  const modalImage = document.createElement("img");
  modalImage.src = cards[currentCardIndex].querySelector(".card-item").src;
  modalImage.style.width = "551px";
  modalImage.style.height = "858px";
  modalImage.style.display = "block";
  modalImage.style.margin = "auto";
  modalContent.appendChild(modalImage);

  // Создаем кнопки для навигации по карточкам
  const prevButton = document.createElement("prev-button");
  prevButton.id = "prev-button";
  prevButton.innerHTML = '<img src="./img/svg/стрела 2.svg">';
  
  const nextButton = document.createElement("next-button");
  nextButton.id = "next-button";
  nextButton.innerHTML = '<img src="./img/svg/стрела 1.svg">';

  // Добавляем обработчики клика для кнопок
  prevButton.addEventListener("click", () => {
    currentCardIndex--;
    if (currentCardIndex < 0) {
      currentCardIndex = cards.length - 1;
    }
    modalImage.src = cards[currentCardIndex].querySelector(".card-item").src;
  });

  nextButton.addEventListener("click", () => {
    currentCardIndex++;
    if (currentCardIndex >= cards.length) {
      currentCardIndex = 0;
    }
    modalImage.src = cards[currentCardIndex].querySelector(".card-item").src;
  });

  // Создаем модальное окно
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.appendChild(modalContent);
  modal.appendChild(prevButton);
  modal.appendChild(nextButton);
  document.body.appendChild(modal);

  // Показываем модальное окно
  modal.style.display = "flex";

  // Добавляем обработчик клика по модальному окну для закрытия его
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
  // Скрываем кнопки при закрытии модального окна
  modal.addEventListener("mouseleave", () => {
    prevButton.style.display = "none";
    nextButton.style.display = "none";
  });

  // Отображаем кнопки при наведении на модальное окно
  modal.addEventListener("mouseenter", () => {
    prevButton.style.display = "block";
    nextButton.style.display = "block";
  });
}