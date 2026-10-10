import { createProgramFromFiles, } from "./utils/shaders.js";

import { m4, resizeCanvasToDisplaySize, } from "./twgl.full.module.js";

import { createSceneGeometries, drawGeometry, } from "./utils/geometry.js";

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

  // Dados iniciais da câmera automática
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

  // Soma o alvo para permitir que a câmera orbite pontos diferentes da origem
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

  // As uniforms abaixo serão enviadas para este programa ativo
  gl.useProgram(state.program.id);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  gl.uniform3fv(
    state.program.locations.u_lightDirection,
    state.light.direction
  );

  // Cria os VAOs das seis primitivas uma única vez
  state.geometries = createSceneGeometries(
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

    // Mudando a proporção do canvas, a projeção precisa ser refeita
    state.projection.dirty = true;
  }

  // Garante que a projeção também seja calculada no primeiro quadro
  if (state.projection.dirty) {
    updateProjection(gl);
  }

  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );

  const cameraPosition = getCameraPosition();

  // lookAt cria a transformação da câmera posicionada no mundo
  const cameraMatrix = m4.lookAt(
    cameraPosition,
    state.camera.target,
    state.camera.up
  );

  // A matriz de visualização é a inversa da matriz da câmera
  const viewMatrix = m4.inverse(cameraMatrix);

  gl.uniformMatrix4fv(
    state.program.locations.u_view,
    false,
    viewMatrix
  );


  // Galeria temporária das seis geometrias, posicionadas lado a lado

  // Disco verde no plano XZ
  drawShape(
    gl,
    "disc",
    m4.scale(
      m4.translation([-7.5, 0, 0]),
      [1.2, 1, 1.2]
    ),
    [0.2, 0.75, 0.3]
  );

  // Hemisfério inferior laranja, com a base arredondada no chão
  drawShape(
    gl,
    "lowerHemisphere",
    m4.translation([-4.5, 1, 0]),
    [1.0, 0.5, 0.1]
  );

  // Esfera amarela
  drawShape(
    gl,
    "sphere",
    m4.translation([-1.5, 1, 0]),
    [1.0, 0.85, 0.1]
  );

  // Cilindro azul, com a escala aumentando sua altura
  drawShape(
    gl,
    "cylinder",
    m4.scale(
      m4.translation([1.5, 0.8, 0]),
      [1.4, 1.6, 1.4]
    ),
    [0.1, 0.45, 0.9]
  );

  // Cone vermelho, apoiado no chão
  drawShape(
    gl,
    "cone",
    m4.scale(
      m4.translation([4.5, 0.8, 0]),
      [1.6, 1.6, 1.6]
    ),
    [0.9, 0.2, 0.15]
  );

  // Cubo roxo
  drawShape(
    gl,
    "cube",
    m4.scale(
      m4.translation([7.5, 0.75, 0]),
      [1.5, 1.5, 1.5]
    ),
    [0.55, 0.3, 0.85]
  );
}

export { initialize, update, render, };

export { state };