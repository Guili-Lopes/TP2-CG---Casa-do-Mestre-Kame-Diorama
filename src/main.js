import { createProgramFromFiles, } from "./utils/shaders.js";
import { getLocations, } from "./utils/program.js";
import { textureSources, loadTexture, } from "./utils/texture.js";
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
    direction: [0.4, 1.0, 0.3],
    color: [0.85, 0.83, 0.78],
    ambient: [0.22, 0.24, 0.28],
  },

  geometries: null,
  textures: null,
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

// Desenha uma geometria com cor, material e textura opcionais
function drawShape(
  gl,
  geometry,
  modelMatrix,
  color,
  material = "matte",
  texture = null
) {
  const geometryData = typeof geometry === "string"
    ? state.geometries[geometry]
    : geometry;

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

  gl.uniform1f(
    locations.u_emissive,
    surface.emissive ?? 0
  );

  // Seleciona a textura, caso o objeto possua uma
  const textureData = typeof texture === "string" ? state.textures?.[texture] : texture;

  if (texture && !textureData) {
    throw new Error(`Textura não encontrada: ${texture}`);
  }

  if (textureData) {
    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(
      gl.TEXTURE_2D,
      textureData
    );
  }

  gl.uniform1i(
    locations.u_useTexture,
    textureData ? 1 : 0
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

// Inicializa os programas, modelos, texturas e controles
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
      "u_texture",
      "u_useTexture",
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
      "u_emissive",
    ],
    ["a_coords", "a_normal", "a_texcoord"]
  );

  state.program.locations = locations;

  gl.useProgram(state.program.id);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // O sampler2D utiliza a unidade de textura zero
  gl.uniform1i(
    locations.u_texture,
    0
  );

  state.geometries = createSceneGeometries(
    gl,
    locations
  );

  state.geometries.terrain = await loadTerrain(
    gl,
    locations,
    "./assets/textures/heightmap.png"
  );

  state.scenery = await loadScenery(gl, locations);
  state.goku = await loadGoku(gl, locations);

  // Carrega todas as texturas em paralelo
  const textureEntries = await Promise.all(
    Object.entries(textureSources).map(async ([name, options]) => {
      const texture = await loadTexture(
        gl,
        options.url,
        options
      );

      return [name, texture];
    })
  );

  state.textures = Object.fromEntries(textureEntries);

  gl.clearColor(0.53, 0.81, 0.92, 1.0);

  const runAction = createActionRunner(state);

  initSidebar(runAction);
  initInput(runAction, gl.canvas);
  updateSidebar(state);
}

// Atualiza câmeras e animações
function update(dt) {
  updateCameras(
    dt,
    state.activeCamera,
    consumeInput()
  );

  updateCloud(dt);
  updateScenery(dt);
  updateGoku(dt);
}

// Desenha a cena com materiais e texturas
function render(gl) {
  const pixelRatio = Math.min(
    window.devicePixelRatio,
    2
  );

  const resized = resizeCanvasToDisplaySize(
    gl.canvas,
    pixelRatio
  );

  if (resized) {
    gl.viewport(
      0,
      0,
      gl.canvas.width,
      gl.canvas.height
    );

    markProjectionDirty();
  }

  const locations = state.program.locations;

  updateProjection(gl, locations.u_projection);

  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );

  // Envia a câmera ativa ao shader
  gl.uniformMatrix4fv(
    locations.u_view,
    false,
    getViewMatrix(state.activeCamera)
  );

  gl.uniform3fv(
    locations.u_cameraPosition,
    getEyePosition(state.activeCamera)
  );

  // Envia os parâmetros da luz direcional
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

  // Desenha o palco do diorama
  drawWorld(gl, drawShape);

  matrixStack.reset();

  // Desenha os modelos e objetos da cena
  drawScenery(
    gl,
    state.scenery,
    matrixStack,
    drawShape
  );

  // Desenha a pose atual do Goku
  drawGoku(
    gl,
    state.goku,
    state.poseIndex,
    matrixStack,
    drawShape,
    setTailWave
  );

  // Desenha a nuvem sem textura
  drawCloud(
    gl,
    matrixStack,
    drawShape
  );
}

export { initialize, update, render, state, };