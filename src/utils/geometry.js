import { primitives, } from "../twgl.full.module.js";

function createAttribute(gl, location, data, size) {
  if (location === -1 || !data) {
    return;
  }

  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  gl.vertexAttribPointer(
    location,
    size,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.enableVertexAttribArray(location);
}


function createGeometry(gl, locations, arrays) {
  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  createAttribute(
    gl,
    locations.a_coords,
    arrays.position,
    3
  );

  createAttribute(
    gl,
    locations.a_normal,
    arrays.normal,
    3
  );

  createAttribute(
    gl,
    locations.a_texcoord,
    arrays.texcoord,
    2
  );

  // O buffer de índices precisa ser vinculado enquanto o VAO está ativo
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(
    gl.ELEMENT_ARRAY_BUFFER,
    indexBuffer
  );

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    arrays.indices,
    gl.STATIC_DRAW
  );

  gl.bindVertexArray(null);

  return {
    vao: vao,
    indexCount: arrays.indices.length,
  };
}

// Cria as seis geometrias uma única vez para reutilização na cena
function createSceneGeometries(gl, locations) {
  const disc = primitives.createDiscVertices(
    1, 128, 64
  );

  const lowerHemisphere = primitives.createSphereVertices(
    1, 32, 16, Math.PI / 2, Math.PI
  );

  const sphere = primitives.createSphereVertices(
    1, 32, 16
  );

  const cylinder = primitives.createCylinderVertices(
    0.5, 1, 32, 1, true, true
  );

  const cone = primitives.createTruncatedConeVertices(
    0.5, 0.001, 1, 32, 1, true, true
  );

  const cube = primitives.createCubeVertices(1);

  return {
    disc: createGeometry(gl, locations, disc),
    lowerHemisphere: createGeometry(gl, locations, lowerHemisphere),
    sphere: createGeometry(gl, locations, sphere),
    cylinder: createGeometry(gl, locations, cylinder),
    cone: createGeometry(gl, locations, cone),
    cube: createGeometry(gl, locations, cube),
  };
}

// Desenha uma geometria utilizando seu VAO e buffer de índices
function drawGeometry(gl, geometry) {
  gl.bindVertexArray(geometry.vao);

  gl.drawElements(
    gl.TRIANGLES,
    geometry.indexCount,
    gl.UNSIGNED_SHORT,
    0
  );

  gl.bindVertexArray(null);
}

export { createGeometry, createSceneGeometries, drawGeometry, };