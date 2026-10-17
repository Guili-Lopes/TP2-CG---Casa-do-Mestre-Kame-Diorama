// Associa os atalhos do teclado ao disparador de ações
function initInput(runAction) {
  const keyActions = {
    "1": () => runAction("camera", 1),
    "2": () => runAction("camera", 2),
    "3": () => runAction("camera", 3),

    "p": () => runAction("nextPose"),

    "l": () => runAction("toggleLighting"),
    "n": () => runAction("toggleFog"),
    "m": () => runAction("toggleSound"),

    "t": () => runAction("skipToNight"),
  };

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    const key = event.key.toLowerCase();

    const action = keyActions[key];

    if (!action) {
      return;
    }

    action();
  });
}

export { initInput, };