/**
 * js/app.js
 * PONTO DE ENTRADA GLOBAL
 * Módulo para ser carregado dinamicamente com cache-busting.
 */

// Variáveis de escopo do módulo para armazenar as referências importadas
let GameConfig, initializeGameState, Utils, PokeAPI, GameLogic, BattleCore, PvpCore, Renderer, AuthSetup, registerExistingPokemonOnLoad;

/**
 * Função principal de inicialização que carrega todos os submódulos de forma dinâmica
 * e aplica o cache-busting para garantir que todas as dependências sejam carregadas.
 * * NOTA: Esta função substitui as importações estáticas para evitar o cache dos módulos dependentes.
 * * @param {number} cacheBuster O timestamp para quebrar o cache.
 */
export async function init(cacheBuster) {
    // String de versão a ser anexada a todas as importações locais
    const v = `?v=${cacheBuster}`;

    try {
        // 1. Carregar Módulos Dinamicamente
        const configModule = await import(`./config_utils.js${v}`);
        GameConfig = configModule.GameConfig;
        initializeGameState = configModule.initializeGameState;
        Utils = configModule.Utils;
        PokeAPI = configModule.PokeAPI;
        registerExistingPokemonOnLoad = configModule.registerExistingPokemonOnLoad; // NOVO: Importa a nova função

        const logicModule = await import(`./game_logic.js${v}`);
        GameLogic = logicModule.GameLogic;

        const battleModule = await import(`./battle_core.js${v}`);
        BattleCore = battleModule.BattleCore;

        const pvpModule = await import(`./pvp_core.js${v}`);
        PvpCore = pvpModule.PvpCore;

        const rendererModule = await import(`./renderer.js${v}`);
        Renderer = rendererModule.Renderer;

        const authModule = await import(`./auth_setup.js${v}`);
        AuthSetup = authModule.AuthSetup;

        // 2. Exportações Globais (Para o escopo do HTML e comunicação inter-módulos)
        // Módulos Completos
        window.GameConfig = GameConfig;
        window.PokeAPI = PokeAPI;
        window.GameLogic = GameLogic;
        window.BattleCore = BattleCore;
        window.PvpCore = PvpCore;
        window.Renderer = Renderer;
        window.Utils = Utils;
        window.initializeGameState = initializeGameState; // Exporta a função para uso global
        window.registerExistingPokemonOnLoad = registerExistingPokemonOnLoad; // NOVO: Exporta a nova função

        // Exportações diretas para compatibilidade com o HTML (facilitando 'onclick')
        window.showScreen = Renderer.showScreen;
        window.selectStarter = Renderer.selectStarter;
        window.selectGender = Renderer.selectGender;
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
        window.exportSave = GameLogic.exportSave;
        window.importSave = GameLogic.importSave;
        window.dragStart = GameLogic.dragStart;
        window.allowDrop = GameLogic.allowDrop;
        window.drop = GameLogic.drop;
        window.releasePokemon = GameLogic.releasePokemon;
        window.setPokemonAsActive = GameLogic.setPokemonAsActive; 

        // --- NOVAS EXPORTAÇÕES DE PREFERÊNCIAS ---
        window.updateVolume = Utils.updateVolume;
        window.toggleMute = Utils.toggleMute;
        // -----------------------------------------

        // 3. Início da Aplicação (usando o AuthSetup carregado dinamicamente)
        AuthSetup.initAuth();

    } catch (e) {
        console.error("Erro fatal ao carregar módulos dependentes:", e);
        // Garante que a tela de carregamento seja substituída por um erro se a importação falhar.
        const gbaScreen = document.querySelector(".gba-screen");
        if (gbaScreen) {
            gbaScreen.innerHTML = '<div class="text-xl font-bold text-red-600 gba-font">ERRO DE CARREGAMENTO DE MÓDULO</div><div class="mt-4 text-sm text-gray-600 gba-font">Verifique o console para detalhes.</div>';
        }
    }
}
