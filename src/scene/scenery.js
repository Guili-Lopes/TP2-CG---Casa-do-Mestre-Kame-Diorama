import { m4, } from "../twgl.full.module.js";

import { loadModel, createNormalizationMatrix, } from "../utils/obj-loader.js";

import { terrainConfig, getGroundHeight, } from "../scene/terrain.js";

// Modelos utilizados pelos objetos da paisagem
const modelPaths = {
  house: "./assets/models/kame-house/house.obj",
  rooster: "./assets/models/kame-house/rooster.obj",
  palm: "./assets/models/palmeiras/palm.obj",
  rock1: "./assets/models/pedras/rock1.obj",
  rock2: "./assets/models/pedras/rock2.obj",
};

// Converte as cores RGB de 0–255 para o intervalo de 0–1
function rgb(r, g, b) {
  return [r / 255, g / 255, b / 255];
}

const houseColors = {
  rose_wood: rgb(255, 181, 216),
  Roof_Tile: rgb(230, 36, 32),
  Roof_Tile_2: rgb(230, 36, 32),
  material: rgb(201, 74, 64),
  text: rgb(201, 74, 64),
  green_dor: rgb(16, 108, 89),
  galsss: rgb(28, 62, 120),
  cement: rgb(205, 202, 195),
  white_wood: rgb(240, 236, 225),
  metal: rgb(175, 175, 175),
  Plastic: rgb(175, 175, 175),
  red: rgb(201, 74, 64),
};

// Material de iluminação associado a cada parte da casa
const houseMaterials = {
  rose_wood: "painted",
  Roof_Tile: "tile",
  Roof_Tile_2: "tile",
  material: "painted",
  text: "painted",
  green_dor: "wood",
  galsss: "glass",
  cement: "matte",
  white_wood: "wood",
  metal: "metal",
  Plastic: "metal",
  red: "painted",
};

// Estado da rotação do galo no telhado
const roosterState = {
  angle: 0,
  speed: 0.8,
};

// Pivô do galo nas coordenadas originais do modelo OBJ
const roosterPivot = [-0.0043, 0, 1.9233];

// Atualiza a rotação do galo com base no tempo
function updateScenery(dt) {
  roosterState.angle = (
    roosterState.angle + roosterState.speed * dt
  ) % (Math.PI * 2);
}

// Desenha os grupos do modelo com cores e materiais individuais
function drawModel(gl, model, stack, drawShape, getColor, getMaterial = () => "matte") {
  for (const [material, geometry] of Object.entries(model.groups)) {
    drawShape(
      gl,
      geometry,
      stack.current(),
      getColor(material),
      getMaterial(material)
    );
  }
}

// Aplica uma transformação local e um material à primitiva
function drawPart(gl, geometry, position, scale, color, stack, drawShape, material = "matte") {
  const localMatrix = m4.scale(
    m4.translation(position),
    scale
  );

  stack.push(localMatrix);

  drawShape(
    gl,
    geometry,
    stack.current(),
    color,
    material
  );

  stack.pop();
}

// Casa com materiais próprios e galo metálico hierárquico
function drawHouse(gl, instance, scenery, stack, drawShape) {
  stack.push(scenery.normalizations.house);

  drawModel(
    gl,
    scenery.models.house,
    stack,
    drawShape,
    material => houseColors[material] ?? rgb(205, 202, 195),
    material => houseMaterials[material] ?? "matte"
  );

  // Rotaciona o galo em torno do eixo da haste
  const translation = m4.translation(roosterPivot);

  const rotation = m4.rotationY(roosterState.angle);

  const inverseTranslation = m4.translation([
    -roosterPivot[0],
    -roosterPivot[1],
    -roosterPivot[2],
  ]);

  const roosterMatrix = m4.multiply(
    m4.multiply(translation, rotation),
    inverseTranslation
  );

  stack.push(roosterMatrix);

  drawModel(
    gl,
    scenery.models.rooster,
    stack,
    drawShape,
    material => houseColors[material] ?? rgb(210, 65, 35),
    () => "metal"
  );

  stack.pop();
  stack.pop();
}

// Cores associadas aos materiais da palmeira
const palmColors = {
  palmeira: rgb(89, 50, 32),
  "Material.001": rgb(27, 123, 0),
};

// Propriedades de iluminação de cada parte da palmeira
const palmMaterials = {
  palmeira: "matte",
  "Material.001": "foliage",
};

