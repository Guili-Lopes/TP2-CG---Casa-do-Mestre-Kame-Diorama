import { loadImage, } from "./image-data.js";

// Caminhos e configurações das texturas utilizadas na cena
const textureSources = {
  island: {
    url: "./assets/textures/island.png",
    flipY: false,
    repeat: false,
  },

  dome: {
    url: "./assets/textures/dome.png",
    flipY: false,
    repeat: true,
  },

  umbrella: {
    url: "./assets/textures/umbrella.png",
    flipY: false,
    repeat: true,
  },

  wood: {
    url: "./assets/textures/wood.png",
    flipY: false,
    repeat: true,
  },

  beachTowel: {
    url: "./assets/textures/beach-towel.png",
    flipY: false,
    repeat: false,
  },

  foliage: {
    url: "./assets/textures/foliage.png",
    flipY: false,
    repeat: true,
  },

  // Mesma imagem, mas invertida para as coordenadas dos modelos OBJ
  foliageObj: {
    url: "./assets/textures/foliage.png",
    flipY: true,
    repeat: true,
  },

  bark: {
    url: "./assets/textures/bark.png",
    flipY: true,
    repeat: true,
  },

  rock: {
    url: "./assets/models/pedras/rock.jpg",
    flipY: true,
    repeat: true,
  },

  cement: {
    url: "./assets/models/kame-house/cement.jpg",
    flipY: true,
    repeat: true,
  },

  whiteWood: {
    url: "./assets/models/kame-house/white_wood.jpg",
    flipY: true,
    repeat: true,
  },

  metal: {
    url: "./assets/models/kame-house/metal.jpg",
    flipY: true,
    repeat: true,
  },

  goku: {
    url: "./assets/models/goku/Kid_Goku.png",
    flipY: true,
    repeat: true,
  },

  powerPole: {
    url: "./assets/models/goku/Power_Pole.png",
    flipY: true,
    repeat: true,
  },

  water: {
    url: "./assets/textures/water.png",
    flipY: false,
    repeat: true,
  },

  particle: {
    url: "./assets/textures/particle.png",
    flipY: false,
    repeat: false,
  },
};


// Carrega uma imagem e cria uma textura WebGL2 com mipmaps
async function loadTexture(gl, url, options = {}) {
  const {
    flipY = false,
    repeat = false,
  } = options;

  const image = await loadImage(url);

  const texture = gl.createTexture();

  if (!texture) {
    throw new Error(`Não foi possível criar a textura: ${url}`);
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // O estado de inversão precisa ser configurado a cada carregamento
  gl.pixelStorei(
    gl.UNPACK_FLIP_Y_WEBGL,
    flipY
  );

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  // Cria versões reduzidas para objetos distantes
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    gl.LINEAR
  );

  const wrapMode = repeat
    ? gl.REPEAT
    : gl.CLAMP_TO_EDGE;

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    wrapMode
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    wrapMode
  );

  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

// Caminhos das seis faces do skybox diurno
const daySkyboxUrls = [
  "./assets/textures/skybox/day/px.png",
  "./assets/textures/skybox/day/nx.png",
  "./assets/textures/skybox/day/py.png",
  "./assets/textures/skybox/day/ny.png",
  "./assets/textures/skybox/day/pz.png",
  "./assets/textures/skybox/day/nz.png",
];

// Carrega as seis faces de um cubemap em paralelo
async function loadCubemap(gl, urls) {
  if (urls.length !== 6) {
    throw new Error("O cubemap precisa ter exatamente seis imagens.");
  }

  const images = await Promise.all(
    urls.map(url => loadImage(url))
  );

  // As faces precisam ser quadradas e possuir o mesmo tamanho
  const size = images[0].naturalWidth;

  for (const image of images) {
    if (
      image.naturalWidth !== size ||
      image.naturalHeight !== size
    ) {
      throw new Error(
        "Todas as faces do cubemap devem ser quadradas e do mesmo tamanho."
      );
    }
  }

  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("Não foi possível criar a textura do skybox.");
  }

  // Unidade 2 reservada para o cubemap
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // Cubemaps não utilizam inversão vertical
  gl.pixelStorei(
    gl.UNPACK_FLIP_Y_WEBGL,
    false
  );

  // +X, -X, +Y, -Y, +Z, -Z
  for (let i = 0; i < images.length; i++) {
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      images[i]
    );
  }

  // Gera os mipmaps do cubemap
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

  gl.texParameteri(
    gl.TEXTURE_CUBE_MAP,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );

  gl.texParameteri(
    gl.TEXTURE_CUBE_MAP,
    gl.TEXTURE_MAG_FILTER,
    gl.LINEAR
  );

  // Evita repetições nas bordas entre as faces
  for (const parameter of [
    gl.TEXTURE_WRAP_S,
    gl.TEXTURE_WRAP_T,
    gl.TEXTURE_WRAP_R,
  ]) {
    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP,
      parameter,
      gl.CLAMP_TO_EDGE
    );
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.activeTexture(gl.TEXTURE0);

  return texture;
}

export { textureSources, daySkyboxUrls, loadTexture, loadCubemap};