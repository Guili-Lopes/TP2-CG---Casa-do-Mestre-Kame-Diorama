import { m4, } from "../twgl.full.module.js";

import { terrainConfig, } from "./terrain.js";

// Desenha as três partes principais do diorama
function drawWorld(gl, drawShape) {
  // Hemisfério inferior
  drawShape(
    gl,
    "lowerHemisphere",
    m4.scaling([
      terrainConfig.domeRadius,
      terrainConfig.hemisphereDepth,
      terrainConfig.domeRadius,
    ]),
    [1.0, 0.5, 0.1]
  );

  // Terreno deformado pelo height map
  drawShape(
    gl,
    "terrain",
    m4.identity(),
    [0.3, 0.75, 0.25]
  );

  // Água provisória
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
    [0.05, 0.42, 0.85]
  );
}

export { drawWorld, };