import { createProgramFromFiles, } from "./utils/shaders.js";
import { getLocations, } from "./utils/program.js";
import { textureSources, loadTexture, } from "./utils/texture.js";
import { createShadowMap, getLightViewProjection, } from "./utils/shadow-map.js";
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

  shadowProgram: {
    id: null,
    locations: {},
  },

  shadowMap: null,

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

// Desenha uma geometria com material e textura
function drawShape(
  gl,
  geometry,
  modelMatrix,
  color,
  material = "matte",
  texture = null
) {
  const geometryData = typeof geometry === "string" ? state.geometries[geometry] : geometry;

  if (!geometryData) {
    throw new Error(`Geometria não encontrada: ${geometry}`);
  }

  const locations = state.program.locations;

  // Esta uniform existe nos dois programas
  gl.uniformMatrix4fv(
    locations.u_model,
    false,
    modelMatrix
  );

  // Na passada da sombra, somente a geometria é necessária
  if (state.program === state.shadowProgram) {
    drawGeometry(gl, geometryData);
    return;
  }

  const surface = materials[material] ?? materials.matte;

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

  // Textura difusa na unidade zero
  const textureData = typeof texture === "string"
    ? state.textures?.[texture]
    : texture;

  if (texture && !textureData) {
    throw new Error(`Textura não encontrada: ${texture}`);
  }

  if (textureData) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureData);
  }

  gl.uniform1i(
    locations.u_useTexture,
    textureData ? 1 : 0
  );

  drawGeometry(gl, geometryData);
}

// Aplica a mesma animação do rabo nas duas passadas
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

// Desenha toda a cena, reutilizado pelos dois programas
function drawScene(gl) {
  drawWorld(gl, drawShape);

  matrixStack.reset();

  drawScenery(
    gl,
    state.scenery,
    matrixStack,
    drawShape
  );

  drawGoku(
    gl,
    state.goku,
    state.poseIndex,
    matrixStack,
    drawShape,
    setTailWave
  );

  drawCloud(
    gl,
    matrixStack,
    drawShape
  );
}

// Inicializa os programas, os modelos e o shadow map
async function initialize(gl) {
  const mainProgram = state.program;

  mainProgram.id = await createProgramFromFiles(
    gl,
    "./src/shaders/vertex.glsl",
    "./src/shaders/fragment.glsl"
  );

  state.shadowProgram.id = await createProgramFromFiles(
    gl,
    "./src/shaders/shadow-vertex.glsl",
    "./src/shaders/shadow-fragment.glsl"
  );

  // Lista compartilhada pelos dois programas
  const uniformNames = [
    "u_model",
    "u_view",
    "u_projection",
    "u_color",
    "u_texture",
    "u_useTexture",
    "u_specularColor",
    "u_shininess",
    "u_emissive",
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
    "u_shadowMap",
    "u_lightViewProjection",
  ];

  const attributeNames = [
    "a_coords",
    "a_normal",
    "a_texcoord",
  ];

  mainProgram.locations = getLocations(
    gl,
    mainProgram.id,
    uniformNames,
    attributeNames
  );

  state.shadowProgram.locations = getLocations(
    gl,
    state.shadowProgram.id,
    uniformNames,
    attributeNames
  );

  gl.useProgram(mainProgram.id);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const locations = mainProgram.locations;

  // Texturas dos objetos na unidade zero
  gl.uniform1i(
    locations.u_texture,
    0
  );

  // Shadow map na unidade um
  gl.uniform1i(
    locations.u_shadowMap,
    1
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

  // Carrega as texturas existentes em paralelo
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

  // Cria o framebuffer de profundidade
  state.shadowMap = createShadowMap(gl, 2048);

  gl.clearColor(0.53, 0.81, 0.92, 1.0);

  const runAction = createActionRunner(state);

  initSidebar(runAction);
  initInput(runAction, gl.canvas);
  updateSidebar(state);
}

// Atualiza as câmeras e as animações
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

// Primeira passada: grava as profundidades vistas pela luz
function renderShadowPass(gl, lightViewProjection) {
  const shadowMap = state.shadowMap;

  // Evita ler a mesma textura que está sendo preenchida
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, null);

  gl.bindFramebuffer(
    gl.FRAMEBUFFER,
    shadowMap.framebuffer
  );

  gl.viewport(
    0,
    0,
    shadowMap.size,
    shadowMap.size
  );

  gl.clear(gl.DEPTH_BUFFER_BIT);

  // Ativa o programa exclusivo da sombra
  state.program = state.shadowProgram;

  gl.useProgram(state.shadowProgram.id);

  gl.uniformMatrix4fv(
    state.shadowProgram.locations.u_lightViewProjection,
    false,
    lightViewProjection
  );

  // Reduz a acne causada pela precisão da profundidade
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  drawScene(gl);

  gl.disable(gl.POLYGON_OFFSET_FILL);
}

// Segunda passada: renderiza a cena com o shadow map
function renderMainPass(gl, mainProgram, lightViewProjection) {
  // Volta a desenhar no canvas
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.viewport(
    0,
    0,
    gl.canvas.width,
    gl.canvas.height
  );

  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );

  // Restaura o programa principal
  state.program = mainProgram;

  gl.useProgram(mainProgram.id);

  const locations = mainProgram.locations;

  updateProjection(gl, locations.u_projection);

  // Envia a matriz da câmera ativa
  gl.uniformMatrix4fv(
    locations.u_view,
    false,
    getViewMatrix(state.activeCamera)
  );

  gl.uniform3fv(
    locations.u_cameraPosition,
    getEyePosition(state.activeCamera)
  );

  // Envia os parâmetros da iluminação direcional
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

  // Mesma matriz usada para gerar o mapa de sombras
  gl.uniformMatrix4fv(
    locations.u_lightViewProjection,
    false,
    lightViewProjection
  );

  // Disponibiliza o shadow map na unidade de textura um
  gl.activeTexture(gl.TEXTURE1);

  gl.bindTexture(
    gl.TEXTURE_2D,
    state.shadowMap.texture
  );

  drawScene(gl);
}

// Renderização em duas passadas
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
    markProjectionDirty();
  }

  const mainProgram = state.program;

  // Atualiza a matriz da luz em cada quadro
  const lightViewProjection = getLightViewProjection(
    state.light.direction
  );

  // Passada 1: profundidade vista pela luz
  renderShadowPass(
    gl,
    lightViewProjection
  );

  // Passada 2: cena vista pela câmera
  renderMainPass(
    gl,
    mainProgram,
    lightViewProjection
  );
}

export { initialize, update, render, state, };