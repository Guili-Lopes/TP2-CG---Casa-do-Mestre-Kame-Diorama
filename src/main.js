import { createProgramFromFiles, } from "./utils/shaders.js";
import { getLocations, } from "./utils/program.js";
import { textureSources, daySkyboxUrls, loadTexture, loadCubemap, } from "./utils/texture.js";
import { createShadowMap, getLightViewProjection, } from "./utils/shadow-map.js";
import { resizeCanvasToDisplaySize, } from "./twgl.full.module.js";
import { createSceneGeometries, drawGeometry, } from "./utils/geometry.js";
import { MatrixStack, } from "./utils/matrix-stack.js";

import { materials, } from "./scene/materials.js";
import { loadTerrain, } from "./scene/terrain.js";
import { porchLight, loadScenery, updateScenery, drawScenery, drawHouseGlass, } from "./scene/scenery.js";
import { gokuPoses, loadGoku, updateGoku, drawGoku, } from "./scene/goku.js";
import { drawWorld, } from "./scene/world.js";
import { updateCloud, drawCloud, } from "./scene/cloud.js";
import { updateWater, drawWater, } from "./scene/water.js";

import { markProjectionDirty, getProjectionMatrix, updateCameras, getViewMatrix, getEyePosition, } from "./controls/cameras.js";

import { createActionRunner, } from "./controls/actions.js";
import { initSidebar, updateSidebar, } from "./controls/sidebar.js";
import { initInput, consumeInput, } from "./controls/input.js";

const matrixStack = new MatrixStack();

// Controla quando o desenho atual corresponde à água
let activeWater = null;

const mainProgram = {
  id: null,
  locations: {},
};

