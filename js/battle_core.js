import { GameConfig, Utils, PokeAPI } from './config_utils.js';
import { GameLogic } from './game_logic.js';
import { PvpCore } from './pvp_core.js';
import { Renderer } from './renderer.js';
import { AuthSetup } from './auth_setup.js';

export const BattleCore = {
  /** Inicia uma batalha selvagem. */
  startWildBattle: async function () {
    const randomId = Math.floor(Math.random() * 151) + 1;
    const wildPokemonData = await PokeAPI.fetchPokemonData(randomId);
    if (!wildPokemonData) {
      GameLogic.addExploreLog("Erro ao encontrar Pokémon selvagem.");
      return;
    }

    const playerMaxLevel =
      window.gameState.profile.pokemon.length > 0
        ? Math.max(...window.gameState.profile.pokemon.map((p) => p.level))
        : 5;
    wildPokemonData.level = Math.max(
      1,
      playerMaxLevel + (Math.random() > 0.5 ? 1 : -1)
    );
    wildPokemonData.currentHp = wildPokemonData.maxHp;

    window.gameState.battle = {
      type: "wild",
      opponent: wildPokemonData,
      playerPokemonIndex: 0,
      turn: 0,
      lastMessage: `Um ${wildPokemonData.name} selvagem apareceu!`,
      log: [],
      currentMenu: "main", // Garante que o menu principal seja exibido ao iniciar
    };

    // Chama o Renderer para mostrar a tela de batalha
    Renderer.showScreen("battle");
  },

  /** Calcula o dano simplificado entre dois Pokémons. */
  calculateDamage: function (attacker, move, defender) {
    const attackStat = attacker.stats.attack || 50;
    const defenseStat = defender.stats.defense || 50;
    const level = attacker.level || 5;
    const baseDamageMultiplier = 2;
    let modifier = Math.random() * 0.15 + 0.85;

    const criticalRoll = Math.random();
    let isCritical = false;
    if (criticalRoll < 0.05) {
      modifier *= 2;
      isCritical = true;
    }

    let damage = Math.floor(
      level * (attackStat / defenseStat) * baseDamageMultiplier * modifier
    );
    damage = Math.max(1, damage);

    return { damage, isCritical };
  },
  
  /** Adiciona EXP ao Pokémon vencedor e verifica se ele sobe de nível. */
  gainExp: function (winner, defeatedLevel) {
    const expGain = Math.floor((defeatedLevel * 50) / 7);
    winner.exp += expGain;

    let expToNextLevel = winner.level * winner.level * winner.level;

    while (winner.exp >= expToNextLevel) {
      winner.level++;
      winner.maxHp += Math.floor(Math.random() * 5 + 5);
      winner.currentHp = winner.maxHp;
      BattleCore.addBattleLog(`${winner.name} subiu para o Nível ${winner.level}!`);

      expToNextLevel = winner.level * winner.level * winner.level;
    }
  },
  
  /** Lógica de vitória em PvE (ganho de dinheiro e EXP). */
  battleWin: function (winner, loser) {
    BattleCore.addBattleLog(`Parabéns! ${winner.name} venceu!`);

    const moneyGain = Math.floor(Math.random() * 500) + 200;
    window.gameState.profile.money += moneyGain;
    BattleCore.addBattleLog(`Você ganhou P$${moneyGain}.`);

    BattleCore.gainExp(winner, loser.level);

    const profilePoke =
      window.gameState.profile.pokemon[
        window.gameState.battle.playerPokemonIndex
      ];
    profilePoke.currentHp = winner.currentHp;
    profilePoke.exp = winner.exp;
    profilePoke.level = winner.level;
  },
  
  /** Adiciona uma mensagem ao log de batalha e atualiza a UI. */
  addBattleLog: function (message) {
    if (window.gameState.battle) {
      window.gameState.battle.lastMessage = message;
      if (window.gameState.battle.log) {
        window.gameState.battle.log.push(message);
        if (window.gameState.battle.log.length > 8) {
          window.gameState.battle.log.shift();
        }
      }
      // Chama a atualização visual
      BattleCore.updateBattleScreen();
    }
  },
  
  /** Calcula a taxa de captura baseada em HP e Pokébola. */
  calculateCatchRate: function (pokemonHp, maxHp, ballCatchRate) {
    const wildPokemon = window.gameState.battle.opponent;
    const hpRatio = pokemonHp / maxHp;
    const levelFactor = wildPokemon.level;

    let catchChance =
      GameConfig.POKEBALL_BASE_CATCH_RATE / (hpRatio * levelFactor * 2);
    catchChance = catchChance * ballCatchRate;

    return Math.min(95, Math.max(10, Math.floor(catchChance)));
  },

  /** Simula a animação e o resultado da captura. */
  animateCapture: function (ballName, ballCatchRate) {
    return new Promise((resolve) => {
      const wildPokemon = window.gameState.battle.opponent;
      const chance = BattleCore.calculateCatchRate(
        wildPokemon.currentHp,
        wildPokemon.maxHp,
        ballCatchRate
      );
      const roll = Math.floor(Math.random() * 100) + 1;
      const opponentSpriteElement =
        document.querySelector(".opponent-sprite");

      if (opponentSpriteElement) {
        opponentSpriteElement.src =
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
        opponentSpriteElement.style.transform = "scale(1.5)";
        opponentSpriteElement.classList.add("animate-spin-slow");
      }

      let shakes = 0;
      let isCaptured = roll <= chance;

      const shakeInterval = setInterval(() => {
        shakes++;

        if (shakes <= 3) {
          BattleCore.addBattleLog(`... ${ballName} balança ${shakes} vez(es) ...`);
        }

        if (shakes === 3) {
          clearInterval(shakeInterval);

          if (opponentSpriteElement) {
            opponentSpriteElement.classList.remove("animate-spin-slow");
          }

          if (isCaptured) {
            BattleCore.addBattleLog(`Sucesso! ${wildPokemon.name} foi capturado!`);

            setTimeout(() => {
              window.gameState.profile.pokemon.push(wildPokemon);
              Utils.saveGame();
              AuthSetup.handleBattleMusic(false);
              Renderer.showScreen("mainMenu");
              resolve(true);
            }, 1000);
          } else {
            BattleCore.addBattleLog(`Oh não! ${wildPokemon.name} escapou!`);

            if (opponentSpriteElement) {
              opponentSpriteElement.src = wildPokemon.sprite;
              opponentSpriteElement.style.transform = "scale(1.5)";
            }

            if (roll > 90) {
              BattleCore.addBattleLog(`${wildPokemon.name} fugiu da batalha!`);
              setTimeout(() => {
                AuthSetup.handleBattleMusic(false);
                Renderer.showScreen("mainMenu");
                resolve(true);
              }, 1500);
            } else {
              resolve(false);
            }
          }
        }
      }, 1200);
    });
  },
  
  /** Tenta capturar o Pokémon selvagem. */
  tryCapture: async function (ballName, ballCatchRate) {
    const ballItem = window.gameState.profile.items.find(
      (i) => i.name === ballName
    );
    if (!ballItem || ballItem.quantity <= 0) {
      BattleCore.addBattleLog(`Você não tem mais ${ballName}!`);
      return;
    }

    BattleCore.addBattleLog(`Você joga a ${ballName}!`);
    BattleCore.setBattleMenu("disabled");

    // Passa o controle para a função de captura
    const battleEnded = await BattleCore.animateCapture(ballName, ballCatchRate);
    
    // Decrementa o item após a tentativa, independentemente do resultado
    ballItem.quantity--;
    Utils.saveGame();

    if (!battleEnded) {
      // Se a captura falhou e a batalha não terminou, o oponente ataca
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Garante que o turno do oponente seja processado
      await BattleCore.playerTurn("opponent_attack"); 
    }

    // Se a batalha ainda estiver ativa (não terminou após tryCapture ou opponent_attack)
    if (window.gameState.battle && !battleEnded) { 
      BattleCore.setBattleMenu("main");
    }
  },

  /** Simula o turno de ação na batalha (PvE e encaminha PvP). */
  playerTurn: async function (action, moveName = null) {
    const battle = window.gameState.battle;
    const playerPokemon = Utils.getActivePokemon();
    const opponent = battle.opponent;
    let ended = false;
    
    // Define o menu como desabilitado no início do turno para evitar dupla ação
    BattleCore.setBattleMenu("disabled");

    const item = window.gameState.profile.items.find(
      (i) => i.name === moveName
    );

    if (battle.type === "pvp") {
      if (action === "item" && item && item.catchRate) {
          BattleCore.addBattleLog("Pokébolas não podem ser usadas em batalhas PvP.");
          BattleCore.setBattleMenu("main");
          return;
      }
      // Encaminha para o core PvP e espera pelo listener
      PvpCore.sendPvpAction(action, moveName);
      return;
    }

    // --- Lógica PvE (Wild Battle) ---

    // 1. Ação do Jogador
    if (action === "run") {
      if (Math.random() < 0.5) {
        BattleCore.addBattleLog(`Você fugiu com sucesso!`);
        ended = true;
      } else {
        BattleCore.addBattleLog(`Você falhou em fugir!`);
      }
    } else if (action === "move") {
      if (playerPokemon.currentHp <= 0) {
        BattleCore.addBattleLog(`${playerPokemon.name} desmaiou e não pode atacar!`);
        BattleCore.setBattleMenu("main"); // Volta o menu
        return;
      }
      const damageResult = BattleCore.calculateDamage(
        playerPokemon,
        moveName,
        opponent
      );
      opponent.currentHp = Math.max(
        0,
        opponent.currentHp - damageResult.damage
      );

      let logMessage = `${playerPokemon.name} usou ${Utils.formatName(
        moveName
      )}! Causou ${damageResult.damage} de dano.`;
      if (damageResult.isCritical) {
        logMessage += ` É UM ACERTO CRÍTICO!`;
      }
      BattleCore.addBattleLog(logMessage);
    } else if (action === "item" && item) {
      // Itens de Cura/Pokébola
      if (item.catchRate) {
        await BattleCore.tryCapture(moveName, item.catchRate);
        return; // tryCapture gerencia o fluxo de turno
      }
      
      const isHealing = item.healAmount;
      GameLogic.useItem(moveName); // Usa o item de cura (aplica localmente)
      
      if (isHealing) {
        // Se for cura, não há ataque do jogador, o oponente ataca no próximo bloco.
        await new Promise((resolve) => setTimeout(resolve, 1000));
        action = "opponent_attack"; // Força o ataque do oponente
      }
    } else if (action === "opponent_attack") {
      // Usado internamente para forçar o turno do oponente após um item ou troca.
    } else {
      BattleCore.setBattleMenu("main");
      return;
    }

    if (opponent.currentHp === 0) {
      BattleCore.battleWin(playerPokemon, opponent);
      ended = true;
    }

    // 2. Turno do Oponente
    // O oponente só ataca se a batalha não terminou e se o jogador não fugiu/usou item/trocou.
    // Usar item (cura) ou troca também é seguido por um ataque do oponente, exceto se a batalha terminar.
    if (!ended && (action === "move" || action === "opponent_attack" || (action === "item" && item.healAmount))) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const randomOpponentMove =
        opponent.moves[Math.floor(Math.random() * opponent.moves.length)];
      const damageResult = BattleCore.calculateDamage(
        opponent,
        randomOpponentMove,
        playerPokemon
      );
      playerPokemon.currentHp = Math.max(
        0,
        playerPokemon.currentHp - damageResult.damage
      );

      let logMessage = `${opponent.name} usou ${Utils.formatName(
        randomOpponentMove
      )}! Recebeu ${damageResult.damage} de dano.`;
      if (damageResult.isCritical) {
        logMessage += ` É UM ACERTO CRÍTICO!`;
      }
      BattleCore.addBattleLog(logMessage);

      if (playerPokemon.currentHp === 0) {
        BattleCore.addBattleLog(
          `${playerPokemon.name} desmaiou! Você precisa trocar de Pokémon.`
        );
        const hasLivePokemon = window.gameState.profile.pokemon.some(
          (p) => p.currentHp > 0
        );
        if (!hasLivePokemon) {
          BattleCore.addBattleLog(
            "Todos os seus Pokémons desmaiaram! Você perdeu a batalha."
          );
          ended = true;
        }
      }
    }

    // 3. Fim do Turno / Batalha
    BattleCore.updateBattleScreen();

    if (ended) {
      setTimeout(() => {
        window.gameState.battle = null;
        AuthSetup.handleBattleMusic(false);
        Renderer.showScreen("mainMenu");
        Utils.saveGame();
      }, 2000);
    }

    // Volta o menu para as opções principais se a batalha não terminou
    if (!ended) {
        BattleCore.setBattleMenu("main");
    }
  },

  /** Troca o Pokémon ativo na batalha. */
  switchPokemon: async function (newIndex) {
    const battle = window.gameState.battle;
    const currentPokemon = Utils.getActivePokemon();
    const newPokemon = window.gameState.profile.pokemon[newIndex];

    if (
      newIndex === battle.playerPokemonIndex ||
      newPokemon.currentHp <= 0
    ) {
      return;
    }

    battle.playerPokemonIndex = newIndex;
    BattleCore.setBattleMenu("disabled"); // Desabilita o menu durante a troca

    BattleCore.addBattleLog(`Volte, ${currentPokemon.name}! Vá, ${newPokemon.name}!`);

    if (battle.type === "pvp") {
      PvpCore.sendPvpAction("switch", null);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Após a troca, o oponente ataca
      await BattleCore.playerTurn("opponent_attack");
    }
    
    // O playerTurn (no caso PvE) ou o listener PvP (no caso PvP) irá reativar o menu para "main"
    Renderer.showScreen("battle");
  },

  /** Define o menu de batalha atual. */
  setBattleMenu: function (menu) {
    if(window.gameState.battle.type === 'pvp' && window.gameState.battle.currentMenu === 'disabled' && menu !== 'main') {
        // Bloqueia mudança de menu se for PvP e estiver esperando, a menos que seja para voltar ao menu principal.
        return; 
    }
    window.gameState.battle.currentMenu = menu;
    BattleCore.updateBattleScreen();
  },
  
  /** Atualiza os elementos visuais da batalha. */
  updateBattleScreen: function () {
    const battleArea = document.getElementById("battle-area");
    if (!battleArea || !window.gameState.battle) return;

    const battle = window.gameState.battle;
    // Garante que o Pokémon ativo está sempre atualizado
    const playerPokemon = Utils.getActivePokemon();
    const opponent = battle.opponent;

    // Garante que o Pokémon do jogador está no time
    if (!playerPokemon) return;

    const playerBackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPokemon.id}.png`;

    const playerHpPercent =
      (playerPokemon.currentHp / playerPokemon.maxHp) * 100;
    const opponentHpPercent = (opponent.currentHp / opponent.maxHp) * 100;

    // Log de Mensagem
    const logHtml = `<p class="gba-font text-xs">${
      battle.lastMessage || ""
    }</p>`;

    let optionsHtml = "";
    const isMainMenu = battle.currentMenu === "main";
    const isDisabled = battle.currentMenu === "disabled";
    
    // O bloqueio PvP já é gerenciado no setBattleMenu, mas o visual precisa refletir o estado
    const isPvpLocked = battle.type === "pvp" && isDisabled;

    // --- Geração do Menu de Opções ---
    if (isMainMenu) {
      optionsHtml = `
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="BattleCore.setBattleMenu('fight')" class="gba-button bg-red-500 hover:bg-red-600">Lutar</button>
                    <button onclick="BattleCore.playerTurn('run')" class="gba-button bg-green-500 hover:bg-green-600" ${battle.type === 'pvp' ? 'disabled' : ''}>Fugir</button>
                    <button onclick="BattleCore.setBattleMenu('item')" class="gba-button bg-yellow-500 hover:bg-yellow-600">Item</button>
                    <button onclick="Renderer.showScreen('switchPokemon')" class="gba-button bg-blue-500 hover:bg-blue-600">Pokémon</button>
                </div>
            `;
    } else if (battle.currentMenu === "fight") {
      optionsHtml = playerPokemon.moves
        .map(
          (move) =>
            `<button onclick="BattleCore.playerTurn('move', '${move}')" class="flex-1 gba-button bg-red-400 hover:bg-red-500">${Utils.formatName(
              move
            )}</button>`
        )
        .join("");
      optionsHtml = `<div class="grid grid-cols-2 gap-2">${optionsHtml}</div>`;
    } else if (battle.currentMenu === "item") {
      const items = window.gameState.profile.items;
      // Itens que podem ser usados em batalha (Pokébolas em wild, Poções em qualquer)
      const battleItems = items.filter((i) => (i.catchRate && battle.type === 'wild') || i.healAmount);

      const itemsHtml = battleItems
        .map((item) => {
          const disabled = item.quantity <= 0;
          return `<button ${
            disabled ? "disabled" : ""
          } onclick="BattleCore.playerTurn('item', '${
            item.name
          }')" class="flex-1 gba-button ${
            disabled
              ? "bg-gray-300"
              : item.catchRate
              ? "bg-yellow-400 hover:bg-yellow-500"
              : "bg-green-400 hover:bg-green-500"
          }">${item.name} x${item.quantity}</button>`;
        })
        .join("");

      optionsHtml = `<div class="grid grid-cols-2 gap-2">${itemsHtml}</div>`;
    } else if (isDisabled) {
      optionsHtml = `<div class="p-2 text-center gba-font text-xs text-gray-700">Aguarde a ação do oponente...</div>`;
    }

    // --- Renderização da Tela de Batalha ---
    // NOTA: Ajustei as classes de posicionamento dos sprites para serem responsivas
    battleArea.innerHTML = `
            <div class="relative h-48 mb-4 flex-shrink-0">
                <!-- OPPONENT HP BOX -->
                <div class="absolute top-0 left-0 p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner w-1/2">
                    <div class="gba-font text-sm font-bold">${
                      opponent.name
                    } (Nv. ${opponent.level})</div>
                    <div class="flex items-center mt-1">
                        <div class="gba-font text-xs mr-1">HP</div>
                        <div class="w-full bg-gray-300 h-2 rounded-full">
                            <div class="h-2 rounded-full transition-all duration-500 ${
                              opponentHpPercent > 50
                                ? "bg-green-500"
                                : opponentHpPercent > 20
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }" style="width: ${opponentHpPercent}%;"></div>
                        </div>
                    </div>
                    <!-- NOVO: Exibe o HP atual e máximo do oponente -->
                    <div class="gba-font text-xs mt-1">${
                      opponent.currentHp
                    }/${opponent.maxHp}</div>
                </div>
                
                <!-- SPRITES: Posições atualizadas para flexibilidade -->
                <div class="relative w-full h-64">
                    <!-- Opponent Sprite: Centrado na parte superior direita para telas pequenas, move-se para a direita em telas maiores -->
                    <img src="${opponent.sprite}" alt="${
      opponent.name
    }" class="opponent-sprite w-28 h-28 absolute top-8 right-0 md:right-24 transform -translate-y-1/2 scale-150">
                </div>
                
                <!-- PLAYER HP BOX -->
                <div class="absolute bottom-0 right-0 p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner w-1/2">
                    <div class="gba-font text-sm font-bold">${
                      playerPokemon.name
                    } (Nv. ${playerPokemon.level})</div>
                    <div class="flex items-center mt-1">
                        <div class="gba-font text-xs mr-1">HP</div>
                        <div class="w-full bg-gray-300 h-2 rounded-full">
                            <div class="h-2 rounded-full transition-all duration-500 ${
                              playerHpPercent > 50
                                ? "bg-green-500"
                                : playerHpPercent > 20
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }" style="width: ${playerHpPercent}%;"></div>
                        </div>
                    </div>
                    <div class="gba-font text-xs mt-1">${
                      playerPokemon.currentHp
                    }/${playerPokemon.maxHp}</div>
                </div>
                <!-- Player Sprite: Centrado na parte inferior esquerda, move-se para a esquerda em telas maiores -->
                <img src="${playerBackSprite}" alt="${
      playerPokemon.name
    }" class="absolute bottom-7 left-12 md:left-24 w-[104px] h-[104px] transform -translate-x-1/2 translate-y-1/2 scale-150">
            </div>
            
            <!-- LOG MESSAGE AREA -->
            <div class="h-16 p-2 mt-4 mb-4 bg-gray-800 text-white rounded-md flex items-center justify-start text-sm gba-font flex-shrink-0">
                ${logHtml}
            </div>
            
            <!-- BUTTONS AREA -->
            <div class="p-2 bg-gray-200 border-2 border-gray-800 rounded-md flex flex-col min-h-[140px] justify-between flex-grow">
                <div id="battle-options-container" class="flex-grow ${isPvpLocked ? 'opacity-50 pointer-events-none' : ''}">
                    ${optionsHtml}
                </div>
                <button onclick="BattleCore.setBattleMenu('main')" id="back-button" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-2 flex-shrink-0" ${
                  isMainMenu || isDisabled ? "disabled" : ""
                }>Voltar</button>
            </div>
        `;
  }
};