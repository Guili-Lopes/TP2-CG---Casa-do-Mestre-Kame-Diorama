import { primitives, } from "../twgl.full.module.js";

import { createGeometry, } from "../utils/geometry.js";

import { sampleImage, } from "../utils/image-data.js";

const terrainConfig = {
  radius: 10,
  waterLevel: 0,
  minHeight: -1.0,
  maxHeight: 1.5,
  hemisphereDepth: 6,
};

let heightMap = null;

// Guarda os pixels para consultar a altura do chão posteriormente
function setTerrainHeightMap(pixels) {
  heightMap = pixels;
}

// Obtém a altura do terreno em qualquer posição XZ
function getGroundHeight(x, z) {
  if (!heightMap) {
    throw new Error("O height map do terreno ainda não foi carregado.");
  }

  const radius = terrainConfig.radius;

  if (x * x + z * z > radius * radius) {
    return terrainConfig.minHeight;
  }

  const u = (x / radius + 1) / 2;
  const v = (z / radius + 1) / 2;

  if (u < 0 || u > 1 || v < 0 || v > 1) {
    return terrainConfig.minHeight;
  }

  const value = sampleImage(heightMap, u, v);

  return ( terrainConfig.minHeight + value * (terrainConfig.maxHeight - terrainConfig.minHeight));
}

// Calcula as normais médias a partir dos triângulos do terreno
function recalculateNormals(arrays) {
  const { position, indices, } = arrays;

  const normal = new Float32Array(position.length);

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;

    const abX = position[b] - position[a];
    const abY = position[b + 1] - position[a + 1];
    const abZ = position[b + 2] - position[a + 2];

    const acX = position[c] - position[a];
    const acY = position[c + 1] - position[a + 1];
    const acZ = position[c + 2] - position[a + 2];

    // Produto vetorial (B - A) × (C - A)
    const nx = abY * acZ - abZ * acY;
    const ny = abZ * acX - abX * acZ;
    const nz = abX * acY - abY * acX;

    for (const vertex of [a, b, c]) {
      normal[vertex] += nx;
      normal[vertex + 1] += ny;
      normal[vertex + 2] += nz;
    }
  }

  // Normaliza os vetores acumulados
  for (let i = 0; i < normal.length; i += 3) {
    const length = Math.hypot(
      normal[i],
      normal[i + 1],
      normal[i + 2]
    );

    if (length > 0) {
      normal[i] /= length;
      normal[i + 1] /= length;
      normal[i + 2] /= length;
    } else {
      normal[i] = 0;
      normal[i + 1] = 1;
      normal[i + 2] = 0;
    }
  }

  arrays.normal = normal;
}

// Cria o disco deformado pelas alturas do height map
function createTerrainGeometry(gl, locations) {
  const radius = terrainConfig.radius;

  const arrays = primitives.createDiscVertices(
    radius,
    128,
    64
  );

  const { position, texcoord, } = arrays;

  for (let i = 0; i < position.length; i += 3) {
    const x = position[i];
    const z = position[i + 2];

    position[i + 1] = getGroundHeight(x, z);

    const u = (x / radius + 1) / 2;
    const v = (z / radius + 1) / 2;

    const texcoordIndex = (i / 3) * 2;

    texcoord[texcoordIndex] = u;
    texcoord[texcoordIndex + 1] = v;
  }

  recalculateNormals(arrays);

  return createGeometry(
    gl,
    locations,
    arrays
  );
}

export { terrainConfig, setTerrainHeightMap, getGroundHeight, createTerrainGeometry, };