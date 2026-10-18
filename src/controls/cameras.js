import { m4, v3, } from "../twgl.full.module.js";

// Câmera 1: automática
const camera = {
  distance: 25,
  elevation: Math.PI / 4,
  azimuth: 0,

  target: [0, 0, 0],
  up: [0, 1, 0],

  rotationSpeed: 0.15,
  minDistance: 10,
  maxDistance: 40,
};

// Câmera 2: orbital controlada pelo mouse
const orbitalCamera = {
  distance: 20,
  elevation: Math.PI / 4,
  azimuth: 0,

  target: [0, 0, 0],
  up: [0, 1, 0],

  sensitivity: 0.005,
  minDistance: 5,
  maxDistance: 40,

  minElevation: Math.PI / 36,
  maxElevation: Math.PI * 17 / 36,
};

// Câmera 3: navegação livre
const freeCamera = {
  position: [0, 8, 25],

  yaw: Math.PI,
  pitch: -0.3,

  up: [0, 1, 0],

  speed: 5,
  sensitivity: 0.003,

  minPitch: -Math.PI * 17 / 36,
  maxPitch: Math.PI * 17 / 36,
};

// Parâmetros da projeção perspectiva
const projection = {
  fovY: Math.PI / 3,
  near: 0.1,
  far: 100,

  matrix: null,
  dirty: true,
};

// Limita um valor entre dois extremos
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Marca a projeção para atualização após o redimensionamento
function markProjectionDirty() {
  projection.dirty = true;
}

// Atualiza a matriz de projeção
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

// Calcula a posição de uma câmera orbital por coordenadas esféricas
function getCameraPosition(orbitCamera = camera) {
  const horizontalDistance = (
    orbitCamera.distance * Math.cos(orbitCamera.elevation)
  );

  const x = horizontalDistance * Math.sin(orbitCamera.azimuth);
  const y = orbitCamera.distance * Math.sin(orbitCamera.elevation);
  const z = horizontalDistance * Math.cos(orbitCamera.azimuth);

  return [
    orbitCamera.target[0] + x,
    orbitCamera.target[1] + y,
    orbitCamera.target[2] + z,
  ];
}

// Calcula a direção frontal da câmera livre
function getForwardVector() {
  const yaw = freeCamera.yaw;
  const pitch = freeCamera.pitch;

  return [
    Math.cos(pitch) * Math.sin(yaw),
    Math.sin(pitch),
    Math.cos(pitch) * Math.cos(yaw),
  ];
}

// Atualiza a câmera automática
function updateAutomaticCamera(dt, input) {
  camera.azimuth = (camera.azimuth + camera.rotationSpeed * dt) % (Math.PI * 2);

  // Zoom proporcional à distância atual
  if (input.wheelDelta !== 0) {
    const zoomFactor = Math.max(
      0.1,
      1 + input.wheelDelta * 0.001
    );

    camera.distance = clamp(
      camera.distance * zoomFactor,
      camera.minDistance,
      camera.maxDistance
    );
  }
}

// Atualiza a câmera orbital com o mouse
function updateOrbitalCamera(input) {
  orbitalCamera.azimuth -= (input.mouseDelta.x * orbitalCamera.sensitivity);

  orbitalCamera.elevation = clamp(
    orbitalCamera.elevation + input.mouseDelta.y * orbitalCamera.sensitivity,
    orbitalCamera.minElevation,
    orbitalCamera.maxElevation
  );

  // Permite aproximar e afastar também na câmera orbital
  if (input.wheelDelta !== 0) {
    const zoomFactor = Math.max(
      0.1,
      1 + input.wheelDelta * 0.001
    );

    orbitalCamera.distance = clamp(
      orbitalCamera.distance * zoomFactor,
      orbitalCamera.minDistance,
      orbitalCamera.maxDistance
    );
  }
}

// Atualiza a direção e a posição da câmera livre
function updateFreeCamera(dt, input) {
  freeCamera.yaw -= (input.mouseDelta.x * freeCamera.sensitivity);

  freeCamera.pitch = clamp(
    freeCamera.pitch - input.mouseDelta.y * freeCamera.sensitivity,
    freeCamera.minPitch,
    freeCamera.maxPitch
  );

  const forward = getForwardVector();

  // Vetor perpendicular à frente e ao eixo vertical
  const right = v3.normalize(
    v3.cross(forward, freeCamera.up)
  );

  const movement = [0, 0, 0];

  // Movimento contínuo enquanto as teclas estiverem pressionadas
  if (input.keysDown.has("w")) {
    for (let i = 0; i < 3; i++) {
      movement[i] += forward[i];
    }
  }

  if (input.keysDown.has("s")) {
    for (let i = 0; i < 3; i++) {
      movement[i] -= forward[i];
    }
  }

  if (input.keysDown.has("d")) {
    for (let i = 0; i < 3; i++) {
      movement[i] += right[i];
    }
  }

  if (input.keysDown.has("a")) {
    for (let i = 0; i < 3; i++) {
      movement[i] -= right[i];
    }
  }

  const length = Math.hypot(...movement);

  // Normaliza o deslocamento para não acelerar nas diagonais
  if (length > 0) {
    for (let i = 0; i < 3; i++) {
      freeCamera.position[i] += (movement[i] / length * freeCamera.speed * dt);
    }
  }
}

// Atualiza somente a câmera selecionada
function updateCameras(dt, activeCamera, input) {
  if (activeCamera === 1) {
    updateAutomaticCamera(dt, input);

  } else if (activeCamera === 2) {
    updateOrbitalCamera(input);

  } else if (activeCamera === 3) {
    updateFreeCamera(dt, input);
  }
}

// Transfere a posição e a orientação ao entrar na câmera livre
function transitionToCamera(previousCamera, nextCamera) {
  if (nextCamera !== 3 || previousCamera === 3) {
    return;
  }

  const source = previousCamera === 2 ? orbitalCamera : camera;

  const position = getCameraPosition(source);

  // A direção inicial aponta para o alvo da câmera anterior
  const direction = v3.normalize([
    source.target[0] - position[0],
    source.target[1] - position[1],
    source.target[2] - position[2],
  ]);

  freeCamera.position = [...position];

  freeCamera.yaw = Math.atan2(
    direction[0],
    direction[2]
  );

  freeCamera.pitch = clamp(
    Math.asin(clamp(direction[1], -1, 1)),
    freeCamera.minPitch,
    freeCamera.maxPitch
  );
}

// Devolve a matriz de visualização da câmera ativa
function getViewMatrix(activeCamera = 1) {
  let position;
  let target;
  let up;

  if (activeCamera === 3) {
    position = freeCamera.position;

    const forward = getForwardVector();

    target = [
      position[0] + forward[0],
      position[1] + forward[1],
      position[2] + forward[2],
    ];

    up = freeCamera.up;

  } else {
    const orbitCamera = activeCamera === 2 ? orbitalCamera : camera;

    position = getCameraPosition(orbitCamera);
    target = orbitCamera.target;
    up = orbitCamera.up;
  }

  const cameraMatrix = m4.lookAt(
    position,
    target,
    up
  );

  return m4.inverse(cameraMatrix);
}

export {
  camera,
  orbitalCamera,
  freeCamera,
  projection,
  markProjectionDirty,
  updateProjection,
  getCameraPosition,
  updateCameras,
  transitionToCamera,
  getViewMatrix,
};