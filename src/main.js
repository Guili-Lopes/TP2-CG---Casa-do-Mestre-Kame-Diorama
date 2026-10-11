import { createProgramFromFiles, } from "./utils/shaders.js";

import { m4, resizeCanvasToDisplaySize, } from "./twgl.full.module.js";

import { createSceneGeometries, drawGeometry, } from "./utils/geometry.js";

import { loadImage, readImagePixels, } from "./utils/image-data.js";

import { terrainConfig, setTerrainHeightMap, getGroundHeight, createTerrainGeometry, } from "./scene/terrain.js";

import { initSidebar, updateSidebar, } from "./controls/sidebar.js";

import { initInput, } from "./controls/input.js";

const state = {
  program: {
    id: null,
    locations: {},
  },

  light: {
    direction: [1, 1, 1],
  },

  // Parâmetros usados para gerar a matriz de projeção perspectiva
  projection: {
    fovY: Math.PI / 3,
    near: 0.1,
    far: 100,
    matrix: null,
    dirty: true,
  },

  // Câmera posicionada para visualizar o diorama inteiro
  camera: {
    distance: 25,
    elevation: Math.PI / 4,
    azimuth: 0,

    target: [0, 0, 0],
    up: [0, 1, 0],
  },

  // Geometrias compartilhadas pelos objetos da cena
  geometries: null,

  activeCamera: 1,

  poseIndex: 0,

  poses: [
    "Em pé",
    "Sentado no píer",
    "Tirando cochilo",
  ],

  lightingEnabled: true,
  fogEnabled: false,
  soundEnabled: false,

  timeOfDay: 12,
};

// Posições temporárias para testar a altura do terreno
const testSpheres = [
  {
    x: 0,
    z: -2,
    radius: 0.3,
    color: [0.95, 0.2, 0.15],
  },
  {
    x: 4.6,
    z: 1.2,
    radius: 0.3,
    color: [0.95, 0.85, 0.1],
  },
  {
    x: -5.5,
    z: 0.8,
    radius: 0.3,
    color: [0.15, 0.95, 0.25],
  },
  {
    x: 6.1,
    z: 0,
    radius: 0.3,
    color: [0.9, 0.2, 0.85],
  },
];

const actions = {
  camera(camera) {
    state.activeCamera = camera;

    updateSidebar(state);

    console.log(`Câmera alterada para ${camera}`);
  },

  nextPose() {
    state.poseIndex = (state.poseIndex + 1) % state.poses.length;

    updateSidebar(state);

    console.log(`Pose alterada para ${state.poses[state.poseIndex]}`);
  },

  toggleLighting() {
    state.lightingEnabled = !state.lightingEnabled;

    updateSidebar(state);

    console.log(`Iluminação: ${state.lightingEnabled}`);
  },

  toggleFog() {
    state.fogEnabled = !state.fogEnabled;

    updateSidebar(state);

    console.log(`Neblina: ${state.fogEnabled}`);
  },

  toggleSound() {
    state.soundEnabled = !state.soundEnabled;

    updateSidebar(state);

    console.log(`Som: ${state.soundEnabled}`);
  },

  skipToNight() {
    state.timeOfDay = 20;

    updateSidebar(state);

    console.log(`Hora alterada para ${state.timeOfDay}`);
  },
};

// Recalcula a projeção sempre que a proporção do canvas mudar
function updateProjection(gl) {
  const aspect = gl.canvas.width / gl.canvas.height;

  state.projection.matrix = m4.perspective(
    state.projection.fovY,
    aspect,
    state.projection.near,
    state.projection.far
  );

  gl.uniformMatrix4fv(
    state.program.locations.u_projection,
    false,
    state.projection.matrix
  );

  state.projection.dirty = false;
}

// Converte distância, elevação e azimute em uma posição no espaço 3D
function getCameraPosition() {
  const camera = state.camera;

  const horizontalDistance = camera.distance * Math.cos(camera.elevation);

  const x = horizontalDistance * Math.sin(camera.azimuth);

  const y = camera.distance * Math.sin(camera.elevation);

  const z = horizontalDistance * Math.cos(camera.azimuth);

  return [
    camera.target[0] + x,
    camera.target[1] + y,
    camera.target[2] + z,
  ];
}

