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

// Поправленные пути: смотрим в папке `images`
pokemonImages.pikachu.src = 'images/icons/pikachu-icon.png';
pokemonImages.charmander.src = 'images/charmander2.webp';
pokemonImages.squirtle.src = 'images/skwirtl.png';

// Перерисовываем сцену, когда иконки покемонов загрузились.
Object.values(pokemonImages).forEach(img => {
  img.onload = () => {
    // если картинка загрузилась — перерисуем сцену (покемоны появятся)
    drawScene();
  };
  img.onerror = () => {
    console.warn('Не удалось загрузить иконку покемона:', img.src);
  };
});

// Предупреждение, если карта не загрузилась
mapImage.onerror = () => console.warn('Не удалось загрузить изображение карты:', mapImage.src);

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
    y: 520,
    radius: 50,
    pokemon: 'squirtle',
    visible: false
  }
];

// Параметры камеры (как мы смотрим на карту)
let scale = 1;        // масштаб (1 = обычный размер)
let offsetX = 0;      // сдвиг по горизонтали
let offsetY = 0;      // сдвиг по вертикали

// Ограничения по зуму
// Не позволяем уменьшать карту меньше её настоящего размера (1 = реальный размер)
const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Глобальные флаги отладки
// Показывать контуры мест (кружки и подписи) — удобно для теста и чтобы понять, куда кликать
const DEBUG_SHOW_SPOTS = false;
// Показывать мини-иконки в углу и логировать их — временно для диагностики, выключим после
const DEBUG_SHOW_THUMBNAILS = false;

// Когда картинка карты загрузится — нарисуем её
mapImage.onload = function () {
  // Установим размер холста равным размеру изображения карты (размер в размер)
  try {
    // некоторые браузеры/сборки могут не сразу иметь ширину/высоту, но у нас известный размер
    canvas.width = mapImage.width || 825;
    canvas.height = mapImage.height || 583;
    // также зафиксируем CSS-ширину/высоту, чтобы браузер не растягивал canvas
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  } catch (e) {
    console.warn('Не удалось задать размер холста по изображению карты:', e);
  }

  // Сначала загрузим сохранённые данные (если есть), потом нарисуем сцену
  loadState();
  // После загрузки состояния — гарантируем, что масштаб в допустимых пределах
  if (typeof scale === 'number') {
    if (scale < MIN_SCALE) scale = MIN_SCALE;
    if (scale > MAX_SCALE) scale = MAX_SCALE;
  }
  console.log('Загруженное состояние карты:', localStorage.getItem('pokemonMapState'));
  drawScene();
};

// Функция drawScene, которая рисует карту и всё, что на ней
function drawScene() {
  // Чистим холст
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Перед рисованием убедимся, что смещения в допустимых пределах
  clampOffsets();

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
    if (!img) {
      console.warn(`Иконка для ${spot.pokemon} не найдена в pokemonImages`);
      return;
    }
    if (!img.complete) {
      console.warn(`Иконка ${spot.pokemon} для места ${spot.id} ещё не загружена: ${img.src}`);
      return; // картинка ещё не загрузилась
    }

    const size = 64; // размер иконки
    const half = size / 2;

    ctx.drawImage(img, spot.x - half, spot.y - half, size, size);
  });

  // Временная отладка: нарисовать контуры мест (кружки) и подписи,
  // чтобы было видно, где именно расположены места на карте.
  if (DEBUG_SHOW_SPOTS) {
    spots.forEach(spot => {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 128, 0, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 128, 0, 0.6)';
      ctx.lineWidth = 2 / (scale || 1);
      ctx.stroke();

      // подпись id
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.font = `${14 / (scale || 1)}px sans-serif`;
      ctx.fillText(spot.id, spot.x - spot.radius, spot.y - spot.radius - 6 / (scale || 1));

      // предупреждение в консоль, если spot.visible=true, но картинка не загружена
      if (spot.visible) {
        const img = pokemonImages[spot.pokemon];
        if (!img || !img.complete) {
          console.warn(`Покемон ${spot.pokemon} для места ${spot.id} отмечен как видимый, но иконка не загружена:`, img && img.src);
        }
      }
    });
  }


// Ограничиваем смещения так, чтобы карта не «уходила» и не показывала фон за её краями.
function clampOffsets() {
  if (!mapImage || !mapImage.width || !mapImage.height) return;

  const scaledWidth = mapImage.width * scale;
  const scaledHeight = mapImage.height * scale;

  // Для оси X: когда карта больше холста — ограничиваем смещение между [canvas.width - scaledWidth, 0]
  // Когда карта меньше холста — фиксируем по левому краю (offsetX = 0)
  if (scaledWidth > canvas.width) {
    const minX = canvas.width - scaledWidth;
    if (offsetX < minX) offsetX = minX;
    if (offsetX > 0) offsetX = 0;
  } else {
    // карта уже помещается — фиксируем по левому краю
    offsetX = 0;
  }

  // Для оси Y: аналогично
  if (scaledHeight > canvas.height) {
    const minY = canvas.height - scaledHeight;
    if (offsetY < minY) offsetY = minY;
    if (offsetY > 0) offsetY = 0;
  } else {
    offsetY = 0;
  }
}
  // Возвращаемся к обычному состоянию
  ctx.restore();

  // Отладка: рисуем мини-иконки покемонов в правом верхнем углу и логируем их размеры,
  // чтобы проверить, загружены ли изображения и видны ли они на холсте.
  if (DEBUG_SHOW_THUMBNAILS) {
    const thumbSize = 32;
    let i = 0;
    Object.entries(pokemonImages).forEach(([name, img]) => {
      const x = canvas.width - (i + 1) * (thumbSize + 8);
      const y = 8;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x, y, thumbSize, thumbSize);
      } else {
        // Рисуем заглушку
        ctx.fillStyle = 'rgba(200,200,200,0.6)';
        ctx.fillRect(x, y, thumbSize, thumbSize);
        ctx.fillStyle = '#000';
        ctx.fillText(name[0], x + 8, y + 20);
      }
      if (DEBUG_SHOW_THUMBNAILS) {
        console.log(`ICON ${name}: src=${img && img.src} complete=${img && img.complete} natural=${img && img.naturalWidth}x${img && img.naturalHeight}`);
      }
      i++;
    });
  }
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
  saveState(); // сохраним положение после отпускания
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  canvas.style.cursor = 'grab';
});

// Обработчик кнопки "Показать всё" — пометить все места видимыми (для теста)
const showAllBtn = document.getElementById('show-all');
if (showAllBtn) {
  showAllBtn.addEventListener('click', () => {
    spots.forEach(s => s.visible = true);
    drawScene();
    saveState();
  });
}

// --- Клик по карте (вынесен отдельно, не внутри mouseup) ---
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
