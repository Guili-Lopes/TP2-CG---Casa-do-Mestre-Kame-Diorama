import { createProgramFromFiles, } from "./utils/shaders.js";

import { m4, } from "./twgl.full.module.js";

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


async function initialize(gl) {
  state.program.id = await createProgramFromFiles(
    gl,
    "./src/shaders/vertex.glsl",
    "./src/shaders/fragment.glsl"
  );


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
  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );
}


export { initialize, update, render, };

export { state };