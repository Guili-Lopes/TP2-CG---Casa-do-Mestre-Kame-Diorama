import { m4, } from "../twgl.full.module.js";

import { loadModel, } from "../utils/obj-loader.js";
import { getGroundHeight, } from "./terrain.js";
import { playEffect, } from "./audio.js";

const ballCenter = [-0.4, 4.7];
const ballRadius = 0.12;

// Cores baseadas nos materiais do modelo OBJ
const shenlongColors = {
  antlers: [0.608, 0.396, 0.000],
  belly: [0.902, 0.902, 0.565],
  red: [0.902, 0.145, 0.247],
  body: [0.192, 0.541, 0.173],
  claws: [0.08, 0.08, 0.08],
  teeth: [0.902, 0.902, 0.902],
  spines: [0.192, 0.325, 0.180],
};

const easterEggState = {
  phase: "hidden",
  timer: 0,
  time: 0,
  ballsAppear: 0,
  shenlongAppear: 0,
  balls: [],
  lights: [],
  shenlong: null,
  coil: null,
};

// Aproxima um valor do alvo sem ultrapassá-lo
function approach(value, target, step) {
  if (value < target) {
    return Math.min(target, value + step);
  }

  return Math.max(target, value - step);
}

// Carrega o Shenlong e prepara as sete esferas
async function loadEasterEgg(gl, locations) {
  const egg = easterEggState;

  egg.shenlong = await loadModel(
    gl,
    locations,
    "./assets/models/shenlong/shenlong.obj"
  );

  const bounds = egg.shenlong.bounds;
  const height = bounds.max[1] - bounds.min[1];

  if (height <= 0) {
    throw new Error("Altura inválida no modelo do Shenlong.");
  }

  // Parâmetros da deformação em espiral
  egg.coil = {
    turns: 1.5,
    shape: [1.0, 1.4, 0.75, 0.45],
    scale: 23.2,
    tailZ: 162.04,
    length: 193.9,
    time: 0,
  };

  egg.balls = [];
  egg.lights = [];

  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;

    const x = ballCenter[0] + Math.cos(angle) * 0.35;
    const z = ballCenter[1] + Math.sin(angle) * 0.35;
    const y = getGroundHeight(x, z) + ballRadius;

    const ball = {
      position: [x, y, z],
      baseY: y,
      rotation: angle,
      texture: `dragon-ball-${i + 1}`,
    };

    egg.balls.push(ball);

    egg.lights.push({
      position: [...ball.position],
      color: [0, 0, 0],
    });
  }

  return egg;
}

// Controla o aparecimento e o desaparecimento do easter egg
function updateEasterEgg(dt, nightFactor) {
  const egg = easterEggState;

  egg.time += dt;

  egg.coil.time = egg.time * 0.8;

  // Inicia o evento quando a noite está estabelecida
  if (egg.phase === "hidden" && nightFactor > 0.9) {
    egg.phase = "balls";
    egg.timer = 0;
  }

  // O amanhecer encerra o evento
  if (nightFactor < 0.5 && egg.phase !== "hidden") {
    egg.phase = "hidden";
    egg.timer = 0;
  }

  // Invoca o Shenlong três segundos após o surgimento das esferas
  if (egg.phase === "balls") {
    egg.timer += dt;

    if (egg.timer >= 3) {
      egg.phase = "shenlong";
      playEffect("dragonBalls");
    }
  }

  const ballsTarget = egg.phase === "hidden" ? 0 : 1;
  const shenlongTarget = egg.phase === "shenlong" ? 1 : 0;

  egg.ballsAppear = approach(egg.ballsAppear, ballsTarget, dt * 1.5);
  egg.shenlongAppear = approach(egg.shenlongAppear, shenlongTarget, dt * 0.7);

  // Anima as esferas e atualiza as sete luzes pontuais
  for (let i = 0; i < egg.balls.length; i++) {
    const ball = egg.balls[i];
    const light = egg.lights[i];

    ball.rotation += dt * 0.7;
    ball.position[1] = ball.baseY + 0.04 * Math.sin(egg.time * 2 + i);

    light.position = [...ball.position];

    const intensity = 0.8 * egg.ballsAppear;

    light.color = [
      1.0 * intensity,
      0.55 * intensity,
      0.15 * intensity,
    ];
  }
}

// Desenha as esferas e o Shenlong nos programas normal e de sombra
function drawEasterEgg(gl, drawShape, setCoil) {
  const egg = easterEggState;

  if (egg.ballsAppear > 0) {
    for (const ball of egg.balls) {
      const scale = ballRadius * egg.ballsAppear;

      // T * Ry * S
      const modelMatrix = m4.multiply(
        m4.multiply(
          m4.translation(ball.position),
          m4.rotationY(ball.rotation)
        ),
        m4.scaling([scale, scale, scale])
      );

      drawShape(
        gl,
        "sphere",
        modelMatrix,
        [1, 1, 1],
        "dragonBallSmall",
        ball.texture
      );
    }
  }

  if (egg.shenlongAppear <= 0 || !egg.shenlong) {
    return;
  }

  const centerY = getGroundHeight(ballCenter[0], ballCenter[1]) + 0.1;
  const scale = 0.04 * egg.shenlongAppear;

  // T * Ry * S
  const modelMatrix = m4.multiply(
    m4.multiply(
      m4.translation([ballCenter[0], centerY, ballCenter[1]]),
      m4.rotationY(0.35 * Math.sin(egg.time * 0.2))
    ),
    m4.scaling([scale, scale, scale])
  );

  const wasCullingEnabled = gl.isEnabled(gl.CULL_FACE);

  gl.disable(gl.CULL_FACE);

  try {
    setCoil(gl, egg.coil);

    for (const [material, geometry] of Object.entries(egg.shenlong.groups)) {
      drawShape(
        gl,
        geometry,
        modelMatrix,
        shenlongColors[material] ?? [0.3, 0.65, 0.25],
        "shenlong"
      );
    }
  } finally {
    // Evita aplicar a deformação aos outros objetos
    setCoil(gl, null);

    if (wasCullingEnabled) {
      gl.enable(gl.CULL_FACE);
    }
  }
}

export { easterEggState, loadEasterEgg, updateEasterEgg, drawEasterEgg, };