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

export { createGeometry, };