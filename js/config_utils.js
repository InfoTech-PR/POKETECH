// config_utils.js
// MÓDULO DE CONFIGURAÇÕES E UTILS
// O arquivo agora exporta uma função assíncrona que inicializa todas as constantes após carregar os dados locais com cache-busting.

export async function createConfigAndUtils(v) {
  // Importação dinâmica com cache-busting (V = "?v=123456789")
  // O módulo local_poke_data.js é carregado aqui para garantir que esteja atualizado.
  const localDataModule = await import(`./local_poke_data.js${v}`);
  const { POKE_DATA, SPECIES_DATA, EVOLUTION_CHAINS } = localDataModule;

  // 1. Definição do GameConfig
  const GameConfig = {
    POKEBALL_BASE_CATCH_RATE: 100,
    STARTERS: ["bulbasaur", "charmander", "squirtle"],
    EVOLUTION_COST: 500,
    HEAL_COST_PER_POKE: 50,
    SHOP_ITEMS: [
      {
        name: "Pokébola",
        quantity: 0,
        catchRate: 1.0,
        cost: 200,
        spriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
      },
      {
        name: "Great Ball",
        quantity: 0,
        catchRate: 1.5,
        cost: 600,
        spriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
      },
      {
        name: "Ultra Ball",
        quantity: 0,
        catchRate: 2.0,
        cost: 1200,
        spriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
      },
      {
        name: "Poção",
        quantity: 0,
        healAmount: 20,
        cost: 300,
        spriteUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png",
      },
    ],
    // Limite da Pokédex baseado nos dados locais
    POKEDEX_LIMIT: Object.keys(POKE_DATA).length,
    EXP_BASE: 100,
    EXP_GROWTH_RATE: 1.35,
    HP_BASE_MULTIPLIER: 0.8,
    HP_LEVEL_MULTIPLIER: 0.25,
  };

  // 2. Definição do initializeGameState
  function initializeGameState() {
    window.gameState = {
      profile: {
        trainerName: "NOVO TREINADOR",
        money: 3000,
        items: GameConfig.SHOP_ITEMS.map((item) => ({
          ...item,
          quantity: item.name === "Pokébola" ? 10 : 5,
        })),
        pokemon: [],
        trainerGender: "MALE",
        pokedex: new Set(),
        preferences: {
          volume: 0.5,
          isMuted: false,
        },
      },
      pokedexCache: {}, // Garante que o cache é inicializado como objeto vazio
      currentScreen: "mainMenu",
      battle: null,
      pvpRoomId: null,
      exploreLog: ["Bem-vindo ao Pokémon GBA RPG!"],
    };
  }

  // 3. Definição do Utils
  const Utils = {
    saveGame: function () {
      try {
        const stateToSave = { ...window.gameState };
        delete stateToSave.battle;
        delete stateToSave.pvpRoomId;

        const profileToSave = {
          ...stateToSave.profile,
          pokedex: Array.from(stateToSave.profile.pokedex),
        };

        localStorage.setItem(
          "pokemonGamePokedexCache",
          JSON.stringify(stateToSave.pokedexCache)
        );
        localStorage.setItem("pokemonGameProfile", JSON.stringify(profileToSave));
        localStorage.setItem(
          "pokemonGameExploreLog",
          JSON.stringify(stateToSave.exploreLog)
        );
        console.log("Jogo Salvo com Sucesso!");
      } catch (error) {
        console.error("Erro ao salvar jogo:", error);
      }
    },

    loadGame: function () {
      try {
        const savedProfile = localStorage.getItem("pokemonGameProfile");
        const savedExploreLog = localStorage.getItem("pokemonGameExploreLog");
        const savedPokedexCache = localStorage.getItem("pokemonGamePokedexCache");

        if (savedProfile) {
          window.gameState.profile = JSON.parse(savedProfile);

          if (window.gameState.profile.pokedex) {
            if (!Array.isArray(window.gameState.profile.pokedex)) {
              console.warn(
                "Pokedex carregada com formato inválido. Inicializando como array vazio."
              );
              window.gameState.profile.pokedex = [];
            }
            window.gameState.profile.pokedex = new Set(
              window.gameState.profile.pokedex
            );
          } else {
            window.gameState.profile.pokedex = new Set();
          }

          window.gameState.pokedexCache = savedPokedexCache
            ? JSON.parse(savedPokedexCache)
            : {};

          if (!window.gameState.profile.preferences) {
            window.gameState.profile.preferences = {
              volume: 0.5,
              isMuted: false,
            };
          }

          // Garante que os itens carregados tenham a spriteUrl.
          window.gameState.profile.items = window.gameState.profile.items.map(
            (savedItem) => {
              const configItem = GameConfig.SHOP_ITEMS.find(
                (c) => c.name === savedItem.name
              );
              return {
                ...savedItem,
                spriteUrl: configItem?.spriteUrl || "", // Adiciona a URL do sprite se existir
              };
            }
          );

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

    resetGameData: function () {
      try {
        localStorage.removeItem("pokemonGameProfile");
        localStorage.removeItem("pokemonGameExploreLog");
        localStorage.removeItem("pokemonGamePokedexCache");
        console.log("Dados do jogo resetados.");

        window.Utils.showModal(
          "infoModal",
          "Dados apagados com sucesso! Recarregando..."
        );
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        console.error("Erro ao resetar dados:", e);
        window.Utils.showModal("errorModal", "Falha ao resetar os dados.");
      }
    },

    registerPokemon: function (pokemonId) {
      if (!window.gameState || !window.gameState.profile) return;

      if (!(window.gameState.profile.pokedex instanceof Set)) {
        let iterablePokedex = [];

        if (Array.isArray(window.gameState.profile.pokedex)) {
          iterablePokedex = window.gameState.profile.pokedex;
        }

        window.gameState.profile.pokedex = new Set(iterablePokedex);
        console.warn("Pokedex re-inicializada como Set.");
      }

      const id = parseInt(pokemonId);
      if (!window.gameState.profile.pokedex.has(id)) {
        window.gameState.profile.pokedex.add(id);
        console.log(`Pokémon ID ${id} registrado na Pokédex.`);
        Utils.saveGame();
      }
    },

    applyVolume: function (volume, isMuted) {
      if (window.backgroundMusic) {
        window.backgroundMusic.volume = isMuted ? 0 : volume;
      }
    },

    updateVolume: function (newVolume) {
      window.gameState.profile.preferences.volume = parseFloat(newVolume);
      window.gameState.profile.preferences.isMuted = false;
      Utils.applyVolume(
        window.gameState.profile.preferences.volume,
        false
      );
      if (window.Renderer) {
        window.Renderer.renderPreferences(
          document.getElementById("app-container")
        );
      }
    },

    toggleMute: function () {
      const prefs = window.gameState.profile.preferences;
      prefs.isMuted = !prefs.isMuted;
      Utils.applyVolume(prefs.volume, prefs.isMuted);
      Utils.saveGame();
      if (window.Renderer) {
        window.Renderer.renderPreferences(
          document.getElementById("app-container")
        );
      }
    },

    showModal: function (id, message = "") {
      const modal = document.getElementById(id);
      if (!modal) return;
      const messageElement = modal.querySelector(".modal-message");
      if (messageElement) {
        messageElement.textContent = message;
      }
      modal.classList.remove("hidden");
    },

    hideModal: function (id) {
      document.getElementById(id).classList.add("hidden");
    },

    formatName: function (name) {
      return name
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    },

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

    calculateMaxHp: function (baseHp, level) {
      const { HP_BASE_MULTIPLIER, HP_LEVEL_MULTIPLIER } = GameConfig;

      let finalMaxHp = Math.floor(
        baseHp * HP_BASE_MULTIPLIER + level * HP_LEVEL_MULTIPLIER + 10
      );

      finalMaxHp = Math.max(10, finalMaxHp);

      return finalMaxHp;
    },

    calculateExpToNextLevel: function (level) {
      const { EXP_BASE, EXP_GROWTH_RATE } = GameConfig;
      return Math.floor(EXP_BASE * Math.pow(level + 1, EXP_GROWTH_RATE));
    },
  };

  // 4. Definição do registerExistingPokemonOnLoad
  function registerExistingPokemonOnLoad() {
    if (
      window.gameState &&
      window.gameState.profile &&
      window.gameState.profile.pokemon
    ) {
      window.gameState.profile.pokemon.forEach((p) => {
        if (p.id) {
          Utils.registerPokemon(p.id);
        }
      });
    }
  }

  // 5. Definição do PokeAPI (agora com dados locais)
  const PokeAPI = {
    /**
     * Obtém os dados de Pokémon de POKE_DATA (local).
     * @param {number|string} idOrName - ID ou nome do Pokémon (localizado em POKE_DATA).
     * @param {boolean} isPokedexView - Se é para visualização na Pokédex (usa stats base).
     * @returns {object|null} Dados formatados do Pokémon.
     */
    async fetchPokemonData(idOrName, isPokedexView = false) {
      let pokemonId = String(idOrName).toLowerCase();

      if (isNaN(parseInt(pokemonId))) {
        const foundEntry = Object.values(POKE_DATA).find(
          (p) => p.name.toLowerCase() === pokemonId
        );
        if (foundEntry) {
          pokemonId = String(foundEntry.id);
        } else {
          console.error(`Pokémon ${idOrName} não encontrado nos dados locais.`);
          return null;
        }
      } else {
        pokemonId = String(idOrName);
      }
      
      const data = POKE_DATA[pokemonId];

      if (!data) {
        console.error(`Dados para o ID ${pokemonId} não encontrados.`);
        return null;
      }

      const initialLevel = 5;
      const baseHp = data.stats.hp;
      const calculatedMaxHp = Utils.calculateMaxHp(baseHp, initialLevel);

      const result = {
        name: data.name,
        id: data.id,
        // Os sprites agora vêm do objeto de dados local
        sprite: data.front_sprite, 
        backSprite: data.back_sprite,
        stats: data.stats,
        maxHp: isPokedexView ? baseHp : calculatedMaxHp,
        level: initialLevel,
        currentHp: isPokedexView ? baseHp : calculatedMaxHp,
        exp: 0,
        moves: data.moves.slice(0, 4),
        types: data.types,
      };

      // === CORREÇÃO DE SEGURANÇA AQUI ===
      // Garante que o estado do jogo e o cache existam antes de tentar escrever.
      if (window.gameState && window.gameState.pokedexCache) { 
        if (result.id) {
          // Preenche o cache para a Pokédex (para que o filtro funcione)
          window.gameState.pokedexCache[result.id] = {
            name: result.name,
            types: result.types,
            spriteUrl: result.sprite // Adiciona o sprite (front) para uso no grid da Pokédex
          };
        }

        if (!isPokedexView) {
          Utils.registerPokemon(result.id);
        }
      } else {
         // Ocorre apenas na primeira chamada de explore, antes de inicializar a UI.
         console.warn("Aviso: window.gameState ou pokedexCache não totalmente inicializados ao buscar Pokémon selvagem.");
      }
      // === FIM DA CORREÇÃO DE SEGURANÇA ===
      
      // O sprite na tela de batalha é sempre o front_sprite, a menos que seja um backSprite (que é tratado no battle_core)
      if (window.gameState.currentScreen === 'battle' && !isPokedexView) {
          result.sprite = data.front_sprite;
      }


      return result;
    },

    /**
     * Obtém a próxima evolução de um Pokémon.
     */
    fetchNextEvolution: async function (pokemonId) {
      const chains = Object.values(EVOLUTION_CHAINS);

      for (const chain of chains) {
        const currentIndex = chain.findIndex((p) => p.id === pokemonId);
        if (currentIndex !== -1) {
          const nextEvolution = chain[currentIndex + 1];
          if (nextEvolution) {
            return nextEvolution.name.toLowerCase();
          }
          return null;
        }
      }
      return null;
    },

    /**
     * Obtém dados de espécie do SPECIES_DATA local.
     */
    fetchSpeciesData: async function (pokemonId) {
      const data = SPECIES_DATA[String(pokemonId)];
      if (data) {
        return {
          description: data.description.replace(/\n/g, " "),
          height: data.height,
          weight: data.weight,
          isLegendary: data.isLegendary,
          isMythical: data.isMythical,
        };
      }
      return { description: "Descrição não encontrada.", height: 0, weight: 0 };
    },

    /**
     * Obtém a cadeia evolutiva de um Pokémon do EVOLUTION_CHAINS local.
     */
    fetchEvolutionChainData: async function (pokemonId) {
      const chains = Object.values(EVOLUTION_CHAINS);

      const chainFound = chains.find(chain => chain.some(p => p.id === pokemonId));

      if (chainFound) {
          return chainFound.map(p => ({
              id: p.id,
              name: p.name
          }));
      }
      
      const selfData = POKE_DATA[String(pokemonId)];
      if(selfData) {
          return [{ id: selfData.id, name: selfData.name }];
      }
      
      return [];
    },
  };

  return {
    GameConfig,
    initializeGameState,
    Utils,
    PokeAPI,
    registerExistingPokemonOnLoad
  };
}
