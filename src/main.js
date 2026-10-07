import { createProgramFromFiles, } from "./utils/shaders.js";

import { m4, primitives, resizeCanvasToDisplaySize, } from "./twgl.full.module.js";

import { createGeometry, } from "./utils/geometry.js";

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

  testSphere: {
    geometry: null,
    color: [1.0, 0.6, 0.1],
  },

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

  proximaPose() {
    state.poseIndex =
      (state.poseIndex + 1) %
      state.poses.length;

    updateSidebar(state);

    console.log(
      `Pose alterada para ${state.poses[state.poseIndex]}`
    );
  },

  alternarIluminacao() {
    state.lightingEnabled =
      !state.lightingEnabled;

    updateSidebar(state);

    console.log(
      `Iluminação: ${state.lightingEnabled}`
    );
  },

  alternarNeblina() {
    state.fogEnabled =
      !state.fogEnabled;

    updateSidebar(state);

    console.log(
      `Neblina: ${state.fogEnabled}`
    );
  },

  alternarSom() {
    state.soundEnabled =
      !state.soundEnabled;

    updateSidebar(state);

    console.log(
      `Som: ${state.soundEnabled}`
    );
  },

  avancarParaNoite() {
    state.timeOfDay = 20;

    updateSidebar(state);

    console.log(
      `Hora alterada para ${state.timeOfDay}`
    );
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

  // Esfera temporária usada para validar câmera, projeção e iluminação
  const sphereArrays = primitives.createSphereVertices(
    2,
    32,
    16
  );

  state.testSphere.geometry = createGeometry(
    gl,
    state.program.locations,
    sphereArrays
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

  gl.bindVertexArray(state.testSphere.geometry.vao);

  // A esfera permanece na origem, portanto sua model é a identidade
  const modelMatrix = m4.identity();

  gl.uniformMatrix4fv(
    state.program.locations.u_model,
    false,
    modelMatrix
  );

  gl.uniform3fv(
    state.program.locations.u_color,
    state.testSphere.color
  );

  gl.drawElements(
    gl.TRIANGLES,
    state.testSphere.geometry.indexCount,
    gl.UNSIGNED_SHORT,
    0
  );

  gl.bindVertexArray(null);
}

export { initialize, update, render, };

export { state };