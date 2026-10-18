import { updateSidebar, } from "./sidebar.js";

import { transitionToCamera, } from "./cameras.js";

// Define as ações que alteram o estado da aplicação
function createActions(state) {
  return {
    camera(camera) {
      // A câmera livre herda a posição e direção da câmera anterior
      transitionToCamera(state.activeCamera, camera);

      state.activeCamera = camera;
    },

    nextPose() {
      state.poseIndex = (state.poseIndex + 1) % state.poses.length;
    },

    toggleLighting() {
      state.lightingEnabled = !state.lightingEnabled;
    },

    toggleFog() {
      state.fogEnabled = !state.fogEnabled;
    },

    toggleSound() {
      state.soundEnabled = !state.soundEnabled;
    },

    skipToNight() {
      state.timeOfDay = 20;
    },
  };
}

// Centraliza a execução das ações e a atualização da interface
function createActionRunner(state) {
  const actions = createActions(state);

  function runAction(name, ...args) {
    const action = actions[name];

    if (typeof action !== "function") {
      throw new Error(`Ação não encontrada: ${name}`);
    }

    action(...args);

    updateSidebar(state);
  }

  return runAction;
}

export { createActions, createActionRunner, };