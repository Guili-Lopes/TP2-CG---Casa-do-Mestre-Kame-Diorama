import { setupWebGL } from "./utils/shaders.js";

import { initialize, update, render, } from "./main.js";

const gl = setupWebGL("#canvas", {alpha: false});

await initialize(gl);

let previousTime = 0;

function mainLoop(currentTime) {
  const deltaTime = (currentTime - previousTime) / 1000;

  previousTime = currentTime;

  update(deltaTime);

  render(gl);

  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);