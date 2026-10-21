import { m4, v3, } from "../twgl.full.module.js";

import { terrainConfig, } from "../scene/terrain.js";

// Cria o framebuffer e a textura de profundidade do shadow map
function createShadowMap(gl, size = 2048) {
  const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

  if (size > maxSize) {
    throw new Error(
      `Shadow map de ${size}px excede o limite da GPU: ${maxSize}px.`
    );
  }

  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("Não foi possível criar a textura de sombras.");
  }

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Reserva a textura de profundidade, preenchida pela GPU
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT32F,
    size,
    size,
    0,
    gl.DEPTH_COMPONENT,
    gl.FLOAT,
    null
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    gl.NEAREST
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    gl.CLAMP_TO_EDGE
  );

  // Permite consultar a profundidade diretamente no sampler2D
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_COMPARE_MODE,
    gl.NONE
  );

  const framebuffer = gl.createFramebuffer();

  if (!framebuffer) {
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteTexture(texture);

    throw new Error("Não foi possível criar o framebuffer de sombras.");
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    texture,
    0
  );

  // Framebuffer sem cor: somente profundidade
  gl.drawBuffers([gl.NONE]);
  gl.readBuffer(gl.NONE);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.activeTexture(gl.TEXTURE0);

  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);

    throw new Error(
      `Framebuffer de sombras incompleto: 0x${status.toString(16)}`
    );
  }

  return {
    framebuffer,
    texture,
    size,
  };
}

// Calcula a projeção ortográfica e a visualização da luz
function getLightViewProjection(lightDirection) {
  // Envolve a ilha, o hemisfério e a órbita da nuvem
  const radius = Math.max(terrainConfig.domeRadius,12) + 3;

  const distance = 30;

  const center = [
    0,
    -terrainConfig.hemisphereDepth / 3,
    0,
  ];

  const direction = v3.normalize(lightDirection);

  const eye = [
    center[0] + direction[0] * distance,
    center[1] + direction[1] * distance,
    center[2] + direction[2] * distance,
  ];

  // Evita o vetor up paralelo à direção de observação
  const up = Math.abs(direction[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];

  const lightView = m4.inverse(
    m4.lookAt(eye, center, up)
  );

  const lightProjection = m4.ortho(
    -radius,
    radius,
    -radius,
    radius,
    0.1,
    distance + radius + terrainConfig.hemisphereDepth + 5
  );

  return m4.multiply(
    lightProjection,
    lightView
  );
}

export { createShadowMap, getLightViewProjection, };