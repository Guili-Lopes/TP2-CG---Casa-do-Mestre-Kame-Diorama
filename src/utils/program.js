// Busca as localizações das uniforms e dos atributos do programa
function getLocations(gl, program, uniformNames, attributeNames) {
  const locations = {};

  for (const name of uniformNames) {
    locations[name] = gl.getUniformLocation(program, name);
  }

  for (const name of attributeNames) {
    locations[name] = gl.getAttribLocation(program, name);
  }

  return locations;
}

export { getLocations, };