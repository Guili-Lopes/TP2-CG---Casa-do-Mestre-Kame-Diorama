import { createProgramFromFiles, } from "./utils/shaders.js";

import { m4, } from "./twgl.full.module.js";


const state = {
  program: {
    id: null,
    locations: {},
  },

  light: {
    direction: [1, 1, 1],
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
}


function update(dt) {

}


function render(gl) {
  gl.clear(
    gl.COLOR_BUFFER_BIT |
    gl.DEPTH_BUFFER_BIT
  );
}


export {
  initialize,
  update,
  render,
};


export { state };