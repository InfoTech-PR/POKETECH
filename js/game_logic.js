import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Certifique-se de que estas constantes estão disponíveis via importação ou globalmente (do local_poke_data.js)
// Como estamos em um ambiente modular, vamos assumir que as constantes do local_poke_data
// estão disponíveis globalmente (como é prática neste projeto) ou que o bundler as injetará.
function sanitizeForFirestore(input, depth = 0) {
  if (input === undefined) return undefined;
  if (input === null) return null;
  if (depth >= 20) return null; // evita ultrapassar o limite de profundidade
  const t = typeof input;

  if (t === 'number') return Number.isFinite(input) ? input : null;
  if (t === 'bigint') return input.toString();
  if (t === 'string' || t === 'boolean') return input;
  if (input instanceof Date) return input; // Firestore converte Date para Timestamp

  if (Array.isArray(input)) {
    const arr = input
      .map(v => sanitizeForFirestore(v, depth + 1))
      .filter(v => v !== undefined); // arrays não podem conter undefined
    return arr;
  }

  if (input instanceof Set) {
    return Array.from(input).map(v => sanitizeForFirestore(v, depth + 1));
  }

  if (input instanceof Map) {
    const obj = {};
    for (const [k, v] of input.entries()) {
      const sv = sanitizeForFirestore(v, depth + 1);
      if (sv !== undefined) obj[k] = sv;
    }
    return obj;
  }

  if (t === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      const sv = sanitizeForFirestore(v, depth + 1);
      if (sv !== undefined) out[k] = sv; // Firestore rejeita undefined
    }
    return out;
  }

  // Funções, símbolos e tipos não serializáveis
  return null;
}
export const GameLogic = {
  // ==== Helpers de evolução ramificada (novos) ====

  // Item de evolução pendente (ex.: definido pela UI ao clicar "Usar Pedra")
  _pendingEvolutionItem: null,

  // ==== Sistema de Doces de Pokémon ====
  
  // Adiciona doce quando Pokémon é capturado ou solto
  addPokemonCandy: function(pokemonId, amount = 1) {
    if (!window.gameState.profile.pokemonCandy) {
      window.gameState.profile.pokemonCandy = {};
    }
    const currentCandy = window.gameState.profile.pokemonCandy[pokemonId] || 0;
    window.gameState.profile.pokemonCandy[pokemonId] = currentCandy + amount;
  },

  // Obtém a quantidade de doces de um Pokémon
  getPokemonCandy: function(pokemonId) {
    if (!window.gameState.profile.pokemonCandy) {
      window.gameState.profile.pokemonCandy = {};
    }
    return window.gameState.profile.pokemonCandy[pokemonId] || 0;
  },

  // Verifica se tem doces suficientes para evoluir (baseado no nível)
  canEvolveWithCandy: function(level) {
    if (level >= 35) {
      return 500;
    } else if (level >= 22) {
      return 300;
    } else if (level >= 16) {
      return 200;
    }
    return null; // Não pode evoluir neste nível
  },

  // Obtém os requisitos de evolução (nível e doces)
  getEvolutionRequirements: function(level) {
    if (level >= 35) {
      return { level: 35, candy: 500 };
    } else if (level >= 22) {
      return { level: 22, candy: 300 };
    } else if (level >= 16) {
      return { level: 16, candy: 200 };
    }
    return null; // Não pode evoluir
  },

  // Consumo simples de item por nome
  consumeItem: function (itemName) {
    if (!itemName) return false;
    const inv = window.gameState?.profile?.items || [];
    const it = inv.find(i => i.name?.toLowerCase() === itemName.toLowerCase());
    if (it && it.quantity > 0) {
      it.quantity -= 1;
      return true;
    }
    return false;
  },

  // Nome por ID usando POKE_DATA (se exposto) ou PokeAPI
  _getNameById: function (id) {
    const byData = window.POKE_DATA?.[String(id)]?.name;
    if (byData) return byData;
    const byApi = window.PokeAPI?.idToName?.(id);
    if (byApi) return byApi;
    return `#${id}`;
  },

  // Resolver alvo quando há ramificação
  resolveBranchTargetId: function (current, ctx) {
    // Usa o novo mapeamento de evoluções
    const hasBranch = window.BRANCHED_EVOS?.[String(current.id)];

    if (!hasBranch) return null;

    if (typeof window.GameLogic.resolveBranchedEvolution === 'function') {
      // Chama a função auxiliar que está em evolution_rules.js
      return window.GameLogic.resolveBranchedEvolution(current, ctx);
    }
    return null;
  },

  // ==== Código original + ajustes ====

  addExploreLog: function (message) {
    if (!window.gameState.exploreLog) {
      window.gameState.exploreLog = [];
    }

    // Adiciona a nova mensagem
    window.gameState.exploreLog.push(message);

    // Mantém apenas os últimos 3 registros
    if (window.gameState.exploreLog.length > 3) {
      window.gameState.exploreLog = window.gameState.exploreLog.slice(-3);
    }

    // Atualiza a tela principal (modo clássico)
    if (window.gameState.currentScreen === "mainMenu") {
      const resultBox = document.getElementById("explore-result");
      if (resultBox) {
        // Exibe apenas a última mensagem para o modo clássico
        resultBox.innerHTML = window.gameState.exploreLog.slice(-1)[0];
      }
      // Reabilita o botão de exploração
      const button = document.getElementById("explore-action-btn");
      if (button) {
        button.disabled = false;
        button.style.cursor = 'pointer';
        button.classList.remove("spinning");
      }
    }

    // Se estiver no mapa, o MapCore se encarrega de ler o log completo.
  },

  saveGameData: async function () {
    // Salva no LocalStorage
    window.Utils.saveGame(); // Salva no Firestore apenas se o usuário estiver logado

    if (
      window.db &&
      window.auth.currentUser &&
      !window.auth.currentUser.isAnonymous
    ) {
      try {

        const profileToSave = { ...window.gameState.profile };
        profileToSave.pokedex = Array.from(profileToSave.pokedex);
        const docRef = doc(window.db, "users", window.userId);
        const profileSanitized = sanitizeForFirestore(profileToSave);

        await setDoc(docRef, profileSanitized, { merge: true });
        console.log("Dados salvos no Firestore com sucesso!");
      } catch (error) {
        console.error("Erro ao salvar dados no Firestore:", error);
      }
    }
  },

  saveProfile: function (options = {}) {
    const { redirectTo = null, showSuccess = true } = options;

    // Inputs de EDIÇÃO (quando estiver na tela de editar perfil)
    const editNameEl = document.getElementById("newTrainerName");
    const editGenderEl = document.querySelector('input[name="newTrainerGender"]:checked');

    // Input INICIAL (tela de criação) — apenas para nome
    const initNameEl = document.getElementById("trainerNameInput");

    // Nome: prioriza edição -> inicial -> gameState, usando ?? para evitar fallback em ''
    const nameRaw =
      (editNameEl ? editNameEl.value : undefined) ??
      (initNameEl ? initNameEl.value : undefined) ??
      (window.gameState?.profile?.trainerName ?? "");

    // Gênero: prioriza edição se houver radio na tela de edição, senão usa o state já definido pelos cliques nas imagens
    const genderRaw =
      (editGenderEl ? editGenderEl.value : undefined) ??
      (window.gameState?.profile?.trainerGender ?? "");

    const finalName = String(nameRaw).trim();
    const finalGender = String(genderRaw).trim();

    if (finalName.length < 3) {
      window.Utils.showModal("errorModal", "O nome deve ter no mínimo 3 caracteres.");
      return;
    }

    if (!finalGender) {
      window.Utils.showModal("errorModal", "Selecione um gênero do treinador.");
      return;
    }

    window.gameState.profile.trainerName = finalName.toUpperCase();
    window.gameState.profile.trainerGender = finalGender;

    // Persistência (ex.: Firestore encapsulado)
    window.GameLogic.saveGameData();

    if (showSuccess) {
      window.Utils.showModal("infoModal", "Perfil atualizado com sucesso!");
    }

    window.Renderer.showScreen(redirectTo || "profile");
  },

  loadProfile: async function () {
    if (!window.db || !window.userId) {
      console.warn(
        "Usuário não autenticado. Carregamento da nuvem desativado."
      );
      return false;
    }
    try {
      const docRef = doc(window.db, "users", window.userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const savedProfile = docSnap.data();
        window.gameState.profile = savedProfile;
        if (window.gameState.profile.pokedex) {
          window.gameState.profile.pokedex = new Set(
            window.gameState.profile.pokedex
          );
        }
        // Garante que o lastLocation exista, para evitar erros no modo Beta
        if (!window.gameState.profile.lastLocation) {
          window.gameState.profile.lastLocation = { lat: 0, lng: 0 };
        }
        // Garante que o isBetaMode exista
        if (typeof window.gameState.profile.preferences.isBetaMode === 'undefined') {
          window.gameState.profile.preferences.isBetaMode = false;
        }
        // NOVO: Garante que os campos do sistema de nível do treinador existam
        if (typeof window.gameState.profile.trainerLevel !== 'number') {
          const maxLevel = window.gameState.profile.pokemon.length > 0
            ? Math.max(...window.gameState.profile.pokemon.map(p => p.level || 1))
            : 1;
          window.gameState.profile.trainerLevel = Math.min(100, Math.max(1, maxLevel));
        }
        if (typeof window.gameState.profile.trainerExp !== 'number') {
          window.gameState.profile.trainerExp = 0;
        }
        if (typeof window.gameState.profile.normalBattleCount !== 'number') {
          window.gameState.profile.normalBattleCount = 0;
        }
        // NOVO: Garante que o sistema de doces exista
        if (!window.gameState.profile.pokemonCandy || typeof window.gameState.profile.pokemonCandy !== 'object') {
          window.gameState.profile.pokemonCandy = {};
        }

        console.log("Perfil do usuário carregado do Firestore!");
        return true;
      } else {
        console.log(
          "Nenhum perfil encontrado para este usuário. Criando um novo."
        );
        return false;
      }
    } catch (error) {
      console.error("Erro ao carregar perfil do Firestore:", error);
      return false;
    }
  },

  // MODO CLÁSSICO: Exploração baseada em texto
  explore: async function () {
    const toggleExploreLoading = (isLoading, message) => {
      const button = document.getElementById("explore-action-btn");
      if (button) {
        if (isLoading) {
          button.disabled = true;
          button.style.cursor = 'wait';
          button.classList.add("spinning");
        } else {
          button.disabled = false;
          button.style.cursor = 'pointer';
          button.classList.remove("spinning");
        }
      }
      const resultBox = document.getElementById("explore-result");
      if (resultBox) {
        if (isLoading) {
          resultBox.innerHTML = `
            <div class="flex items-center gap-2 text-white gba-font text-xs" style="text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);">
              <span class="inline-flex h-4 w-4 border-[3px] border-white border-t-transparent rounded-full animate-spin"></span>
              <span>${message || "Procurando aventuras..."}</span>
            </div>
          `;
        }
      }
    };

    const hasLivePokemon = window.gameState.profile.pokemon.some(
      (p) => p.currentHp > 0
    );
    if (!hasLivePokemon && window.gameState.profile.pokemon.length > 0) {
      GameLogic.addExploreLog(
        "Todos os Pokémons desmaiaram! Vá para o Centro Pokémon."
      );
      window.Renderer.renderMainMenu(document.getElementById("app-container"));
      return;
    }

    toggleExploreLoading(true, "Procurando aventuras...");

    const roll = Math.random();
    let resultMessage = "";
    let startedBattle = false;

    if (roll < 0.3) {
      const money = Math.floor(Math.random() * 200) + 100;
      window.gameState.profile.money += money;
      resultMessage = `Você encontrou P$${money} no chão!`;
    } else if (roll < 0.5) {
      const possibleItems = window.gameState.profile.items.filter(
        (i) => i.name !== "Great Ball" && i.name !== "Ultra Ball"
      );
      const item =
        possibleItems[Math.floor(Math.random() * possibleItems.length)];
      item.quantity++;
      resultMessage = `Você encontrou 1x ${item.name}!`;
    } else if (roll < 0.75) {
      GameLogic.addExploreLog("Um Pokémon selvagem apareceu!");
      window.AuthSetup?.handleBattleMusic(true);
      await window.BattleCore.startWildBattle();
      startedBattle = true;
    } else {
      resultMessage = "Você explorou, mas não encontrou nada de interessante.";
    }

    if (!startedBattle) {
      GameLogic.addExploreLog(resultMessage);
      window.GameLogic.saveGameData();
      window.Renderer.renderMainMenu(document.getElementById("app-container"));
      toggleExploreLoading(false);
    }

    if (startedBattle) {
      toggleExploreLoading(false);
    }
  },

  // MODO BETA: Exploração no mapa. A lógica principal está em map_core.js
  mapExplore: function () {
    window.MapCore.mapExplore();
  },

  toggleBetaMode: function () {
    const prefs = window.gameState.profile.preferences;
    prefs.isBetaMode = !prefs.isBetaMode;
    window.GameLogic.saveGameData();

    if (prefs.isBetaMode) {
      window.Utils.showModal("infoModal", "Modo Beta (Mapa) ativado! Voltando ao Menu Principal para recarregar.");
    } else {
      window.Utils.showModal("infoModal", "Modo Clássico (Texto) ativado! Voltando ao Menu Principal.");
      window.MapCore?.destroyMap();
    }

    // Força um retorno ao Menu para recarregar a tela correta na próxima vez.
    setTimeout(() => window.Renderer.showScreen('mainMenu'), 1000);
  },

  buyItem: function (itemName, quantity) {
    let qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      window.Utils.showModal("errorModal", "Quantidade inválida.");
      return;
    }

    qty = Math.min(99, qty);

    const itemToBuy = window.GameConfig.SHOP_ITEMS.find(
      (item) => item.name === itemName
    );
    if (!itemToBuy) {
      window.Utils.showModal("errorModal", "Item não encontrado.");
      return;
    }

    const totalCost = itemToBuy.cost * qty;

    if (window.gameState.profile.money >= totalCost) {
      window.gameState.profile.money -= totalCost;
      let existingItem = window.gameState.profile.items.find(
        (i) => i.name === itemName
      );

      if (existingItem) {
        existingItem.quantity += qty;
      } else {
        const newItem = { ...itemToBuy, quantity: qty };
        window.gameState.profile.items.push(newItem);
      }

      window.GameLogic.saveGameData();
      window.Utils.showModal(
        "infoModal",
        `Você comprou ${qty}x ${itemName} por P$${totalCost}.`
      );
      window.Renderer.showScreen("shop");
    } else {
      window.Utils.showModal(
        "errorModal",
        `Você não tem P$${totalCost} suficiente para comprar ${qty}x ${itemName}!`
      );
    }
  },

  useItem: function (itemName, targetPokemonIndex = -1) {
    const item = window.gameState.profile.items.find(
      (i) => i.name === itemName
    );
    if (!item || item.quantity <= 0) {
      if (window.gameState.currentScreen !== "battle") {
        window.Utils.showModal("errorModal", `Você não tem mais ${itemName}!`);
      }
      return false;
    }

    if (window.gameState.currentScreen !== "battle") {
      const targetPokemon =
        window.gameState.profile.pokemon[targetPokemonIndex];
      if (!targetPokemon) return false;
      window.Utils.ensureMoveCounters(targetPokemon);

      if (item.healAmount) {
        if (targetPokemon.currentHp >= targetPokemon.maxHp) {
          window.Utils.showModal(
            "infoModal",
            `${targetPokemon.name} já está com HP máximo.`
          );
          return false;
        }
        if (targetPokemon.currentHp <= 0) {
          window.Utils.showModal(
            "infoModal",
            `${targetPokemon.name} está desmaiado e não pode ser curado agora.`
          );
          return false;
        }

        const actualHeal = Math.min(
          item.healAmount,
          targetPokemon.maxHp - targetPokemon.currentHp
        );
        targetPokemon.currentHp += actualHeal;
        item.quantity--;

        window.Utils.showModal(
          "infoModal",
          `Você usou ${itemName}. ${targetPokemon.name} curou ${actualHeal} HP. Restam x${item.quantity}.`
        );
        window.GameLogic.saveGameData();
        window.Renderer.showScreen("pokemonList");
        return true;
      }

      if (item.ppRestore) {
        window.Utils.ensureMoveCounters(targetPokemon);
        // NOVO: Verifica se todos os movimentos têm PA cheio
        let allMovesFull = true;
        if (targetPokemon.moves && targetPokemon.moves.length > 0) {
          for (const move of targetPokemon.moves) {
            const moveName = typeof move === "string" ? move : move.name || move;
            const movePA = window.Utils.getMovePA(targetPokemon, moveName);
            if (movePA.remaining < movePA.max) {
              allMovesFull = false;
              break;
            }
          }
        } else {
          // Fallback para sistema antigo
          const normalFull =
            targetPokemon.normalMoveRemaining >=
            targetPokemon.normalMoveMaxUses;
          const specialFull =
            targetPokemon.specialMoveRemaining >=
            targetPokemon.specialMoveMaxUses;
          allMovesFull = normalFull && specialFull;
        }

        if (allMovesFull) {
          window.Utils.showModal(
            "infoModal",
            `${targetPokemon.name} já está com todos os PAs carregados.`
          );
          return false;
        }

        window.Utils.restoreMoveCharges(targetPokemon);
        item.quantity--;

        window.Utils.showModal(
          "infoModal",
          `${targetPokemon.name} recuperou todos os PAs dos golpes. Restam x${item.quantity}.`
        );
        window.GameLogic.saveGameData();
        window.Renderer.showScreen("pokemonList");
        return true;
      }

      window.Utils.showModal(
        "errorModal",
        `O item ${itemName} não pode ser usado fora da batalha.`
      );
      return false;
    }

    const playerPokemon = window.Utils.getActivePokemon();
    window.Utils.ensureMoveCounters(playerPokemon);

    if (item.healAmount) {
      item.quantity--;
      if (playerPokemon.currentHp >= playerPokemon.maxHp) {
        window.BattleCore.addBattleLog(
          `${playerPokemon.name} já está com HP máximo!`
        );
        item.quantity++;
        return false;
      } else {
        const actualHeal = Math.min(
          item.healAmount,
          playerPokemon.maxHp - playerPokemon.currentHp
        );
        playerPokemon.currentHp += actualHeal;
        window.BattleCore.addBattleLog(
          `Você usou ${itemName}. ${playerPokemon.name} curou ${actualHeal} HP.`
        );
        window.BattleCore._animateBattleAction(
          ".player-sprite",
          "animate-heal",
          500
        );
      }
      window.GameLogic.saveGameData();
      return true;
    }

    if (item.ppRestore) {
      // NOVO: Verifica se todos os movimentos têm PA cheio
      let allMovesFull = true;
      if (playerPokemon.moves && playerPokemon.moves.length > 0) {
        for (const move of playerPokemon.moves) {
          const moveName = typeof move === "string" ? move : move.name || move;
          const movePA = window.Utils.getMovePA(playerPokemon, moveName);
          if (movePA.remaining < movePA.max) {
            allMovesFull = false;
            break;
          }
        }
      } else {
        // Fallback para sistema antigo
        const normalFull =
          playerPokemon.normalMoveRemaining >=
          playerPokemon.normalMoveMaxUses;
        const specialFull =
          playerPokemon.specialMoveRemaining >=
          playerPokemon.specialMoveMaxUses;
        allMovesFull = normalFull && specialFull;
      }

      if (allMovesFull) {
        BattleCore.addBattleLog(
          `${playerPokemon.name} já está com todos os PAs carregados!`
        );
        return false;
      }

      item.quantity--;
      window.Utils.restoreMoveCharges(playerPokemon);
      BattleCore.addBattleLog(
        `Você usou ${itemName}. ${playerPokemon.name} recuperou todos os PAs dos golpes.`
      );
      BattleCore._animateBattleAction(
        ".player-sprite",
        "animate-heal",
        500
      );
      window.GameLogic.saveGameData();
      return true;
    }

    return false;
  },

  // NOVO: Função para usar Éter em um movimento específico
  useEtherOnMove: function (pokemonIndex, moveName) {
    const pokemon = window.gameState.profile.pokemon[pokemonIndex];
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon inválido.");
      return false;
    }

    const item = window.gameState.profile.items.find(
      (i) => i.name === "Éter" && i.ppRestore
    );
    if (!item || item.quantity <= 0) {
      window.Utils.showModal("errorModal", "Você não tem Éter!");
      return false;
    }

    window.Utils.ensureMoveCounters(pokemon);
    const movePA = window.Utils.getMovePA(pokemon, moveName);
    
    if (movePA.remaining >= movePA.max) {
      window.Utils.showModal(
        "infoModal",
        `${window.Utils.formatName(moveName)} já está com PA cheio!`
      );
      return false;
    }

    // Restaura PA do movimento específico
    if (pokemon.moveUses && pokemon.moveUses[moveName]) {
      pokemon.moveUses[moveName].remaining = pokemon.moveUses[moveName].max;
    } else {
      // Fallback para sistema antigo
      const isSpecial = window.Utils.isSpecialMove(pokemon, moveName);
      if (isSpecial) {
        pokemon.specialMoveRemaining = pokemon.specialMoveMaxUses || 15;
      } else {
        pokemon.normalMoveRemaining = pokemon.normalMoveMaxUses || 30;
      }
    }

    item.quantity--;
    window.GameLogic.saveGameData();

    // Mostra mensagem de sucesso
    const moveDisplayName = window.Utils.formatName(moveName);
    window.Utils.showModal(
      "infoModal",
      `${pokemon.name} recuperou todo o PA de ${moveDisplayName}! Restam x${item.quantity} Éter${item.quantity !== 1 ? 's' : ''}.`
    );
    return true;
  },

  healAllPokemon: function () {
    const profile = window.gameState.profile;
    const GameConfig = window.GameConfig;
    let totalCost = 0;
    let healedCount = 0;

    profile.pokemon.forEach((p) => {
      window.Utils.ensureMoveCounters(p);
      // NOVO: Verifica se algum movimento precisa de PA
      let movesNeedPA = false;
      if (p.moves && p.moves.length > 0) {
        for (const move of p.moves) {
          const moveName = typeof move === "string" ? move : move.name || move;
          const movePA = window.Utils.getMovePA(p, moveName);
          if (movePA.remaining < movePA.max) {
            movesNeedPA = true;
            break;
          }
        }
      } else {
        // Fallback para sistema antigo
        movesNeedPA =
          p.specialMoveRemaining < p.specialMoveMaxUses ||
          p.normalMoveRemaining < p.normalMoveMaxUses;
      }
      
      const hpNeeds = p.currentHp < p.maxHp;

      if (hpNeeds) {
        p.currentHp = p.maxHp;
      }
      window.Utils.restoreMoveCharges(p);

      if (hpNeeds || movesNeedPA) {
        totalCost += GameConfig.HEAL_COST_PER_POKE;
        healedCount++;
      }
    });

    if (healedCount === 0) {
      window.Utils.showModal(
        "infoModal",
        "Todos os seus Pokémons já estavam saudáveis e com PAs completos!"
      );
      return;
    }

    if (profile.money < totalCost) {
      window.Utils.showModal(
        "errorModal",
        `Você não tem dinheiro suficiente! Custo total: P$${totalCost}.`
      );
      return;
    }

    profile.money -= totalCost;

    const healSound = new Audio(
      "https://jetta.vgmtreasurechest.com/soundtracks/pokemon-game-boy-pok-mon-sound-complete-set-play-cd/wfmtgcrc/1-11.%20Recovery.mp3"
    );
    healSound.volume = window.gameState.profile.preferences?.isMuted
      ? 0
      : window.gameState.profile.preferences?.volume ?? 0.5;
    healSound
      .play()
      .catch((err) => console.warn("Falha ao tocar som de cura:", err));

    window.Utils.showModal(
      "infoModal",
      `Obrigado por esperar! ${healedCount} Pokémons cuidados e com PAs recarregados por P$${totalCost}.`
    );
    window.GameLogic.saveGameData();
    window.Renderer.showScreen("healCenter");
  },

  // ==== EVOLUÇÃO ATUALIZADA (com ramificação) ====
  evolvePokemon: async function (pokemonIndex) {
    const pokemon = window.gameState.profile.pokemon[pokemonIndex];
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon inválido para evoluir.");
      return;
    }

    // Contexto para regras de ramificação
    const ctx = {
      level: pokemon.level,
      stats: pokemon.stats,
      // Pega o item pendente, se houver
      item: window.GameLogic._pendingEvolutionItem || null,
      gender: pokemon.gender,
      timeOfDay: window.World?.getTimeOfDay?.(), // "day","evening","night" se aplicável
      ability: pokemon.ability,
      seed: window.Utils.hash?.(`${pokemon.uid}:${window.gameState.profile.trainerId}`) ?? Date.now(),
    };

    // 1) Tenta resolver alvo por ramificação
    let nextId = window.GameLogic.resolveBranchTargetId(pokemon, ctx);

    // 2) Fallback linear por PokeAPI (se não for ramificado e não tiver item forçado)
    let nextEvolutionName = null;
    if (!nextId) {
      nextEvolutionName = await window.PokeAPI.fetchNextEvolution(pokemon.id);
      if (!nextEvolutionName) {
        window.Utils.showModal(
          "errorModal",
          `${pokemon.name} ainda não pode evoluir, ou já atingiu o máximo.`
        );
        return;
      }
    } else {
      nextEvolutionName = window.GameLogic._getNameById(nextId);
    }

    const GameConfig = window.GameConfig;

    // NOVO: Sistema de evolução baseado em nível e doces
    const evolutionReqs = window.GameLogic.getEvolutionRequirements(pokemon.level);
    if (!evolutionReqs) {
      window.Utils.showModal(
        "errorModal",
        `${pokemon.name} precisa estar no nível 16, 22 ou 35 para evoluir!`
      );
      return;
    }

    // Verifica se está no nível certo
    if (pokemon.level < evolutionReqs.level) {
      window.Utils.showModal(
        "errorModal",
        `${pokemon.name} precisa estar no nível ${evolutionReqs.level} para evoluir! (Atual: ${pokemon.level})`
      );
      return;
    }

    // Verifica se tem doces suficientes
    const pokemonCandy = window.GameLogic.getPokemonCandy(pokemon.id);
    if (pokemonCandy < evolutionReqs.candy) {
      window.Utils.showModal(
        "errorModal",
        `${pokemon.name} precisa de ${evolutionReqs.candy} doces para evoluir! (Você tem: ${pokemonCandy})`
      );
      return;
    }

    // Consome os doces
    window.gameState.profile.pokemonCandy[pokemon.id] = pokemonCandy - evolutionReqs.candy;

    let consumedItemName = null;

    // Se a evolução foi disparada por item, tenta consumir o item
    if (ctx.item) {
      const itemToConsume = window.GameConfig.SHOP_ITEMS.find(i => i.name.toLowerCase().includes(ctx.item));
      if (itemToConsume) {
        const ok = window.GameLogic.consumeItem(itemToConsume.name);
        if (!ok) {
          // Rollback (Embora a UI deva bloquear isso, mantemos a segurança)
          window.gameState.profile.money += GameConfig.EVOLUTION_COST;
          pokemon.exp += requiredExp;
          window.Utils.showModal("errorModal", `Erro: O item ${itemToConsume.name} não foi encontrado na mochila.`);
          window.Renderer.showScreen("managePokemon");
          return;
        }
        consumedItemName = itemToConsume.name;
      }
      window.GameLogic._pendingEvolutionItem = null; // Limpa o item pendente após tentativa
    }

    window.Utils.showModal("infoModal", `Evoluindo ${pokemon.name}...`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Buscar dados da nova forma por nome
    const targetName = nextEvolutionName || window.GameLogic._getNameById(nextId);
    const newPokemonDataRaw = await window.PokeAPI.fetchPokemonData(targetName);

    if (newPokemonDataRaw) {
      // 1. Usar os dados base da nova forma
      const newPokemonData = {
        ...newPokemonDataRaw,
        // 2. Preservar Nível e EXP
        level: pokemon.level,
        exp: pokemon.exp,
        // Preservar gênero (necessário para evoluções de ramificação)
        gender: pokemon.gender,
      }

      // 3. Recalcular o HP Máximo com os novos base stats + nível atual
      newPokemonData.maxHp = window.Utils.calculateMaxHp(newPokemonData.stats.hp, newPokemonData.level);
      newPokemonData.currentHp = newPokemonData.maxHp;
      // 4. Registrar na Pokédex
      window.Utils.registerPokemon(newPokemonData.id);

      window.gameState.profile.pokemon[pokemonIndex] = newPokemonData;
      window.GameLogic.saveGameData();

      let successMessage = `Parabéns! Seu ${pokemon.name} evoluiu para **${newPokemonData.name}**! (${evolutionReqs.candy} doces utilizados)`;
      if (consumedItemName) {
        successMessage += ` (Item **${consumedItemName}** utilizado)`;
      }

      window.Utils.showModal(
        "infoModal",
        successMessage
      );
      window.Renderer.showScreen("pokemonList");
    } else {
      // Reembolsa os doces se a evolução falhar (dados locais ausentes)
      window.gameState.profile.pokemonCandy[pokemon.id] = pokemonCandy;
      window.Utils.showModal(
        "errorModal",
        `Falha ao buscar dados de ${window.Utils.formatName(targetName)}. Evolução cancelada.`
      );
      window.Renderer.showScreen("managePokemon");
    }
  },

  releasePokemon: function (index) {
    if (window.gameState.profile.pokemon.length <= 1) {
      window.Utils.showModal(
        "errorModal",
        "Você não pode soltar o seu último Pokémon!"
      );
      return;
    }

    const releasedPokemon = window.gameState.profile.pokemon.splice(
      index,
      1
    )[0];
    
    // NOVO: Adiciona doce quando Pokémon é solto
    window.GameLogic.addPokemonCandy(releasedPokemon.id, 1);
    
    // NOVO: Remove o pokémon da equipe de batalha e ajusta os índices
    const profile = window.gameState.profile;
    if (profile.battleTeam && Array.isArray(profile.battleTeam)) {
      // Remove o índice do pokémon solto da equipe
      profile.battleTeam = profile.battleTeam.filter(teamIndex => teamIndex !== index);
      // Ajusta os índices dos pokémons que vinham depois do solto (diminui 1)
      profile.battleTeam = profile.battleTeam.map(teamIndex => 
        teamIndex > index ? teamIndex - 1 : teamIndex
      );
    }
    
    window.GameLogic.saveGameData();
    const pokemonCandy = window.GameLogic.getPokemonCandy(releasedPokemon.id);
    window.Utils.showModal("infoModal", `Você soltou ${releasedPokemon.name} e ganhou 1 doce! (Total: ${pokemonCandy} doces de ${releasedPokemon.name})`);
    window.Renderer.showScreen("managePokemon");
  },

  // NOVO: Função para favoritar/desfavoritar um pokémon
  toggleFavoritePokemon: function (pokemonIndex) {
    const profile = window.gameState.profile;
    const pokemon = profile.pokemon[pokemonIndex];
    
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon inválido.");
      return false;
    }

    // Alterna o status de favorito
    pokemon.isFavorite = !pokemon.isFavorite;
    window.GameLogic.saveGameData();
    
    const displayName = window.Utils.getPokemonDisplayName(pokemon);
    const message = pokemon.isFavorite 
      ? `${displayName} foi adicionado aos favoritos! ⭐`
      : `${displayName} foi removido dos favoritos.`;
    
    window.Utils.showModal("infoModal", message);
    return true;
  },

  // NOVO: Função para renomear um pokémon
  renamePokemon: function (pokemonIndex, newNickname) {
    const profile = window.gameState.profile;
    const pokemon = profile.pokemon[pokemonIndex];
    
    if (!pokemon) {
      window.Utils.showModal("errorModal", "Pokémon inválido.");
      return false;
    }

    // Remove espaços no início e fim, e limita o tamanho
    const trimmedNickname = newNickname ? newNickname.trim().substring(0, 20) : "";
    
    // Se o nickname estiver vazio, remove o nickname (volta ao nome original)
    if (trimmedNickname === "") {
      delete pokemon.nickname;
      window.GameLogic.saveGameData();
      window.Utils.showModal(
        "infoModal",
        `O nome de ${pokemon.name} foi resetado para o nome original.`
      );
      return true;
    }

    pokemon.nickname = trimmedNickname;
    window.GameLogic.saveGameData();
    
    const displayName = window.Utils.getPokemonDisplayName(pokemon);
    window.Utils.showModal(
      "infoModal",
      `${pokemon.name} agora se chama ${displayName}!`
    );
    return true;
  },

  // NOVO: Função para alternar um pokémon na equipe de batalha
  toggleBattleTeamPokemon: function (index) {
    const profile = window.gameState.profile;
    if (!profile.battleTeam) {
      profile.battleTeam = [];
    }
    
    const battleTeam = profile.battleTeam;
    const MAX_BATTLE_TEAM = 5;
    const pokemonIndex = battleTeam.indexOf(index);

    if (pokemonIndex !== -1) {
      // Remove da equipe
      battleTeam.splice(pokemonIndex, 1);
      window.GameLogic.saveGameData();
      window.Renderer.showScreen('battleTeam');
    } else {
      // Adiciona à equipe se não estiver cheia
      if (battleTeam.length < MAX_BATTLE_TEAM) {
        battleTeam.push(index);
        window.GameLogic.saveGameData();
        window.Renderer.showScreen('battleTeam');
      } else {
        window.Utils.showModal(
          'infoModal',
          `A equipe de batalha está completa (${MAX_BATTLE_TEAM} pokémons). Remova um pokémon antes de adicionar outro.`
        );
      }
    }
  },

  setPokemonAsActive: function (index) {
    // NOVIDADE: Adicionado check para não tentar mover o Pokémon já ativo (índice 0)
    if (index === 0) {
      window.Utils.showModal(
        "infoModal",
        `${window.gameState.profile.pokemon[index].name} já é o seu Pokémon ativo!`
      );
      return;
    }

    const pokemonArray = window.gameState.profile.pokemon;
    if (index < 0 || index >= pokemonArray.length) {
      return;
    }

    const [activePokemon] = pokemonArray.splice(index, 1);
    pokemonArray.unshift(activePokemon);

    // NOVO: Ajusta os índices da equipe de batalha após mover para o primeiro lugar
    const profile = window.gameState.profile;
    if (profile.battleTeam && Array.isArray(profile.battleTeam)) {
      const newBattleTeam = profile.battleTeam.map(oldIndex => {
        if (oldIndex === index) {
          // O pokémon movido vai para o índice 0
          return 0;
        } else if (oldIndex < index) {
          // Pokémons que estavam antes do movido: incrementam 1
          return oldIndex + 1;
        }
        // Pokémons que estavam depois do movido: mantêm o índice
        return oldIndex;
      });
      profile.battleTeam = newBattleTeam.filter(i => 
        i >= 0 && i < pokemonArray.length
      );
    }

    window.GameLogic.saveGameData();
    window.Utils.showModal(
      "infoModal",
      `${activePokemon.name} é agora seu Pokémon ativo!`
    );
    window.Renderer.showScreen("managePokemon");
  },

  draggedPokemonIndex: null,

  dragStart: function (event) {
    const handleElement = event.target.closest('[data-drag-handle="true"]');
    if (!handleElement) {
      event.preventDefault();
      return;
    }

    const targetElement = handleElement.closest("[data-pokemon-index]");
    if (!targetElement) return;

    GameLogic.draggedPokemonIndex = parseInt(
      targetElement.dataset.pokemonIndex
    );
    event.dataTransfer.effectAllowed = "move";

    targetElement.classList.add("opacity-50");
  },

  allowDrop: function (event) {
    event.preventDefault();
  },

  drop: function (event) {
    event.preventDefault();
    const droppedOnElement = event.target.closest("[data-pokemon-index]");
    if (!droppedOnElement) return;

    const droppedOnIndex = parseInt(droppedOnElement.dataset.pokemonIndex);
    const draggedIndex = GameLogic.draggedPokemonIndex;

    const draggedElement = document.querySelector(
      `[data-pokemon-index="${draggedIndex}"]`
    );
    if (draggedElement) {
      draggedElement.classList.remove("opacity-50");
    }

    if (draggedIndex === null || draggedIndex === droppedOnIndex) {
      return;
    }

    const pokemonArray = window.gameState.profile.pokemon;
    const [removed] = pokemonArray.splice(draggedIndex, 1);
    pokemonArray.splice(droppedOnIndex, 0, removed);

    // NOVO: Ajusta os índices da equipe de batalha após reordenar
    const profile = window.gameState.profile;
    if (profile.battleTeam && Array.isArray(profile.battleTeam)) {
      // Cria um mapeamento dos índices antigos para os novos após a reordenação
      const newBattleTeam = profile.battleTeam.map(oldIndex => {
        if (oldIndex === draggedIndex) {
          // O pokémon arrastado vai para o novo índice
          return droppedOnIndex;
        } else if (draggedIndex < oldIndex && oldIndex <= droppedOnIndex) {
          // Pokémons que estavam depois do arrastado e antes do destino: movem 1 para trás
          return oldIndex - 1;
        } else if (droppedOnIndex <= oldIndex && oldIndex < draggedIndex) {
          // Pokémons que estavam antes do arrastado mas depois do destino: movem 1 para frente
          return oldIndex + 1;
        }
        // Pokémons não afetados mantêm o mesmo índice
        return oldIndex;
      });
      profile.battleTeam = newBattleTeam.filter(index => 
        index >= 0 && index < pokemonArray.length
      );
    }

    window.GameLogic.saveGameData();

    window.Renderer.showScreen("pokemonList");
  },

  dragEnter: function (event) {
    event.preventDefault();
    const targetElement = event.target.closest("[data-pokemon-index]");
    if (!targetElement || targetElement.classList.contains("drag-over")) return;

    targetElement.classList.add(
      "border-dashed",
      "border-4",
      "border-blue-500",
      "bg-blue-50"
    );
  },

  dragLeave: function (event) {
    const targetElement = event.target.closest("[data-pokemon-index]");
    if (!targetElement) return;

    targetElement.classList.remove(
      "border-dashed",
      "border-4",
      "border-blue-500",
      "bg-blue-50"
    );
  },

  exportSave: function () {
    try {
      const saveProfile = localStorage.getItem("pokemonGameProfile");
      const saveLog = localStorage.getItem("pokemonGameExploreLog");

      if (!saveProfile) {
        window.Utils.showModal(
          "errorModal",
          "Nenhum jogo salvo para exportar!"
        );
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
      a.download = `pokemon_gba_save_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.Utils.showModal(
        "infoModal",
        "Seu save foi exportado com sucesso!"
      );
    } catch (e) {
      console.error("Erro ao exportar save:", e);
      window.Utils.showModal(
        "errorModal",
        "Falha ao exportar o save. Tente novamente."
      );
    }
  },

  importSave: function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // A verificação abaixo precisa ser mais flexível para aceitar a estrutura correta
        if (data.profile && Array.isArray(data.profile.pokemon)) {
          // 1. Atualiza o estado do jogo localmente
          window.gameState.profile = data.profile;
          window.gameState.exploreLog = data.exploreLog || [];
          window.gameState.pokedexCache = data.pokedexCache || {};

          // 2. Persiste o save no LocalStorage
          localStorage.setItem(
            "pokemonGameProfile",
            JSON.stringify(data.profile)
          );
          localStorage.setItem(
            "pokemonGameExploreLog",
            JSON.stringify(data.exploreLog || [])
          );

          // 3. NOVO: Salva os dados importados no Firestore
          if (
            window.gameState.profile.pokedex &&
            Array.isArray(window.gameState.profile.pokedex)
          ) {
            // Ver observação no loadProfile que converte para Set depois
          }

          await window.GameLogic.saveGameData();

          window.Utils.showModal(
            "infoModal",
            "Save importado com sucesso! Recarregando..."
          );
          setTimeout(() => window.location.reload(), 1500);
        } else {
          // O erro "Estrutura de save inválida" é o que você está vendo
          throw new Error("Estrutura de save inválida.");
        }
      } catch (e) {
        console.error("Erro ao importar save:", e);
        window.Utils.showModal(
          "errorModal",
          "Falha ao importar o save. O arquivo pode estar corrompido ou ser inválido."
        );
      }
    };
    reader.readAsText(file);
  },

  // NOVO: Sistema de Troca de Pokémon
  startTrade: async function (friendId, friendName) {
    if (!window.db || !window.userId) {
      window.Utils.showModal("errorModal", "Você precisa estar logado para trocar Pokémon.");
      return;
    }

    if (window.gameState.profile.pokemon.length === 0) {
      window.Utils.showModal("errorModal", "Você não tem Pokémon para trocar!");
      return;
    }

    // Verifica se são amigos
    try {
      const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
      const q = query(
        collection(window.db, "friendships"),
        where("participants", "array-contains", window.userId)
      );
      const snapshot = await getDocs(q);
      let isFriend = false;
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.participants.includes(friendId) && data.status === "accepted") {
          isFriend = true;
        }
      });

      if (!isFriend) {
        window.Utils.showModal("errorModal", "Você só pode trocar Pokémon com amigos!");
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar amizade:", error);
      window.Utils.showModal("errorModal", "Erro ao verificar amizade.");
      return;
    }

    // Cria ou busca sala de troca
    const tradeRoomId = [window.userId, friendId].sort().join('_trade');
    
    try {
      const { doc, setDoc, getDoc, onSnapshot, Timestamp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
      const tradeRef = doc(window.db, "trades", tradeRoomId);
      const tradeSnap = await getDoc(tradeRef);

      // Cria a sala de troca se não existir
      if (!tradeSnap.exists()) {
        await setDoc(tradeRef, {
          player1: window.userId,
          player2: friendId,
          player1Name: window.gameState.profile.trainerName,
          player2Name: friendName,
          player1Pokemon: null,
          player2Pokemon: null,
          player1Confirmed: false,
          player2Confirmed: false,
          status: "waiting", // waiting, ready, completed, cancelled
          createdAt: Timestamp.now(),
        });
      }

      // Renderiza a tela de troca
      GameLogic.renderTradeScreen(tradeRoomId, friendId, friendName);
    } catch (error) {
      console.error("Erro ao iniciar troca:", error);
      window.Utils.showModal("errorModal", "Erro ao iniciar troca de Pokémon.");
    }
  },

  renderTradeScreen: async function (tradeRoomId, friendId, friendName) {
    const { doc, onSnapshot, getDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    
    // Limpa listener anterior se existir
    if (window.unsubscribeTrade) {
      window.unsubscribeTrade();
    }

    const tradeRef = doc(window.db, "trades", tradeRoomId);
    
    // Listener em tempo real
    window.unsubscribeTrade = onSnapshot(tradeRef, async (snap) => {
      if (!snap.exists()) {
        window.Utils.showModal("infoModal", "A troca foi cancelada.");
        if (window.unsubscribeTrade) {
          window.unsubscribeTrade();
          window.unsubscribeTrade = null;
        }
        return;
      }

      const tradeData = snap.data();
      const isPlayer1 = tradeData.player1 === window.userId;
      const myPokemon = isPlayer1 ? tradeData.player1Pokemon : tradeData.player2Pokemon;
      const theirPokemon = isPlayer1 ? tradeData.player2Pokemon : tradeData.player1Pokemon;
      const myConfirmed = isPlayer1 ? tradeData.player1Confirmed : tradeData.player2Confirmed;
      const theirConfirmed = isPlayer1 ? tradeData.player2Confirmed : tradeData.player1Confirmed;

      // Renderiza a interface
      const myPokemonHtml = myPokemon 
        ? `
          <div class="bg-green-100 border-2 border-green-500 rounded-lg p-3">
            <img src="../assets/sprites/pokemon/${myPokemon.id}_front.png" alt="${myPokemon.name}" class="w-24 h-24 mx-auto mb-2">
            <div class="text-center gba-font text-sm font-bold">${myPokemon.name}</div>
            <div class="text-center gba-font text-xs">Nv. ${myPokemon.level}</div>
            ${myConfirmed ? '<div class="text-center text-green-600 font-bold mt-1">✓ Confirmado</div>' : ''}
          </div>
        `
        : '<div class="bg-gray-200 border-2 border-gray-400 rounded-lg p-3 text-center gba-font text-sm">Selecione um Pokémon</div>';

      const theirPokemonHtml = theirPokemon
        ? `
          <div class="bg-blue-100 border-2 border-blue-500 rounded-lg p-3">
            <img src="../assets/sprites/pokemon/${theirPokemon.id}_front.png" alt="${theirPokemon.name}" class="w-24 h-24 mx-auto mb-2">
            <div class="text-center gba-font text-sm font-bold">${theirPokemon.name}</div>
            <div class="text-center gba-font text-xs">Nv. ${theirPokemon.level}</div>
            ${theirConfirmed ? '<div class="text-center text-blue-600 font-bold mt-1">✓ Confirmado</div>' : ''}
          </div>
        `
        : '<div class="bg-gray-200 border-2 border-gray-400 rounded-lg p-3 text-center gba-font text-sm">Aguardando seleção...</div>';

      // Lista de Pokémon para seleção
      const pokemonListHtml = window.gameState.profile.pokemon.map((p, index) => {
        // Usa índice para identificar se não tiver uid
        const pokemonId = p.uid || `index_${index}`;
        const selectedId = myPokemon ? (myPokemon.uid || `index_${myPokemon._tradeIndex}`) : null;
        const isSelected = selectedId === pokemonId;
        return `
          <button onclick="window.GameLogic.selectPokemonForTrade(${index}, '${tradeRoomId}')" 
                  class="w-full p-2 border-2 rounded-lg gba-font text-xs text-left ${isSelected ? 'bg-green-300 border-green-600' : 'bg-white border-gray-400 hover:bg-gray-100'}">
            <div class="flex items-center gap-2">
              <img src="../assets/sprites/pokemon/${p.id}_front.png" alt="${p.name}" class="w-12 h-12">
              <div>
                <div class="font-bold">${p.name}</div>
                <div>Nv. ${p.level} | HP: ${p.currentHp}/${p.maxHp}</div>
              </div>
            </div>
          </button>
        `;
      }).join('');

      const statusMessage = tradeData.status === "completed" 
        ? '<div class="text-center text-green-600 font-bold gba-font">Troca concluída!</div>'
        : tradeData.status === "cancelled"
        ? '<div class="text-center text-red-600 font-bold gba-font">Troca cancelada</div>'
        : myConfirmed && theirConfirmed
        ? '<div class="text-center text-yellow-600 font-bold gba-font">Ambos confirmaram! Finalizando troca...</div>'
        : '<div class="text-center text-gray-600 gba-font">Aguardando confirmações...</div>';

      const content = `
        <div class="text-xl font-bold text-center mb-4 text-gray-800 gba-font">TROCA DE POKÉMON</div>
        <div class="text-sm text-center mb-4 text-gray-600 gba-font">Com: ${friendName}</div>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-xs font-bold mb-2 text-center gba-font">SEU POKÉMON</div>
            ${myPokemonHtml}
          </div>
          <div>
            <div class="text-xs font-bold mb-2 text-center gba-font">POKÉMON DO AMIGO</div>
            ${theirPokemonHtml}
          </div>
        </div>

        ${statusMessage}

        ${tradeData.status === "waiting" || tradeData.status === "ready" ? `
          <div class="mb-4">
            <div class="text-xs font-bold mb-2 gba-font">SELECIONE SEU POKÉMON:</div>
            <div class="max-h-48 overflow-y-auto space-y-2">
              ${pokemonListHtml}
            </div>
          </div>

          <div class="flex gap-2">
            ${myPokemon && !myConfirmed ? `
              <button onclick="window.GameLogic.confirmTrade('${tradeRoomId}')" 
                      class="gba-button bg-green-500 hover:bg-green-600 flex-1">
                Confirmar Troca
              </button>
            ` : ''}
            <button onclick="window.GameLogic.cancelTrade('${tradeRoomId}')" 
                    class="gba-button bg-red-500 hover:bg-red-600 flex-1">
              Cancelar
            </button>
          </div>
        ` : `
          <button onclick="window.GameLogic.closeTrade()" 
                  class="gba-button bg-gray-500 hover:bg-gray-600 w-full">
            Fechar
          </button>
        `}
      `;

      const app = document.getElementById("app-container");
      if (app) {
        window.Renderer.renderGbaCard(content);
      }
    });
  },

  selectPokemonForTrade: async function (pokemonIndex, tradeRoomId) {
    const pokemon = window.gameState.profile.pokemon[pokemonIndex];
    if (!pokemon) return;

    try {
      const { doc, updateDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
      const tradeRef = doc(window.db, "trades", tradeRoomId);
      const tradeSnap = await getDoc(tradeRef);
      
      if (!tradeSnap.exists()) return;

      const tradeData = tradeSnap.data();
      const isPlayer1 = tradeData.player1 === window.userId;

      // Cria uma cópia do Pokémon para troca (sem referências)
      const pokemonCopy = JSON.parse(JSON.stringify(pokemon));
      // Adiciona índice para identificação se não tiver uid
      if (!pokemonCopy.uid) {
        pokemonCopy._tradeIndex = pokemonIndex;
      }
      
      await updateDoc(tradeRef, {
        [isPlayer1 ? 'player1Pokemon' : 'player2Pokemon']: pokemonCopy,
        [isPlayer1 ? 'player1Confirmed' : 'player2Confirmed']: false,
        status: "ready",
      });
    } catch (error) {
      console.error("Erro ao selecionar Pokémon:", error);
      window.Utils.showModal("errorModal", "Erro ao selecionar Pokémon.");
    }
  },

  confirmTrade: async function (tradeRoomId) {
    try {
      const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
      const tradeRef = doc(window.db, "trades", tradeRoomId);
      const tradeSnap = await getDoc(tradeRef);
      
      if (!tradeSnap.exists()) return;

      const tradeData = tradeSnap.data();
      const isPlayer1 = tradeData.player1 === window.userId;

      // Marca como confirmado
      await updateDoc(tradeRef, {
        [isPlayer1 ? 'player1Confirmed' : 'player2Confirmed']: true,
      });

      // Verifica se ambos confirmaram
      const updatedSnap = await getDoc(tradeRef);
      const updatedData = updatedSnap.data();

      if (updatedData.player1Confirmed && updatedData.player2Confirmed) {
        // Executa a troca
        await GameLogic.executeTrade(tradeRoomId, updatedData);
      }
    } catch (error) {
      console.error("Erro ao confirmar troca:", error);
      window.Utils.showModal("errorModal", "Erro ao confirmar troca.");
    }
  },

  executeTrade: async function (tradeRoomId, tradeData) {
    try {
      const { doc, updateDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
      
      // Remove os Pokémon originais dos times
      const myProfileRef = doc(window.db, "users", window.userId);
      const friendProfileRef = doc(window.db, "users", tradeData.player2);
      
      const myProfileSnap = await getDoc(myProfileRef);
      const friendProfileSnap = await getDoc(friendProfileRef);

      if (!myProfileSnap.exists() || !friendProfileSnap.exists()) {
        throw new Error("Perfis não encontrados.");
      }

      const myProfile = myProfileSnap.data();
      const friendProfile = friendProfileSnap.data();

      // Remove o Pokémon que está sendo trocado
      // Usa uid se existir, senão usa _tradeIndex ou compara por id+level+name
      const isPlayer1 = tradeData.player1 === window.userId;
      const myTradePokemon = isPlayer1 ? tradeData.player1Pokemon : tradeData.player2Pokemon;
      const friendTradePokemon = isPlayer1 ? tradeData.player2Pokemon : tradeData.player1Pokemon;

      let myPokemonIndex = -1;
      let friendPokemonIndex = -1;

      // Busca o Pokémon do jogador atual
      if (myTradePokemon.uid) {
        myPokemonIndex = myProfile.pokemon.findIndex(p => p.uid === myTradePokemon.uid);
      } else if (myTradePokemon._tradeIndex !== undefined) {
        myPokemonIndex = myTradePokemon._tradeIndex;
      } else {
        // Fallback: busca por id, name e level
        myPokemonIndex = myProfile.pokemon.findIndex(p => 
          p.id === myTradePokemon.id && 
          p.name === myTradePokemon.name && 
          p.level === myTradePokemon.level
        );
      }

      // Busca o Pokémon do amigo
      if (friendTradePokemon.uid) {
        friendPokemonIndex = friendProfile.pokemon.findIndex(p => p.uid === friendTradePokemon.uid);
      } else if (friendTradePokemon._tradeIndex !== undefined) {
        friendPokemonIndex = friendTradePokemon._tradeIndex;
      } else {
        // Fallback: busca por id, name e level
        friendPokemonIndex = friendProfile.pokemon.findIndex(p => 
          p.id === friendTradePokemon.id && 
          p.name === friendTradePokemon.name && 
          p.level === friendTradePokemon.level
        );
      }

      if (myPokemonIndex === -1 || friendPokemonIndex === -1) {
        throw new Error("Pokémon não encontrado no time.");
      }

      // Remove dos times originais
      myProfile.pokemon.splice(myPokemonIndex, 1);
      friendProfile.pokemon.splice(friendPokemonIndex, 1);

      // Remove campos temporários antes de adicionar
      const receivedPokemon = JSON.parse(JSON.stringify(isPlayer1 ? tradeData.player2Pokemon : tradeData.player1Pokemon));
      const sentPokemon = JSON.parse(JSON.stringify(isPlayer1 ? tradeData.player1Pokemon : tradeData.player2Pokemon));
      
      if (receivedPokemon._tradeIndex !== undefined) {
        delete receivedPokemon._tradeIndex;
      }
      if (sentPokemon._tradeIndex !== undefined) {
        delete sentPokemon._tradeIndex;
      }

      // Adiciona os novos Pokémon
      myProfile.pokemon.push(receivedPokemon);
      friendProfile.pokemon.push(sentPokemon);

      // Atualiza os perfis
      await updateDoc(myProfileRef, {
        pokemon: myProfile.pokemon,
      });

      await updateDoc(friendProfileRef, {
        pokemon: friendProfile.pokemon,
      });

      // Atualiza o estado local
      window.gameState.profile.pokemon = myProfile.pokemon;

      // Marca a troca como concluída
      await updateDoc(doc(window.db, "trades", tradeRoomId), {
        status: "completed",
      });

      window.Utils.showModal("infoModal", "Troca realizada com sucesso!");
      window.GameLogic.saveGameData();
      
      // Recarrega a tela após 2 segundos
      setTimeout(() => {
        if (window.unsubscribeTrade) {
          window.unsubscribeTrade();
          window.unsubscribeTrade = null;
        }
        window.Renderer.showScreen("mainMenu");
      }, 2000);
    } catch (error) {
      console.error("Erro ao executar troca:", error);
      window.Utils.showModal("errorModal", `Erro ao executar troca: ${error.message}`);
    }
  },

  cancelTrade: async function (tradeRoomId) {
    try {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
      await deleteDoc(doc(window.db, "trades", tradeRoomId));
      
      if (window.unsubscribeTrade) {
        window.unsubscribeTrade();
        window.unsubscribeTrade = null;
      }
      
      window.Utils.showModal("infoModal", "Troca cancelada.");
      window.Renderer.showScreen("mainMenu");
    } catch (error) {
      console.error("Erro ao cancelar troca:", error);
      window.Utils.showModal("errorModal", "Erro ao cancelar troca.");
    }
  },

  closeTrade: function () {
    if (window.unsubscribeTrade) {
      window.unsubscribeTrade();
      window.unsubscribeTrade = null;
    }
    window.Renderer.showScreen("mainMenu");
  },
};

// Garantir global (se necessário em outras partes)
window.GameLogic = window.GameLogic || GameLogic;
