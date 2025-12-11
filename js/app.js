/**
 * js/app.js
 * Ponto de entrada da aplicação.
 */

let GameConfig,
  initializeGameState,
  Utils,
  PokeAPI,
  GameLogic,
  BattleCore,
  PvpCore,
  Renderer,
  AuthSetup,
  registerExistingPokemonOnLoad,
  PokeFriendship,
  MapCore,
  PokeChat; // NOVO: Módulo de Chat

/**
 * Função principal de inicialização da aplicação.
 * Carrega todos os módulos dependentes de forma dinâmica com cache-busting.
 * @param {number} cacheBuster Timestamp usado para versionamento de cache.
 */
export async function init(cacheBuster = Date.now()) {
  // Variável global para ser usada em carregamentos de assets estáticos (ex: game_updates.json)

  const params = new URLSearchParams(window.location.search);
  const friendshipId = params.get("friend");

  if (friendshipId && window.userId && !window.userId.startsWith("anonimo")) {
    // Remove o parâmetro do URL para evitar reprocessamento
    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);

    // Aguarda um pouco para garantir que os módulos estão carregados
    setTimeout(async () => {
      if (window.PokeFriendship && window.Utils) {
        // Processa o aceite
        const result = await window.PokeFriendship.processFriendshipAcceptance(
          friendshipId
        );
        window.Utils.showModal(
          result.success ? "infoModal" : "errorModal",
          result.message
        );

        // Continua para a tela principal (Menu ou Map)
        if (window.Renderer) {
          window.Renderer.showScreen("mainMenu");
        }
      }
    }, 1000);
  }
  window.cacheBuster = cacheBuster;
  const v = `?v=${cacheBuster}`;

  function updateErrorStatus(message, isError = false) {
    const statusElement = document.getElementById("error-status");
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `text-[8px] gba-font text-center mt-2 ${
        isError ? "text-red-500" : "text-green-500"
      }`;
    }
  }

  window.exportSaveOnError = function () {
    // Tenta exportar o save do LocalStorage diretamente, sem depender de GameLogic.js
    try {
      const saveProfile = localStorage.getItem("pokemonGameProfile");
      const saveLog = localStorage.getItem("pokemonGameExploreLog");

      if (!saveProfile) {
        updateErrorStatus("Nenhum jogo salvo para exportar!", true);
        return;
      }

      const data = {
        profile: JSON.parse(saveProfile),
        exploreLog: saveLog ? JSON.parse(saveLog) : ["Bem-vindo de volta!"],
      };
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `pokemon_gba_save_ERRO_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      updateErrorStatus(
        "Save exportado com sucesso! Tente Limpar os Dados.",
        false
      );
    } catch (e) {
      updateErrorStatus(
        `Falha ao exportar o save: ${e.message.substring(0, 50)}`,
        true
      );
    }
  };

  window.clearLocalData = function () {
    // Implementa a lógica de limpeza de dados sem usar confirm()
    const confirmButton = document.getElementById("confirm-clear");
    const cancelButton = document.getElementById("cancel-clear");

    // Se a confirmação já estiver ativa, executa a limpeza
    if (confirmButton && confirmButton.style.display !== "none") {
      localStorage.removeItem("pokemonGameProfile");
      localStorage.removeItem("pokemonGameExploreLog");
      localStorage.removeItem("pokemonGamePokedexCache");
      updateErrorStatus("Dados locais limpos. Recarregando...", false);
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    // Caso contrário, mostra a confirmação
    const initialButton = document.getElementById("clear-button-initial");
    if (initialButton) initialButton.style.display = "none";

    if (confirmButton && cancelButton) {
      confirmButton.style.display = "block";
      cancelButton.style.display = "block";
    }
    updateErrorStatus("Confirme: ISSO APAGARÁ SEU PROGRESO!", true);
  };

  window.cancelClearData = function () {
    const initialButton = document.getElementById("clear-button-initial");
    const confirmButton = document.getElementById("confirm-clear");
    const cancelButton = document.getElementById("cancel-clear");

    if (initialButton) initialButton.style.display = "block";
    if (confirmButton) confirmButton.style.display = "none";
    if (cancelButton) cancelButton.style.display = "none";
    updateErrorStatus("", false); // Limpa a mensagem de status
  };

  try {
    // 1. Carregamento de Configurações e Utilitários (Agora é uma função assíncrona)
    const configModule = await import(`./config_utils.js?v=${Date.now()}`);

    // Chama a função fábrica para carregar dados locais com cache-busting
    const loadedConfig = await configModule.createConfigAndUtils(v);
    ({
      GameConfig,
      initializeGameState,
      Utils,
      PokeAPI,
      registerExistingPokemonOnLoad,
    } = loadedConfig);

    // 2. Carregamento de Lógica de Jogo
    const logicModule = await import(`./game_logic.js?v=${Date.now()}`);
    GameLogic = logicModule.GameLogic;

    // 3. Carregamento do Core de Batalha
    const battleModule = await import(`./battle_core.js?v=${Date.now()}`);
    BattleCore = battleModule.BattleCore;

    // 4. Carregamento do Core de PvP
    const pvpModule = await import(`./pvp_core.js?v=${Date.now()}`);
    PvpCore = pvpModule.PvpCore;

    // 5. Carregamento do Core do Mapa (NOVO)
    const mapModule = await import(`./map_core.js?v=${Date.now()}`);
    MapCore = mapModule.MapCore;

    // 6. Carregamento da Fábrica do Renderer e Inicialização
    const rendererModule = await import(`./renderer.js?v=${Date.now()}`);
    // Chama a função de fábrica do Renderer, passando o versionamento
    Renderer = await rendererModule.createRenderer(cacheBuster);

    // 7. Carregamento do Setup de Autenticação
    const authModule = await import(`./auth_setup.js?v=${Date.now()}`);
    AuthSetup = authModule.AuthSetup;

    // 8. Carregamento do Sistema de Amizade
    const friendshipModule = await import(
      `./poke_friendship.js?v=${Date.now()}`
    );
    PokeFriendship = friendshipModule.PokeFriendship;

    // 9. Carregamento do Sistema de Chat (NOVO)
    const chatModule = await import(`./poke_chat.js?v=${Date.now()}`);
    PokeChat = chatModule.PokeChat;

    // --- Exposição para o escopo global (window) ---
    window.GameConfig = GameConfig;
    window.PokeAPI = PokeAPI;
    window.GameLogic = GameLogic;
    window.BattleCore = BattleCore;
    window.PvpCore = PvpCore;
    window.Renderer = Renderer;
    window.Utils = Utils;
    window.initializeGameState = initializeGameState;
    window.registerExistingPokemonOnLoad = registerExistingPokemonOnLoad;
    window.MapCore = MapCore; // EXPONDO O NOVO CORE

    // --- Exposição de funções de tela e lógica ---
    window.showScreen = Renderer.showScreen;
    window.selectStarter = Renderer.selectStarter;
    window.selectGender = Renderer.selectGender;
    window.updateGenderOnly = Renderer.updateGenderOnly; // Novo: Para uso no perfil
    window.explore = GameLogic.explore;
    window.playerTurn = BattleCore.playerTurn;
    window.setBattleMenu = BattleCore.setBattleMenu;
    window.useItem = GameLogic.useItem;
    window.useEtherOnMove = GameLogic.useEtherOnMove;
    window.saveGame = Utils.saveGame;
    window.createPvpLink = PvpCore.createPvpLink;
    window.joinPvpBattle = PvpCore.joinPvpBattle;
    window.copyPvpLink = PvpCore.copyPvpLink;
    window.showModal = Utils.showModal;
    window.hideModal = Utils.hideModal;
    window.switchPokemon = BattleCore.switchPokemon;
    window.evolvePokemon = GameLogic.evolvePokemon;
    window.saveProfile = GameLogic.saveProfile;
    window.buyItem = GameLogic.buyItem;
    window.healAllPokemon = GameLogic.healAllPokemon;
    window.showPokemonStats = Renderer.showPokemonStats;
    // CORREÇÃO: Expondo a função showPokedexStats
    window.showPokedexStats = Renderer.showPokedexStats;
    window.exportSave = GameLogic.exportSave;
    window.importSave = GameLogic.importSave;
    window.loadSaveFromFile = GameLogic.loadSaveFromFile;
    window.autoSaveToFile = GameLogic.autoSaveToFile;
    window.dragStart = GameLogic.dragStart;
    window.allowDrop = GameLogic.allowDrop;
    window.drop = GameLogic.drop;
    window.dragEnter = GameLogic.dragEnter;
    window.dragLeave = GameLogic.dragLeave;
    window.releasePokemon = GameLogic.releasePokemon;
    window.setPokemonAsActive = GameLogic.setPokemonAsActive;
    window.showFriendListModal = PokeFriendship.showFriendListModal;
    window.sendFriendRequest = PokeFriendship.sendFriendRequest;
    window.updateVolume = Utils.updateVolume;
    window.toggleMute = Utils.toggleMute;
    window.resetGameData = Utils.resetGameData;
    window.toggleBetaMode = GameLogic.toggleBetaMode; // NOVO
    window.mapExplore = GameLogic.mapExplore; // NOVO
    window.PokeChat = PokeChat; // EXPONDO O NOVO CHAT

    // LOGIN
    window.signInWithGoogle = AuthSetup.signInWithGoogle;
    window.signOutUser = AuthSetup.signOutUser;

    // INICIALIZAÇÃO FINAL: Autenticação e Carregamento de Save
    AuthSetup.initAuth();

    // NOVO: Sistema de Instalação PWA
    window.deferredPrompt = null;
    window.isPWAInstalled = false;
    window.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    window.isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://");

    // Detecta se já está instalado
    if (window.isStandalone) {
      window.isPWAInstalled = true;
      console.log("✅ [PWA] Aplicativo já está instalado");
    }

    // Captura o evento beforeinstallprompt (Android/Chrome)
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("✅ [PWA] Evento beforeinstallprompt capturado");
      e.preventDefault();
      window.deferredPrompt = e;
      window.isPWAInstallable = true;

      // Dispara evento customizado para atualizar UI
      window.dispatchEvent(
        new CustomEvent("pwa-installable", { detail: true })
      );
    });

    // Detecta quando a PWA é instalada
    window.addEventListener("appinstalled", () => {
      console.log("✅ [PWA] Aplicativo instalado com sucesso!");
      window.isPWAInstalled = true;
      window.deferredPrompt = null;
      window.isPWAInstallable = false;
      window.dispatchEvent(new CustomEvent("pwa-installed", { detail: true }));
    });

    // Função para instalar a PWA
    window.installPWA = async function () {
      if (!window.deferredPrompt) {
        console.warn("⚠️ [PWA] Prompt de instalação não disponível");

        // Para iOS, mostra instruções
        if (window.isIOS) {
          window.Utils?.showModal(
            "infoModal",
            "Para instalar no iOS:<br><br>" +
              "1. Toque no botão de compartilhar (□↑)<br>" +
              '2. Role para baixo e toque em "Adicionar à Tela Inicial"<br>' +
              '3. Toque em "Adicionar"'
          );
          return false;
        }

        // Para outros navegadores mobile
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isAndroid) {
          window.Utils?.showModal(
            "infoModal",
            "Para instalar no Android:<br><br>" +
              "1. Toque no menu (⋮) no canto superior direito<br>" +
              '2. Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"<br>' +
              "3. Confirme a instalação"
          );
        }
        return false;
      }

      try {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log(`[PWA] Resultado da instalação: ${outcome}`);

        if (outcome === "accepted") {
          window.isPWAInstalled = true;
          window.Utils?.showModal(
            "infoModal",
            "Aplicativo instalado com sucesso!"
          );
        }

        window.deferredPrompt = null;
        window.isPWAInstallable = false;
        window.dispatchEvent(
          new CustomEvent("pwa-install-result", { detail: outcome })
        );
        return outcome === "accepted";
      } catch (error) {
        console.error("❌ [PWA] Erro ao instalar:", error);
        return false;
      }
    };

    // NOVO: Registro do Service Worker para PWA
    if ("serviceWorker" in navigator) {
      // Registra imediatamente, não espera o load
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js", {
            scope: "/",
            updateViaCache: "none", // Sempre busca atualizações
          })
          .then((registration) => {
            console.log("✅ [SW] Registrado com sucesso:", registration.scope);
            console.log(
              "✅ [SW] Estado:",
              registration.active ? "ATIVO" : "INSTALANDO"
            );

            // Verifica atualizações
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                console.log("[SW] Nova versão encontrada, instalando...");
                newWorker.addEventListener("statechange", () => {
                  console.log(`[SW] Estado do novo worker: ${newWorker.state}`);
                  if (newWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      console.log(
                        "🔄 [SW] Nova versão instalada! Recarregue a página."
                      );
                    } else {
                      console.log("✅ [SW] Instalado pela primeira vez!");
                    }
                  }
                });
              }
            });

            // Verifica atualizações periodicamente (a cada 5 minutos)
            setInterval(() => {
              registration.update().catch((err) => {
                console.debug(
                  "[SW] Erro ao verificar atualização:",
                  err.message
                );
              });
            }, 300000);
          })
          .catch((error) => {
            console.error("❌ [SW] Falha ao registrar:", error);
            console.error("❌ [SW] Detalhes:", {
              message: error.message,
              stack: error.stack,
              name: error.name,
            });
          });

        // Aguarda o service worker estar pronto
        navigator.serviceWorker.ready
          .then((registration) => {
            console.log("✅ [SW] Pronto para uso");
            if (navigator.serviceWorker.controller) {
              console.log("✅ [SW] Está controlando a página");
              // Marca como instalável após SW estar ativo
              setTimeout(() => {
                if (!window.isPWAInstalled && !window.isStandalone) {
                  // Verifica se é instalável mesmo sem o evento beforeinstallprompt
                  // Para Android/Chrome, o evento beforeinstallprompt deve ter sido disparado
                  // Para iOS, sempre mostra o botão de instalação
                  const isMobile =
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                      navigator.userAgent
                    );
                  if (isMobile && !window.deferredPrompt) {
                    // Se for mobile e não tiver o prompt, pode ser iOS ou navegador que não suporta
                    // Marca como potencialmente instalável
                    if (window.isIOS || !window.deferredPrompt) {
                      window.isPWAInstallable = true;
                      window.dispatchEvent(
                        new CustomEvent("pwa-check-installable")
                      );
                    }
                  }
                }
              }, 3000);
            } else {
              console.log("⚠️ [SW] Ainda não está controlando (aguardando...)");
            }
          })
          .catch((error) => {
            console.warn("⚠️ [SW] Não está pronto:", error);
          });
      };

      // Tenta registrar imediatamente
      if (document.readyState === "loading") {
        window.addEventListener("load", registerSW);
      } else {
        registerSW();
      }
    } else {
      console.warn(
        "⚠️ [SW] Service Workers não são suportados neste navegador"
      );
    }
  } catch (e) {
    console.error("Erro fatal ao carregar módulos dependentes:", e);
    let errorMessage = "Erro de carregamento desconhecido.";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === "string") {
      errorMessage = e;
    } else if (e.toString) {
      errorMessage = e.toString();
    }

    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
      gbaScreen.innerHTML = `
                <div class="flex flex-col h-full justify-between items-center p-2"> <!-- Reduzido o PADDING para p-2 -->
                    <div class="flex-shrink-0 text-center w-full"> <!-- Adicionado w-full para o contêiner do título/detalhes -->
                        <div class="text-lg sm:text-xl font-bold text-red-600 gba-font mb-2 leading-none mx-auto max-w-xs">
                            ERRO CRÍTICO<br>DE MÓDULO
                        </div> <!-- Título em duas linhas com max-w-xs para compactar -->
                        <div class="mt-4 text-xs sm:text-sm text-gray-600 gba-font text-left bg-white p-2 border border-gray-400 rounded overflow-y-auto max-h-100"> <!-- Aumentado para max-h-32 -->
                            Ocorreu um erro ao carregar os arquivos principais.
                            <br>
                            <strong>Detalhe:</strong> ${errorMessage.substring(
                              0,
                              150
                            )}
                        </div>
                    </div>

                    <div class="mt-4 w-full flex-grow flex flex-col justify-end space-y-2">
                        <button onclick="window.exportSaveOnError()" class="gba-button bg-blue-500 hover:bg-blue-600 w-full">
                            EXPORTAR SAVE (TENTATIVA)
                        </button>
                        
                        <!-- BOTÃO INICIAL PARA LIMPAR DADOS -->
                        <button id="clear-button-initial" onclick="window.clearLocalData()" class="gba-button bg-red-500 hover:bg-red-600 w-full">
                            LIMPAR DADOS LOCAIS
                        </button>
                        
                        <!-- BOTÕES DE CONFIRMAÇÃO (INICIALMENTE ESCONDIDOS) -->
                        <div class="flex space-x-2">
                            <button id="confirm-clear" onclick="window.clearLocalData()" class="gba-button bg-red-700 hover:bg-red-800 flex-1" style="display: none;">
                                CONFIRMAR LIMPEZA
                            </button>
                            <button id="cancel-clear" onclick="window.cancelClearData()" class="gba-button bg-gray-500 hover:bg-gray-600 flex-1" style="display: none;">
                                CANCELAR
                            </button>
                        </div>
                        
                        <span id="error-status" class="text-[8px] text-gray-500 gba-font text-center mt-2">
                            Se o erro persistir, o save pode estar corrompido. Tente a Limpeza.
                        </span>
                    </div>
                </div>
            `;
    }
  }
}
