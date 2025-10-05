/**
 * js/config_utils.js
 * MÓDULO 1: CONFIGURAÇÃO, UTILS E POKEAPI CORE
 */

// Firebase Imports (Necessário para o módulo de Auth e PvP)
// Importações de CDN com versão definida no URL.
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
  // Novo: Define o limite de Pokémons para a Pokédex (Geração 1)
  POKEDEX_LIMIT: 151,
  // COEFICIENTES AJUSTADOS PARA BALANCEAMENTO DE XP
  EXP_BASE: 100, // AUMENTADO: EXP base para um Pokémon de Nível 1
  EXP_GROWTH_RATE: 1.35, // AUMENTADO: Multiplicador para EXP necessária por nível (curva um pouco mais íngreme)
  // NOVO: Coeficientes para o cálculo de HP
  HP_BASE_MULTIPLIER: 0.8,
  HP_LEVEL_MULTIPLIER: 0.25,
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
            // NOVO: Conjunto (Set) para armazenar IDs de Pokémon já vistos/capturados
            pokedex: new Set(), 
            preferences: { 
                volume: 0.5,
                isMuted: false
            }
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
      
      // Converte o Set (pokedex) para Array antes de salvar
      const profileToSave = {
          ...stateToSave.profile,
          pokedex: Array.from(stateToSave.profile.pokedex)
      };

      localStorage.setItem(
        "pokemonGameProfile",
        JSON.stringify(profileToSave)
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
        
        // Converte o Array (pokedex salvo) de volta para Set
        if (window.gameState.profile.pokedex) {
            // CORREÇÃO: Usar Array.isArray para garantir que o Set seja criado a partir de um iterável (Array)
            // Caso contrário, usa um novo Set vazio.
            if (!Array.isArray(window.gameState.profile.pokedex)) {
                 // Se o valor salvo não for um Array (e.g., é um objeto simples {} de um save corrompido), 
                 // inicializa como um Array vazio para evitar que new Set(object) quebre.
                 console.warn("Pokedex carregada com formato inválido. Inicializando como array vazio.");
                 window.gameState.profile.pokedex = []; 
            }
            window.gameState.profile.pokedex = new Set(window.gameState.profile.pokedex);
        } else {
            // Se o save antigo não tiver 'pokedex', inicializa com Set vazio
            window.gameState.profile.pokedex = new Set();
        }

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
  
  /** Zera todos os dados locais do jogo e recarrega a página. */
  resetGameData: function () {
    try {
      localStorage.removeItem("pokemonGameProfile");
      localStorage.removeItem("pokemonGameExploreLog");
      console.log("Dados do jogo resetados.");
      
      window.Utils.showModal("infoModal", "Dados apagados com sucesso! Recarregando...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error("Erro ao resetar dados:", e);
      window.Utils.showModal("errorModal", "Falha ao resetar os dados.");
    }
  },

  /** Adiciona um Pokémon à Pokédex pelo seu ID. */
  registerPokemon: function (pokemonId) {
      // VERIFICAÇÃO DE SEGURANÇA: Garante que 'pokedex' é um Set antes de usá-lo.
      if (!window.gameState || !window.gameState.profile) return;
      
      // CORREÇÃO APLICADA: Esta é a linha que estava causando o erro.
      // Agora, verificamos se é um Set. Se não for, tentamos converter o valor existente
      // para um Array se for iterável, ou usamos um Array vazio.
      if (!(window.gameState.profile.pokedex instanceof Set)) {
          let iterablePokedex = [];
          
          // Se for um Array (caso de saves antigos), podemos usá-lo.
          if (Array.isArray(window.gameState.profile.pokedex)) {
              iterablePokedex = window.gameState.profile.pokedex;
          } 
          // Se for null/undefined/objeto vazio, new Set(iterablePokedex) funcionará.
          
          // Re-inicializa o Pokedex como um Set
          window.gameState.profile.pokedex = new Set(iterablePokedex); 
          console.warn("Pokedex re-inicializada como Set.");
      }
      
      const id = parseInt(pokemonId);
      if (!window.gameState.profile.pokedex.has(id)) {
          window.gameState.profile.pokedex.add(id);
          console.log(`Pokémon ID ${id} registrado na Pokédex.`);
          window.Utils.saveGame(); // Salva o registro imediatamente
      }
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
      window.Utils.applyVolume(window.gameState.profile.preferences.volume, false);
      // Chamada global para Renderer, que deve ser carregado no app.js
      if (window.Renderer) {
          window.Renderer.renderPreferences(document.getElementById("app-container"));
      }
  },
  
  /** Alterna o estado de mudo. */
  toggleMute: function () {
      const prefs = window.gameState.profile.preferences;
      prefs.isMuted = !prefs.isMuted;
      window.Utils.applyVolume(prefs.volume, prefs.isMuted);
      window.Utils.saveGame();
      // Chamada global para Renderer, que deve ser carregado no app.js
      if (window.Renderer) {
          window.Renderer.renderPreferences(document.getElementById("app-container"));
      }
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
   * Calcula o Max HP de um Pokémon com base nas estatísticas base e nível (Fórmula revisada).
   * MaxHP = (HP_Base * Multiplicador_Base) + (Nível * Multiplicador_Nível)
   * @param {number} baseHp O valor base de HP do Pokémon.
   * @param {number} level O nível atual do Pokémon.
   * @returns {number} O valor máximo de HP.
   */
  calculateMaxHp: function(baseHp, level) {
    const { HP_BASE_MULTIPLIER, HP_LEVEL_MULTIPLIER } = GameConfig;
    
    // 1. Cálculo base (representa a força inerente do Pokémon)
    const baseValue = baseHp * HP_BASE_MULTIPLIER;
    
    // 2. Cálculo de crescimento por nível
    const levelGrowth = level * HP_LEVEL_MULTIPLIER;
    
    // 3. HP Final = Arredondado(Base + Crescimento)
    let finalMaxHp = Math.floor(baseValue + levelGrowth);
    
    // Garante um valor mínimo de HP.
    finalMaxHp = Math.max(10, finalMaxHp);

    return finalMaxHp;
  },

  /**
   * Calcula a EXP necessária para o próximo nível (Fórmula revisada, mais linear).
   * EXP_Next = EXP_Base * (Nível ^ Taxa_Crescimento)
   * @param {number} level O nível atual do Pokémon.
   * @returns {number} A experiência necessária para o próximo nível.
   */
  calculateExpToNextLevel: function(level) {
      // Nível + 1 é usado para calcular a EXP *total* necessária para atingir esse nível.
      const { EXP_BASE, EXP_GROWTH_RATE } = GameConfig;
      return Math.floor(EXP_BASE * Math.pow(level + 1, EXP_GROWTH_RATE));
  },
  
  /**
   * Função auxiliar para buscar dados de Pokémon.
   * @param {string|number} nameOrId Nome ou ID do Pokémon.
   * @param {boolean} [isPokedexView=false] Indica se a busca é apenas para visualização da Pokédex (sem registro).
   */
  async fetchPokemonData(nameOrId, isPokedexView = false) {
    try {
      // Usando Axios que foi importado no index.html
      const response = await axios.get(`${GameConfig.POKEAPI_BASE}${nameOrId}`);
      const data = response.data;
      const moves = data.moves.slice(0, 4).map((m) => m.move.name);
      const stats = {};
      data.stats.forEach((s) => {
        stats[s.stat.name.replace("-", "")] = s.base_stat;
      });
      
      // Define o nível inicial para novos Pokémons. Para Pokédex, o nível é irrelevante.
      const initialLevel = 5; 

      // NOVO: Calcula o HP Máximo usando a nova lógica baseada no nível.
      const baseHp = stats.hp;
      const calculatedMaxHp = Utils.calculateMaxHp(baseHp, initialLevel);
      
      // NOVO: Registra o Pokémon na Pokédex APENAS se não for para visualização pura da Pokédex
      if (!isPokedexView) {
        Utils.registerPokemon(data.id);
      }
      
      // Retorna um objeto de dados de Pokémon
      return {
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        id: data.id,
        sprite: data.sprites.front_default,
        stats: stats,
        // Se for visualização da Pokédex, usamos o HP Base. Caso contrário, usamos o calculado.
        maxHp: isPokedexView ? baseHp : calculatedMaxHp, 
        level: initialLevel,
        currentHp: isPokedexView ? baseHp : calculatedMaxHp,
        exp: 0,
        moves: moves,
        types: data.types.map((t) => t.type.name),
      };
    } catch (error) {
      console.error(
        `Erro ao buscar dados de ${nameOrId} na PokéAPI:`,
        error
      );
      // O erro original indica que o problema é no 'has', não na API.
      // Retornar null aqui é o comportamento esperado em caso de falha de API.
      return null;
    }
  }
};

/**
 * Função para lidar com a retrocompatibilidade durante o carregamento do jogo.
 * Ela registra todos os Pokémons do time na Pokédex caso o save seja antigo e não tenha o Set 'pokedex'.
 */
export function registerExistingPokemonOnLoad() {
    // É seguro chamar aqui, pois esta função só é chamada APÓS o módulo Utils ser completamente definido.
    if (window.gameState && window.gameState.profile && window.gameState.profile.pokemon) {
        window.gameState.profile.pokemon.forEach(p => {
            // Verifica se o Pokémon tem um ID antes de tentar registrar.
            if (p.id) { 
                // Chamamos diretamente Utils.registerPokemon (que já está no escopo do módulo)
                Utils.registerPokemon(p.id);
            }
        });
    }
}


/** Lógica de API Externa (PokeAPI) */
export const PokeAPI = {
    /** Busca dados de um Pokémon e formata para o estado do jogo. */
    fetchPokemonData: Utils.fetchPokemonData,

    /** Busca a próxima evolução possível na cadeia de evolução. */
    fetchNextEvolution: async function (pokemonId) {
        // Usa GameConfig (que está no escopo do módulo)
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
