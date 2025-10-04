/**
 * js/config_utils.js
 * MÓDULO 1: CONFIGURAÇÃO, UTILS E POKEAPI CORE
 */

// Firebase Imports (Necessário para o módulo de Auth e PvP)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/** Configurações do Jogo */
export const GameConfig = {
  POKEAPI_BASE: "https://pokeapi.co/api/v2/pokemon/",
  SPECIES_BASE: "https://pokeapi.co/api/v2/pokemon-species/",
  POKEBALL_BASE_CATCH_RATE: 100,
  STARTERS: ["bulbasaur", "charmander", "squirtle"],
  EVOLUTION_COST: 500,
  HEAL_COST_PER_POKE: 50,
  SHOP_ITEMS: [
    { name: "Pokébola", quantity: 0, catchRate: 1.0, cost: 200 },
    { name: "Great Ball", quantity: 0, catchRate: 1.5, cost: 600 },
    { name: "Poção", quantity: 0, healAmount: 20, cost: 300 },
  ],
};

/**
 * Estado Global do Jogo (window.gameState)
 */
export function initializeGameState() {
    window.gameState = {
        profile: {
            trainerName: "NOVO TREINADOR",
            money: 3000,
            items: GameConfig.SHOP_ITEMS.map(item => ({...item, quantity: item.name === "Pokébola" ? 10 : 5})),
            pokemon: [],
            trainerGender: "MALE",
            // --- NOVO: Preferências ---
            preferences: { 
                volume: 0.5,
                isMuted: false
            }
            // -------------------------
        },
        currentScreen: "mainMenu",
        battle: null,
        pvpRoomId: null,
        exploreLog: ["Bem-vindo ao Pokémon GBA RPG!"],
    };
}


/** Funções Utilitárias e de Dados */
export const Utils = {
  /** Salva o estado do perfil do jogador no LocalStorage. */
  saveGame: function () {
    try {
      const stateToSave = { ...window.gameState };
      delete stateToSave.battle;
      delete stateToSave.pvpRoomId;
      
      // Salva o perfil (inclui preferências agora)
      localStorage.setItem(
        "pokemonGameProfile",
        JSON.stringify(stateToSave.profile)
      );
      localStorage.setItem(
        "pokemonGameExploreLog",
        JSON.stringify(stateToSave.exploreLog)
      );
      console.log("Jogo Salvo com Sucesso!");
    } catch (error) {
      console.error("Erro ao salvar jogo:", error);
    }
  },

  /** Carrega o estado do perfil do jogador do LocalStorage. */
  loadGame: function () {
    try {
      const savedProfile = localStorage.getItem("pokemonGameProfile");
      const savedExploreLog = localStorage.getItem("pokemonGameExploreLog");

      if (savedProfile) {
        window.gameState.profile = JSON.parse(savedProfile);
        
        // Garante que as preferências existem, mesmo que o save seja antigo
        if (!window.gameState.profile.preferences) {
            window.gameState.profile.preferences = { volume: 0.5, isMuted: false };
        }
        
        if (savedExploreLog) {
          window.gameState.exploreLog = JSON.parse(savedExploreLog);
        }
        console.log("Jogo Carregado com Sucesso!");
        return true;
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
    }
    return false;
  },
  
  /** Aplica o volume atual do estado global à música de fundo. */
  applyVolume: function (volume, isMuted) {
      if (window.backgroundMusic) {
          window.backgroundMusic.volume = isMuted ? 0 : volume;
      }
      // TODO: Adicionar lógica para aplicar volume a efeitos sonoros (SFX)
  },
  
  /** Atualiza e salva o volume no estado global. */
  updateVolume: function (newVolume) {
      window.gameState.profile.preferences.volume = parseFloat(newVolume);
      window.gameState.profile.preferences.isMuted = false;
      Utils.applyVolume(window.gameState.profile.preferences.volume, false);
      Utils.saveGame();
      Renderer.renderPreferences(document.getElementById("app-container"));
  },
  
  /** Alterna o estado de mudo. */
  toggleMute: function () {
      const prefs = window.gameState.profile.preferences;
      prefs.isMuted = !prefs.isMuted;
      Utils.applyVolume(prefs.volume, prefs.isMuted);
      Utils.saveGame();
      Renderer.renderPreferences(document.getElementById("app-container"));
  },


  /** Exibe um modal genérico. */
  showModal: function (id, message = "") {
    const modal = document.getElementById(id);
    if (!modal) return;
    const messageElement = modal.querySelector(".modal-message");
    if (messageElement) {
      messageElement.textContent = message;
    }
    modal.classList.remove("hidden");
  },

  /** Esconde um modal genérico. */
  hideModal: function (id) {
    document.getElementById(id).classList.add("hidden");
  },

  /** Formata strings para serem apresentadas na UI. */
  formatName: function (name) {
    return name
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  },
  
  /** Retorna o Pokémon ativo na batalha ou o primeiro do time. */
  getActivePokemon: function () {
      if (
          !window.gameState.battle &&
          window.gameState.profile.pokemon.length > 0
      ) {
          return window.gameState.profile.pokemon[0];
      }
      return window.gameState.profile.pokemon[
          window.gameState.battle?.playerPokemonIndex || 0
      ];
  },
  
  /**
   * Função auxiliar para buscar dados de Pokémon.
   */
  async fetchPokemonData(nameOrId) {
    try {
      const response = await axios.get(`${GameConfig.POKEAPI_BASE}${nameOrId}`);
      const data = response.data;
      const moves = data.moves.slice(0, 4).map((m) => m.move.name);
      const stats = {};
      data.stats.forEach((s) => {
        stats[s.stat.name.replace("-", "")] = s.base_stat;
      });

      return {
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        id: data.id,
        sprite: data.sprites.front_default,
        stats: stats,
        level: 5,
        currentHp: stats.hp,
        maxHp: stats.hp,
        exp: 0,
        moves: moves,
        types: data.types.map((t) => t.type.name),
      };
    } catch (error) {
      console.error(
        `Erro ao buscar dados de ${nameOrId} na PokéAPI:`,
        error
      );
      return null;
    }
  }
};

/** Lógica de API Externa (PokeAPI) */
export const PokeAPI = {
    /** Busca dados de um Pokémon e formata para o estado do jogo. */
    fetchPokemonData: Utils.fetchPokemonData,

    /** Busca a próxima evolução possível na cadeia de evolução. */
    fetchNextEvolution: async function (pokemonId) {
        const res = await fetch(
          `${GameConfig.SPECIES_BASE}/${pokemonId}/`
        );
        if (!res.ok) return null;
    
        const species = await res.json();
        if (!species.evolution_chain) return null;
    
        const evoRes = await fetch(species.evolution_chain.url);
        if (!evoRes.ok) return null;
    
        const evoChain = await evoRes.json();
    
        function findNext(chain, currentId) {
          if (chain.species.url.endsWith(`${currentId}/`)) {
            if (chain.evolves_to.length > 0) {
              return chain.evolves_to[0].species.name;
            }
            return null;
          }
          for (let next of chain.evolves_to) {
            const res = findNext(next, currentId);
            if (res) return res;
          }
          return null;
        }
    
        return findNext(evoChain.chain, pokemonId);
    }
}
