/**
 * js/auth_setup.js
 * MÓDULO 6: INICIALIZAÇÃO E SETUP
 * Contém a lógica de inicialização do Firebase, autenticação e carregamento inicial do jogo.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// IMPORTAÇÃO ATUALIZADA: Incluindo a nova função de registro
import { initializeGameState, Utils, registerExistingPokemonOnLoad } from './config_utils.js';
import { PvpCore } from './pvp_core.js';
import { Renderer } from './renderer.js';

// **ATENÇÃO: Removidas as declarações de topo para ler diretamente do window.**
// O valor só é definido em window.firebaseConfig APÓS o carregamento deste script.

/**
 * Módulo de Inicialização e Autenticação.
 */
export const AuthSetup = {
  /** Adiciona listener de música na primeira interação, e ativa tela cheia. */
  setupInitialInteractions: function () {
      let backgroundMusic = null;
      let currentTrack = 0;
      const tracks = [
          "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/sgalcfte/1-01.%20Opening.mp3",
          "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/pahiwgtx/1-31.%20Theme%20Of%20Lavender%20Town.mp3",
      ];
      
      function playMusic() {
          if (backgroundMusic) return;
          
          // --- Lendo e Aplicando Preferências de Volume ---
          const prefs = window.gameState.profile.preferences || { volume: 0.5, isMuted: false };
          const volume = prefs.isMuted ? 0 : prefs.volume;
          // ------------------------------------------------
          
          backgroundMusic = new Audio(tracks[currentTrack]);
          backgroundMusic.volume = volume; // Aplica o volume lido
          backgroundMusic.addEventListener("ended", () => {
          currentTrack = (currentTrack + 1) % tracks.length;
          backgroundMusic = null;
          playMusic();
          });
          backgroundMusic.play().catch((e) => {
          console.warn(
              "Música bloqueada. Ela será iniciada com a primeira interação."
          );
          });
          
          // Armazena a referência no window para ser manipulada pelo menu de preferências
          window.backgroundMusic = backgroundMusic; 
      }
      
      // Remove a chamada a Utils.toggleFullScreen() que estava comentada e não definida
      document.addEventListener("click", () => { playMusic(); }, { once: true }); 
  },

  /** Inicializa Firebase e Autenticação. */
  initAuth: async function () {
    // Lendo as variáveis globais DENTRO da função para garantir que já foram definidas pelo index.html
    const firebaseConfig = window.firebaseConfig;
    const initialAuthToken = window.initialAuthToken;
    let gameLoaded = false;
    
    // Antes de chamar setupInitialInteractions, garantimos que o gameState foi inicializado ou carregado
    if (Utils.loadGame()) {
      gameLoaded = true;
      // LÓGICA DE RETROCOMPATIBILIDADE ATUALIZADA:
      // Chama a função centralizada que garante que Utils.registerPokemon esteja disponível.
      registerExistingPokemonOnLoad();
    } else {
      initializeGameState(); 
    }
    
    // Agora que o gameState está pronto, podemos configurar a música.
    AuthSetup.setupInitialInteractions();

    if (firebaseConfig) { // Agora firebaseConfig contém o fallback ou a config real
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
            // Fallback for anonymous user ID if auth is not ready
            window.userId = "anonymous-" + crypto.randomUUID();
          }
          
          if (gameLoaded) {
              const urlParams = new URLSearchParams(window.location.search);
              const roomId = urlParams.get("pvp");
              if (roomId) {
                  PvpCore.joinPvpBattle(roomId);
              } else if (window.gameState.currentScreen !== "battle") {
                    Renderer.showScreen("mainMenu");
              }
          } else {
              // Já inicializado acima, só exibe a tela
              Renderer.showScreen("initialMenu");
          }
          unsubscribe();
        });
      } catch (error) {
        console.error(
          "Erro fatal ao inicializar Firebase (Chaves Inválidas?):",
          error
        );

        window.db = null;
        window.auth = null;

        window.userId = "anonymous-" + crypto.randomUUID();
        if (!gameLoaded) {
            initializeGameState();
            Renderer.showScreen("initialMenu");
        }
        Utils.showModal(
          "errorModal",
          "Erro na autenticação do Firebase. O PvP não funcionará. Jogue o modo Exploração."
        );
      }
    } else {
      console.error(
        "Firebase Configuração não encontrada. O PvP estará desativado."
      );
      window.db = null;
      window.auth = null;
      window.userId = "anonymous-" + crypto.randomUUID();
      // O jogo já está carregado ou inicializado, apenas renderiza.
      if (!gameLoaded) {
          initializeGameState();
      }
      Renderer.showScreen("initialMenu");
    }
  }
};
