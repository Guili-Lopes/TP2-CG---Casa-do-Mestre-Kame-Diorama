import { m4, } from "../twgl.full.module.js";

import { loadImage, readImagePixels, sampleImage, } from "../utils/image-data.js";

// Estado global do vento
const windState = {
  angle: 0,
  rotationSpeed: 0.03,
  time: 0,
  gustSpeed: 1.5,
  noiseScale: 0.08,
};

let noisePixels = null;

// Carrega a textura de ruído utilizada nas rajadas
async function loadWind() {
  const image = await loadImage("./assets/textures/noise.png");

  noisePixels = readImagePixels(image);
}

// Atualiza o tempo e a direção do vento
function updateWind(dt) {
  windState.time += dt;
  windState.angle = (windState.angle + windState.rotationSpeed * dt) % (Math.PI * 2);
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

  const direction = getWindDirection();

  // Move a textura de ruído na direção do vento
  const px = x - direction[0] * windState.gustSpeed * windState.time;
  const pz = z - direction[2] * windState.gustSpeed * windState.time;

  // Converte as posições em coordenadas periódicas da textura
  const u = px * windState.noiseScale;
  const v = pz * windState.noiseScale;

  const repeatU = u - Math.floor(u);
  const repeatV = v - Math.floor(v);

  return sampleImage(noisePixels, repeatU, repeatV);
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