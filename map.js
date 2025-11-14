// Находим все значки
const markers = document.querySelectorAll('.marker');

markers.forEach(marker => {
  let offsetX = 0;
  let offsetY = 0;

  marker.addEventListener('mousedown', e => {
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    function moveHandler(e) {
      marker.style.left = (e.pageX - offsetX) + 'px';
      marker.style.top = (e.pageY - offsetY) + 'px';
    }

    function upHandler() {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    }

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  });
});
let scale = 1;
const mapContainer = document.getElementById('map-container');

document.getElementById('zoom-in').addEventListener('click', () => {
  scale += 0.1;
  mapContainer.style.transform = `scale(${scale})`;
});

document.getElementById('zoom-out').addEventListener('click', () => {
  scale -= 0.1;
  if (scale < 0.4) scale = 0.4;
  mapContainer.style.transform = `scale(${scale})`;
});
