
  const caughtCounter = document.getElementById('caught-counter');
  const resetButton = document.getElementById('reset-button');
  const cards = document.querySelectorAll('.card');

  // --- ФУНКЦИИ (наши "рецепты") ---

  // Функция 1: Обновляет число на счётчике
  function updateCounter() {
    const caughtCount = document.querySelectorAll('.card.caught').length;
    caughtCounter.textContent = caughtCount;
  }

  // Функция 2: Сохраняет ID пойманных героев в localStorage
  function saveState() {
    const caughtIds = []; // Создаём пустой список
    document.querySelectorAll('.card.caught').forEach(card => {
      caughtIds.push(card.id); // Добавляем ID каждой в список
    });
    // Превращаем список в строку и сохраняем в localStorage
    localStorage.setItem('caughtPokemon', JSON.stringify(caughtIds));
  }

  // Функция 3: Загружает ID из localStorage и применяет стили
  function loadState() {
    // Достаём строку и превращаем её обратно в список.
    const caughtIds = JSON.parse(localStorage.getItem('caughtPokemon')) || [];
    caughtIds.forEach(id => {
      const card = document.getElementById(id);
      if (card) {
        card.classList.add('caught');
      }
    });
  }

  // --- ЛОГИКА (используем наши "рецепты") ---

  // Добавляем обработчики на все карточки
  cards.forEach(card => {
    const button = card.querySelector('.catch');
    button.addEventListener('click', () => {
      card.classList.toggle('caught');
      updateCounter(); // Обновляем счётчик
      saveState();     // Сохраняем состояние
    });
  });

  // Добавляем обработчик на кнопку сброса
  resetButton.addEventListener('click', () => {
    cards.forEach(card => {
      card.classList.remove('caught');
    });
    updateCounter(); // Обновляем счётчик
    saveState();     // Сохраняем (пустой список)
  });

  // --- ИНИЦИАЛИЗАЦИЯ (что делаем при загрузке страницы) ---
  loadState();     // Загружаем состояние
  updateCounter(); // Обновляем счётчик5
