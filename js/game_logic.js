import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Certifique-se de que estas constantes estão disponíveis via importação ou globalmente (do local_poke_data.js)
// Como estamos em um ambiente modular, vamos assumir que as constantes do local_poke_data
// estão disponíveis globalmente (como é prática neste projeto) ou que o bundler as injetará.

export const GameLogic = {
  // ==== Helpers de evolução ramificada (novos) ====

  // Item de evolução pendente (ex.: definido pela UI ao clicar "Usar Pedra")
  _pendingEvolutionItem: null,

  // Consumo simples de item por nome
  consumeItem: function(itemName) {
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
  _getNameById: function(id) {
    const byData = window.POKE_DATA?.[String(id)]?.name;
    if (byData) return byData;
    const byApi = window.PokeAPI?.idToName?.(id);
    if (byApi) return byApi;
    return `#${id}`;
  },

  // Resolver alvo quando há ramificação
  resolveBranchTargetId: function(current, ctx) {
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

    window.gameState.exploreLog.push(message);
    if (window.gameState.exploreLog.length > 3) {
      window.gameState.exploreLog.shift();
    }
    if (window.gameState.currentScreen === "mainMenu") {
      const resultBox = document.getElementById("explore-result");
      if (resultBox) {
        resultBox.innerHTML = window.gameState.exploreLog.slice(-1)[0];
      }
    }
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
        await setDoc(docRef, profileToSave, { merge: true });
        console.log("Dados salvos no Firestore com sucesso!");
      } catch (error) {
        console.error("Erro ao salvar dados no Firestore:", error);
      }
    }
  },

  saveProfile: function (options = {}) {
    const { redirectTo = null, showSuccess = true } = options;

    // Inputs de EDIÇÃO (quando estiver na tela de editar perfil)
    const editNameEl   = document.getElementById("newTrainerName");
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

  explore: async function () {
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
    }
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
      return;
    }

    if (window.gameState.currentScreen !== "battle") {
      if (!item.healAmount) {
        window.Utils.showModal(
          "errorModal",
          `O item ${itemName} não pode ser usado fora da batalha.`
        );
        return;
      }

      const targetPokemon =
        window.gameState.profile.pokemon[targetPokemonIndex];
      if (!targetPokemon) return;

      if (targetPokemon.currentHp >= targetPokemon.maxHp) {
        window.Utils.showModal(
          "infoModal",
          `${targetPokemon.name} já está com HP máximo.`
        );
        return;
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
      return;
    }

    if (item.healAmount) {
      item.quantity--;
      const playerPokemon = window.Utils.getActivePokemon();

      if (playerPokemon.currentHp >= playerPokemon.maxHp) {
        window.BattleCore.addBattleLog(
          `${playerPokemon.name} já está com HP máximo!`
        );
        item.quantity++;
        return;
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
    }
  },

  healAllPokemon: function () {
    const profile = window.gameState.profile;
    const GameConfig = window.GameConfig;
    let totalCost = 0;
    let healedCount = 0;

    profile.pokemon.forEach((p) => {
      if (p.currentHp < p.maxHp) {
        p.currentHp = p.maxHp;
        totalCost += GameConfig.HEAL_COST_PER_POKE;
        healedCount++;
      }
    });

    if (healedCount === 0) {
      window.Utils.showModal(
        "infoModal",
        "Todos os seus Pokémons já estão saudáveis!"
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
      `Obrigado por esperar! ${healedCount} Pokémons curados por P$${totalCost}.`
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

    // Requisitos do projeto (custo e EXP)
    if (window.gameState.profile.money < GameConfig.EVOLUTION_COST) {
      window.Utils.showModal(
        "errorModal",
        `Você precisa de P$${GameConfig.EVOLUTION_COST} para evoluir ${pokemon.name}.`
      );
      return;
    }

    const requiredExp = 1000; // mantido conforme seu código
    if (pokemon.exp < requiredExp) {
      window.Utils.showModal(
        "errorModal",
        `${pokemon.name} precisa de ${requiredExp} EXP para evoluir!`
      );
      return;
    }

    // Débito de custo e EXP
    window.gameState.profile.money -= GameConfig.EVOLUTION_COST;
    pokemon.exp -= requiredExp;
    
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
      
      let successMessage = `Parabéns! Seu ${pokemon.name} evoluiu para **${newPokemonData.name}**!`;
      if (consumedItemName) {
          successMessage += ` (Item **${consumedItemName}** utilizado)`;
      }

      window.Utils.showModal(
        "infoModal",
        successMessage
      );
      window.Renderer.showScreen("pokemonList");
    } else {
      // Reembolsa o dinheiro se a evolução falhar (dados locais ausentes)
      window.gameState.profile.money += GameConfig.EVOLUTION_COST;
      pokemon.exp += requiredExp;
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
    window.GameLogic.saveGameData();
    window.Utils.showModal("infoModal", `Você soltou ${releasedPokemon.name}.`);
    window.Renderer.showScreen("managePokemon");
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
};

// Garantir global (se necessário em outras partes)
window.GameLogic = window.GameLogic || GameLogic;
