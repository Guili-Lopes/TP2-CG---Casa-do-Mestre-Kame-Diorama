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


export { textureSources, loadTexture, };