// Palmeira com tronco fosco e folhas de material vegetal
function drawPalm(gl, instance, scenery, stack, drawShape) {
  stack.push(scenery.normalizations.palm);

  drawModel(
    gl,
    scenery.models.palm,
    stack,
    drawShape,
    material => palmColors[material] ?? rgb(89, 50, 32),
    material => palmMaterials[material] ?? "matte"
  );

  stack.pop();
}

// Desenha as pedras com acabamento pouco reflexivo
function drawRock(gl, instance, scenery, stack, drawShape) {
  const modelName = instance.model;

  stack.push(scenery.normalizations[modelName]);

  drawModel(
    gl,
    scenery.models[modelName],
    stack,
    drawShape,
    () => rgb(150, 140, 125),
    () => "rock"
  );

  stack.pop();
}

// Arbusto formado por três esferas com material vegetal
function drawBush(gl, instance, scenery, stack, drawShape) {
  const parts = [
    {
      position: [0, 0.32, 0],
      scale: [0.52, 0.38, 0.45],
      color: rgb(35, 132, 27),
    },
    {
      position: [-0.3, 0.25, 0.12],
      scale: [0.38, 0.31, 0.34],
      color: rgb(49, 153, 32),
    },
    {
      position: [0.28, 0.28, -0.1],
      scale: [0.4, 0.34, 0.36],
      color: rgb(27, 109, 20),
    },
  ];

  for (const part of parts) {
    drawPart(
      gl,
      "sphere",
      part.position,
      part.scale,
      part.color,
      stack,
      drawShape,
      "foliage"
    );
  }
}

// Tufo com seis cones inclinados a partir da base
function drawGrass(gl, instance, scenery, stack, drawShape) {
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;

    const x = Math.cos(angle) * 0.075;
    const z = Math.sin(angle) * 0.075;

    const tiltX = Math.sin(angle) * 0.3;
    const tiltZ = Math.cos(angle) * 0.3;

    // A inclinação é aplicada antes de elevar o centro do cone
    let localMatrix = m4.multiply(
      m4.rotationZ(tiltZ),
      m4.rotationX(tiltX)
    );

    localMatrix = m4.multiply(
      m4.translation([x, 0, z]),
      localMatrix
    );

    stack.push(localMatrix);

    drawPart(
      gl,
      "cone",
      [0, 0.2, 0],
      [0.06, 0.4, 0.06],
      i % 2 === 0 ? rgb(50, 151, 31) : rgb(82, 177, 39),
      stack,
      drawShape,
      "foliage"
    );

    stack.pop();
  }
}

// Guarda-sol com mastro de madeira e cobertura de tecido
function drawUmbrella(gl, instance, scenery, stack, drawShape) {
  drawPart(
    gl,
    "cylinder",
    [0, 0.8, 0],
    [0.12, 1.6, 0.12],
    rgb(220, 205, 163),
    stack,
    drawShape,
    "wood"
  );

  drawPart(
    gl,
    "cone",
    [0, 1.68, 0],
    [2.0, 0.4, 2.0],
    rgb(235, 58, 43),
    stack,
    drawShape,
    "cloth"
  );

  // A canga herda a posição e a rotação do guarda-sol
  stack.push(
    m4.multiply(
      m4.translation([-1.05, 0.13, 0.2]),
      m4.rotationY(0.35)
    )
  );

  drawPart(
    gl,
    "cube",
    [0, 0, 0],
    [0.9, 0.03, 1.8],
    rgb(250, 211, 94),
    stack,
    drawShape,
    "cloth"
  );

  stack.pop();
}

// Píer com tábuas e estacas de madeira
function drawPier(gl, instance, scenery, stack, drawShape) {
  const groundHeight = getGroundHeight(instance.x, instance.z);

  const deckHeight = terrainConfig.waterLevel + 0.35;

  stack.push(
    m4.translation([
      0,
      deckHeight - groundHeight,
      0,
    ])
  );

  for (let i = 0; i < 12; i++) {
    drawPart(
      gl,
      "cube",
      [0, 0, 0.15 + i * 0.29],
      [0.8, 0.12, 0.26],
      i % 2 === 0 ? rgb(155, 102, 57) : rgb(171, 117, 67),
      stack,
      drawShape,
      "wood"
    );
  }

  for (const z of [0.5, 2.9]) {
    for (const x of [-0.36, 0.36]) {
      drawPart(
        gl,
        "cylinder",
        [x, -0.9, z],
        [0.22, 2.0, 0.22],
        rgb(105, 68, 39),
        stack,
        drawShape,
        "wood"
      );
    }
  }

  stack.pop();
}

