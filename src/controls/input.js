// Estado da entrada de teclado e mouse
const input = {
  keysDown: new Set(),
  mouseDelta: { x: 0, y: 0 },
  wheelDelta: 0,
  dragging: false,
};

// Registra as ações e os controles contínuos
function initInput(runAction, canvas) {
  const keyActions = {
    "1": () => runAction("camera", 1),
    "2": () => runAction("camera", 2),
    "3": () => runAction("camera", 3),

    "p": () => runAction("nextPose"),

    "l": () => runAction("toggleLighting"),
    "n": () => runAction("toggleFog"),
    "m": () => runAction("toggleSound"),

    "t": () => runAction("fastForwardTime"),
  };

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    // Mantém o registro das teclas pressionadas
    input.keysDown.add(key);

    // Evita repetir ações ao segurar uma tecla
    if (event.repeat) {
      return;
    }

    const action = keyActions[key];

    if (action) {
      action();
    }
  });

  window.addEventListener("keyup", (event) => {
    input.keysDown.delete(event.key.toLowerCase());
  });

  // Evita movimento contínuo ao trocar de janela
  window.addEventListener("blur", () => {
    input.keysDown.clear();

    input.dragging = false;
    input.mouseDelta.x = 0;
    input.mouseDelta.y = 0;
    input.wheelDelta = 0;
  });

  // Inicia o arrasto apenas com o botão esquerdo sobre o canvas
  canvas.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
      input.dragging = true;
    }
  });

  // Acumula o deslocamento mesmo quando o cursor sai do canvas
  window.addEventListener("mousemove", (event) => {
    if (!input.dragging) {
      return;
    }

    input.mouseDelta.x += event.movementX;
    input.mouseDelta.y += event.movementY;
  });

  window.addEventListener("mouseup", (event) => {
    if (event.button === 0) {
      input.dragging = false;
    }
  });

  // Registra o scroll somente sobre a cena
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();

    input.wheelDelta += event.deltaY;
  }, { passive: false });
}

// Devolve a entrada acumulada e zera os movimentos do mouse
function consumeInput() {
  const currentInput = {
    keysDown: input.keysDown,

    mouseDelta: {
      x: input.mouseDelta.x,
      y: input.mouseDelta.y,
    },

    wheelDelta: input.wheelDelta,
  };

  input.mouseDelta.x = 0;
  input.mouseDelta.y = 0;
  input.wheelDelta = 0;

  return currentInput;
}

export { input, initInput, consumeInput, };