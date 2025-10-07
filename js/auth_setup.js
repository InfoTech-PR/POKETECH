import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    let backgroundMusic = null;
    let currentTrack = 0;
    const tracks = [
      "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/sgalcfte/1-01.%20Opening.mp3",
      "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/pahiwgtx/1-31.%20Theme%20Of%20Lavender%20Town.mp3",
    ];

    function playMusic() {
      if (window.backgroundMusic && !window.backgroundMusic.paused) {
        return;
      }
      const prefs = window.gameState.profile.preferences || {
        volume: 0.5,
        isMuted: false,
      };
      const volume = prefs.isMuted ? 0 : prefs.volume;
      backgroundMusic = new Audio(tracks[currentTrack]);
      backgroundMusic.volume = volume;
      backgroundMusic.loop = true;
      backgroundMusic.addEventListener("ended", () => {
        if (window.backgroundMusic === backgroundMusic) {
          currentTrack = (currentTrack + 1) % tracks.length;
          backgroundMusic = null;
          playMusic();
        }
      });
      backgroundMusic.play().catch(() => {
        console.warn(
          "Música bloqueada. Ela será iniciada com a primeira interação."
        );
      });
      window.backgroundMusic = backgroundMusic;
    }
    document.addEventListener(
      "click",
      () => {
        playMusic();
      },
      { once: true }
    );
  },

  handleBattleMusic: function (isBattle) {
    const prefs = window.gameState.profile.preferences || {
      volume: 0.5,
      isMuted: false,
    };
    const volume = prefs.isMuted ? 0 : prefs.volume;
    if (window.backgroundMusic) {
      window.backgroundMusic.pause();
      window.backgroundMusic.currentTime = 0;
      window.backgroundMusic = null;
    }
    if (isBattle) {
      const battleMusic = new Audio(
        "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/dariqfbs/1-15.%20Battle%20%28VS%20Trainer%29.mp3"
      );
      battleMusic.volume = volume;
      battleMusic.loop = true;
      battleMusic
        .play()
        .catch((err) => console.warn("Falha ao tocar música de batalha:", err));
      window.backgroundMusic = battleMusic;
    } else {
      AuthSetup.setupInitialInteractions();
    }
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
        const prefs = window.gameState.profile.preferences || {
          volume: 0.5,
          isMuted: false,
        };
        const volume = prefs.isMuted ? 0 : prefs.volume;
        if (window.backgroundMusic) {
          window.backgroundMusic.pause();
          window.backgroundMusic.currentTime = 0;
          window.backgroundMusic = null;
        }
        const healMusic = new Audio(
          "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/juvsbgak/1-10.%20Pok%C3%A9mon%20Center.mp3"
        );
        healMusic.volume = volume;
        healMusic.loop = true;
        healMusic
          .play()
          .catch((err) =>
            console.warn("Falha ao tocar música do Centro Pokémon:", err)
          );
        window.backgroundMusic = healMusic;
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