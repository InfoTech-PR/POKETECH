import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const DEFAULT_TRACKS = [
  "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/sgalcfte/1-01.%20Opening.mp3",
  "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/pahiwgtx/1-31.%20Theme%20Of%20Lavender%20Town.mp3",
];

const defaultMusicState = {
  tracks: DEFAULT_TRACKS,
  currentTrack: 0,
  audio: null,
  hasInteraction: false,
  listenerAttached: false,
};

let battleMusicInstance = null;
let healMusicInstance = null;

const getUserPreferences = () => {
  return (
    window.gameState?.profile?.preferences || {
      volume: 0.5,
      isMuted: false,
    }
  );
};

const stopAndResetAudio = (audio) => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

const ensureDefaultAudio = () => {
  if (!defaultMusicState.audio) {
    const audio = new Audio(
      defaultMusicState.tracks[defaultMusicState.currentTrack]
    );
    audio.loop = false;
    audio.addEventListener("ended", () => {
      if (window.backgroundMusic === audio) {
        const prefs = getUserPreferences();
        // Só avança para próxima música se não estiver mutada
        if (!prefs.isMuted) {
          defaultMusicState.currentTrack =
            (defaultMusicState.currentTrack + 1) %
            defaultMusicState.tracks.length;
          audio.src = defaultMusicState.tracks[defaultMusicState.currentTrack];
          audio.currentTime = 0;
          audio.load();
          audio.volume = prefs.volume;
          audio
            .play()
            .catch((err) =>
              console.warn(
                "Falha ao alternar para a próxima música padrão:",
                err
              )
            );
        }
      }
    });
    defaultMusicState.audio = audio;
  }
  return defaultMusicState.audio;
};

const playDefaultAudio = (volume) => {
  const audio = ensureDefaultAudio();
  audio.volume = volume;
  window.backgroundMusic = audio;
  // Só toca a música se o volume for maior que 0 (não mutada)
  if (volume > 0 && audio.paused) {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("Falha ao tocar música padrão:", err);
      });
    }
  } else if (volume === 0) {
    // Se estiver mutada, garante que a música está pausada
    audio.pause();
  }
  return audio;
};

const pauseDefaultAudio = () => {
  if (defaultMusicState.audio && !defaultMusicState.audio.paused) {
    defaultMusicState.audio.pause();
  }
};

