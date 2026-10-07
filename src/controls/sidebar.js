function initSidebar(actions) {
  const sidebar = document.querySelector(".sidebar");

  sidebar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === "camera") {
      const camera = Number(button.dataset.camera);

      actions.camera(camera);
    } else if (actions[action]) {
      actions[action]();
    }

    button.blur();
  });
}

function formatarHora(timeOfDay) {
  const normalizedTime = ((timeOfDay % 24) + 24) % 24;

  let hours = Math.floor(normalizedTime);

  let minutes = Math.round((normalizedTime - hours) * 60);

  if (minutes === 60) {
    minutes = 0;
    hours = (hours + 1) % 24;
  }

  return (`${String(hours).padStart(2, "0")}:` + `${String(minutes).padStart(2, "0")}`);
}

function updateSidebar(state) {
  const cameraButtons = document.querySelectorAll('button[data-action="camera"]');

  cameraButtons.forEach((button) => {
    const camera = Number(button.dataset.camera);

    button.setAttribute(
      "aria-pressed",
      camera === state.activeCamera
    );
  });

  const lightingButton = document.querySelector('button[data-action="alternarIluminacao"]');

  const fogButton = document.querySelector('button[data-action="alternarNeblina"]');

  const soundButton = document.querySelector('button[data-action="alternarSom"]');


  if (lightingButton) {
    lightingButton.setAttribute(
      "aria-pressed",
      state.lightingEnabled
    );
  }

  if (fogButton) {
    fogButton.setAttribute(
      "aria-pressed",
      state.fogEnabled
    );
  }

  if (soundButton) {
    soundButton.setAttribute(
      "aria-pressed",
      state.soundEnabled
    );
  }

  const poseAtual = document.querySelector("#pose-atual");

  const horaAtual = document.querySelector("#hora-atual");

  if (poseAtual) {
    poseAtual.textContent = state.poses[state.poseIndex];
  }

  if (horaAtual) {
    horaAtual.textContent = formatarHora(state.timeOfDay);
  }
}

export { initSidebar, updateSidebar, };