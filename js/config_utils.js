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
    // NOVO: Ultra Ball adicionada
    { name: "Ultra Ball", quantity: 0, catchRate: 2.0, cost: 1200 },
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

export function initializeGameState() {
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
    }, // CORREÇÃO AQUI: Garante que pokedexCache seja sempre um objeto.
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
      // NOVO: Carrega o cache
      const savedPokedexCache = localStorage.getItem("pokemonGamePokedexCache");

      if (savedProfile) {
        window.gameState.profile = JSON.parse(savedProfile);

        // Converte o Array (pokedex salvo) de volta para Set
        if (window.gameState.profile.pokedex) {
          // CORREÇÃO: Usar Array.isArray para garantir que o Set seja criado a partir de um iterável (Array)
          // Caso contrário, usa um novo Set vazio.
          if (!Array.isArray(window.gameState.profile.pokedex)) {
            // Se o valor salvo não for um Array (e.g., é um objeto simples {} de um save corrompido),
            // inicializa como um Array vazio para evitar que new Set(object) quebre.
            console.warn(
              "Pokedex carregada com formato inválido. Inicializando como array vazio."
            );
            window.gameState.profile.pokedex = [];
          }
          window.gameState.profile.pokedex = new Set(
            window.gameState.profile.pokedex
          );
        } else {
          // Se o save antigo não tiver 'pokedex', inicializa com Set vazio
          window.gameState.profile.pokedex = new Set();
        }

        // NOVO: Carrega o cache de Pokédex
        window.gameState.pokedexCache = savedPokedexCache
          ? JSON.parse(savedPokedexCache)
          : {};

        // Garante que as preferências existem, mesmo que o save seja antigo
        if (!window.gameState.profile.preferences) {
          window.gameState.profile.preferences = {
            volume: 0.5,
            isMuted: false,
          };
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

  resetGameData: function () {
    try {
      localStorage.removeItem("pokemonGameProfile");
      localStorage.removeItem("pokemonGameExploreLog");
      // NOVO: Remove o cache ao resetar
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

  applyVolume: function (volume, isMuted) {
    if (window.backgroundMusic) {
      window.backgroundMusic.volume = isMuted ? 0 : volume;
    }
    // TODO: Adicionar lógica para aplicar volume a efeitos sonoros (SFX)
  },

  updateVolume: function (newVolume) {
    window.gameState.profile.preferences.volume = parseFloat(newVolume);
    window.gameState.profile.preferences.isMuted = false;
    window.Utils.applyVolume(
      window.gameState.profile.preferences.volume,
      false
    );
    // Chamada global para Renderer, que deve ser carregado no app.js
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
    // Chamada global para Renderer, que deve ser carregado no app.js
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

  calculateExpToNextLevel: function (level) {
    // Nível + 1 é usado para calcular a EXP *total* necessária para atingir esse nível.
    const { EXP_BASE, EXP_GROWTH_RATE } = GameConfig;
    return Math.floor(EXP_BASE * Math.pow(level + 1, EXP_GROWTH_RATE));
  },

  async fetchPokemonData(nameOrId, isPokedexView = false) {
    try {
      // CORREÇÃO AQUI: Garante que o cache exista antes de usá-lo.
      if (!window.gameState.pokedexCache) {
        window.gameState.pokedexCache = {};
      } // Usando Axios que foi importado no index.html

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
      const types = data.types.map((t) => t.type.name); // Registra dados no cache para uso na Pokédex

      const pokemonId = data.id;
      if (pokemonId) {
        // Esta é a linha que estava dando erro
        window.gameState.pokedexCache[pokemonId] = {
          name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
          types: types,
        };
      } // Registra o Pokémon na Pokédex APENAS se não for para visualização pura da Pokédex

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
      // Verifica se o Pokémon tem um ID antes de tentar registrar.
      if (p.id) {
        // Chamamos diretamente Utils.registerPokemon (que já está no escopo do módulo)
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

      // Busca o texto da Pokédex em português (pt) ou inglês (en) se não encontrar.
      const entry = speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === "pt" || entry.language.name === "en"
      );

      // Faz uma segunda chamada para obter peso/altura, pois a API de espécies não os tem (estão na API de Pokemons)
      const pokemonDataRes = await axios.get(
        `${GameConfig.POKEAPI_BASE}${pokemonId}`
      );
      const pokemonData = pokemonDataRes.data;

      const data = {
        description: entry
          ? entry.flavor_text.replace(/\n/g, " ")
          : "Descrição não encontrada.",
        // Altura e Peso vêm da API de Pokemons (e não da API de Espécies)
        height: pokemonData.height,
        weight: pokemonData.weight,
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
};
