import { createProgramFromFiles, } from "./utils/shaders.js";
import { getLocations, } from "./utils/program.js";
import { resizeCanvasToDisplaySize, } from "./twgl.full.module.js";
import { createSceneGeometries, drawGeometry, } from "./utils/geometry.js";
import { MatrixStack, } from "./utils/matrix-stack.js";

import { materials, } from "./scene/materials.js";
import { loadTerrain, } from "./scene/terrain.js";
import { loadScenery, updateScenery, drawScenery, } from "./scene/scenery.js";
import { gokuPoses, loadGoku, updateGoku, drawGoku, } from "./scene/goku.js";
import { drawWorld, } from "./scene/world.js";
import { updateCloud, drawCloud, } from "./scene/cloud.js";

import { markProjectionDirty, updateProjection, updateCameras, getViewMatrix, getEyePosition, } from "./controls/cameras.js";
import { createActionRunner, } from "./controls/actions.js";
import { initSidebar, updateSidebar, } from "./controls/sidebar.js";
import { initInput, consumeInput, } from "./controls/input.js";

const matrixStack = new MatrixStack();

const state = {
  program: {
    id: null,
    locations: {},
  },

  light: {
    direction: [0.4, 1, 0.3],
    color: [1, 1, 1],
    ambient: [0.3, 0.3, 0.3],
  },

  geometries: null,
  scenery: null,
  goku: null,

  activeCamera: 1,
  poseIndex: 0,
  poses: gokuPoses,

  lightingEnabled: true,
  fogEnabled: false,
  soundEnabled: false,
  timeOfDay: 12,
};

// Desenha uma geometria usando a cor e as propriedades do material
function drawShape(gl, geometry, modelMatrix, color, material = "matte") {
  const geometryData = typeof geometry === "string" ? state.geometries[geometry] : geometry;

  if (!geometryData) {
    throw new Error(`Geometria não encontrada: ${geometry}`);
  }

  const locations = state.program.locations;

  const surface = materials[material] ?? materials.matte;

  gl.uniformMatrix4fv(
    locations.u_model,
    false,
    modelMatrix
  );

  gl.uniform3fv(
    locations.u_color,
    color
  );

  gl.uniform3f(
    locations.u_specularColor,
    surface.specular,
    surface.specular,
    surface.specular
  );

  gl.uniform1f(
    locations.u_shininess,
    surface.shininess
  );

  gl.uniform1i(
    locations.u_unlit,
    surface.unlit ? 1 : 0
  );

  drawGeometry(gl, geometryData);
}

// Controla a deformação do rabo apenas durante seu desenho
function setTailWave(gl, wave) {
  const locations = state.program.locations;

  if (!wave) {
    gl.uniform1f(locations.u_tailWave, 0.0);
    return;
  }

  gl.uniform1f(locations.u_tailWave, wave.amplitude);
  gl.uniform3fv(locations.u_tailPivot, wave.pivot);
  gl.uniform1f(locations.u_tailLength, wave.length);
  gl.uniform3fv(locations.u_waveAxis, wave.axis);
  gl.uniform1f(locations.u_time, wave.time);
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
    [
      "u_model",
      "u_view",
      "u_projection",
      "u_color",
      "u_specularColor",
      "u_shininess",
      "u_lightDirection",
      "u_lightColor",
      "u_ambientLight",
      "u_cameraPosition",
      "u_lightingEnabled",
      "u_unlit",
      "u_tailWave",
      "u_tailPivot",
      "u_tailLength",
      "u_waveAxis",
      "u_time",
    ],
    ["a_coords", "a_normal", "a_texcoord"]
  );

  state.program.locations = locations;

  gl.useProgram(state.program.id);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  state.geometries = createSceneGeometries(gl, locations);

  state.geometries.terrain = await loadTerrain(
    gl,
    locations,
    "./assets/textures/heightmap.png"
  );

  state.scenery = await loadScenery(gl, locations);
  state.goku = await loadGoku(gl, locations);

  gl.clearColor(0.53, 0.81, 0.92, 1.0);

  const runAction = createActionRunner(state);

  initSidebar(runAction);
  initInput(runAction, gl.canvas);
  updateSidebar(state);
}

// Atualiza câmeras e animações
function update(dt) {
  updateCameras(dt, state.activeCamera, consumeInput());

  updateCloud(dt);
  updateScenery(dt);
  updateGoku(dt);
}

// Desenha a cena com iluminação de Phong
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

  // Atualiza a posição e a visualização da câmera ativa
  gl.uniformMatrix4fv(
    locations.u_view,
    false,
    getViewMatrix(state.activeCamera)
  );

  gl.uniform3fv(
    locations.u_cameraPosition,
    getEyePosition(state.activeCamera)
  );

  // Atualiza a iluminação direcional a cada quadro
  gl.uniform3fv(
    locations.u_lightDirection,
    state.light.direction
  );

  gl.uniform3fv(
    locations.u_lightColor,
    state.light.color
  );

  gl.uniform3fv(
    locations.u_ambientLight,
    state.light.ambient
  );

  gl.uniform1i(
    locations.u_lightingEnabled,
    state.lightingEnabled ? 1 : 0
  );

  drawWorld(gl, drawShape);

  matrixStack.reset();

  drawScenery(gl, state.scenery, matrixStack, drawShape);

  drawGoku(
    gl,
    state.goku,
    state.poseIndex,
    matrixStack,
    drawShape,
    setTailWave
  );

  drawCloud(gl, matrixStack, drawShape);
}

export { initialize, update, render, state, };