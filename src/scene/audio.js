// Sons contínuos e efeitos da cena
const soundSources = {
  music: {
    url: "./assets/sounds/CHALA HEAD CHALA Dragon ball z na versao Forro.mp3",
    volume: 0.35,
    loop: true,
  },

  waves: {
    url: "./assets/sounds/waves.mp3",
    volume: 0.4,
    loop: true,
  },

  ki: {
    url: "./assets/sounds/dbz-charging.mp3",
    volume: 0,
    loop: true,
  },

  teleport: {
    url: "./assets/sounds/goku-teleport-sound.mp3",
    volume: 0.7,
    loop: false,
  },

  dragonBalls: {
    url: "./assets/sounds/dragon-balls.mp3",
    volume: 0.8,
    loop: false,
  },
};

const sounds = {};
const activeEffects = new Set();

let soundEnabled = false;

// Mantém o volume entre 0 e 1
function clampVolume(value) {
  return Math.min(1, Math.max(0, value));
}

// Cria os elementos de áudio uma única vez
function createSounds() {
  for (const [name, options] of Object.entries(soundSources)) {
    const audio = new Audio(options.url);

    audio.loop = options.loop;
    audio.volume = clampVolume(options.volume);
    audio.preload = "auto";

    sounds[name] = audio;
  }
}

// Liga ou desliga todos os sons
function setSoundEnabled(enabled) {
  soundEnabled = enabled;

  if (enabled) {
    for (const name of ["music", "waves", "ki"]) {
      sounds[name]?.play().catch(() => {});
    }

  } else {
    for (const sound of Object.values(sounds)) {
      sound.pause();
    }

    // Interrompe também os efeitos que foram clonados
    for (const effect of activeEffects) {
      effect.pause();
      effect.currentTime = 0;
    }

    activeEffects.clear();
  }
}

// Reproduz efeitos permitindo sons sobrepostos
function playEffect(name) {
  if (!soundEnabled || !sounds[name] || soundSources[name].loop) {
    return;
  }

  const effect = sounds[name].cloneNode(true);

  effect.volume = clampVolume(soundSources[name].volume);

  activeEffects.add(effect);

  effect.addEventListener("ended", () => {
    activeEffects.delete(effect);
  }, { once: true });

  effect.play().catch(() => {
    activeEffects.delete(effect);
  });
}

// Ajusta o zumbido do ki conforme a quantidade de partículas
function updateAudio(state, aliveCount) {
  if (!sounds.ki) {
    return;
  }

  const intensity = Math.min(aliveCount / 138, 1);
  const volume = state.soundEnabled ? 0.5 * intensity : 0;

  sounds.ki.volume = clampVolume(volume);
}

export { createSounds, setSoundEnabled, playEffect, updateAudio, };