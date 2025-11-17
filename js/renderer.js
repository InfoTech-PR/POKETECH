// renderer.js
// Módulo de unificação que importa e exporta todas as funções do Renderer.

/**
 * Cria e retorna o objeto Renderer, carregando dinamicamente seus submódulos
 * com a string de versionamento (cache-buster).
 * * @param {string} v - A string de versionamento (ex: "?v=123456789").
 * @returns {Promise<object>} O objeto Renderer unificado.
 */
export async function createRenderer(v) {
    // 1. Carrega dinamicamente todos os submódulos usando a string de versionamento (v)
    // Isso garante que o cache-busting seja aplicado a todas as dependências.
    const [
        { RendererCore },
        { RendererMenus },
        { RendererPokemon },
        { RendererServices }
    ] = await Promise.all([
        import(`./renderer_core.js?v=${v}`),
        import(`./renderer_menus.js?v=${v}`),
        import(`./renderer_pokemon.js?v=${v}`),
        import(`./renderer_services.js?v=${v}`)
    ]);

    // 2. Exporta o objeto final 'Renderer' que combina o core e todos os submódulos.
    const Renderer = {
        // Core Functions
        showScreen: RendererCore.showScreen,
        renderGbaCard: RendererCore.renderGbaCard,

        // Menu Functions (from renderer_menus.js)
        renderInitialMenu: RendererMenus.renderInitialMenu,
        renderStarterSelection: RendererMenus.renderStarterSelection,
        renderMainMenu: RendererMenus.renderMainMenu,
        renderProfile: RendererMenus.renderProfile,
        renderPreferences: RendererMenus.renderPreferences,
        renderPokemonMenu: RendererMenus.renderPokemonMenu,
        renderServiceMenu: RendererMenus.renderServiceMenu,
        renderProfileMenu: RendererMenus.renderProfileMenu,
        renderFriendshipMenu: RendererMenus.renderFriendshipMenu,
        handleFriendLinkGeneration: RendererMenus.handleFriendLinkGeneration,
        copyFriendLink: RendererMenus.copyFriendLink,
        copyTrainerIdFromCard: RendererMenus.copyTrainerIdFromCard,
        joinPvpFromFriendship: RendererMenus.joinPvpFromFriendship,
        challengeFriendToPvp: RendererMenus.challengeFriendToPvp,
        updateTrainerAvatar: RendererMenus.updateTrainerAvatar,

        // NOVO: Expondo a função de cópia do ID para que window.Renderer.copyPlayerId funcione
        copyPlayerId: RendererMenus.copyPlayerId,

        // Funções de Gênero
        selectGender: RendererMenus.selectGender,
        updateGenderOnly: RendererMenus.updateGenderOnly,

        // Pokémon Functions (from renderer_pokemon.js)
        renderPokemonList: RendererPokemon.renderPokemonList,
        renderManagePokemon: RendererPokemon.renderManagePokemon,
        renderBag: RendererPokemon.renderBag,
        renderBattleTeam: RendererPokemon.renderBattleTeam,

        // CORREÇÃO E NOVIDADE: renderPokedex agora é a tela que exibe a lista de regiões
        // A função detalhada é chamada internamente.
        renderPokedex: RendererPokemon.renderPokedex,

        // NOVA FUNÇÃO (para ser chamada via showScreen('pokedex'))
        renderPokedexRegionList: RendererPokemon.renderPokedexRegionList,

        showPokemonStats: RendererPokemon.showPokemonStats,
        showPokedexStats: RendererPokemon.showPokedexStats,
        selectStarter: RendererMenus.selectStarter, // Mantido aqui para compatibilidade

        // Services and Battle Functions (from renderer_services.js)
        renderHealCenter: RendererServices.renderHealCenter,
        renderShop: RendererServices.renderShop,
        renderPvpSetup: RendererServices.renderPvpSetup,
        renderPvpWaiting: RendererServices.renderPvpWaiting,
        renderBattleScreen: RendererServices.renderBattleScreen,
        renderSwitchPokemon: RendererServices.renderSwitchPokemon,
        renderMapView: RendererServices.renderMapView, // NOVO: Mapeamento de tela de mapa
    };

    return Renderer;
}
