import { gokuPoses, } from "./goku.js";

const MAX_PARTICLES = 300;
const EMISSION_RATE = 120;

// Pool de partículas reutilizadas durante a execução
const particles = Array.from({ length: MAX_PARTICLES }, () => ({
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  age: 0,
  life: 1,
  size: 0.15,
}));

const particleData = new Float32Array(MAX_PARTICLES * 5);

let aliveCount = 0;
let emissionAccumulator = 0;

// Inicializa uma partícula ao redor do Goku em pé
function spawnParticle() {
  if (aliveCount >= MAX_PARTICLES) {
    return;
  }

  const particle = particles[aliveCount++];
  const center = gokuPoses[0].position;

  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * 0.3;

  const dx = Math.cos(angle);
  const dz = Math.sin(angle);

  particle.position[0] = center[0] + dx * radius;
  particle.position[1] = center[1] + Math.random() * 0.85;
  particle.position[2] = center[2] + dz * radius;

  // Movimento ascendente com leve dispersão radial
  const outwardSpeed = 0.04 + Math.random() * 0.12;

  particle.velocity[0] = dx * outwardSpeed;
  particle.velocity[1] = 0.2 + Math.random() * 0.25;
  particle.velocity[2] = dz * outwardSpeed;

  particle.age = 0;
  particle.life = 0.5 + Math.random() * 0.5;
  particle.size = 0.12 + Math.random() * 0.12;
}

// Cria uma rajada de partículas ao retornar à pose em pé
function burstParticles(quantity = 60) {
  for (let i = 0; i < quantity && aliveCount < MAX_PARTICLES; i++) {
    spawnParticle();
  }
}

// Atualiza as partículas vivas e controla novos nascimentos
function updateParticles(dt, emitting) {
  // Atualiza e remove partículas mesmo quando a emissão está desligada
  let i = 0;

  while (i < aliveCount) {
    const particle = particles[i];

    particle.age += dt;

    if (particle.age >= particle.life) {
      // Troca a partícula morta com a última viva
      const lastIndex = aliveCount - 1;

      particles[i] = particles[lastIndex];
      particles[lastIndex] = particle;

      aliveCount--;
      continue;
    }

    for (let axis = 0; axis < 3; axis++) {
      particle.position[axis] += particle.velocity[axis] * dt;
    }

    i++;
  }

  // Novas partículas surgem somente na pose em pé
  if (!emitting) {
    emissionAccumulator = 0;
    return;
  }

  emissionAccumulator += EMISSION_RATE * dt;

  const births = Math.floor(emissionAccumulator);
  emissionAccumulator -= births;

  for (let j = 0; j < births && aliveCount < MAX_PARTICLES; j++) {
    spawnParticle();
  }
}

// Cria o VAO e o VBO dinâmico exclusivo das partículas
function createParticleGeometry(gl) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();

  if (!vao || !buffer) {
    throw new Error("Não foi possível criar os buffers das partículas.");
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Cinco floats por partícula: X, Y, Z, tamanho e alfa
  gl.bufferData(gl.ARRAY_BUFFER, particleData.byteLength, gl.DYNAMIC_DRAW);

  const stride = 5 * Float32Array.BYTES_PER_ELEMENT;

  // Localização 0: posição
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(0);

  // Localização 1: tamanho
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(1);

  // Localização 2: transparência
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16);
  gl.enableVertexAttribArray(2);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, buffer, };
}

// Atualiza o VBO e desenha somente as partículas vivas
function drawParticles(gl, geometry) {
  if (aliveCount === 0) {
    return;
  }

  for (let i = 0; i < aliveCount; i++) {
    const particle = particles[i];
    const offset = i * 5;

    particleData[offset] = particle.position[0];
    particleData[offset + 1] = particle.position[1];
    particleData[offset + 2] = particle.position[2];
    particleData[offset + 3] = particle.size;

    // Aparece suavemente e desaparece ao final da vida
    particleData[offset + 4] = Math.sin(Math.PI * particle.age / particle.life);
  }

  gl.bindVertexArray(geometry.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffer);

  gl.bufferSubData(
    gl.ARRAY_BUFFER,
    0,
    particleData.subarray(0, aliveCount * 5)
  );

  gl.drawArrays(gl.POINTS, 0, aliveCount);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

export { MAX_PARTICLES, updateParticles, burstParticles, createParticleGeometry, drawParticles, };