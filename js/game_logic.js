/**
 * js/game_logic.js
 * MÓDULO 2: LÓGICA DE JOGO
 * Gerencia a progressão do jogador, inventário, exploração e interações fora de batalha.
 */
import { GameConfig, Utils, PokeAPI } from './config_utils.js';
import { BattleCore } from './battle_core.js'; // Importação necessária para explorar/batalha
import { Renderer } from './renderer.js'; // Importação necessária para renderizar

/**
 * Módulo para gerenciar a progressão do jogador,
 * inventário, exploração e interações fora de batalha.
 */
export const GameLogic = {
  /** Adiciona uma mensagem ao log de exploração e atualiza a UI se estiver no Main Menu. */
  addExploreLog: function (message) {
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

  /** Simula um evento de exploração (dinheiro, item ou batalha selvagem). */
  explore: async function () {
    const hasLivePokemon = window.gameState.profile.pokemon.some(
      (p) => p.currentHp > 0
    );
    if (!hasLivePokemon && window.gameState.profile.pokemon.length > 0) {
      GameLogic.addExploreLog("Todos os Pokémons desmaiaram! Não é seguro explorar.");
      Renderer.renderMainMenu(document.getElementById("app-container"));
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
      // Chamada para BattleCore.startWildBattle (Disponível via exportação)
      await window.BattleCore.startWildBattle();
      startedBattle = true;
    } else {
      resultMessage =
        "Você explorou, mas não encontrou nada de interessante.";
    }

    if (!startedBattle) {
      GameLogic.addExploreLog(resultMessage);
      Utils.saveGame();
      // Chamada para Renderer.renderMainMenu (Disponível via exportação)
      Renderer.renderMainMenu(document.getElementById("app-container"));
    }
  },

  /** Realiza a compra de um item na loja. */
  buyItem: function (itemName) {
    const itemToBuy = window.GameConfig.SHOP_ITEMS.find((item) => item.name === itemName);
    if (!itemToBuy) {
      Utils.showModal("errorModal", "Item não encontrado.");
      return;
    }

    if (window.gameState.profile.money >= itemToBuy.cost) {
      window.gameState.profile.money -= itemToBuy.cost;
      let existingItem = window.gameState.profile.items.find(
        (i) => i.name === itemName
      );

      if (existingItem) {
        existingItem.quantity++;
      } else {
        const newItem = { ...itemToBuy, quantity: 1 };
        window.gameState.profile.items.push(newItem);
      }

      Utils.saveGame();
      Utils.showModal(
        "infoModal",
        `Você comprou 1x ${itemName} por P$${itemToBuy.cost}.`
      );
      Renderer.showScreen("shop");
    } else {
      Utils.showModal("errorModal", "Você não tem dinheiro suficiente!");
    }
  },

  /** Cura o Pokémon ativo ou o Pokémon na lista com um item de cura. */
  useItem: function (itemName, targetPokemonIndex = -1) {
    const item = window.gameState.profile.items.find(
      (i) => i.name === itemName
    );
    if (!item || item.quantity <= 0) {
      if (window.gameState.currentScreen !== "battle") {
        Utils.showModal("errorModal", `Você não tem mais ${itemName}!`);
      }
      return;
    }

    // --- Lógica FORA de Batalha (Cura na Mochila/Lista) ---
    if (window.gameState.currentScreen !== "battle") {
      if (!item.healAmount) {
        Utils.showModal(
          "errorModal",
          `O item ${itemName} não pode ser usado fora da batalha.`
        );
        return;
      }

      const targetPokemon =
        window.gameState.profile.pokemon[targetPokemonIndex];
      if (!targetPokemon) return;

      if (targetPokemon.currentHp >= targetPokemon.maxHp) {
        Utils.showModal(
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

      Utils.showModal(
        "infoModal",
        `Você usou ${itemName}. ${targetPokemon.name} curou ${actualHeal} HP. Restam x${item.quantity}.`
      );
      Utils.saveGame();
      Renderer.showScreen("pokemonList");
      return;
    }

    // --- Lógica DENTRO de Batalha ---
    if (item.healAmount) {
      item.quantity--;
      const playerPokemon = Utils.getActivePokemon();

      if (playerPokemon.currentHp >= playerPokemon.maxHp) {
        window.BattleCore.addBattleLog(`${playerPokemon.name} já está com HP máximo!`);
        item.quantity++; // Devolve o item
      } else {
        const actualHeal = Math.min(
          item.healAmount,
          playerPokemon.maxHp - playerPokemon.currentHp
        );
        playerPokemon.currentHp += actualHeal;
        window.BattleCore.addBattleLog(
          `Você usou ${itemName}. ${playerPokemon.name} curou ${actualHeal} HP.`
        );
      }
    }

    window.BattleCore.updateBattleScreen();
    window.BattleCore.setBattleMenu("main");
  },

  /** Cura todos os Pokémons no Centro Pokémon. */
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
      Utils.showModal("infoModal", "Todos os seus Pokémons já estão saudáveis!");
      return;
    }

    if (profile.money < totalCost) {
      Utils.showModal(
        "errorModal",
        `Você não tem dinheiro suficiente! Custo total: P$${totalCost}.`
      );
      return;
    }

    profile.money -= totalCost;

    Utils.showModal(
      "infoModal",
      `Obrigado por esperar! ${healedCount} Pokémons curados por P$${totalCost}.`
    );
    Utils.saveGame();
    Renderer.showScreen("healCenter");
  },

  /** Executa a lógica de evolução de um Pokémon. */
  evolvePokemon: async function (pokemonIndex) {
    const pokemon = window.gameState.profile.pokemon[pokemonIndex];
    const nextEvolutionName = await window.PokeAPI.fetchNextEvolution(pokemon.id);
    const GameConfig = window.GameConfig;

    if (!nextEvolutionName || pokemon.level < 1) {
      Utils.showModal("errorModal", `${pokemon.name} ainda não pode evoluir.`);
      return;
    }

    if (window.gameState.profile.money < GameConfig.EVOLUTION_COST) {
      Utils.showModal(
        "errorModal",
        `Você precisa de P$${GameConfig.EVOLUTION_COST} para evoluir ${pokemon.name}.`
      );
      return;
    }

    window.gameState.profile.money -= GameConfig.EVOLUTION_COST;
    Utils.showModal("infoModal", `Evoluindo ${pokemon.name}...`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newPokemonData = await window.PokeAPI.fetchPokemonData(nextEvolutionName);

    if (newPokemonData) {
      newPokemonData.level = pokemon.level;
      newPokemonData.exp = pokemon.exp;
      newPokemonData.currentHp = newPokemonData.maxHp;

      window.gameState.profile.pokemon[pokemonIndex] = newPokemonData;
      Utils.saveGame();
      Utils.showModal(
        "infoModal",
        `Parabéns! Seu ${pokemon.name} evoluiu para ${newPokemonData.name}!`
      );
      Renderer.showScreen("pokemonList");
    } else {
      window.gameState.profile.money += GameConfig.EVOLUTION_COST;
      Utils.showModal(
        "errorModal",
        `Falha ao buscar dados de ${nextEvolutionName}. Evolução cancelada.`
      );
    }
  },

  /** Salva as alterações de nome e gênero do treinador. */
  saveProfile: function () {
    const newNameInput = document.getElementById("newTrainerName");
    const newGenderInput = document.querySelector(
      'input[name="newTrainerGender"]:checked'
    );

    if (!newNameInput || !newGenderInput) {
      Utils.showModal("errorModal", "Erro ao encontrar campos de perfil.");
      return;
    }

    const newName = newNameInput.value.trim();
    const newGender = newGenderInput.value;

    if (newName.length < 3) {
      Utils.showModal("errorModal", "O nome deve ter no mínimo 3 caracteres.");
      return;
    }

    window.gameState.profile.trainerName = newName.toUpperCase();
    window.gameState.profile.trainerGender = newGender;
    Utils.saveGame();
    Utils.showModal("infoModal", "Perfil atualizado com sucesso!");
    Renderer.showScreen("profile");
  },
  
  /** Solta (deleta) um Pokémon do time, se houver mais de um. */
  releasePokemon: function (index) {
    if (window.gameState.profile.pokemon.length <= 1) {
      Utils.showModal("errorModal", "Você não pode soltar o seu último Pokémon!");
      return;
    }

    const releasedPokemon = window.gameState.profile.pokemon.splice(
      index,
      1
    )[0];
    Utils.saveGame();
    Utils.showModal("infoModal", `Você soltou ${releasedPokemon.name}.`);
    Renderer.showScreen("managePokemon");
  },
  
  /**
   * Define o Pokémon na posição 'index' como o primeiro Pokémon do time (posição 0).
   * @param {number} index O índice do Pokémon a ser movido.
   */
  setPokemonAsActive: function (index) {
    const pokemonArray = window.gameState.profile.pokemon;
    if (index === 0 || index < 0 || index >= pokemonArray.length) {
        return;
    }

    const [activePokemon] = pokemonArray.splice(index, 1);
    pokemonArray.unshift(activePokemon); // Move para o topo (posição 0)

    Utils.saveGame();
    Utils.showModal("infoModal", `${activePokemon.name} é agora seu Pokémon ativo!`);
    Renderer.showScreen("managePokemon");
  },
  
  // --- Drag and Drop Logic ---
  draggedPokemonIndex: null,

  /** Inicia o arrasto e armazena o índice do Pokémon. */
  dragStart: function (event) {
    // Adicionado: Verifica se o elemento arrastado é o handle real (o SVG dos pontinhos)
    const handleElement = event.target.closest('[data-drag-handle="true"]');
    if (!handleElement) {
        // Se não for o handle, previne o drag para permitir a rolagem normal
        event.preventDefault();
        return;
    }

    // O target real para o índice é o item pai
    const targetElement = handleElement.closest('[data-pokemon-index]');
    if (!targetElement) return;

    GameLogic.draggedPokemonIndex = parseInt(targetElement.dataset.pokemonIndex);
    event.dataTransfer.effectAllowed = "move";
    
    // Adiciona uma classe para feedback visual (opcional)
    targetElement.classList.add("opacity-50");
  },
  
  /** Permite a soltura. */
  allowDrop: function (event) {
    event.preventDefault();
  },
  
  /** Processa a soltura e reordena a lista. */
  drop: function (event) {
    event.preventDefault();
    const droppedOnElement = event.target.closest('[data-pokemon-index]');
    if (!droppedOnElement) return;

    const droppedOnIndex = parseInt(droppedOnElement.dataset.pokemonIndex);
    const draggedIndex = GameLogic.draggedPokemonIndex;

    // Remove a classe de opacidade do elemento arrastado
    const draggedElement = document.querySelector(`[data-pokemon-index="${draggedIndex}"]`);
    if (draggedElement) {
        draggedElement.classList.remove("opacity-50");
    }

    if (draggedIndex === null || draggedIndex === droppedOnIndex) {
        return;
    }

    const pokemonArray = window.gameState.profile.pokemon;
    const [removed] = pokemonArray.splice(draggedIndex, 1);
    pokemonArray.splice(droppedOnIndex, 0, removed);

    Utils.saveGame();
    
    // Re-renderiza a lista para refletir a nova ordem em tempo real
    Renderer.showScreen("pokemonList"); 
  },
  
  /** Adiciona feedback visual de arrasto sobre. */
  dragEnter: function (event) {
      event.preventDefault();
      const targetElement = event.target.closest('[data-pokemon-index]');
      if (!targetElement || targetElement.classList.contains("drag-over")) return;
      
      // Adiciona uma classe para feedback visual (ex: borda)
      targetElement.classList.add("border-dashed", "border-4", "border-blue-500", "bg-blue-50");
  },
  
  /** Remove feedback visual de arrasto sobre. */
  dragLeave: function (event) {
      const targetElement = event.target.closest('[data-pokemon-index]');
      if (!targetElement) return;
      
      // Remove a classe de feedback visual
      targetElement.classList.remove("border-dashed", "border-4", "border-blue-500", "bg-blue-50");
  },

  /** Exporta o save do jogador como um arquivo JSON. */
  exportSave: function () {
    try {
      const saveProfile = localStorage.getItem("pokemonGameProfile");
      const saveLog = localStorage.getItem("pokemonGameExploreLog");

      if (!saveProfile) {
        Utils.showModal("errorModal", "Nenhum jogo salvo para exportar!");
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
      Utils.showModal("infoModal", "Seu save foi exportado com sucesso!");
    } catch (e) {
      console.error("Erro ao exportar save:", e);
      Utils.showModal("errorModal", "Falha ao exportar o save. Tente novamente.");
    }
  },

  /** Importa o save do jogador de um arquivo JSON. */
  importSave: function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.profile && Array.isArray(data.profile.pokemon)) {
          localStorage.setItem(
            "pokemonGameProfile",
            JSON.stringify(data.profile)
          );
          localStorage.setItem(
            "pokemonGameExploreLog",
            JSON.stringify(data.exploreLog || [])
          );

          window.gameState.profile = data.profile;
          window.gameState.exploreLog = data.exploreLog || [];

          Utils.showModal(
            "infoModal",
            "Save importado com sucesso! Recarregando..."
          );
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error("Estrutura de save inválida.");
        }
      } catch (e) {
        console.error("Erro ao importar save:", e);
        Utils.showModal(
          "errorModal",
          "Falha ao importar o save. O arquivo pode estar corrompido ou ser inválido."
        );
      }
    };
    reader.readAsText(file);
  }
};