const state = {
  mainProgram,
  program: mainProgram,

  shadowProgram: {
    id: null,
    locations: {},
  },

  skyboxProgram: {
    id: null,
    locations: {},
  },

  shadowMap: null,
  skyboxCubemap: null,

  light: {
    direction: [0.4, 1.0, 0.3],
    color: [0.85, 0.83, 0.78],
    ambient: [0.22, 0.24, 0.28],
    pointAttenuation: [1.0, 0.7, 1.8],
  },

  pointLights: [porchLight],

  fog: {
    color: [0.58, 0.72, 0.80],
    density: 0.02,
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
function drawShape(gl, geometry, modelMatrix, color, material = "matte", texture = null) {
  const geometryData = typeof geometry === "string" ? state.geometries[geometry] : geometry;

  if (!geometryData) {
    throw new Error(`Geometria não encontrada: ${geometry}`);
  }

  const locations = state.program.locations;

  gl.uniformMatrix4fv(
    locations.u_model,
    false,
    modelMatrix
  );

  // Na passada da sombra, desenha apenas a geometria
  if (state.program === state.shadowProgram) {
    drawGeometry(gl, geometryData);
    return;
  }

  const surface = materials[material] ?? materials.matte;

  // A água tem alfa próprio; os demais objetos usam o alfa do material
  gl.uniform1i(
    locations.u_isWater, 
    activeWater ? 1 : 0
  );

  gl.uniform1f(
    locations.u_alpha,
     activeWater?.alpha ?? surface.alpha ?? 1.0
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

  // Textura difusa na unidade zero
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

// Aplica a animação do rabo nos programas normal e de sombra
function setTailWave(gl, wave) {
  const locations = state.program.locations;

  if (!wave) {
    gl.uniform1f(
      locations.u_tailWave,
       0.0
    );
    return;
  }

  gl.uniform1f(
    locations.u_tailWave,
    wave.amplitude
  );

  gl.uniform3fv(
    locations.u_tailPivot,
    wave.pivot
  );

  gl.uniform1f(
    locations.u_tailLength,
    wave.length
  );

  gl.uniform3fv(
    locations.u_waveAxis,
    wave.axis
  );

  gl.uniform1f(
    locations.u_time,
    wave.time
  );
}

// Liga ou desliga os parâmetros específicos da água
function setWater(gl, water = null) {
  activeWater = water;

  const locations = state.mainProgram.locations;

  gl.uniform1i(locations.u_isWater, water ? 1 : 0);
  gl.uniform1f(locations.u_alpha, water?.alpha ?? 1.0);

  if (!water) {
    return;
  }

  gl.uniform1f(locations.u_time, water.time);
  gl.uniform4fv(locations.u_waterWave1, water.wave1);
  gl.uniform4fv(locations.u_waterWave2, water.wave2);
  gl.uniform2fv(locations.u_waterSpeeds, water.speeds);
}

// Desenha os objetos opacos da cena
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


// Inicializa os três programas, os modelos e as texturas
async function initialize(gl) {
  const mainProgram = state.mainProgram;

  // Programa principal: Phong, materiais, texturas e sombras
  mainProgram.id = await createProgramFromFiles(
    gl,
    "./src/shaders/vertex.glsl",
    "./src/shaders/fragment.glsl"
  );

  // Programa de profundidade para o shadow map
  state.shadowProgram.id = await createProgramFromFiles(
    gl,
    "./src/shaders/shadow-vertex.glsl",
    "./src/shaders/shadow-fragment.glsl"
  );

  // Programa exclusivo do skybox
  state.skyboxProgram.id = await createProgramFromFiles(
    gl,
    "./src/shaders/skybox-vertex.glsl",
    "./src/shaders/skybox-fragment.glsl"
  );

  // Localizações compartilhadas pelos programas principal e de sombra
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
    "u_fogEnabled",
    "u_fogColor",
    "u_fogDensity",
    "u_pointLightCount",
    "u_pointLightPositions[0]",
    "u_pointLightColors[0]",
    "u_pointLightAttenuation",
    "u_isWater",
    "u_alpha",
    "u_waterWave1",
    "u_waterWave2",
    "u_waterSpeeds",
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

 state.skyboxProgram.locations = getLocations(
    gl,
    state.skyboxProgram.id,
    ["u_view", "u_projection", "u_skybox", "u_fogEnabled", "u_fogColor"],
    ["a_coords"]
  );

  // Configura o programa principal
  gl.useProgram(mainProgram.id);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Unidade zero: texturas dos objetos
  gl.uniform1i(
    mainProgram.locations.u_texture,
    0
  );

  // Unidade um: shadow map
  gl.uniform1i(
    mainProgram.locations.u_shadowMap,
    1
  );

  // Configura o cubemap na unidade dois
  gl.useProgram(state.skyboxProgram.id);

  gl.uniform1i(
    state.skyboxProgram.locations.u_skybox,
    2
  );

  // Restaura o programa principal para criar as geometrias
  gl.useProgram(mainProgram.id);

  const locations = mainProgram.locations;

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

  // Carrega as texturas 2D dos objetos
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

  // Carrega o skybox diurno
  state.skyboxCubemap = await loadCubemap(
    gl,
    daySkyboxUrls
  );

  // Cria o framebuffer de profundidade
  state.shadowMap = createShadowMap(gl, 2048);

  gl.clearColor(0.53, 0.81, 0.92, 1.0);

  const runAction = createActionRunner(state);

  initSidebar(runAction);
  initInput(runAction, gl.canvas);
  updateSidebar(state);
}

// Atualiza as câmeras e os objetos animados
function update(dt) {
  updateCameras(
    dt,
    state.activeCamera,
    consumeInput()
  );

  updateCloud(dt);
  updateScenery(dt);
  updateGoku(dt);
  updateWater(dt);
}

// Primeira passada: grava a profundidade vista pela luz
function renderShadowPass(gl, lightViewProjection) {
  const shadowMap = state.shadowMap;

  // Desliga a leitura da textura que receberá a profundidade
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

  state.program = state.shadowProgram;

  gl.useProgram(state.shadowProgram.id);

  gl.uniformMatrix4fv(
    state.shadowProgram.locations.u_lightViewProjection,
    false,
    lightViewProjection
  );

  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  try {
    // O céu não entra na passada da sombra
    drawScene(gl);
  } finally {
    gl.disable(gl.POLYGON_OFFSET_FILL);
    state.program = state.mainProgram;
  }
}

// Desenha o cubemap atrás dos objetos opacos
function drawSkybox(gl, viewMatrix, projectionMatrix) {
  const skyboxProgram = state.skyboxProgram;
  const locations = skyboxProgram.locations;

  gl.useProgram(skyboxProgram.id);

  // O vertex shader remove a translação da visualização
  gl.uniformMatrix4fv(
    locations.u_view,
    false,
    viewMatrix
  );

  gl.uniformMatrix4fv(
    locations.u_projection,
    false,
    projectionMatrix
  );

  // Aplica a mesma cor da neblina ao horizonte do céu
  gl.uniform1i(
    locations.u_fogEnabled,
    state.fogEnabled ? 1 : 0
  );
  
  gl.uniform3fv(
    locations.u_fogColor, 
    state.fog.color
  );

  // Cubemap na unidade de textura dois
  gl.activeTexture(gl.TEXTURE2);

  gl.bindTexture(
    gl.TEXTURE_CUBE_MAP,
    state.skyboxCubemap
  );

  // Permite desenhar no fundo, cuja profundidade é 1
  gl.depthFunc(gl.LEQUAL);

  // A câmera está dentro do cubo
  gl.cullFace(gl.FRONT);

  // Impede o céu de alterar a profundidade já desenhada
  gl.depthMask(false);

  try {
    drawGeometry(
      gl,
      state.geometries.cube
    );
  } finally {
    // Restaura as configurações para os demais desenhos
    gl.depthMask(true);
    gl.cullFace(gl.BACK);
    gl.depthFunc(gl.LESS);
  }
}

// Envia até oito fontes de luz pontuais ao shader
function uploadPointLights(gl, locations) {
  const maxLights = 8;
  const activeLights = state.pointLights.slice(0, maxLights);

  const positions = new Float32Array(activeLights.length * 3);
  const colors = new Float32Array(activeLights.length * 3);

  for (let i = 0; i < activeLights.length; i++) {
    const light = activeLights[i];

    positions.set(light.position, i * 3);
    colors.set(light.color, i * 3);
  }

  gl.uniform1i(locations.u_pointLightCount, activeLights.length);

  gl.uniform3fv(
    locations.u_pointLightAttenuation,
    state.light.pointAttenuation
  );

  if (activeLights.length > 0) {
    gl.uniform3fv(locations["u_pointLightPositions[0]"], positions);
    gl.uniform3fv(locations["u_pointLightColors[0]"], colors);
  }
}

// Segunda passada: desenha a cena e depois o céu
function renderMainPass(gl, lightViewProjection) {
  const mainProgram = state.mainProgram;

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

  state.program = mainProgram;

  gl.useProgram(mainProgram.id);

  const locations = mainProgram.locations;

  // Matrizes compartilhadas pela cena e pelo skybox
  const projectionMatrix = getProjectionMatrix(gl);
  const viewMatrix = getViewMatrix(state.activeCamera);

  gl.uniformMatrix4fv(
    locations.u_projection,
    false,
    projectionMatrix
  );

  gl.uniformMatrix4fv(
    locations.u_view,
    false,
    viewMatrix
  );

  gl.uniform3fv(
    locations.u_cameraPosition,
    getEyePosition(state.activeCamera)
  );

  // Parâmetros da iluminação direcional
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

  // Configura a neblina na cena principal
  gl.uniform1i(
    locations.u_fogEnabled, 
    state.fogEnabled ? 1 : 0
  );

  gl.uniform3fv(
    locations.u_fogColor,
    state.fog.color
  );

  // Envia as luzes pontuais da cena
  uploadPointLights(gl, locations);

  gl.uniform1f(
    locations.u_fogDensity, 
    state.fog.density
  );

  // Projeção da luz utilizada no shadow mapping
  gl.uniformMatrix4fv(
    locations.u_lightViewProjection,
    false,
    lightViewProjection
  );

  // Shadow map na unidade um
  gl.activeTexture(gl.TEXTURE1);

  gl.bindTexture(
    gl.TEXTURE_2D,
    state.shadowMap.texture
  );

  // Primeiro desenha os objetos opacos
  drawScene(gl);

  // Depois desenha o céu somente nos pixels do fundo
  drawSkybox(
    gl,
    viewMatrix,
    projectionMatrix
  );

  // Restaura o programa principal para desenhar a água
  state.program = mainProgram;
  gl.useProgram(mainProgram.id);

  // Habilita a mistura de transparência
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // A água testa a profundidade, mas não escreve nela
  gl.depthMask(false);

  try {
    // Água com ondas, textura animada e transparência
    drawWater(gl, drawShape, setWater);

    // Vidros transparentes da Kame House
    drawHouseGlass(gl, state.scenery, drawShape);
  } finally {
    // Restaura o estado padrão do WebGL
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
}


// Renderização com sombra, objetos e skybox
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

  // A matriz da luz é compartilhada pelas duas passadas
  const lightViewProjection = getLightViewProjection(
    state.light.direction
  );

  // Passada 1: profundidade vista pela luz
  renderShadowPass(
    gl,
    lightViewProjection
  );

  // Passada 2: cena vista pela câmera, seguida do céu
  renderMainPass(
    gl,
    lightViewProjection
  );
}

export { initialize, update, render, state, };