// Cria as instâncias e as matrizes de normalização uma única vez
function createScenery(models) {
  const normalizations = {
    house: createNormalizationMatrix(models.house.bounds, 2.6),
    palm: createNormalizationMatrix(models.palm.bounds, 3.3),
    rock1: createNormalizationMatrix(models.rock1.bounds, 1),
    rock2: createNormalizationMatrix(models.rock2.bounds, 1),
  };

  const instances = [
    { type: "house", x: -0.1, z: -2.0, rotationY: 0, scale: 1 },

    { type: "palm", x: -3.5, z: -1.8, rotationY: 0.3, scale: 1 },
    { type: "palm", x: 3.5, z: -1.8, rotationY: 2.1, scale: 0.95 },
    { type: "palm", x: -3.1, z: 3.1, rotationY: 4.3, scale: 1.05 },

    { type: "rock", model: "rock1", x: 5.8, z: 1.2, rotationY: 0.3, scale: 0.7 },
    { type: "rock", model: "rock2", x: 6.6, z: -0.5, rotationY: 1.8, scale: 0.5 },
    { type: "rock", model: "rock1", x: -5.6, z: 2.3, rotationY: 1.1, scale: 0.6 },
    { type: "rock", model: "rock2", x: -6.7, z: -1.0, rotationY: 2.7, scale: 0.45 },
    { type: "rock", model: "rock1", x: 2.6, z: 5.9, rotationY: 0.8, scale: 0.55 },
    { type: "rock", model: "rock2", x: -2.0, z: -6.8, rotationY: 3.5, scale: 0.65 },
    { type: "rock", model: "rock1", x: 7.2, z: 1.7, rotationY: 1.4, scale: 0.8 },
    { type: "rock", model: "rock2", x: -7.0, z: 2.0, rotationY: 0.5, scale: 0.7 },

    { type: "bush", x: -4.5, z: -0.2, rotationY: 0, scale: 0.9 },
    { type: "bush", x: 2.4, z: -3.6, rotationY: 0.7, scale: 1 },
    { type: "bush", x: -2.1, z: 3.9, rotationY: 1.1, scale: 0.8 },
    { type: "bush", x: 4.6, z: 1.1, rotationY: 0.3, scale: 0.85 },
    { type: "bush", x: 0.8, z: 4.5, rotationY: 2.0, scale: 0.9 },

    { type: "umbrella", x: 3.0, z: 2.5, rotationY: -0.3, scale: 1 },

    {
      type: "pier",
      x: -3.7,
      z: 4.5,
      rotationY: Math.atan2(-3.7, 4.5),
      scale: 1,
    },
  ];

  // Distribui a grama em uma espiral de posições fixas
  const grassCount = 24;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < grassCount; i++) {
    const angle = i * goldenAngle;
    const radius = 1.8 + 3.3 * Math.sqrt((i + 0.5) / grassCount);

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Reserva espaço para a casa
    if (Math.hypot(x + 0.1, z + 2) < 1.8) {
      continue;
    }

    instances.push({
      type: "grass",
      x,
      z,
      rotationY: angle,
      scale: 0.8 + (i % 4) * 0.1,
    });
  }

  return {
    models,
    normalizations,
    instances,
  };
}

// Carrega todos os modelos em paralelo e prepara suas instâncias
async function loadScenery(gl, locations) {
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

  return createScenery(models);
}

// Desenha as instâncias aproveitando as mesmas geometrias
function drawScenery(gl, scenery, stack, drawShape) {
  const drawers = {
    house: drawHouse,
    palm: drawPalm,
    rock: drawRock,
    bush: drawBush,
    grass: drawGrass,
    umbrella: drawUmbrella,
    pier: drawPier,
  };

  for (const instance of scenery.instances) {
    let y = getGroundHeight(instance.x, instance.z);

    // Algumas pedras continuam parcialmente visíveis dentro da água
    if (instance.type === "rock" && y < terrainConfig.waterLevel) {
      y = Math.max(y, terrainConfig.waterLevel - 0.25);
    }

    // Afunda discretamente os objetos pequenos nas encostas
    if (["rock", "bush", "grass"].includes(instance.type)) {
      y -= 0.06;
    }

    const translation = m4.translation([
      instance.x,
      y,
      instance.z,
    ]);

    const rotation = m4.rotationY(instance.rotationY);

    const scaling = m4.scaling([
      instance.scale,
      instance.scale,
      instance.scale,
    ]);

    const localMatrix = m4.multiply(
      m4.multiply(translation, rotation),
      scaling
    );

    stack.push(localMatrix);

    drawers[instance.type](
      gl,
      instance,
      scenery,
      stack,
      drawShape
    );

    stack.pop();
  }
}

export { loadScenery, createScenery, updateScenery, drawScenery, };