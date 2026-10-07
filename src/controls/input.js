function initInput(actions) {
  const keyActions = {
    "1": () => actions.camera(1),
    "2": () => actions.camera(2),
    "3": () => actions.camera(3),

    "p": () => actions.proximaPose(),

    "l": () => actions.alternarIluminacao(),
    "n": () => actions.alternarNeblina(),
    "m": () => actions.alternarSom(),

    "t": () => actions.avancarParaNoite(),
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