// Desenha qualquer geometria aplicando sua matriz de modelo e cor
function drawShape(gl, geometryName, modelMatrix, color) {
  const locations = state.program.locations;

  gl.uniformMatrix4fv(
    locations.u_model,
    false,
    modelMatrix
  );

  gl.uniform3fv(
    locations.u_color,
    color
  );

  drawGeometry(
    gl,
    state.geometries[geometryName]
  );
}

async function initialize(gl) {
  state.program.id = await createProgramFromFiles(
    gl,
    "./src/shaders/vertex.glsl",
    "./src/shaders/fragment.glsl"
  );

  // Localizações das uniforms e atributos usados pelos shaders
  state.program.locations = {
    u_model: gl.getUniformLocation(
      state.program.id,
      "u_model"
    ),

    u_view: gl.getUniformLocation(
      state.program.id,
      "u_view"
    ),

    u_projection: gl.getUniformLocation(
      state.program.id,
      "u_projection"
    ),

    u_color: gl.getUniformLocation(
      state.program.id,
      "u_color"
    ),

    u_lightDirection: gl.getUniformLocation(
      state.program.id,
      "u_lightDirection"
    ),

    a_coords: gl.getAttribLocation(
      state.program.id,
      "a_coords"
    ),

    a_normal: gl.getAttribLocation(
      state.program.id,
      "a_normal"
    ),

    a_texcoord: gl.getAttribLocation(
      state.program.id,
      "a_texcoord"
    ),
  };

  gl.useProgram(state.program.id);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  gl.uniform3fv(
    state.program.locations.u_lightDirection,
    state.light.direction
  );

  // Cria as seis primitivas para reutilização na cena
  state.geometries = createSceneGeometries(
    gl,
    state.program.locations
  );

  // Carrega os pixels antes de criar o terreno
  const heightMapImage = await loadImage("./assets/textures/heightmap.png");

  const heightMapPixels = readImagePixels(heightMapImage);

  setTerrainHeightMap(heightMapPixels);

  // Cria a geometria deformada do terreno uma única vez
  state.geometries.terrain = createTerrainGeometry(
    gl,
    state.program.locations
  );

  gl.clearColor(
    0.53,
    0.81,
    0.92,
    1.0
  );

  initSidebar(actions);

  initInput(actions);

  updateSidebar(state);
}

function update(dt) {

}

function render(gl) {
  // Limita a resolução interna para evitar buffers muito grandes
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

    state.projection.dirty = true;
  }

  if (state.projection.dirty) {
    updateProjection(gl);
  }

  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );

  const cameraPosition = getCameraPosition();

  const cameraMatrix = m4.lookAt(
    cameraPosition,
    state.camera.target,
    state.camera.up
  );

  const viewMatrix = m4.inverse(cameraMatrix);

  gl.uniformMatrix4fv(
    state.program.locations.u_view,
    false,
    viewMatrix
  );

  // Hemisfério laranja que fecha a parte inferior do diorama
  drawShape(
    gl,
    "lowerHemisphere",
    m4.scaling([
      terrainConfig.radius,
      terrainConfig.hemisphereDepth,
      terrainConfig.radius,
    ]),
    [1.0, 0.5, 0.1]
  );

  // Terreno com os vértices deformados pelo height map
  drawShape(
    gl,
    "terrain",
    m4.identity(),
    [0.3, 0.75, 0.25]
  );

  // Água provisória, opaca e posicionada no nível zero
  drawShape(
    gl,
    "disc",
    m4.scale(
      m4.translation([0, terrainConfig.waterLevel, 0]),
      [
        terrainConfig.radius,
        1,
        terrainConfig.radius,
      ]
    ),
    [0.05, 0.42, 0.85]
  );

  // Esferas de teste apoiadas nas diferentes alturas da ilha
  for (const sphere of testSpheres) {
    const groundHeight = getGroundHeight(
      sphere.x,
      sphere.z
    );

    const modelMatrix = m4.scale(
      m4.translation([
        sphere.x,
        groundHeight + sphere.radius,
        sphere.z,
      ]),
      [
        sphere.radius,
        sphere.radius,
        sphere.radius,
      ]
    );

    drawShape(
      gl,
      "sphere",
      modelMatrix,
      sphere.color
    );
  }
}

export { initialize, update, render, };

export { state };