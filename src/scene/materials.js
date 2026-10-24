// Propriedades especulares dos materiais da cena
const materials = {
  matte: {
    specular: 0.02,
    shininess: 5,
    unlit: false,
  },

  cloth: {
    specular: 0.1,
    shininess: 8,
    unlit: false,
  },

  wood: {
    specular: 0.15,
    shininess: 12,
    unlit: false,
  },

  foliage: {
    specular: 0.15,
    shininess: 12,
    unlit: false,
  },

  painted: {
    specular: 0.2,
    shininess: 16,
    unlit: false,
  },

  tile: {
    specular: 0.35,
    shininess: 24,
    unlit: false,
  },

  rock: {
    specular: 0.1,
    shininess: 8,
    unlit: false,
  },

  hair: {
    specular: 0.3,
    shininess: 24,
    unlit: false,
  },

  metal: {
    specular: 0.7,
    shininess: 48,
    unlit: false,
  },

  glossy: {
    specular: 0.6,
    shininess: 60,
    unlit: false,
  },

  glass: {
    specular: 0.9,
    shininess: 96,
    alpha: 0.45,
    unlit: false,
  },

  cloud: {
    specular: 0.05,
    shininess: 4,
    unlit: false,
  },

  dragonBall: {
    specular: 0.6,
    shininess: 60,
    emissive: 0.35,
    unlit: false,
  },

  lamp: {
    specular: 0,
    shininess: 1,
    unlit: true,
  },

  water: {
    specular: 0.8,
    shininess: 80,
    unlit: false,
  },

  // Material sem iluminação para elementos estilizados
  none: {
    specular: 0,
    shininess: 1,
    unlit: true,
  },
};

export { materials, };