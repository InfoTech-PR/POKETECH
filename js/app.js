/**
 * js/app.js
 * PONTO DE ENTRADA GLOBAL
 * Importa todos os módulos e os expõe ao escopo global (window)
 * para que o HTML possa acessar as funções diretamente.
 */

import { GameConfig, initializeGameState, Utils, PokeAPI } from './config_utils.js';
import { GameLogic } from './game_logic.js';
import { BattleCore } from './battle_core.js';
import { PvpCore } from './pvp_core.js';
import { Renderer } from './renderer.js';
import { AuthSetup } from './auth_setup.js';

// --- INÍCIO DA APLICAÇÃO ---
window.onload = AuthSetup.initAuth;

// --- EXPORTAÇÕES GLOBAIS (Para o escopo do HTML) ---
// Módulos Completos
window.GameConfig = GameConfig;
window.PokeAPI = PokeAPI;
window.GameLogic = GameLogic;
window.BattleCore = BattleCore;
window.PvpCore = PvpCore;
window.Renderer = Renderer;
window.Utils = Utils;

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
window.setPokemonAsActive = GameLogic.setPokemonAsActive; // NOVA EXPORTAÇÃO

// --- NOVAS EXPORTAÇÕES DE PREFERÊNCIAS ---
window.updateVolume = Utils.updateVolume;
window.toggleMute = Utils.toggleMute;
// -----------------------------------------

// Exporta AuthSetup para ser o ponto de partida no index.html
export { AuthSetup };
