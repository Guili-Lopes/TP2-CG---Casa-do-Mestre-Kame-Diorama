import { m4, } from "../twgl.full.module.js";

import { terrainConfig, } from "./terrain.js";

// Desenha o hemisfério e o terreno
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
}

export { drawWorld, };