export const AuthSetup = {
  signInWithGoogle: async function () {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(window.auth, provider);
      const user = result.user;
      window.Utils.showModal(
        "infoModal",
        `Bem-vindo(a), ${user.displayName || "Treinador(a)"}!`
      );
    } catch (error) {
      console.error("Erro no login com o Google:", error);
      window.Utils.showModal("errorModal", "Falha no login com o Google.");
    }
  },

  signOutUser: async function () {
    try {
      await signOut(window.auth);
      window.Utils.showModal(
        "infoModal",
        "Você deslogou com sucesso. Recarregando..."
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      window.Utils.showModal("errorModal", "Não foi possível deslogar.");
    }
  },

  setupInitialInteractions: function () {
    const prefs = getUserPreferences();
    const volume = prefs.isMuted ? 0 : prefs.volume;

    const startPlayback = () => {
      defaultMusicState.hasInteraction = true;
      // Atualiza as preferências no momento do clique (caso tenham mudado)
      const currentPrefs = getUserPreferences();
      const currentVolume = currentPrefs.isMuted ? 0 : currentPrefs.volume;

      // Só inicia a música se não estiver mutada
      if (!currentPrefs.isMuted) {
        playDefaultAudio(currentVolume);
      } else {
        // Se estiver mutada, apenas configura o volume mas não toca
        const audio = ensureDefaultAudio();
        audio.volume = 0;
        window.backgroundMusic = audio;
        audio.pause();
      }
    };

    if (defaultMusicState.hasInteraction) {
      // Se já houve interação, aplica as preferências atuais
      // Atualiza as preferências (caso tenham mudado desde a última vez)
      const currentPrefs = getUserPreferences();
      const currentVolume = currentPrefs.isMuted ? 0 : currentPrefs.volume;

      if (!currentPrefs.isMuted) {
        playDefaultAudio(currentVolume);
      } else {
        const audio = ensureDefaultAudio();
        audio.volume = 0;
        audio.pause();
      }
      return;
    }

    // Se as preferências indicam que está mutado, não adiciona o listener
    // A música só será iniciada quando o usuário clicar E não estiver mutado
    if (!defaultMusicState.listenerAttached) {
      document.addEventListener(
        "click",
        () => {
          startPlayback();
        },
        { once: true }
      );
      defaultMusicState.listenerAttached = true;
    }
  },

  handleBattleMusic: function (isBattle) {
    const prefs = getUserPreferences();
    const volume = prefs.isMuted ? 0 : prefs.volume;
    const defaultAudio = ensureDefaultAudio();

    stopAndResetAudio(healMusicInstance);

    if (isBattle) {
      pauseDefaultAudio();
      if (!battleMusicInstance) {
        battleMusicInstance = new Audio(
          "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/dariqfbs/1-15.%20Battle%20%28VS%20Trainer%29.mp3"
        );
        battleMusicInstance.loop = true;
      }
      battleMusicInstance.currentTime = 0;
      battleMusicInstance.volume = volume;
      // Só toca a música de batalha se não estiver mutada
      if (!prefs.isMuted) {
        battleMusicInstance
          .play()
          .catch((err) =>
            console.warn("Falha ao tocar música de batalha:", err)
          );
      } else {
        battleMusicInstance.pause();
      }
      window.backgroundMusic = battleMusicInstance;
    } else {
      stopAndResetAudio(battleMusicInstance);
      if (defaultMusicState.hasInteraction) {
        playDefaultAudio(volume);
      } else {
        AuthSetup.setupInitialInteractions();
      }
    }
  },

  playHealMusic: function () {
    const prefs = getUserPreferences();
    const volume = prefs.isMuted ? 0 : prefs.volume;

    pauseDefaultAudio();
    stopAndResetAudio(battleMusicInstance);

    if (!healMusicInstance) {
      healMusicInstance = new Audio(
        "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/juvsbgak/1-10.%20Pok%C3%A9mon%20Center.mp3"
      );
      healMusicInstance.loop = true;
    }

    healMusicInstance.currentTime = 0;
    healMusicInstance.volume = volume;
    // Só toca a música de cura se não estiver mutada
    if (!prefs.isMuted) {
      healMusicInstance
        .play()
        .catch((err) =>
          console.warn("Falha ao tocar música do Centro Pokémon:", err)
        );
    } else {
      healMusicInstance.pause();
    }
    window.backgroundMusic = healMusicInstance;
  },

  initAuth: async function () {
    const firebaseConfig = window.firebaseConfig;

    // IMPORTANTE: Carrega o jogo do localStorage ANTES de configurar a música
    // Isso garante que as preferências do usuário sejam aplicadas desde o início
    if (window.Utils && window.Utils.loadGame) {
      window.initializeGameState();
      const gameLoaded = window.Utils.loadGame();
      if (gameLoaded) {
        // Se o jogo foi carregado, aplica as preferências imediatamente
        AuthSetup.applyMusicPreferences();
      }
    }

    // Agora configura as interações iniciais com as preferências já carregadas
    AuthSetup.setupInitialInteractions();

    const originalShowScreen = window.Renderer.showScreen;
    window.Renderer.showScreen = function (screenName) {
      originalShowScreen(screenName);
      if (screenName === "battle") {
        AuthSetup.handleBattleMusic(true);
      } else if (screenName === "healCenter") {
        AuthSetup.playHealMusic();
      } else {
        AuthSetup.handleBattleMusic(false);
      }
    };

    if (firebaseConfig) {
      try {
        const app = initializeApp(firebaseConfig);
        window.db = getFirestore(app);
        window.auth = getAuth(app);

        onAuthStateChanged(window.auth, async (user) => {
          if (user) {
            // Usuário está logado
            window.userId = user.uid;

            const loaded = await window.GameLogic.loadProfile();

            // Aplica as preferências de música após carregar o perfil
            AuthSetup.applyMusicPreferences();

            if (!loaded) {
              // É a primeira vez do usuário, redireciona para a seleção de inicial.
              window.initializeGameState();
              window.gameState.profile.trainerName =
                user.displayName || "TREINADOR";
              window.Renderer.showScreen("starterSelection");
            } else {
              // O usuário já tem um save.
              window.Renderer.showScreen("mainMenu");
            }

            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get("pvp");
            if (roomId) {
              window.PvpCore.joinPvpBattle(roomId);
            }
          } else {
            // Usuário não está logado, mostra a tela de login.
            window.userId = "anonimo";
            // Se já carregou o jogo acima, não precisa inicializar novamente
            if (!window.gameState || !window.gameState.profile) {
              window.initializeGameState();
              // Tenta carregar do localStorage novamente
              if (window.Utils && window.Utils.loadGame) {
                window.Utils.loadGame();
              }
            }
            // Aplica as preferências de música após inicializar/carregar o estado
            AuthSetup.applyMusicPreferences();
            window.Renderer.showScreen("initialMenu");
          }
        });
      } catch (error) {
        console.error("Erro fatal ao inicializar Firebase:", error);
        window.db = null;
        window.auth = null;
        window.userId = "anonimo-erro";
        // Se já carregou o jogo acima, não precisa inicializar novamente
        if (!window.gameState || !window.gameState.profile) {
          window.initializeGameState();
          // Tenta carregar do localStorage novamente
          if (window.Utils && window.Utils.loadGame) {
            window.Utils.loadGame();
          }
        }
        // Aplica as preferências de música após inicializar/carregar o estado
        AuthSetup.applyMusicPreferences();
        window.Utils.showModal(
          "errorModal",
          "Erro na autenticação. PvP desativado."
        );
        window.Renderer.showScreen("initialMenu");
      }
    } else {
      console.error("Firebase Configuração não encontrada. PvP desativado.");
      window.db = null;
      window.auth = null;
      window.userId = "anonimo-erro";
      // Se já carregou o jogo acima, não precisa inicializar novamente
      if (!window.gameState || !window.gameState.profile) {
        window.initializeGameState();
        // Tenta carregar do localStorage novamente
        if (window.Utils && window.Utils.loadGame) {
          window.Utils.loadGame();
        }
      }
      // Aplica as preferências de música após inicializar/carregar o estado
      AuthSetup.applyMusicPreferences();
      window.Renderer.showScreen("initialMenu");
    }
  },

  // Nova função para aplicar as preferências de música após carregar o perfil
  applyMusicPreferences: function () {
    const prefs = getUserPreferences();
    const volume = prefs.isMuted ? 0 : prefs.volume;

    // Aplica o volume em todas as instâncias de áudio existentes
    if (defaultMusicState.audio) {
      defaultMusicState.audio.volume = volume;
      if (prefs.isMuted) {
        // Se estiver mutada, pausa imediatamente
        defaultMusicState.audio.pause();
      }
    }

    if (battleMusicInstance) {
      battleMusicInstance.volume = volume;
      if (prefs.isMuted) {
        battleMusicInstance.pause();
      }
    }

    if (healMusicInstance) {
      healMusicInstance.volume = volume;
      if (prefs.isMuted) {
        healMusicInstance.pause();
      }
    }

    // Atualiza o volume do backgroundMusic se existir
    if (window.backgroundMusic) {
      window.backgroundMusic.volume = volume;
      if (prefs.isMuted) {
        window.backgroundMusic.pause();
      }
    }

    // Se estiver mutada, garante que tudo está pausado e não reinicia
    if (prefs.isMuted) {
      pauseDefaultAudio();
      if (battleMusicInstance) battleMusicInstance.pause();
      if (healMusicInstance) healMusicInstance.pause();
      // Reseta o estado de interação para que a música não seja iniciada no próximo clique
      // (mas mantém o listener para caso o usuário desmute depois)
      // Não resetamos hasInteraction aqui, pois queremos manter o estado
    } else if (defaultMusicState.hasInteraction) {
      // Se já houve interação e não está mutada, reinicia a música
      playDefaultAudio(volume);
    }
  },
};
