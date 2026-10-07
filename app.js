import { setupWebGL } from "./utils/shader.js";

import { initialize, update, render, } from "./main.js";


const canvas = document.querySelector("#canvas");

const gl = setupWebGL(canvas);

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