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

  const indexed = arrays.indices !== undefined && arrays.indices !== null;

  let indexCount = 0;
  let indexType = null;

  if (indexed) {
    // Cria o IBO apenas para geometrias indexadas
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

    indexCount = arrays.indices.length;

    indexType = arrays.indices instanceof Uint32Array
      ? gl.UNSIGNED_INT
      : gl.UNSIGNED_SHORT;
  }

  gl.bindVertexArray(null);

  return {
    vao: vao,
    indexed: indexed,
    indexCount: indexCount,
    indexType: indexType,
    vertexCount: arrays.position.length / 3,
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

// Desenha geometrias indexadas e não indexadas usando o mesmo VAO
function drawGeometry(gl, geometry) {
  gl.bindVertexArray(geometry.vao);

  if (geometry.indexed) {
    gl.drawElements(
      gl.TRIANGLES,
      geometry.indexCount,
      geometry.indexType,
      0
    );
  } else {
    gl.drawArrays(
      gl.TRIANGLES,
      0,
      geometry.vertexCount
    );
  }

  gl.bindVertexArray(null);
}

export { createGeometry, createSceneGeometries, drawGeometry, };