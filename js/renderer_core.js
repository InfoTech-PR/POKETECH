// renderer_core.js
// Módulo 1/4 do Renderer: Funções Core de navegação e renderização do card GBA.

export const RendererCore = {
  showScreen: function (screenId, extraData = null) {
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
        window.Renderer.renderPokemonList(app);
        break;
      case "bag":
        window.Renderer.renderBag(app, extraData);
        break;
      case "pokedex":
        window.Renderer.renderPokedex(app, extraData);
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
