import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const AuthSetup = {
  setupInitialInteractions: function () {
      let backgroundMusic = null;
      let currentTrack = 0;
      const tracks = [
          "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/sgalcfte/1-01.%20Opening.mp3",
          "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/pahiwgtx/1-31.%20Theme%20Of%20Lavender%20Town.mp3",
      ];
      
      function playMusic() {
          if (window.backgroundMusic && !window.backgroundMusic.paused) {
              return; // Já está tocando
          }
          
          // --- Lendo e Aplicando Preferências de Volume ---
          const prefs = window.gameState.profile.preferences || { volume: 0.5, isMuted: false };
          const volume = prefs.isMuted ? 0 : prefs.volume;
          // ------------------------------------------------
          
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
              console.warn("Música bloqueada. Ela será iniciada com a primeira interação.");
          });
          
          window.backgroundMusic = backgroundMusic; 
      }
      
      document.addEventListener("click", () => { playMusic(); }, { once: true }); 
  },

  handleBattleMusic: function (isBattle) {
      const prefs = window.gameState.profile.preferences || { volume: 0.5, isMuted: false };
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
          battleMusic.play().catch(err => console.warn("Falha ao tocar música de batalha:", err));
          window.backgroundMusic = battleMusic;
      } else {
          AuthSetup.setupInitialInteractions(); 
      }
  },

  initAuth: async function () {
    const firebaseConfig = window.firebaseConfig;
    const initialAuthToken = window.initialAuthToken;
    let gameLoaded = false;
    
    if (window.Utils.loadGame()) {
      gameLoaded = true;
      window.registerExistingPokemonOnLoad();
    } else {
      window.initializeGameState(); 
    }
    
    AuthSetup.setupInitialInteractions();

    // --- Integração automática com a tela de batalha ---
    const originalShowScreen = window.Renderer.showScreen;
    window.Renderer.showScreen = function (screenName) {
        originalShowScreen(screenName);
        if (screenName === "battle") {
            AuthSetup.handleBattleMusic(true);
        } else {
            AuthSetup.handleBattleMusic(false);
        }
    };
    // ---------------------------------------------------

    if (firebaseConfig) {
      try {
        const app = initializeApp(firebaseConfig);
        window.db = getFirestore(app);
        window.auth = getAuth(app);

        console.log("Inicializando autenticação...");

        if (initialAuthToken) {
          await signInWithCustomToken(window.auth, initialAuthToken);
        } else {
          await signInAnonymously(window.auth);
        }

        const unsubscribe = onAuthStateChanged(window.auth, (user) => {
          if (user) {
            window.userId = user.uid;
            console.log("Usuário autenticado:", window.userId);
          } else {
            console.log("Nenhum usuário autenticado.");
            window.userId = "anonymous-" + crypto.randomUUID();
          }
          
          if (gameLoaded) {
              const urlParams = new URLSearchParams(window.location.search);
              const roomId = urlParams.get("pvp");
              if (roomId) {
                  window.PvpCore.joinPvpBattle(roomId);
              } else if (window.gameState.currentScreen !== "battle") {
                    window.Renderer.showScreen("mainMenu");
              }
          } else {
              window.Renderer.showScreen("initialMenu");
          }
          unsubscribe();
        });
      } catch (error) {
        console.error("Erro fatal ao inicializar Firebase (Chaves Inválidas?):", error);
        window.db = null;
        window.auth = null;
        window.userId = "anonymous-" + crypto.randomUUID();
        if (!gameLoaded) {
            window.initializeGameState();
            window.Renderer.showScreen("initialMenu");
        }
        window.Utils.showModal(
          "errorModal",
          "Erro na autenticação do Firebase. O PvP não funcionará. Jogue o modo Exploração."
        );
      }
    } else {
      console.error("Firebase Configuração não encontrada. O PvP estará desativado.");
      window.db = null;
      window.auth = null;
      window.userId = "anonymous-" + crypto.randomUUID();
      if (!gameLoaded) {
          window.initializeGameState();
      }
      window.Renderer.showScreen("initialMenu");
    }
  }
};