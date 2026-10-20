import { m4, } from "../twgl.full.module.js";

import { loadModel, } from "../utils/obj-loader.js";

import { getGroundHeight, } from "../scene/terrain.js";

// Caminhos dos modelos do Goku
const modelPaths = {
  standingBody: "./assets/models/goku/goku_standing.obj",
  standingTail: "./assets/models/goku/goku_standing_tail.obj",

  sittingBody: "./assets/models/goku/goku_sitting.obj",
  sittingTail: "./assets/models/goku/goku_sitting_tail.obj",

  lyingBody: "./assets/models/goku/goku_lying.obj",
  lyingTail: "./assets/models/goku/goku_lying_tail.obj",
};

// Converte as cores RGB para o intervalo de 0 a 1
function rgb(r, g, b) {
  return [r / 255, g / 255, b / 255];
}

// Cores provisórias dos materiais do Goku
const gokuColors = {
  Body: rgb(52, 56, 120),
  Head: rgb(40, 40, 40),
  Power_Pole_Sheathed: rgb(150, 40, 30),
};

// Materiais de iluminação das partes do Goku
const gokuMaterials = {
  Body: "cloth",
  Head: "hair",
  Power_Pole_Sheathed: "wood",
};

// Texturas dos materiais do Goku
const gokuTextures = {
  Body: "goku",
  Head: "goku",
  Power_Pole_Sheathed: "powerPole",
};

const tailColor = rgb(120, 80, 40);

// Estado da animação do rabo
const gokuState = {
  time: 0,
  amplitude: 0.4,
  speed: 3,
  waveAmplitude: 6,
  tailLength: 50,
};

// Posições iniciais baseadas na casa, no píer e na canga
const pierRotation = Math.atan2(-3.7, 4.5);

const pierEnd = [
  -3.7 + Math.sin(pierRotation) * 3.45,
  4.5 + Math.cos(pierRotation) * 3.45,
];

const tailPivots = {
  standing: [0.33737, 30.513, -10.242],
  sitting: [-1.3561, 20.699, 10.283],
  lying: [-0.27097, -5.9149, 4.7196],
};

// Tabela de poses
const gokuPoses = [
  {
    name: "Em pé",
    body: null,
    tail: null,
    normalization: null,

    position: [1.5, 0, -0.9],
    rotationY: 0.3,

    pivot: tailPivots.standing,
    tailBaseRotation: m4.identity(),
    waveAxis: [1, 0, 0],
  },

  {
    name: "Sentado no píer",
    body: null,
    tail: null,
    normalization: null,

    position: [pierEnd[0], 0.21, pierEnd[1]],
    rotationY: pierRotation,

    pivot: tailPivots.sitting,
    tailBaseRotation: m4.identity(),
    waveAxis: [1, 0, 0],
  },

  {
    name: "Tirando cochilo",
    body: null,
    tail: null,
    normalization: null,

    position: [1.94, 0, 2.38],
    rotationY: 0,

    pivot: tailPivots.lying,
    tailBaseRotation: m4.rotationZ(Math.PI * 0.43),
    waveAxis: [1, 0, 0],
  },
];

// Normaliza cada pose utilizando a mesma escala da pose em pé
function createPoseNormalization(bounds, scale) {
  const [minX, minY, minZ] = bounds.min;
  const [maxX, , maxZ] = bounds.max;

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const translation = m4.translation([
    -centerX,
    -minY,
    -centerZ,
  ]);

  const scaling = m4.scaling([
    scale,
    scale,
    scale,
  ]);

  // S * T: centraliza e apoia o modelo antes de escalar
  return m4.multiply(scaling, translation);
}

