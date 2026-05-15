document.querySelector('.show-text').addEventListener('click', function(event) {
  event.preventDefault();
  event.target.previousElementSibling.click();
});


gallery = document.getElementById("gallery");
images = gallery.querySelectorAll(".gallery-hide_item");

let currentImageIndex = 0;

images.forEach((image, index) => {
  image.addEventListener("click", () => {
    currentImageIndex = index;
    showImage();
  });
});


function showImage() {
  // Проверяем наличие открытого модального окна и закрываем его, если есть
  const modall = document.querySelector(".modal");
  if (modall) {
    modall.remove();
  }

  // Создаем новое модальное окно
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  const modalImage = document.createElement("img");
  modalImage.src = images[currentImageIndex].src;
  modalImage.classList.add("modal-zoom-img");
  modalContent.appendChild(modalImage);

  // Создаем кнопки для навигации по изображениям
  const prevButton = document.createElement("prev-button");
  prevButton.id = "prev-button";
  prevButton.innerHTML = '<img src="/img/svg/стрела 2.svg">';
  
  const nextButton = document.createElement("next-button");
  nextButton.id = "next-button";
  nextButton.innerHTML = '<img src="/img/svg/стрела 1.svg">';

  // Добавляем обработчики клика для кнопок
  prevButton.addEventListener("click", () => {
    currentImageIndex--;
    if (currentImageIndex < 0) {
      currentImageIndex = images.length - 1;
    }
    modalImage.src = images[currentImageIndex].src;
  });

  nextButton.addEventListener("click", () => {
    currentImageIndex++;
    if (currentImageIndex >= images.length) {
      currentImageIndex = 0;
    }
    modalImage.src = images[currentImageIndex].src;
  });

  // Создаем модальное окно
  const modal = document.createElement("div");
  modal.classList.add("modal", "site-zoom-modal");
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