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
  return window.gameState?.profile?.preferences || {
    volume: 0.5,
    isMuted: false,
  };
};

const stopAndResetAudio = (audio) => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};

const ensureDefaultAudio = () => {
  if (!defaultMusicState.audio) {
    const audio = new Audio(defaultMusicState.tracks[defaultMusicState.currentTrack]);
    audio.loop = false;
    audio.addEventListener("ended", () => {
      if (window.backgroundMusic === audio) {
        defaultMusicState.currentTrack =
          (defaultMusicState.currentTrack + 1) % defaultMusicState.tracks.length;
        audio.src = defaultMusicState.tracks[defaultMusicState.currentTrack];
        audio.currentTime = 0;
        audio.load();
        audio
          .play()
          .catch((err) =>
            console.warn("Falha ao alternar para a próxima música padrão:", err)
          );
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
  if (audio.paused) {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("Falha ao tocar música padrão:", err);
      });
    }
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
      console.log("Usuário deslogado com sucesso.");
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
      playDefaultAudio(volume);
    };

    if (defaultMusicState.hasInteraction) {
      playDefaultAudio(volume);
      return;
    }

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
      battleMusicInstance
        .play()
        .catch((err) =>
          console.warn("Falha ao tocar música de batalha:", err)
        );
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
    healMusicInstance
      .play()
      .catch((err) =>
        console.warn("Falha ao tocar música do Centro Pokémon:", err)
      );
    window.backgroundMusic = healMusicInstance;
  },

  initAuth: async function () {
    const firebaseConfig = window.firebaseConfig;

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
            console.log("Usuário autenticado:", window.userId);

            const loaded = await window.GameLogic.loadProfile();

            if (!loaded) {
              // É a primeira vez do usuário, redireciona para a seleção de inicial.
              console.log(
                "Nenhum save encontrado. Redirecionando para a seleção de Pokémon."
              );
              window.initializeGameState();
              window.gameState.profile.trainerName =
                user.displayName || "TREINADOR";
              window.Renderer.showScreen("starterSelection");
            } else {
              // O usuário já tem um save.
              console.log(
                "Save encontrado. Redirecionando para o menu principal."
              );
              window.Renderer.showScreen("mainMenu");
            }

            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get("pvp");
            if (roomId) {
              window.PvpCore.joinPvpBattle(roomId);
            }
          } else {
            // Usuário não está logado, mostra a tela de login.
            console.log("Nenhum usuário logado. Exibindo tela de login.");
            window.userId = "anonimo";
            window.initializeGameState();
            window.Renderer.showScreen("initialMenu");
          }
        });
      } catch (error) {
        console.error("Erro fatal ao inicializar Firebase:", error);
        window.db = null;
        window.auth = null;
        window.userId = "anonimo-erro";
        window.initializeGameState();
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
      window.initializeGameState();
      window.Renderer.showScreen("initialMenu");
    }
  },
};