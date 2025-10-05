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
    
    // --- UTILS PARA TELA DE ERRO ---
    function updateErrorStatus(message, isError = false) {
        const statusElement = document.getElementById("error-status");
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `text-[8px] gba-font text-center mt-2 ${isError ? 'text-red-500' : 'text-green-500'}`;
        }
    }
    // -----------------------------


    // --- FUNÇÕES DE RECUPERAÇÃO DE ERRO (GLOBALMENTE DISPONÍVEIS) ---
    // Essas funções precisam estar disponíveis em 'window' antes do catch
    window.exportSaveOnError = function() {
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
            updateErrorStatus("Save exportado com sucesso! Tente Limpar os Dados.", false);
        } catch (e) {
            updateErrorStatus(`Falha ao exportar o save: ${e.message.substring(0, 50)}`, true);
        }
    };

    window.clearLocalData = function() {
        // Implementa a lógica de limpeza de dados sem usar confirm()
        const confirmButton = document.getElementById("confirm-clear");
        const cancelButton = document.getElementById("cancel-clear");
        
        // Se a confirmação já estiver ativa, executa a limpeza
        if (confirmButton && confirmButton.style.display !== 'none') {
            localStorage.removeItem("pokemonGameProfile");
            localStorage.removeItem("pokemonGameExploreLog");
            updateErrorStatus("Dados locais limpos. Recarregando...", false);
            setTimeout(() => window.location.reload(), 1000);
            return;
        }

        // Caso contrário, mostra a confirmação
        const initialButton = document.getElementById("clear-button-initial");
        if (initialButton) initialButton.style.display = 'none';

        if (confirmButton && cancelButton) {
            confirmButton.style.display = 'block';
            cancelButton.style.display = 'block';
        }
        updateErrorStatus("Confirme: ISSO APAGARÁ SEU PROGRESO!", true);
    };
    
    // Função auxiliar para cancelar a limpeza
    window.cancelClearData = function() {
        const initialButton = document.getElementById("clear-button-initial");
        const confirmButton = document.getElementById("confirm-clear");
        const cancelButton = document.getElementById("cancel-clear");
        
        if (initialButton) initialButton.style.display = 'block';
        if (confirmButton) confirmButton.style.display = 'none';
        if (cancelButton) cancelButton.style.display = 'none';
        updateErrorStatus("", false); // Limpa a mensagem de status
    };
    // -----------------------------------------------------------------


    try {
        // === PONTO DE INJEÇÃO DE ERRO ===
        // ALTERE A LINHA ABAIXO PARA SIMULAR UM ERRO DE CARREGAMENTO:
        // Exemplo: await import(`./config_utils_BROKEN.js${v}`);
        const configModule = await import(`./config_utils.js${v}`); // <-- ERRO INJETADO AQUI!
        // ================================
        
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
        
        // NOVO TRATAMENTO: Tenta extrair a mensagem de erro em diferentes formatos.
        let errorMessage = "Erro de carregamento desconhecido.";
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        } else if (e.toString) {
            // Caso em que o erro é um objeto, mas não uma instância de Error (ex: objeto Promise rejection)
            errorMessage = e.toString();
        }
        
        // Garante que a tela de carregamento seja substituída por um erro se a importação falhar.
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
                            <strong>Detalhe:</strong> ${errorMessage.substring(0, 150)}
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
