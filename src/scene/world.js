import { m4, } from "../twgl.full.module.js";

import { terrainConfig, } from "./terrain.js";

// Desenha o hemisfério, o terreno e a água
function drawWorld(gl, drawShape) {
  // Hemisfério com textura da Esfera do Dragão
  drawShape(
    gl,
    "lowerHemisphere",
    m4.scaling([
      terrainConfig.domeRadius,
      terrainConfig.hemisphereDepth,
      terrainConfig.domeRadius,
    ]),
    [1, 1, 1],
    "dragonBall",
    "dome"
  );

  // Terreno com textura de areia e grama
  drawShape(
    gl,
    "terrain",
    m4.identity(),
    [1, 1, 1],
    "matte",
    "island"
  );

  // Água provisória, ainda sem textura
  drawShape(
    gl,
    "disc",
    m4.scale(
      m4.translation([
        0,
        terrainConfig.waterLevel,
        0,
      ]),
      [
        terrainConfig.domeRadius,
        1,
        terrainConfig.domeRadius,
      ]
    ),
    [0.05, 0.42, 0.85],
    "glossy"
  );
}

export { drawWorld, };