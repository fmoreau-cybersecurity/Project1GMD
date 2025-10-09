const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const confettis = [];

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function createConfetti() {
  return {
    x: random(0, canvas.width),
    y: random(-canvas.height, 0),
    size: random(5, 10),
    color: `hsl(${random(0, 360)}, 100%, 50%)`,
    speed: random(2, 5),
    angle: random(0, Math.PI * 2),
    spin: random(-0.05, 0.05)
  };
}

// Générer 200 confettis
for (let i = 0; i < 200; i++) {
  confettis.push(createConfetti());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confettis.forEach(c => {
    c.y += c.speed;
    c.angle += c.spin;

    if (c.y > canvas.height) {
      c.y = -10;
      c.x = random(0, canvas.width);
    }

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
    ctx.restore();
  });

  requestAnimationFrame(animate);
}

animate();

// Adapter si on redimensionne la fenêtre
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
