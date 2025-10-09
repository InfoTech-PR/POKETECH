/**
 * js/app.js - ARQUIVO PRINCIPAL ORIGINAL COM CORREÇÃO DO MAPA
 * Corrige o erro "Cannot read properties of null (reading 'getContext')"
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
  PokeFriendship;

/**
 * Função principal de inicialização da aplicação.
 * Carrega todos os módulos dependentes de forma dinâmica com cache-busting.
 * @param {number} cacheBuster Timestamp usado para versionamento de cache.
 */
export async function init(cacheBuster = Date.now()) {
  // Variável global para ser usada em carregamentos de assets estáticos (ex: game_updates.json)
  window.cacheBuster = cacheBuster;
  const v = `?v=${cacheBuster}`;

  function updateErrorStatus(message, isError = false) {
    const statusElement = document.getElementById("error-status");
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `text-[8px] gba-font text-center mt-2 ${isError ? "text-red-500" : "text-green-500"
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

    // 5. Carregamento da Fábrica do Renderer e Inicialização
    const rendererModule = await import(`./renderer.js?v=${Date.now()}`);
    // Chama a função de fábrica do Renderer, passando o versionamento
    Renderer = await rendererModule.createRenderer(cacheBuster);

    // 6. Carregamento do Setup de Autenticação
    const authModule = await import(`./auth_setup.js?v=${Date.now()}`);
    AuthSetup = authModule.AuthSetup;

    // 7. Carregamento do Sistema de Amizade
    const friendshipModule = await import(`./poke_friendship.js?v=${Date.now()}`);
    PokeFriendship = friendshipModule.PokeFriendship;
    window.PokeFriendship = PokeFriendship; // Expõe para uso em onclick/eventos

    // --- Exposição para o escopo global (window) --- CÓDIGO ORIGINAL MANTIDO
    window.GameConfig = GameConfig;
    window.PokeAPI = PokeAPI;
    window.GameLogic = GameLogic;
    window.BattleCore = BattleCore;
    window.PvpCore = PvpCore;
    window.Renderer = Renderer;
    window.Utils = Utils;
    window.initializeGameState = initializeGameState;
    window.registerExistingPokemonOnLoad = registerExistingPokemonOnLoad;

    // --- Exposição de funções de tela e lógica --- CÓDIGO ORIGINAL MANTIDO
    window.showScreen = Renderer.showScreen;
    window.selectStarter = Renderer.selectStarter;
    window.selectGender = Renderer.selectGender;
    window.updateGenderOnly = Renderer.updateGenderOnly; // Novo: Para uso no perfil
    window.explore = GameLogic.explore;
    window.playerTurn = BattleCore.playerTurn;
    window.setBattleMenu = BattleCore.setBattleMenu;
    window.useItem = GameLogic.useItem;
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

    // LOGIN ORIGINAL
    window.signInWithGoogle = AuthSetup.signInWithGoogle;
    window.signOutUser = AuthSetup.signOutUser;

    // INICIALIZAÇÃO FINAL: Autenticação e Carregamento de Save ORIGINAL
    AuthSetup.initAuth();

    // 🗺️ CORREÇÃO: Inicialização do mapa com verificações robustas
    setTimeout(() => {
      setupMapSystem();
    }, 5000); // Aumentado para 5 segundos para maior segurança

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
                <div class="flex flex-col items-center justify-center h-full text-center p-4">
                    <h1 class="text-red-500 text-xl font-bold mb-4 gba-font">ERRO CRÍTICO
                    DE MÓDULO</h1>
                    <p class="text-white mb-4">Ocorreu um erro ao carregar os arquivos principais.</p>
                    
                    <div class="bg-red-900 p-4 rounded mb-4 text-sm">
                        <strong>Detalhe:</strong> ${errorMessage.substring(0, 150)}
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <button onclick="window.exportSaveOnError()" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            📁 Exportar Save de Emergência
                        </button>
                        
                        <button id="clear-button-initial" onclick="window.clearLocalData()" 
                                class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">
                            🗑️ Limpar Dados Locais
                        </button>
                        
                        <button id="confirm-clear" onclick="window.clearLocalData()" 
                                style="display: none;" 
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                            ⚠️ CONFIRMAR LIMPEZA
                        </button>
                        
                        <button id="cancel-clear" onclick="window.cancelClearData()" 
                                style="display: none;" 
                                class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
                            ❌ Cancelar
                        </button>
                    </div>
                    
                    <p class="text-gray-400 text-xs mt-4">Se o erro persistir, o save pode estar corrompido. Tente a Limpeza.</p>
                    
                    <div id="error-status" class="mt-2"></div>
                </div>
            `;
    }
  }
}

/**
 * 🗺️ FUNÇÃO CORRIGIDA PARA CONFIGURAR O SISTEMA DE MAPA
 * Corrige o erro "Cannot read properties of null (reading 'getContext')"
 */
