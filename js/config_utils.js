// config_utils.js
// MÓDULO DE CONFIGURAÇÕES E UTILS

export const GameConfig = {
  POKEAPI_BASE: "https://pokeapi.co/api/v2/pokemon/",
  SPECIES_BASE: "https://pokeapi.co/api/v2/pokemon-species/",
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
  // Novo: Define o limite de Pokémons para a Pokédex (Geração 1)
  POKEDEX_LIMIT: 151,
  // COEFICIENTES AJUSTADOS PARA BALANCEAMENTO DE XP
  EXP_BASE: 100, // AUMENTADO: EXP base para um Pokémon de Nível 1
  EXP_GROWTH_RATE: 1.35, // AUMENTADO: Multiplicador para EXP necessária por nível (curva um pouco mais íngreme)
  // NOVO: Coeficientes para o cálculo de HP
  HP_BASE_MULTIPLIER: 0.8,
  HP_LEVEL_MULTIPLIER: 0.25,
};

export function initializeGameState() {
  window.gameState = {
    profile: {
      trainerName: "NOVO TREINADOR",
      money: 3000,
      // Garante que o GameConfig.SHOP_ITEMS seja usado como base,
      // e que o `spriteUrl` seja copiado
      items: window.GameConfig.SHOP_ITEMS.map((item) => ({
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
    pokedexCache: {},
    currentScreen: "mainMenu",
    battle: null,
    pvpRoomId: null,
    exploreLog: ["Bem-vindo ao Pokémon GBA RPG!"],
  };
}

export const Utils = {
  saveGame: function () {
    try {
      const stateToSave = { ...window.gameState };
      delete stateToSave.battle;
      delete stateToSave.pvpRoomId;

      // Converte o Set (pokedex) para Array antes de salvar
      const profileToSave = {
        ...stateToSave.profile,
        pokedex: Array.from(stateToSave.profile.pokedex),
      };

      // Salva o cache de Pokédex
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
        
        // CORREÇÃO: Garante que os itens carregados tenham a spriteUrl.
        // Isso é crucial para que a loja não quebre se houver itens antigos no save.
        window.gameState.profile.items = window.gameState.profile.items.map(savedItem => {
            const configItem = GameConfig.SHOP_ITEMS.find(c => c.name === savedItem.name);
            return {
                ...savedItem,
                spriteUrl: configItem?.spriteUrl || '' // Adiciona a URL do sprite se existir
            };
        });


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
      window.Utils.saveGame(); // Salva o registro imediatamente
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
    window.Utils.applyVolume(
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
    window.Utils.applyVolume(prefs.volume, prefs.isMuted);
    window.Utils.saveGame();
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

    // Fórmula revisada: Foca mais no baseHp e tem um crescimento linear por nível.
    // HP Final = Base + (Base * Multiplicador Base) + (Nível * Multiplicador Nível)
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

  async fetchPokemonData(nameOrId, isPokedexView = false) {
    try {
      if (!window.gameState.pokedexCache) {
        window.gameState.pokedexCache = {};
      }
      const response = await axios.get(`${GameConfig.POKEAPI_BASE}${nameOrId}`);
      const data = response.data;
      const moves = data.moves.slice(0, 4).map((m) => m.move.name);
      const stats = {};
      data.stats.forEach((s) => {
        stats[s.stat.name.replace("-", "")] = s.base_stat;
      });
      const initialLevel = 5;

      const baseHp = stats.hp;
      const calculatedMaxHp = Utils.calculateMaxHp(baseHp, initialLevel);
      const types = data.types.map((t) => t.type.name);

      const pokemonId = data.id;
      if (pokemonId) {
        window.gameState.pokedexCache[pokemonId] = {
          name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
          types: types,
        };
      }

      if (!isPokedexView) {
        Utils.registerPokemon(data.id);
      }
      return {
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        id: pokemonId,
        sprite: data.sprites.front_default,
        stats: stats,
        maxHp: isPokedexView ? baseHp : calculatedMaxHp,
        level: initialLevel,
        currentHp: isPokedexView ? baseHp : calculatedMaxHp,
        exp: 0,
        moves: moves,
        types: types,
      };
    } catch (error) {
      console.error(`Erro ao buscar dados de ${nameOrId} na PokéAPI:`, error);
      return null;
    }
  },
};

export function registerExistingPokemonOnLoad() {
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

export const PokeAPI = {
  fetchPokemonData: Utils.fetchPokemonData,

  fetchNextEvolution: async function (pokemonId) {
    const res = await fetch(`${GameConfig.SPECIES_BASE}/${pokemonId}/`);
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
  },

  speciesDataCache: {},

  fetchSpeciesData: async function (pokemonId) {
    if (PokeAPI.speciesDataCache[pokemonId]) {
      return PokeAPI.speciesDataCache[pokemonId];
    }

    try {
      const response = await axios.get(
        `${GameConfig.SPECIES_BASE}${pokemonId}`
      );
      const speciesData = response.data;

      const entry = speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === "pt" || entry.language.name === "en"
      );

      const pokemonDataRes = await axios.get(
        `${GameConfig.POKEAPI_BASE}${pokemonId}`
      );
      const pokemonData = pokemonDataRes.data;

      const data = {
        description: entry
          ? entry.flavor_text.replace(/\n/g, " ")
          : "Descrição não encontrada.",
        height: pokemonData.height,
        weight: pokemonData.weight,
        isLegendary: speciesData.is_legendary, 
        isMythical: speciesData.is_mythical, 
      };

      PokeAPI.speciesDataCache[pokemonId] = data;
      return data;
    } catch (error) {
      console.error(
        `Erro ao buscar dados de espécie para ID ${pokemonId}:`,
        error
      );
      return { description: "Descrição não encontrada.", height: 0, weight: 0 };
    }
  },
  
  // NOVO: Função para buscar toda a cadeia evolutiva
  evolutionChainCache: {},

  fetchEvolutionChainData: async function (pokemonId) {
    if (PokeAPI.evolutionChainCache[pokemonId]) {
      return PokeAPI.evolutionChainCache[pokemonId];
    }
    
    try {
      // 1. Obter URL da Cadeia de Evolução
      const speciesRes = await axios.get(`${GameConfig.SPECIES_BASE}${pokemonId}`);
      const chainUrl = speciesRes.data.evolution_chain.url;

      // 2. Obter Dados da Cadeia
      const evoRes = await axios.get(chainUrl);
      const evoChain = evoRes.data.chain;

      const evolutionData = [];

      function parseChain(chain) {
        // Extrai o ID do URL
        const urlParts = chain.species.url.split('/');
        const id = parseInt(urlParts[urlParts.length - 2]);
        
        evolutionData.push({
          id: id,
          name: chain.species.name,
        });

        if (chain.evolves_to.length > 0) {
          parseChain(chain.evolves_to[0]);
        }
      }

      parseChain(evoChain);
      
      // O cache será mapeado pelo ID do Pokémon inicial (mais baixo da cadeia)
      // Para Pokémons no meio ou final da cadeia, a chave será o ID do primeiro Pokémon.
      const initialId = evolutionData.length > 0 ? evolutionData[0].id : pokemonId;
      PokeAPI.evolutionChainCache[initialId] = evolutionData;
      
      return evolutionData;
      
    } catch (error) {
      console.error(`Erro ao buscar cadeia evolutiva para ID ${pokemonId}:`, error);
      return [];
    }
  },
};
