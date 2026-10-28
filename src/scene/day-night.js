// Estado do relógio e da transição entre dia e noite
const dayNightState = {
  hour: 10,
  normalSpeed: 0.1,
  fastSpeed: 3,
  target: null,
  nightFactor: 0,
};

// Cores da iluminação em diferentes horários
const keyframes = [
  { hour: 0,  light: [0.10, 0.12, 0.22], ambient: [0.05, 0.06, 0.12], fog: [0.08, 0.10, 0.18] },
  { hour: 5,  light: [0.10, 0.12, 0.22], ambient: [0.05, 0.06, 0.12], fog: [0.08, 0.10, 0.18] },
  { hour: 6,  light: [0.05, 0.03, 0.03], ambient: [0.12, 0.10, 0.14], fog: [0.45, 0.38, 0.45] },
  { hour: 7,  light: [0.95, 0.55, 0.35], ambient: [0.18, 0.16, 0.20], fog: [0.62, 0.55, 0.55] },
  { hour: 9,  light: [0.85, 0.83, 0.78], ambient: [0.22, 0.24, 0.28], fog: [0.58, 0.72, 0.80] },
  { hour: 16, light: [0.85, 0.83, 0.78], ambient: [0.22, 0.24, 0.28], fog: [0.58, 0.72, 0.80] },
  { hour: 17, light: [0.95, 0.50, 0.30], ambient: [0.18, 0.13, 0.15], fog: [0.65, 0.45, 0.40] },
  { hour: 18, light: [0.05, 0.03, 0.03], ambient: [0.10, 0.08, 0.12], fog: [0.30, 0.25, 0.35] },
  { hour: 19, light: [0.10, 0.12, 0.22], ambient: [0.05, 0.06, 0.12], fog: [0.08, 0.10, 0.18] },
  { hour: 24, light: [0.10, 0.12, 0.22], ambient: [0.05, 0.06, 0.12], fog: [0.08, 0.10, 0.18] },
];

// Interpolação linear entre dois valores
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Interpolação suave entre dois horários
function smoothstep(start, end, value) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));

  return t * t * (3 - 2 * t);
}

// Interpola os quadros-chave da iluminação
function sampleKeyframes(hour) {
  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i];
    const next = keyframes[i + 1];

    if (hour < current.hour || hour > next.hour) {
      continue;
    }

    const t = (hour - current.hour) / (next.hour - current.hour);

    const interpolateColor = name => current[name].map(
      (value, index) => lerp(value, next[name][index], t)
    );

    return {
      light: interpolateColor("light"),
      ambient: interpolateColor("ambient"),
      fog: interpolateColor("fog"),
    };
  }

  return {
    light: [...keyframes[0].light],
    ambient: [...keyframes[0].ambient],
    fog: [...keyframes[0].fog],
  };
}

// Calcula a direção da luz solar ou lunar
function getSunDirection(hour) {
  const angle = (hour - 6) / 12 * Math.PI;

  let x = -Math.cos(angle);
  let y = Math.sin(angle);
  let z = 0.35;

  // Durante a noite, utiliza a direção oposta para a lua
  if (hour < 6 || hour >= 18) {
    x = -x;
    y = -y;
    z = -z;
  }

  // Evita luz muito próxima do horizonte
  y = Math.max(0.15, y);

  const length = Math.hypot(x, y, z);

  return [x / length, y / length, z / length];
}

// Calcula a transição suave entre os dois skyboxes
function getNightFactor(hour) {
  if (hour >= 17) {
    return smoothstep(17, 19, hour);
  }

  if (hour < 7) {
    return 1 - smoothstep(5, 7, hour);
  }

  return 0;
}

// Inicia a aceleração até o próximo período
function startFastForward() {
  if (dayNightState.target !== null) {
    return;
  }

  const hour = dayNightState.hour;
  const isDay = hour >= 6 && hour < 18;

  dayNightState.target = isDay ? 20 : 6;
}

// Atualiza o relógio e todos os parâmetros visuais da cena
function updateDayNight(dt, state, porchLight) {
  const time = dayNightState;
  const speed = time.target === null ? time.normalSpeed : time.fastSpeed;
  const step = speed * dt;

  if (time.target !== null) {
    // Distância até o alvo, incluindo a virada da meia-noite
    const remaining = (time.target - time.hour + 24) % 24;

    if (step >= remaining) {
      time.hour = time.target;
      time.target = null;
    } else {
      time.hour = (time.hour + step) % 24;
    }
  } else {
    time.hour = (time.hour + step) % 24;
  }

  const colors = sampleKeyframes(time.hour);

  // Atualiza a iluminação direcional e a neblina
  state.light.direction = getSunDirection(time.hour);
  state.light.color = colors.light;
  state.light.ambient = colors.ambient;
  state.fog.color = colors.fog;

  // Atualiza a intensidade da noite e a luz da varanda
  time.nightFactor = getNightFactor(time.hour);

  state.nightFactor = time.nightFactor;
  state.timeOfDay = time.hour;

  porchLight.color = [
    1.5 * time.nightFactor,
    1.125 * time.nightFactor,
    0.675 * time.nightFactor,
  ];

  porchLight.nightFactor = time.nightFactor;
}

export { dayNightState, updateDayNight, startFastForward, };