import { m4, } from "../twgl.full.module.js";

import { loadImage, readImagePixels, sampleImage, } from "../utils/image-data.js";

// Estado global do vento
const windState = {
  angle: 0,
  targetAngle: 0,
  changeTimer: 4,
  turnSpeed: 0.6,
  time: 0,
  gustSpeed: 1.5,
  noiseScale: 0.08,
  gustOffset: [0, 0],
};

let noisePixels = null;

// Carrega a textura de ruído utilizada nas rajadas
async function loadWind() {
  const image = await loadImage("./assets/textures/noise.png");

  noisePixels = readImagePixels(image);
}

// Atualiza o tempo e muda a direção do vento de tempos em tempos
function updateWind(dt) {
  windState.time += dt;

  // A cada 6 a 12 segundos, escolhe uma nova direção-alvo
  windState.changeTimer -= dt;

  if (windState.changeTimer <= 0) {
    // Vira entre 45° e 135°, para a esquerda ou para a direita
    const turn = (Math.PI / 4) + Math.random() * (Math.PI / 2);
    const side = Math.random() < 0.5 ? -1 : 1;

    windState.targetAngle = windState.angle + side * turn;
    windState.changeTimer = 6 + Math.random() * 6;
  }
  // Aproxima a direção atual da direção-alvo pelo caminho mais curto
  const difference = Math.atan2(
    Math.sin(windState.targetAngle - windState.angle),
    Math.cos(windState.targetAngle - windState.angle)
  );

  windState.angle += difference * Math.min(1, windState.turnSpeed * dt);

  const direction = getWindDirection();

  windState.gustOffset[0] += direction[0] * windState.gustSpeed * dt;
  windState.gustOffset[1] += direction[2] * windState.gustSpeed * dt;
}

// Devolve a direção normalizada do vento no plano XZ
function getWindDirection() {
  return [
    Math.cos(windState.angle),
    0,
    Math.sin(windState.angle),
  ];
}

// Calcula a intensidade da rajada em uma posição do mundo
function getGust(x, z) {
  if (!noisePixels) {
    return 0;
  }

  // Move a textura de ruído na direção do vento
  const px = x - windState.gustOffset[0];
  const pz = z - windState.gustOffset[1];

  // Converte as posições em coordenadas periódicas da textura
  const u = px * windState.noiseScale;
  const v = pz * windState.noiseScale;

  const repeatU = u - Math.floor(u);
  const repeatV = v - Math.floor(v);

  return sampleImage(noisePixels, u - Math.floor(u), v - Math.floor(v));
}

// Calcula o cisalhamento de uma planta conforme sua posição
function getWindShear(x, z, maxStrength) {
  const direction = getWindDirection();
  const gust = getGust(x, z);

  // Rajadas suaves com oscilações individuais
  const oscillation = 1 + 0.25 * Math.sin(3 * windState.time + x + z);
  const strength = maxStrength * (0.3 + 0.7 * gust) * oscillation;

  return [
    strength * direction[0],
    strength * direction[2],
  ];
}

// Matriz de cisalhamento nos eixos X e Z em função da altura Y
function shearMatrix(sx, sz) {
  const matrix = m4.identity();

  matrix[4] = sx;
  matrix[6] = sz;

  return matrix;
}

export { windState, loadWind, updateWind, getWindDirection, getGust, getWindShear, shearMatrix, };