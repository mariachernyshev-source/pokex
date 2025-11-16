// 1. Находим холст и получаем "кисть" (контекст)
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');

// 2. Загружаем изображение карты
const mapImage = new Image();
mapImage.src = 'images/map.jpg';

const pokemonImages = {
  pikachu: new Image(),
  charmander: new Image(),
  squirtle: new Image()
};

pokemonImages.pikachu.src = 'images/icons/pikachu-icon.png';
pokemonImages.charmander.src = 'images/icons/charmander2-icon.webp';
pokemonImages.squirtle.src = 'images/skwirtl-icon.png';

// Параметры камеры (как мы смотрим на карту)
let scale = 1;        // масштаб (1 = обычный размер)
let offsetX = 0;      // сдвиг по горизонтали
let offsetY = 0;      // сдвиг по вертикали

// Ограничения по зуму
const MIN_SCALE = 0.4;
const MAX_SCALE = 4;

// Когда картинка карты загрузится — нарисуем её
mapImage.onload = function () {
  loadState();   // сначала загрузим сохранённые данные
  drawScene();   // потом нарисуем карту с учётом масштаба/покемонов
};

// Функция drawScene, которая рисует карту и всё, что на ней
function drawScene() {
  // Чистим холст
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Сохраняем состояние "кисти"
  ctx.save();

  // Применяем масштаб и сдвиг
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Рисуем карту в точке (0, 0)
  ctx.drawImage(mapImage, 0, 0);

   // Рисуем покемонов в тех местах, где они "видимы"
  spots.forEach(spot => {
    if (!spot.visible) return;

    const img = pokemonImages[spot.pokemon];
    if (!img.complete) return; // картинка ещё не загрузилась

    const size = 64; // размер иконки
    const half = size / 2;

    ctx.drawImage(img, spot.x - half, spot.y - half, size, size);
  });

  // Возвращаемся к обычному состоянию
  ctx.restore();
}

// Переводит координаты мыши в координаты карты
function screenToMap(x, y) {
  const rect = canvas.getBoundingClientRect();
  const screenX = x - rect.left;
  const screenY = y - rect.top;

  // Обратное преобразование translate + scale
  const mapX = (screenX - offsetX) / scale;
  const mapY = (screenY - offsetY) / scale;

  return { x: mapX, y: mapY };
}

// --- Перетаскивание карты мышкой ---
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousedown', (event) => {
  isDragging = true;
  canvas.style.cursor = 'grabbing';
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
});

canvas.addEventListener('mousemove', (event) => {
  if (!isDragging) return;

  const dx = event.clientX - lastMouseX;
  const dy = event.clientY - lastMouseY;

  offsetX += dx;
  offsetY += dy;

  lastMouseX = event.clientX;
  lastMouseY = event.clientY;

  drawScene();
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'grab';
  // --- Клик по карте ---
canvas.addEventListener('click', (event) => {
  // Если сейчас тащим карту — не обрабатывать как клик по месту
  if (isDragging) return;

  const mapPoint = screenToMap(event.clientX, event.clientY);

  // Ищем, попали ли мы в какое‑нибудь "место"
  let changed = false;

  spots.forEach(spot => {
    const dx = mapPoint.x - spot.x;
    const dy = mapPoint.y - spot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= spot.radius) {
      // Кликнули по этому месту — переключаем видимость покемона
      spot.visible = !spot.visible;
      changed = true;
    }
  });

  if (changed) {
    drawScene();
    saveState();
  }
});
  saveState(); // будем сохранять положение
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  canvas.style.cursor = 'grab';
});

// --- Зум колесиком мыши ---
canvas.addEventListener('wheel', (event) => {
  event.preventDefault(); // отменяем стандартную прокрутку страницы

  const zoomIntensity = 0.1;
  let newScale = scale;

  if (event.deltaY < 0) {
    // колесо крутят вверх — увеличиваем
    newScale += zoomIntensity;
  } else {
    // вниз — уменьшаем
    newScale -= zoomIntensity;
  }

  // Ограничиваем зум
  if (newScale < MIN_SCALE) newScale = MIN_SCALE;
  if (newScale > MAX_SCALE) newScale = MAX_SCALE;

  // Чтобы зум был "вокруг мышки", поправим сдвиг
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const zoomFactor = newScale / scale;

  offsetX = mouseX - (mouseX - offsetX) * zoomFactor;
  offsetY = mouseY - (mouseY - offsetY) * zoomFactor;

  scale = newScale;
  // --- "Места" на карте и покемоны ---
// Координаты в системе карты (как будто карта нарисована от (0,0))
const spots = [
  {
    id: 'hill',
    x: 400,
    y: 300,
    radius: 40,
    pokemon: 'pikachu',
    visible: false
  },
  {
    id: 'rock',
    x: 700,
    y: 450,
    radius: 40,
    pokemon: 'charmander',
    visible: false
  },
  {
    id: 'pond',
    x: 250,
    y: 600,
    radius: 50,
    pokemon: 'squirtle',
    visible: false
  }
];
  drawScene();
  saveState();
}, { passive: false });

// --- Сохранение и загрузка состояния карты ---

function saveState() {
  const state = {
    scale: scale,
    offsetX: offsetX,
    offsetY: offsetY,
    spots: spots.map(spot => ({
      id: spot.id,
      visible: spot.visible
    }))
  };

  localStorage.setItem('pokemonMapState', JSON.stringify(state));
}

function loadState() {
  const stateText = localStorage.getItem('pokemonMapState');
  if (!stateText) return;

  try {
    const state = JSON.parse(stateText);

    if (typeof state.scale === 'number') scale = state.scale;
    if (typeof state.offsetX === 'number') offsetX = state.offsetX;
    if (typeof state.offsetY === 'number') offsetY = state.offsetY;

    if (Array.isArray(state.spots)) {
      state.spots.forEach(savedSpot => {
        const spot = spots.find(s => s.id === savedSpot.id);
        if (spot) {
          spot.visible = !!savedSpot.visible;
        }
      });
    }
  } catch (e) {
    console.warn('Не удалось прочитать состояние карты:', e);
  }
}