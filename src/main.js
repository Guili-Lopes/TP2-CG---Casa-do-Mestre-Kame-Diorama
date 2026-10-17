import { createProgramFromFiles, } from "./utils/shaders.js";
import { getLocations, } from "./utils/program.js";
import { resizeCanvasToDisplaySize, } from "./twgl.full.module.js";
import { createSceneGeometries, drawGeometry, } from "./utils/geometry.js";
import { MatrixStack, } from "./utils/matrix-stack.js";

import { loadTerrain, } from "./scene/terrain.js";
import { loadScenery, updateScenery, drawScenery, } from "./scene/scenery.js";
import { drawWorld, } from "./scene/world.js";
import { updateCloud, drawCloud, } from "./scene/cloud.js";

import { markProjectionDirty, updateProjection, getViewMatrix, } from "./controls/cameras.js";
import { createActionRunner, } from "./controls/actions.js";
import { initSidebar, updateSidebar, } from "./controls/sidebar.js";
import { initInput, } from "./controls/input.js";

const matrixStack = new MatrixStack();

const state = {
  program: {
    id: null,
    locations: {},
  },

  light: {
    direction: [1, 1, 1],
  },

  geometries: null,
  scenery: null,

  activeCamera: 1,
  poseIndex: 0,
  poses: ["Em pé", "Sentado no píer", "Tirando cochilo"],

  lightingEnabled: true,
  fogEnabled: false,
  soundEnabled: false,
  timeOfDay: 12,
};

// Desenha uma primitiva ou uma geometria OBJ com matriz e cor próprias
function drawShape(gl, geometry, modelMatrix, color) {
  const geometryData = typeof geometry === "string"
    ? state.geometries[geometry]
    : geometry;

  if (!geometryData) {
    throw new Error(`Geometria não encontrada: ${geometry}`);
  }

  const locations = state.program.locations;

  gl.uniformMatrix4fv(locations.u_model, false, modelMatrix);
  gl.uniform3fv(locations.u_color, color);

  drawGeometry(gl, geometryData);
}

// Inicializa o programa, as geometrias e os controles
async function initialize(gl) {
  state.program.id = await createProgramFromFiles(
    gl,
    "./src/shaders/vertex.glsl",
    "./src/shaders/fragment.glsl"
  );

  const locations = getLocations(
    gl,
    state.program.id,
    ["u_model", "u_view", "u_projection", "u_color", "u_lightDirection"],
    ["a_coords", "a_normal", "a_texcoord"]
  );

  state.program.locations = locations;

  gl.useProgram(state.program.id);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  gl.uniform3fv(
    locations.u_lightDirection,
    state.light.direction
  );

  state.geometries = createSceneGeometries(gl, locations);

  state.geometries.terrain = await loadTerrain(
    gl,
    locations,
    "./assets/textures/heightmap.png"
  );

  state.scenery = await loadScenery(gl, locations);

  gl.clearColor(0.53, 0.81, 0.92, 1.0);

  const runAction = createActionRunner(state);

  initSidebar(runAction);
  initInput(runAction);
  updateSidebar(state);
}

// Atualiza as animações da cena
function update(dt) {
  updateCloud(dt);
  updateScenery(dt);
}

// Desenha o mundo, os objetos e a nuvem
function render(gl) {
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  const resized = resizeCanvasToDisplaySize(gl.canvas, pixelRatio);

  if (resized) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    markProjectionDirty();
  }

  const locations = state.program.locations;

  updateProjection(gl, locations.u_projection);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(
    locations.u_view,
    false,
    getViewMatrix()
  );

  drawWorld(gl, drawShape);

  matrixStack.reset();

  drawScenery(gl, state.scenery, matrixStack, drawShape);
  drawCloud(gl, matrixStack, drawShape);
}

export { initialize, update, render, state, };