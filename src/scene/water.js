import { m4, } from "../twgl.full.module.js";

import { terrainConfig, } from "./terrain.js";

// Configurações e animação da água
const waterState = {
  time: 0,
  alpha: 0.5,

  // [amplitude, número de onda, direção X, direção Z]
  wave1: [0.04, 1.2, 1.0, 0.3],
  wave2: [0.025, 2.3, -0.4, 1.0],

  // Velocidade angular de cada onda
  speeds: [1.3, 1.9],
};

// Atualiza o movimento da água
function updateWater(dt) {
  waterState.time += dt;
}

// Desenha a água separadamente dos objetos opacos
function drawWater(gl, drawShape, setWater) {
  const modelMatrix = m4.scale(
    m4.translation([0, terrainConfig.waterLevel, 0]),
    [terrainConfig.domeRadius, 1, terrainConfig.domeRadius]
  );

  setWater(gl, waterState);

  try {
    drawShape(
      gl,
      "disc",
      modelMatrix,
      [0.6, 0.8, 0.9],
      "water",
      "water"
    );
  } finally {
    setWater(gl, null);
  }
}

export { waterState, updateWater, drawWater, };