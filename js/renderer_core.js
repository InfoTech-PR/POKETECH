// renderer_core.js
// Módulo 1/4 do Renderer: Funções Core de navegação e renderização do card GBA.

export const RendererCore = {
  showScreen: function (screenId, extraData = null) {

    // CORREÇÃO ESSENCIAL: Garante que extraData é um objeto, mesmo que 'null' seja passado.
    let safeExtraData = extraData && typeof extraData === 'object' ? extraData : {};

    // NOVO: TRATAMENTO DE STRING JSON (mantido por segurança, mas o bug o evita)
    if (typeof extraData === 'string' && screenId === 'pokedex') {
      try {
        safeExtraData = JSON.parse(extraData);
        console.log(`[NAV] DADOS EXTRAS RESTAURADOS (JSON.parse):`, safeExtraData);
      } catch (e) {
        console.error('[NAV] Erro ao fazer JSON.parse do extraData. Usando objeto vazio.', e);
        safeExtraData = {};
      }
    }

    // CORREÇÃO FINAL ROBUSTA: Se o argumento direto falhou (objeto vazio ou nulo),
    // verifica a variável global temporária setada pela função openPokedexRegion.
    if (Object.keys(safeExtraData).length === 0 && window.nextScreenPayload) {
      safeExtraData = window.nextScreenPayload;
      window.nextScreenPayload = null; // Limpa imediatamente após o uso
      console.log(`[NAV] DADOS EXTRAS RESTAURADOS (GLOBAL):`, safeExtraData);
    }

    // [LOG A] Adicionado log para rastrear a navegação e dados extras (agora usando safeExtraData)
    console.log(`[NAV] Tentativa de navegar para: ${screenId}. Dados extras:`, safeExtraData);

    window.gameState.currentScreen = screenId;
    const app = document.getElementById("app-container");

    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
      // Limpa o conteúdo antes de renderizar a nova tela
      gbaScreen.innerHTML = "";
    } else {
      console.error("Elemento .gba-screen não encontrado.");
      return;
    }

    switch (screenId) {
      case "initialMenu":
        window.Renderer.renderInitialMenu(app);
        break;
      case "starterSelection":
        window.Renderer.renderStarterSelection(app);
        break;
      case "friendshipMenu":
        window.Renderer.renderFriendshipMenu(app);
        break;
      case "mainMenu":
        window.Renderer.renderMainMenu(app);
        break;
      case "profile":
        window.Renderer.renderProfile(app);
        break;
      case "pokemonList":
        window.Renderer.renderPokemonList(app, safeExtraData);
        break;
      case "bag":
        // Passa o objeto seguro
        window.Renderer.renderBag(app, safeExtraData);
        break;
      case "pokedex":
        // CORREÇÃO APLICADA AQUI: Envia safeExtraData para renderPokedex
        window.Renderer.renderPokedex(app, safeExtraData);
        break;
      case "managePokemon":
        window.Renderer.renderManagePokemon(app);
        break;
      case "battle":
        window.Renderer.renderBattleScreen(app);
        break;
      case "switchPokemon":
        window.Renderer.renderSwitchPokemon(app);
        break;
      case "pvpSetup":
        window.Renderer.renderPvpSetup(app);
        break;
      case "pvpWaiting":
        window.Renderer.renderPvpWaiting(window.gameState.pvpRoomId);
        break;
      case "healCenter":
        window.Renderer.renderHealCenter(app);
        break;
      case "shop":
        window.Renderer.renderShop(app);
        break;
      case "preferences":
        window.Renderer.renderPreferences(app);
        break;
      case "updates": // CORREÇÃO: Novo case para a tela de updates
        window.Renderer.renderUpdates(app);
        break;
      case "mapView": // NOVO: Tela do Mapa
        window.Renderer.renderMapView(app);
        break;
      // NOVOS SUBMENUS
      case "pokemonMenu":
        window.Renderer.renderPokemonMenu(app);
        break;
      case "serviceMenu":
        window.Renderer.renderServiceMenu(app);
        break;
      case "profileMenu":
        window.Renderer.renderProfileMenu(app);
        break;
      default:
        window.Renderer.renderMainMenu(app);
    }
  },

  renderGbaCard: function (contentHtml) {
    const gbaScreen = document.querySelector(".gba-screen");
    if (gbaScreen) {
      gbaScreen.innerHTML = contentHtml;
    } else {
      console.error(
        "Elemento .gba-screen não encontrado para renderizar card."
      );
    }
  },
};
