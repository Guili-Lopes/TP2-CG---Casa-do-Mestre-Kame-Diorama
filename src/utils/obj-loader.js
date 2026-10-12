import { m4, } from "../twgl.full.module.js";

import { createGeometry, } from "./geometry.js";

// Carrega um arquivo OBJ e devolve os dados separados por material
async function loadObj(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Erro ao carregar OBJ "${url}": ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Erro ao carregar OBJ "${url}": HTTP ${response.status}`);
  }

  const text = await response.text();

  return parseObj(text);
}

// Converte os índices do OBJ, incluindo os índices negativos
function resolveIndex(value, data) {
  if (value === undefined || value === "") {
    return null;
  }

  const index = Number(value);

  const resolvedIndex = index > 0 ? index - 1 : data.length + index;

  if (!Number.isInteger(index) || index === 0 || resolvedIndex < 0 || resolvedIndex >= data.length) {
    throw new Error(`Índice OBJ inválido: ${value}`);
  }

  return resolvedIndex;
}

// Calcula a normal de um triângulo pelo produto vetorial
function calculateNormal(a, b, c) {
  const ab = [
    b[0] - a[0],
    b[1] - a[1],
    b[2] - a[2],
  ];

  const ac = [
    c[0] - a[0],
    c[1] - a[1],
    c[2] - a[2],
  ];

  const normal = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  ];

  const length = Math.hypot(...normal);

  if (length === 0) {
    return [0, 1, 0];
  }

  return normal.map(value => value / length);
}

// Interpreta o OBJ e separa os triângulos pelo material
function parseObj(text) {
  const positions = [];
  const texcoords = [];
  const normals = [];

  const groups = Object.create(null);

  const bounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };

  let currentMaterial = "default";

  const lines = text.split(/\r?\n/);

  for (const [lineIndex, rawLine] of lines.entries()) {
    const line = rawLine.split("#")[0].trim();

    if (!line) {
      continue;
    }

    const parts = line.split(/\s+/);
    const type = parts[0];

    if (type === "v") {
      const vertex = parts.slice(1, 4).map(value => parseFloat(value));

      positions.push(vertex);

      // A caixa envolvente considera todos os vértices do modelo
      for (let axis = 0; axis < 3; axis++) {
        bounds.min[axis] = Math.min(bounds.min[axis], vertex[axis]);
        bounds.max[axis] = Math.max(bounds.max[axis], vertex[axis]);
      }

    } else if (type === "vt") {
      texcoords.push(
        parts.slice(1, 3).map(value => parseFloat(value))
      );

    } else if (type === "vn") {
      normals.push(
        parts.slice(1, 4).map(value => parseFloat(value))
      );

    } else if (type === "usemtl") {
      currentMaterial = parts.slice(1).join(" ") || "default";

    } else if (type === "f") {
      const references = parts.slice(1);

      if (references.length < 3) {
        throw new Error(`Face OBJ inválida na linha ${lineIndex + 1}`);
      }

      if (!groups[currentMaterial]) {
        groups[currentMaterial] = {
          position: [],
          normal: [],
          texcoord: [],
        };
      }

      const group = groups[currentMaterial];

      const vertices = references.map(reference => {
        const [v, vt, vn] = reference.split("/");

        const positionIndex = resolveIndex(v, positions);
        const texcoordIndex = resolveIndex(vt, texcoords);
        const normalIndex = resolveIndex(vn, normals);

        if (positionIndex === null) {
          throw new Error(`Vértice sem posição na linha ${lineIndex + 1}`);
        }

        return {
          position: positions[positionIndex],
          texcoord: texcoordIndex === null
            ? [0, 0]
            : texcoords[texcoordIndex],
          normal: normalIndex === null
            ? null
            : normals[normalIndex],
        };
      });

      // Triangula faces com três ou mais vértices
      for (let i = 1; i < vertices.length - 1; i++) {
        const triangle = [
          vertices[0],
          vertices[i],
          vertices[i + 1],
        ];

        const triangleNormal = calculateNormal(
          triangle[0].position,
          triangle[1].position,
          triangle[2].position
        );

        for (const vertex of triangle) {
          group.position.push(...vertex.position);
          group.texcoord.push(...vertex.texcoord);
          group.normal.push(...(vertex.normal ?? triangleNormal));
        }
      }
    }
  }

  if (Object.keys(groups).length === 0) {
    throw new Error("O arquivo OBJ não possui faces válidas.");
  }

  // Converte os grupos em arrays compatíveis com o createGeometry
  for (const group of Object.values(groups)) {
    group.position = new Float32Array(group.position);
    group.normal = new Float32Array(group.normal);
    group.texcoord = new Float32Array(group.texcoord);

    group.vertexCount = group.position.length / 3;
  }

  return { groups, bounds, };
}

// Cria um VAO para cada material do modelo
async function loadModel(gl, locations, url) {
  const model = await loadObj(url);

  const groups = Object.create(null);

  for (const [material, arrays] of Object.entries(model.groups)) {
    groups[material] = createGeometry(
      gl,
      locations,
      arrays
    );
  }

  return {
    groups,
    bounds: model.bounds,
  };
}

// Centraliza o modelo em XZ, apoia a base em Y=0 e ajusta sua altura
function createNormalizationMatrix(bounds, desiredHeight) {
  const [minX, minY, minZ] = bounds.min;
  const [maxX, maxY, maxZ] = bounds.max;

  const modelHeight = maxY - minY;

  if (modelHeight <= 0 || desiredHeight <= 0) {
    throw new Error("Altura inválida para normalização do modelo.");
  }

  const scale = desiredHeight / modelHeight;

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

  // S * T: primeiro translada, depois aplica a escala
  return m4.multiply(scaling, translation);
}

export { loadObj, parseObj, loadModel, createNormalizationMatrix, };