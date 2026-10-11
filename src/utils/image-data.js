// Carrega uma imagem e informa o caminho caso ocorra um erro
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error(`Erro ao carregar imagem: "${url}"`));
    };

    image.src = url;
  });
}

// Lê os pixels da imagem utilizando um canvas 2D em memória
function readImagePixels(image) {
  const canvas = document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível criar o contexto 2D.");
  }

  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  return {
    width: canvas.width,
    height: canvas.height,
    data: imageData.data,
  };
}

// Amostra o canal vermelho com interpolação bilinear
function sampleImage(pixels, u, v) {
  const { width, height, data, } = pixels;

  const x = Math.max(0, Math.min(1, u)) * (width - 1);
  const y = Math.max(0, Math.min(1, v)) * (height - 1);

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);

  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const tx = x - x0;
  const ty = y - y0;

  // Cada pixel possui quatro canais: R, G, B e A
  function getPixel(px, py) {
    const index = (py * width + px) * 4;

    return data[index] / 255;
  }

  const top = (
    getPixel(x0, y0) * (1 - tx) +
    getPixel(x1, y0) * tx
  );

  const bottom = (
    getPixel(x0, y1) * (1 - tx) +
    getPixel(x1, y1) * tx
  );

  return top * (1 - ty) + bottom * ty;
}

export { loadImage, readImagePixels, sampleImage, };