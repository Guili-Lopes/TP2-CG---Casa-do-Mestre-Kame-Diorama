import { m4, } from "../twgl.full.module.js";

import { terrainConfig, } from "./terrain.js";

// Desenha as partes principais do diorama com seus materiais
function drawWorld(gl, drawShape) {
  // Hemisfério inferior com acabamento polido
  drawShape(
    gl,
    "lowerHemisphere",
    m4.scaling([
      terrainConfig.domeRadius,
      terrainConfig.hemisphereDepth,
      terrainConfig.domeRadius,
    ]),
    [1.0, 0.5, 0.1],
    "glossy"
  );

  // Terreno fosco
  drawShape(
    gl,
    "terrain",
    m4.identity(),
    [0.3, 0.75, 0.25],
    "matte"
  );

  // Água provisória com acabamento polido
  drawShape(
    gl,
    "disc",
    m4.scale(
      m4.translation([0, terrainConfig.waterLevel, 0]),
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