// Carrega os seis modelos e prepara as três poses
async function loadGoku(gl, locations) {
  const modelNames = Object.keys(modelPaths);

  const loadedModels = await Promise.all(
    modelNames.map(name => loadModel(
      gl,
      locations,
      modelPaths[name]
    ))
  );

  const models = Object.fromEntries(
    modelNames.map((name, index) => [
      name,
      loadedModels[index],
    ])
  );

  // A escala é calculada somente pela altura do Goku em pé
  const standingBounds = models.standingBody.bounds;

  const standingHeight = (
    standingBounds.max[1] - standingBounds.min[1]
  );

  if (standingHeight <= 0) {
    throw new Error("Altura inválida no modelo do Goku em pé.");
  }

  const scale = 0.85 / standingHeight;

  const poseModels = [
    ["standingBody", "standingTail"],
    ["sittingBody", "sittingTail"],
    ["lyingBody", "lyingTail"],
  ];

  for (let i = 0; i < gokuPoses.length; i++) {
    const pose = gokuPoses[i];

    const [bodyName, tailName] = poseModels[i];

    pose.body = models[bodyName];
    pose.tail = models[tailName];

    // Corpo e rabo compartilham a normalização do corpo
    pose.normalization = createPoseNormalization(
      pose.body.bounds,
      scale
    );
  }

  // Em pé, os pés ficam apoiados diretamente no terreno
  gokuPoses[0].position[1] = getGroundHeight(
    gokuPoses[0].position[0],
    gokuPoses[0].position[2]
  );

  // Sentado, a altura é ajustada em relação ao tablado do píer
  gokuPoses[1].position[1] = 0.32;

  // Deitado, a altura acompanha a canga do guarda-sol
  gokuPoses[2].position[1] = (
    getGroundHeight(3.0, 2.5) + 0.145
  );

  return {
    poses: gokuPoses,
  };
}

// Atualiza a oscilação do rabo
function updateGoku(dt) {
  gokuState.time += dt;
}

// Desenha os grupos do Goku com materiais e texturas
function drawModel(
  gl,
  model,
  stack,
  drawShape,
  getColor,
  getMaterial = () => "matte",
  getTexture = () => null
) {
  for (const [material, geometry] of Object.entries(model.groups)) {
    drawShape(
      gl,
      geometry,
      stack.current(),
      getColor(material),
      getMaterial(material),
      getTexture(material)
    );
  }
}

// Desenha a pose atual, com o rabo como objeto filho
function drawGoku(gl, goku, poseIndex, stack, drawShape, setTailWave) {
  const pose = goku.poses[poseIndex];

  // Posiciona e orienta o Goku no mundo
  const modelMatrix = m4.multiply(
    m4.translation(pose.position),
    m4.rotationY(pose.rotationY)
  );

  stack.push(modelMatrix);

  // Converte os vértices para a escala comum das três poses
  stack.push(pose.normalization);

  // Corpo, rosto, cabelo e bastão com as texturas originais
  drawModel(
    gl,
    pose.body,
    stack,
    drawShape,
    material => gokuTextures[material] ? rgb(255, 255, 255) : gokuColors[material] ?? rgb(52, 56, 120),
    material => gokuMaterials[material] ?? "cloth",
    material => gokuTextures[material] ?? null
  );

  // Combina dois movimentos senoidais para o rabo
  const swingAngle = (gokuState.amplitude * Math.sin(gokuState.speed * gokuState.time) + 0.1 * Math.sin(7.3 * gokuState.time));

  const pivot = pose.pivot;

  const translation = m4.translation(pivot);

  const rotation = m4.rotationY(swingAngle);

  const inverseTranslation = m4.translation([
    -pivot[0],
    -pivot[1],
    -pivot[2],
  ]);

  // T(pivô) * Ry(oscilação) * R_base * T(-pivô)
  const tailMatrix = m4.multiply(
    m4.multiply(
      m4.multiply(
        translation,
        rotation
      ),
      pose.tailBaseRotation
    ),
    inverseTranslation
  );

  stack.push(tailMatrix);

  // Liga a onda do rabo só enquanto o rabo é desenhado
  setTailWave(gl, {
    amplitude: gokuState.waveAmplitude,
    pivot: pose.pivot,
    length: gokuState.tailLength,
    axis: pose.waveAxis,
    time: gokuState.time
  });

  // O rabo utiliza a mesma textura do corpo do Goku
  drawModel(
    gl,
    pose.tail,
    stack,
    drawShape,
    () => rgb(255, 255, 255),
    () => "hair",
    () => "goku"
  );

  //Desliga a onda
  setTailWave(gl, null);

  stack.pop();
  stack.pop();
  stack.pop();
}

export { gokuPoses, loadGoku, updateGoku, drawGoku, };