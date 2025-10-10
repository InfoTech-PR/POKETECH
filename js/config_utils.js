// config_utils.js
// MÓDULO DE CONFIGURAÇÕES E UTILS
// O arquivo agora exporta uma função assíncrona que inicializa todas as constantes após carregar os dados locais com cache-busting.

export async function createConfigAndUtils(v) {
  // Importação dinâmica com cache-busting (V = "?v=123456789")
  // O módulo local_poke_data.js é carregado aqui para garantir que esteja atualizado.
  const [localDataModule, branchedEvosModule] = await Promise.all([
    import(`./local_poke_data.js${v}`),
    import(`./branched_evos.js${v}`),
  ]);

  const { POKE_DATA, SPECIES_DATA, EVOLUTION_CHAINS, REVERSE_BRANCHED_EVOS } = localDataModule;
  const { BRANCHED_EVOS } = branchedEvosModule; // Importa as regras de ramificação

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
        catchRate: 0.5,
        cost: 200,
        spriteUrl:
          "../assets/sprites/items/poke-ball.png",
      },
      {
        name: "Great Ball",
        quantity: 0,
        catchRate: 1.0,
        cost: 600,
        spriteUrl:
          "../assets/sprites/items/great-ball.png",
      },
      {
        name: "Ultra Ball",
        quantity: 0,
        catchRate: 1.5,
        cost: 1200,
        spriteUrl:
          "../assets/sprites/items/ultra-ball.png",
      },
      {
        name: "Poção",
        quantity: 0,
        healAmount: 20,
        cost: 300,
        spriteUrl:
          "../assets/sprites/items/potion.png",
      },
    ],
    // Limite da Pokédex baseado nos dados locais
    POKEDEX_LIMIT: Object.keys(POKE_DATA).length,
    EXP_BASE: 100,
    EXP_GROWTH_RATE: 1.35,
    HP_BASE_MULTIPLIER: 0.8,
    HP_LEVEL_MULTIPLIER: 0.25,

    // NOVO: Mapeamento de Regiões
    POKEDEX_REGIONS: [
      { name: "KANTO", id: "kanto", startId: 1, endId: 151, starters: [1, 4, 7] },
      { name: "JOHTO", id: "johto", startId: 152, endId: 251, starters: [152, 155, 158] },
      { name: "HOENN", id: "hoenn", startId: 252, endId: 386, starters: [252, 255, 258] },
      { name: "SINNOH", id: "sinnoh", startId: 387, endId: 493, starters: [387, 390, 393] },
      { name: "UNOVA", id: "unova", startId: 494, endId: 649, starters: [495, 498, 501] },
      { name: "KALOS", id: "kalos", startId: 650, endId: 721, starters: [650, 653, 656] },
      { name: "ALOLA", id: "alola", startId: 722, endId: 809, starters: [722, 725, 728] },
      { name: "GALAR", id: "galar", startId: 810, endId: 898, starters: [810, 813, 816] },
      { name: "PALDEA", id: "paldea", startId: 906, endId: 1025, starters: [906, 909, 912] },
    ]
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
          isBetaMode: false, // NOVO: Flag para o modo Beta
        },
        // NOVO: Última Localização (Usado para o mapa)
        lastLocation: {
          lat: -25.5317, // Default: Curitiba, PR, Brasil (Ponto central razoável)
          lng: -49.2707,
          timestamp: Date.now(),
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
              isBetaMode: false, // Garante que a flag exista ao carregar
            };
          } else if (window.gameState.profile.preferences.isBetaMode === undefined) {
            // Caso tenha preferências mas falte a nova flag
            window.gameState.profile.preferences.isBetaMode = false;
          }

          // Garante que a localização exista com defaults se ausente
          if (!window.gameState.profile.lastLocation) {
            window.gameState.profile.lastLocation = {
              lat: -25.5317,
              lng: -49.2707,
              timestamp: Date.now(),
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

        window.gameState.profile.pokedex = new Set(
          iterablePokedex
        );
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

    // NOVO: Função para alternar o modo Beta
    toggleBetaMode: function () {
      const prefs = window.gameState.profile.preferences;
      prefs.isBetaMode = !prefs.isBetaMode;
      Utils.saveGame();

      // Redireciona para o menu principal para aplicar a nova navegação
      if (window.Renderer) {
        window.Utils.showModal("infoModal", `Modo BETA ${prefs.isBetaMode ? 'ATIVADO' : 'DESATIVADO'}.`);
        window.Renderer.showScreen('mainMenu');
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
      // CORREÇÃO: Pega o Pokémon baseado no índice armazenado na batalha,
      // sem pressupor que ele está na posição 0 do array.
      const index = window.gameState.battle?.playerPokemonIndex || 0;
      return window.gameState.profile.pokemon[index];
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

  // Helpers locais
  function idToNameLocal(id) {
    return POKE_DATA[String(id)]?.name || String(id);
  }

  function flattenBranches(branches) {
    const seen = new Set();
    const flat = [];
    for (const path of branches || []) {
      for (const node of path) {
        if (!seen.has(node.id)) {
          seen.add(node.id);
          flat.push({ id: node.id, name: node.name });
        }
      }
    }
    return flat;
  }

  function findPathToTarget(branches, targetId) {
    for (const path of branches || []) {
      const idx = path.findIndex(n => n.id === targetId);
      if (idx !== -1) {
        return path.slice(0, idx + 1).map(n => ({ id: n.id, name: n.name }));
      }
    }
    return null;
  }

  function locateChainContainingId(evoChainsObj, id) {
    // Procura a cadeia (array) que contém o id em qualquer posição
    for (const key of Object.keys(evoChainsObj)) {
      const arr = evoChainsObj[key];
      if (!Array.isArray(arr) || !arr.length) continue;
      const head = arr[0];
      // Verifica branches no head (caso base ramificado tipo Eevee, Tyrogue)
      if (head && Array.isArray(head.branches) && head.branches.length) {
        if (head.id === id) {
          return { baseKey: key, chainArr: arr, head, branchesSource: head };
        }
      }
      // Agora verifica branches em cada elemento (caso intermediário ramificado tipo Gloom, Poliwhirl, Kirlia)
      for (let i = 0; i < arr.length; i++) {
        const curr = arr[i];
        if (curr && Array.isArray(curr.branches) && curr.branches.length) {
          if (curr.id === id) {
            return { baseKey: key, chainArr: arr, head, branchesSource: curr };
          }
        }
        // Também registra se o elemento procurado existe no array (mesmo sem branches)
        if (curr && curr.id === id) {
          // Não retorna aqui, pois queremos o elemento com branches se houver, senão só identifica que existe
          // O retorno para casos lineares é tratado depois na lógica principal
        }
      }
      // Checa também se o id está no conjunto geral de ids desse array para fallback linear
      const idSet = new Set(arr.map(e => e.id));
      if (idSet.has(id)) {
        return { baseKey: key, chainArr: arr, head, branchesSource: null };
      }
    }
    return null;
  }

  // 5. Definição do PokeAPI (agora com dados locais)
  const PokeAPI = {
    /**
     * Obtém os dados de Pokémon de POKE_DATA (local).
     * @param {number|string} idOrName - ID ou nome do Pokémon (localizado em POKE_DATA).
     * @param {boolean} isPokedexView - Se é para visualização na Pokédex (usa stats base).
     * @returns {object|null} Dados formatados do Pokémon.
     */

    REVERSE_BRANCHED_EVOS: REVERSE_BRANCHED_EVOS,
    BRANCHED_EVOS: BRANCHED_EVOS,



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

      if (window.gameState && window.gameState.pokedexCache) {
        if (result.id) {
          // Popula o cache para a Pokédex
          window.gameState.pokedexCache[result.id] = {
            name: result.name,
            types: result.types,
            spriteUrl: result.sprite
          };
        }

        if (!isPokedexView) {
          Utils.registerPokemon(result.id);
        }
      } else {
        console.warn("Aviso: window.gameState ou pokedexCache não totalmente inicializados ao buscar Pokémon selvagem.");
      }

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
     * MUDANÇA: Agora incorpora as regras de ramificação para Pokémons com múltiplas evoluções.
     * @param {number} pokemonId - ID do Pokémon para buscar a cadeia.
     * @returns {Array<object>} Lista de objetos de evolução.
     */
    fetchEvolutionChainData: async function (pokemonId) {
      const id = Number(pokemonId);

      // Encontre a cadeia e possíveis ramificações no head ou intermediário
      const located = locateChainContainingId(EVOLUTION_CHAINS, id);
      if (!located) {
        // fallback: retorna apenas o próprio se não achou cadeia
        const self = POKE_DATA[String(id)];
        return self ? [{ id: self.id, name: self.name }] : [];
      }

      // Caso branches no nó principal (head) OU no intermediário (branchesSource)
      if (located.branchesSource && Array.isArray(located.branchesSource.branches) && located.branchesSource.branches.length) {
        // retorna nó + todos UNIQUE das branches desse nó
        return [
          { id: located.branchesSource.id, name: located.branchesSource.name },
          ...flattenBranches(located.branchesSource.branches)
        ];
      }

      // Caso forma evoluída ramificada (usando o mapa reverso)
      const revOrigin = REVERSE_BRANCHED_EVOS[String(id)];
      if (revOrigin) {
        console.log("revOrigin");
        console.log(revOrigin);
        // Encontra a cadeia do origin
        const originLocated = locateChainContainingId(EVOLUTION_CHAINS, revOrigin);
        if (originLocated && originLocated.branchesSource && originLocated.branchesSource.branches) {
          // Caminho da branch do origin até o id atual
          const path = findPathToTarget(originLocated.branchesSource.branches, id);
          if (path && path.length) {
            // Se o próprio revOrigin (Eevee) não está incluído, adicione
            if (path[0].id !== Number(revOrigin)) {
              return [
                { id: Number(revOrigin), name: idToNameLocal(revOrigin) },
                ...path
              ];
            }
            return path;
          }
        }
        // Fallback: [origin, target]
        return [
          { id: Number(revOrigin), name: idToNameLocal(revOrigin) },
          { id, name: idToNameLocal(id) }
        ];
      }

      // Cadeia linear: retorna tudo do array na ordem
      const { chainArr } = located;
      return chainArr.map(p => ({ id: p.id, name: p.name }));
    },

    idToName: function (id) {
      return POKE_DATA[String(id)]?.name || null;
    }
  };

  return {
    GameConfig,
    initializeGameState,
    Utils,
    PokeAPI,
    registerExistingPokemonOnLoad
  };
}