function setupMapSystem() {
  try {
    console.log('🗺️ Iniciando configuração do sistema de mapa...');

    // VERIFICAÇÃO 1: gameState deve existir
    if (!window.gameState) {
      console.log('⚠️ gameState não disponível, tentando novamente em 2s...');
      setTimeout(setupMapSystem, 2000);
      return;
    }

    // VERIFICAÇÃO 2: MapNavigationSystem deve estar carregado
    if (typeof window.MapNavigationSystem !== 'function') {
      console.log('ℹ️ MapNavigationSystem não carregado, sistema de mapa desabilitado');
      return;
    }

    // VERIFICAÇÃO 3: Container do mapa deve existir
    let mapContainer = document.getElementById('map-navigation-container');
    if (!mapContainer) {
      console.log('📦 Criando container do mapa...');
      mapContainer = createMapContainer();
    }

    // VERIFICAÇÃO 4: Canvas deve existir e ser válido
    let canvas = document.getElementById('map-canvas');
    if (!canvas) {
      console.log('🎨 Criando canvas do mapa...');
      canvas = createMapCanvas(mapContainer);
    }

    // VERIFICAÇÃO 5: Canvas deve ter getContext disponível
    if (!canvas || typeof canvas.getContext !== 'function') {
      console.error('❌ Canvas inválido, não é possível inicializar mapa');
      return;
    }

    // VERIFICAÇÃO 6: Testa se getContext funciona
    try {
      const testContext = canvas.getContext('2d');
      if (!testContext) {
        console.error('❌ Não foi possível obter contexto 2D do canvas');
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao testar contexto do canvas:', error);
      return;
    }

    console.log('✅ Todas as verificações passaram, inicializando MapNavigationSystem...');

    // INICIALIZAÇÃO DO SISTEMA DE MAPA
    const mapSystem = new MapNavigationSystem('map-canvas', window.gameState);

    // Integra com o POKETECH
    if (typeof mapSystem.integrateWithPoketech === 'function') {
      mapSystem.integrateWithPoketech();
    }

    // Expõe globalmente
    window.MapNavigation = mapSystem;

    // Configura integração com Renderer
    setupRendererIntegration();

    // Modifica botão explorar
    setTimeout(() => {
      modifyExploreButton();
    }, 1000);

    console.log('✅ Sistema de mapa inicializado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao configurar sistema de mapa:', error);
    console.log('ℹ️ O jogo continuará funcionando sem o sistema de mapa');
  }
}

/**
 * Cria o container do mapa se não existir
 */
function createMapContainer() {
  const body = document.body;
  const container = document.createElement('div');
  container.id = 'map-navigation-container';
  container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #2d3748;
        z-index: 100;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
  body.appendChild(container);
  console.log('✅ Container do mapa criado');
  return container;
}

/**
 * Cria o canvas do mapa
 */
function createMapCanvas(container) {
  // Detecta mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Dimensões do canvas
  const canvasWidth = isMobile ? Math.min(window.innerWidth - 40, 360) : 800;
  const canvasHeight = isMobile ? Math.min(window.innerHeight - 100, 400) : 600;

  // Cria canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'map-canvas';
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.cssText = `
        border: 3px solid #000;
        border-radius: 8px;
        background: #000;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        max-width: 100%;
        max-height: 80vh;
    `;

  // Adiciona canvas ao container
  container.appendChild(canvas);

  // Adiciona controles se desktop
  if (!isMobile) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 101;
        `;

    controlsDiv.innerHTML = `
            <button onclick="window.MapNavigation && window.MapNavigation.toggleFullMap()" 
                    style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #ffffff; 
                           border: 3px solid #000; border-radius: 8px; background-color: #22c55e; 
                           cursor: pointer; font-family: 'Press Start 2P', cursive;">
                🗺️ MAPA
            </button>
            <button onclick="window.Renderer && window.Renderer.showScreen('mainMenu')" 
                    style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #ffffff; 
                           border: 3px solid #000; border-radius: 8px; background-color: #ef4444; 
                           cursor: pointer; font-family: 'Press Start 2P', cursive;">
                ← VOLTAR
            </button>
        `;

    container.appendChild(controlsDiv);
  }

  console.log('✅ Canvas do mapa criado com sucesso');
  return canvas;
}

/**
 * Configura integração com o Renderer
 */
function setupRendererIntegration() {
  if (!window.Renderer || typeof window.Renderer.showScreen !== 'function') {
    console.log('⚠️ Renderer não disponível para integração');
    return;
  }

  // Salva a função original
  const originalShowScreen = window.Renderer.showScreen;

  // Sobrescreve com suporte ao mapa
  window.Renderer.showScreen = function (screen) {
    const mapContainer = document.getElementById('map-navigation-container');
    const gbaScreen = document.querySelector('.gba-screen');

    if (screen === 'worldMap' && mapContainer) {
      // Mostra o mapa
      mapContainer.style.display = 'flex';
      if (gbaScreen) gbaScreen.style.display = 'none';

      if (window.gameState) {
        window.gameState.currentScreen = 'worldMap';
      }

      // Atualiza controles mobile se disponível
      if (window.MapNavigation && typeof window.MapNavigation.updateMobileControlsPosition === 'function') {
        setTimeout(() => {
          window.MapNavigation.updateMobileControlsPosition();
        }, 100);
      }
    } else {
      // Esconde o mapa e mostra a tela normal
      if (mapContainer) mapContainer.style.display = 'none';
      if (gbaScreen) gbaScreen.style.display = 'flex';

      // Chama função original
      originalShowScreen.call(this, screen);
    }
  };

  console.log('✅ Integração com Renderer configurada');
}

/**
 * Modifica o botão explorar para usar o mapa
 */
function modifyExploreButton() {
  try {
    const exploreButton = document.querySelector('button[onclick*="explore"]');
    if (exploreButton && window.MapNavigation) {
      exploreButton.onclick = () => {
        if (window.Renderer && window.Renderer.showScreen) {
          window.Renderer.showScreen('worldMap');
        }
      };
      exploreButton.innerHTML = '🗺️ EXPLORAR MAPA';
      console.log('✅ Botão explorar modificado!');
    }
  } catch (error) {
    console.log('ℹ️ Não foi possível modificar botão explorar:', error.message);
  }
}

// Função global para abrir o mapa
window.openWorldMap = function () {
  if (window.Renderer && window.Renderer.showScreen) {
    window.Renderer.showScreen('worldMap');
  }
};