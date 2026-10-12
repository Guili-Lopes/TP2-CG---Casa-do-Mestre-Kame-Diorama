import { m4, } from "../twgl.full.module.js";

const cloudState = {
  angle: 0,
  speed: 0.3,
  orbitRadius: 12,
  height: 4,
  time: 0,
};

const cloudColor = [
  255 / 255,
  210 / 255,
  62 / 255,
];

// Atualiza a posição orbital e a flutuação da nuvem
function updateCloud(dt) {
  cloudState.angle = (
    cloudState.angle + cloudState.speed * dt
  ) % (Math.PI * 2);

  cloudState.time += dt;
}

// Nuvem voadora composta por esferas achatadas
function drawCloud(gl, stack, drawShape) {
  const fluctuation = 0.2 * Math.sin(cloudState.time * 2);

  stack.push(
    m4.rotationY(cloudState.angle)
  );

  stack.push(
    m4.translation([
      cloudState.orbitRadius,
      cloudState.height + fluctuation,
      0,
    ])
  );

  stack.push(
    m4.rotationZ(
      0.1 * Math.sin(cloudState.time)
    )
  );

  const parts = [
    { position: [0, 0, 0], scale: [1.1, 0.38, 0.65] },
    { position: [-0.65, 0.12, 0], scale: [0.62, 0.36, 0.57] },
    { position: [0.65, 0.08, 0], scale: [0.68, 0.36, 0.56] },
    { position: [-0.25, 0.18, -0.4], scale: [0.56, 0.3, 0.44] },
    { position: [0.3, 0.2, 0.4], scale: [0.59, 0.31, 0.48] },
    { position: [-0.9, -0.06, 0.2], scale: [0.42, 0.23, 0.4] },
    { position: [0.95, -0.05, -0.15], scale: [0.43, 0.24, 0.38] },
  ];

  for (const part of parts) {
    stack.push(
      m4.scale(
        m4.translation(part.position),
        part.scale
      )
    );

    drawShape(
      gl,
      "sphere",
      stack.current(),
      cloudColor
    );

    stack.pop();
  }

  stack.pop();
  stack.pop();
  stack.pop();
}

export { updateCloud, drawCloud, };