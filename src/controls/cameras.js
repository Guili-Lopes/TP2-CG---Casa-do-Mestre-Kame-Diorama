import { m4, } from "../twgl.full.module.js";

// Parâmetros da câmera automática
const camera = {
  distance: 25,
  elevation: Math.PI / 4,
  azimuth: 0,

  target: [0, 0, 0],
  up: [0, 1, 0],
};

// Parâmetros da projeção perspectiva
const projection = {
  fovY: Math.PI / 3,
  near: 0.1,
  far: 100,
  matrix: null,
  dirty: true,
};

// Marca a projeção para ser recalculada após o redimensionamento
function markProjectionDirty() {
  projection.dirty = true;
}

// Atualiza a projeção conforme a proporção do canvas
function updateProjection(gl, location) {
  if (!projection.dirty) {
    return;
  }

  const aspect = gl.canvas.width / gl.canvas.height;

  projection.matrix = m4.perspective(
    projection.fovY,
    aspect,
    projection.near,
    projection.far
  );

  gl.uniformMatrix4fv(
    location,
    false,
    projection.matrix
  );

  projection.dirty = false;
}

// Calcula a posição da câmera por distância, elevação e azimute
function getCameraPosition() {
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

// Devolve a matriz de visualização da câmera
function getViewMatrix() {
  const cameraMatrix = m4.lookAt(
    getCameraPosition(),
    camera.target,
    camera.up
  );

  return m4.inverse(cameraMatrix);
}

export {
  camera,
  projection,
  markProjectionDirty,
  updateProjection,
  getViewMatrix,
};