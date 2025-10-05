/**
 * js/pvp_core.js
 * MÓDULO 4: CORE PVP
 * Gerencia a lógica PvP em tempo real com Firebase Firestore.
 */
// REMOVIDO: importações estáticas para evitar problemas de cache. 
// As dependências agora são acessadas através do objeto 'window' (exposto pelo app.js).

// Firebase Imports (Necessário para Firestore e OnSnapshot)
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Módulo para gerenciar a lógica PvP em tempo real com Firebase Firestore.
 */
export const PvpCore = {
  /** Verifica se o Firebase está configurado para habilitar PvP. */
  isPvpEnabled: function () {
    // Acesso às variáveis globais definidas na inicialização do HTML
    return window.db !== null && window.auth !== null;
  },

  /** Retorna a referência do documento da sala PvP. */
  getPvpRoomRef: function (roomId) {
    const path = `/artifacts/${window.appId}/public/data/pvp_rooms/${roomId}`;
    return doc(window.db, path);
  },
  
  /** Atualiza a mensagem na tela de setup PvP. */
  updatePvpMessage: function (message) {
      const msgBox = document.getElementById("pvp-messages") || document.getElementById("pvp-message-wait");
      if (msgBox) msgBox.innerHTML = message;
  },

  /** Cria uma nova sala PvP no Firestore. */
  createPvpLink: async function () {
    if (!PvpCore.isPvpEnabled() || !window.userId || window.gameState.profile.pokemon.length === 0) {
      PvpCore.updatePvpMessage("Erro: PvP indisponível ou você não tem Pokémons.");
      return;
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = PvpCore.getPvpRoomRef(roomId);
    const playerPokemon = window.Utils.getActivePokemon(); // Usa window.Utils

    try {
      const roomData = {
        status: "waiting",
        player1: {
          userId: window.userId,
          trainerName: window.gameState.profile.trainerName,
          pokemon: { ...playerPokemon, currentHp: playerPokemon.maxHp },
          action: null,
        },
        player2: null,
        log: [
          `Sala ${roomId} criada por ${window.gameState.profile.trainerName}. Compartilhe o link.`,
        ],
        turn: 1,
        createdAt: Date.now(),
      };

      await setDoc(roomRef, roomData);
      window.gameState.pvpRoomId = roomId;

      const newUrl = `${window.location.origin}${window.location.pathname}?pvp=${roomId}`;
      window.history.pushState({ path: newUrl }, "", newUrl);

      PvpCore.updatePvpMessage(`Sala criada! Link: <input id="pvpLink" type="text" value="${newUrl}" readonly class="w-full p-1 mt-2 text-xs border border-gray-300 rounded" onclick="PvpCore.copyPvpLink()">
                <button onclick="PvpCore.copyPvpLink()" class="gba-button bg-green-500 hover:bg-green-600 w-full mt-2">Copiar Link</button>
                Aguardando oponente...`);

      window.Renderer.renderPvpWaiting(roomId); // Usa window.Renderer
      PvpCore.listenForPvpChanges(roomId, true);
    } catch (error) {
      console.error("Erro ao criar sala PvP:", error);
      PvpCore.updatePvpMessage("Erro ao criar sala. Tente novamente.");
    }
  },
  
  /** Copia o link da sala PvP para a área de transferência. */
  copyPvpLink: function () {
      const copyText = document.getElementById("pvpLink");
      if (copyText) {
          copyText.select();
          document.execCommand('copy');
          window.Utils.showModal("infoModal", "Link copiado para a área de transferência!"); // Usa window.Utils
      }
  },

  /** Entra em uma sala PvP existente no Firestore. */
  joinPvpBattle: async function (roomId) {
    if (!PvpCore.isPvpEnabled() || !window.userId || window.gameState.profile.pokemon.length === 0) {
      PvpCore.updatePvpMessage("Erro: PvP indisponível ou você não tem Pokémons.");
      return;
    }

    roomId =
      roomId || new URLSearchParams(window.location.search).get("pvp");
    if (!roomId) {
      PvpCore.updatePvpMessage("Por favor, forneça o ID da sala.");
      return;
    }

    const roomRef = PvpCore.getPvpRoomRef(roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      PvpCore.updatePvpMessage(`Sala ${roomId} não encontrada.`);
      return;
    }

    const roomData = roomSnap.data();

    if (roomData.player1.userId === window.userId) {
      window.gameState.pvpRoomId = roomId;
      PvpCore.updatePvpMessage("Você é o criador da sala. Restaurando sessão...");
      window.Renderer.renderPvpWaiting(roomId); // Usa window.Renderer
      PvpCore.listenForPvpChanges(roomId, true);
      return;
    }

    if (roomData.player2) {
      PvpCore.updatePvpMessage(`A sala ${roomId} já está cheia ou em andamento.`);
      return;
    }

    const playerPokemon = window.Utils.getActivePokemon(); // Usa window.Utils
    const player2Data = {
      userId: window.userId,
      trainerName: window.gameState.profile.trainerName,
      pokemon: { ...playerPokemon, currentHp: playerPokemon.maxHp },
      action: null,
    };

    try {
      await updateDoc(roomRef, {
        player2: player2Data,
        status: "ready",
        log: [
          ...roomData.log,
          `${window.gameState.profile.trainerName} entrou na batalha!`,
        ],
      });

      window.gameState.pvpRoomId = roomId;
      PvpCore.updatePvpMessage(`Você entrou na sala ${roomId}. Batalha começando!`);
      PvpCore.listenForPvpChanges(roomId, false);
    } catch (error) {
      console.error("Erro ao entrar na sala PvP:", error);
      PvpCore.updatePvpMessage("Erro ao entrar na sala. Tente novamente.");
    }
  },

  /** Adiciona um listener em tempo real para mudanças na sala PvP. */
  listenForPvpChanges: function (roomId, isPlayer1) {
    if (window.unsubscribePvp) window.unsubscribePvp();

    const roomRef = PvpCore.getPvpRoomRef(roomId);

    window.unsubscribePvp = onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) {
        window.Utils.showModal("pvpModal", "A sala de batalha foi encerrada!"); // Usa window.Utils
        if (window.unsubscribePvp) window.unsubscribePvp();
        window.Renderer.showScreen("mainMenu"); // Usa window.Renderer
        return;
      }

      const roomData = docSnap.data();

      if (
        roomData.status === "ready" &&
        window.gameState.currentScreen !== "battle"
      ) {
        // Inicia a batalha
        window.gameState.battle = {
          type: "pvp",
          opponent: isPlayer1
            ? roomData.player2.pokemon
            : roomData.player1.pokemon,
          playerPokemonIndex: 0,
          turn: roomData.turn,
          lastMessage: roomData.log.slice(-1)[0] || "A batalha começou!",
          log: roomData.log,
          isPlayer1: isPlayer1,
          currentMenu: "main",
          pvpRoomId: roomId,
          roomData: roomData,
        };
        window.Renderer.showScreen("battle"); // Usa window.Renderer
      } else if (window.gameState.currentScreen === "battle") {
        // Atualiza o estado da batalha
        window.gameState.battle.log = roomData.log;
        window.gameState.battle.turn = roomData.turn;
        window.gameState.battle.roomData = roomData;
        window.gameState.battle.lastMessage =
          roomData.log.slice(-1)[0] || window.gameState.battle.lastMessage;

        const myRole = isPlayer1 ? "player1" : "player2";
        const oppRole = isPlayer1 ? "player2" : "player1";

        const myPokeInRoom = roomData[myRole].pokemon;
        window.gameState.profile.pokemon[
          window.gameState.battle.playerPokemonIndex
        ].currentHp = myPokeInRoom.currentHp;

        window.gameState.battle.opponent.currentHp =
          roomData[oppRole].pokemon.currentHp;

        if (
          roomData.player1.action &&
          roomData.player2.action &&
          roomData.status === "active"
        ) {
          PvpCore.processPvpTurn(roomId, roomData, isPlayer1);
        }

        window.BattleCore.updateBattleScreen(); // Usa window.BattleCore
      } else if (window.gameState.currentScreen === "pvpWaiting") {
        PvpCore.updatePvpMessage(roomData.log.slice(-1)[0] || "Aguardando...");
      }
    });
  },

  /** Envia a ação do jogador para o Firestore. */
  sendPvpAction: async function (action, moveName = null) {
    if (!PvpCore.isPvpEnabled()) return;

    const battle = window.gameState.battle;
    if (!battle || battle.type !== "pvp" || !battle.pvpRoomId) {
      window.Utils.showModal("errorModal", "Erro no estado da batalha PvP."); // Usa window.Utils
      return;
    }

    const roomRef = PvpCore.getPvpRoomRef(battle.pvpRoomId);
    const myRole = battle.isPlayer1 ? "player1" : "player2";
    
    // Se for uma cura, aplica localmente e envia o estado atualizado
    if (action === "item" && moveName === "Poção") {
        const item = window.gameState.profile.items.find(i => i.name === "Poção");
        window.GameLogic.useItem("Poção"); // Usa window.GameLogic
        
        const updatedPokemon = window.Utils.getActivePokemon(); // Usa window.Utils
        
        const updateData = {};
        updateData[`${myRole}.pokemon`] = updatedPokemon;
        updateData.log = [
            ...battle.roomData.log,
            `${window.gameState.profile.trainerName} usou uma Poção! HP atualizado.`,
        ];
        
        try {
            await updateDoc(roomRef, updateData);
            window.BattleCore.addBattleLog(`Poção usada. Aguardando ação do oponente...`); // Usa window.BattleCore
            window.BattleCore.setBattleMenu("disabled"); // Usa window.BattleCore
        } catch(e) {
            console.error("Erro ao enviar cura PvP:", e);
            window.BattleCore.addBattleLog("Erro ao enviar sua cura. Tente novamente."); // Usa window.BattleCore
        }
        return;
    }
    
    // Troca de Pokémon
    if (action === "switch") {
      const updatedPokemon = window.Utils.getActivePokemon(); // Usa window.Utils
      
      const updateData = {};
      updateData[`${myRole}.action`] = { action: action, move: moveName };
      updateData.status = "active";
      updateData[`${myRole}.pokemon`] = updatedPokemon;
      updateData.log = [
          ...battle.roomData.log,
          `${window.gameState.profile.trainerName} trocou para ${updatedPokemon.name}...`,
      ];

      try {
          await updateDoc(roomRef, updateData);
          window.BattleCore.addBattleLog(`Troca concluída. Aguardando ação do oponente...`); // Usa window.BattleCore
          window.BattleCore.setBattleMenu("disabled"); // Usa window.BattleCore
      } catch (e) {
          console.error("Erro ao enviar troca PvP:", e);
          window.BattleCore.addBattleLog("Erro ao enviar sua troca. Tente novamente."); // Usa window.BattleCore
      }
      return;
    }

    // Ação de MOVER
    const updateData = {};
    updateData[`${myRole}.action`] = { action: action, move: moveName };
    updateData.status = "active";
    updateData.log = [
      ...battle.roomData.log,
      `${window.gameState.profile.trainerName} está preparando uma ação...`,
    ];

    try {
      await updateDoc(roomRef, updateData);
      window.BattleCore.addBattleLog(`Aguardando ação do oponente...`); // Usa window.BattleCore
      window.BattleCore.setBattleMenu("disabled"); // Usa window.BattleCore
    } catch (e) {
      console.error("Erro ao enviar ação PvP:", e);
      window.BattleCore.addBattleLog("Erro ao enviar sua ação. Tente novamente."); // Usa window.BattleCore
    }
  },

  /** Processa o turno de batalha PvP após ambos os jogadores enviarem suas ações. */
  processPvpTurn: async function (roomId, roomData, isPlayer1) {
    const roomRef = PvpCore.getPvpRoomRef(roomId);

    if (roomData.status !== "active") return;

    let p1 = roomData.player1;
    let p2 = roomData.player2;
    let log = roomData.log;
    
    // Determine o meu seletor e o do oponente para as animações
    const mySpriteSelector = isPlayer1 ? '.player-sprite' : '.opponent-sprite';
    const oppSpriteSelector = isPlayer1 ? '.opponent-sprite' : '.player-sprite';


    const actions = [
      {
        role: "player1",
        action: p1.action,
        pokemon: p1.pokemon,
        target: p2.pokemon,
        targetRole: "player2",
        // NOVO: Adiciona seletores de sprite para animação
        attackerSprite: isPlayer1 ? mySpriteSelector : oppSpriteSelector,
        targetSprite: isPlayer1 ? oppSpriteSelector : mySpriteSelector,
        attackAnimation: isPlayer1 ? 'animate-attack' : 'animate-opponent-attack',
      },
      {
        role: "player2",
        action: p2.action,
        pokemon: p2.pokemon,
        target: p1.pokemon,
        targetRole: "player1",
        // NOVO: Adiciona seletores de sprite para animação
        attackerSprite: isPlayer1 ? oppSpriteSelector : mySpriteSelector,
        targetSprite: isPlayer1 ? mySpriteSelector : oppSpriteSelector,
        attackAnimation: isPlayer1 ? 'animate-opponent-attack' : 'animate-attack',
      },
    ];

    p1 = JSON.parse(JSON.stringify(p1));
    p2 = JSON.parse(JSON.stringify(p2));
    log = [...log];
    let battleFinished = false;

    // Processa ações de Ataque (moves)
    for (const { role, action, pokemon, target, targetRole, attackerSprite, targetSprite, attackAnimation } of actions) {
      if (action.action === "move") {
        
        // ANIMAÇÃO: Ataque
        window.BattleCore._animateBattleAction(attackerSprite, attackAnimation, 300);

        const damageResult = window.BattleCore.calculateDamage(pokemon, action.move, target); // Usa window.BattleCore
        
        const targetHpBefore = target.currentHp;
        target.currentHp = Math.max(
          0,
          target.currentHp - damageResult.damage
        );
        const targetTookDamage = targetHpBefore > target.currentHp;


        let logMessage = `${roomData[role].trainerName}'s ${
          pokemon.name
        } usou ${window.Utils.formatName(action.move)}! Causou ${ // Usa window.Utils
          damageResult.damage
        } de dano.`;
        if (damageResult.isCritical) {
          logMessage += ` É UM ACERTO CRÍTICO!`;
        }
        log.push(logMessage);
        
        // Aplica o dano no objeto de dados
        if (targetRole === "player1") {
          p1.pokemon = target;
        } else {
          p2.pokemon = target;
        }
        
        // ANIMAÇÃO: Dano no alvo
        if (targetTookDamage) {
            // A animação de dano precisa ser aplicada no cliente que está visualizando.
            // Para simplificar, aplicamos localmente e atualizamos a tela.
            // O listener já garante que a UI será re-renderizada pelo BattleCore.updateBattleScreen
            window.BattleCore._animateBattleAction(targetSprite, 'animate-damage', 500);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }


        if (target.currentHp === 0) {
          battleFinished = true;
          log.push(`${roomData[targetRole].trainerName}'s ${target.name} desmaiou!`);
          log.push(`${roomData[role].trainerName} venceu o PvP!`);
          break;
        }
      }
    }

    if (battleFinished) {
      await updateDoc(roomRef, {
        status: "finished",
        log: log,
        player1: p1,
        player2: p2,
      });

      const winnerName = log.slice(-1)[0].split(' ')[0];
      window.Utils.showModal("pvpModal", `${winnerName} venceu o PvP!`); // Usa window.Utils
      if (window.unsubscribePvp) window.unsubscribePvp();
      window.gameState.battle = null;
      setTimeout(() => window.Renderer.showScreen("mainMenu"), 500); // Usa window.Renderer
      return;
    }

    // Atualiza o estado da sala para o próximo turno
    const newRoomData = {
      player1: { ...p1, action: null },
      player2: { ...p2, action: null },
      turn: roomData.turn + 1,
      status: "ready",
      log: log,
    };

    await updateDoc(roomRef, newRoomData);
    window.BattleCore.setBattleMenu("main"); // Usa window.BattleCore
  }
};
