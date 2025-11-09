/**
 * js/battle_core.js
 * MÓDULO CORE DE BATALHA (Lógica de Combate Selvagem e Suporte para PvP)
 * Este módulo gerencia o estado da batalha, cálculos de dano e a interface de combate.
 */

// Garante que o objeto window.BattleCore exista para acesso global.
if (typeof window.BattleCore === "undefined") {
  window.BattleCore = {};
}

// =======================================================
// TABELA DE EFICÁCIA DE TIPOS (TYPE CHART)
// Define a eficácia de um tipo de ataque (chave) contra um tipo de defesa (valor).
// 0: Nenhum Dano, 0.5: Não muito eficaz, 1: Normal, 2: Super eficaz
// Todos os tipos são convertidos para minúsculas antes da comparação.
// =======================================================
const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  electric: {
    water: 2,
    grass: 0.5,
    electric: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    flying: 0.5,
    poison: 0.5,
    rock: 2,
    bug: 0.5,
    ghost: 0,
    steel: 2,
    psychic: 0.5,
    ice: 2,
    dark: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    steel: 0.5,
    psychic: 0.5,
    dark: 0,
    fairy: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  fairy: { fighting: 2, poison: 0.5, steel: 0.5, fire: 0.5, dragon: 2 },
};

// =======================================================
// MAPA DE MOVIMENTOS PARA TIPAGEM
// Mapeia o nome do movimento para o tipo (usado na eficácia de dano)
// =======================================================
const MOVES_TO_TYPE_MAPPING = {
  "razor-wind": "normal",
  "swords-dance": "normal",
  cut: "normal",
  bind: "normal",
  "vine-whip": "grass",
  scratch: "normal",
  "mega-punch": "normal",
  "fire-punch": "fire",
  "thunder-punch": "electric",
  "ice-punch": "ice",
  "mega-kick": "normal",
  headbutt: "normal",
  tackle: "normal",
  "string-shot": "bug",
  snore: "normal",
  "bug-bite": "bug",
  harden: "normal",
  "iron-defense": "steel",
  gust: "flying",
  whirlwind: "flying",
  "poison-sting": "poison",
  "fury-attack": "normal",
  fly: "flying",
  slam: "normal",
  "body-slam": "normal",
  "pay-day": "normal",
  "sand-attack": "ground",
  "double-kick": "fighting",
  "horn-attack": "normal",
  pound: "normal",
  "double-slap": "normal",
  "take-down": "normal",
  "double-edge": "normal",
  "karate-chop": "fighting",
  stomp: "normal",
  "horn-drill": "normal",
  "vice-grip": "normal",
  guillotine: "normal",
  transform: "normal",
  leer: "normal",
  "comet-punch": "normal",
  "hydro-pump": "water",
  splash: "normal",
  flail: "normal",
  absorb: "grass",
  acid: "poison",
  supersonic: "normal",
  mist: "ice",
  growl: "normal",
  peck: "flying",
  "drill-peck": "flying",
  ember: "fire",
  flamethrower: "fire",
  "thunder-shock": "electric",
  thunderbolt: "electric",
  "thunder-wave": "electric",
  thunder: "electric",
  surf: "water",
  bite: "dark",
  thrash: "normal",
  disable: "normal",
  toxic: "poison",
  psychic: "psychic",
  "night-shade": "ghost",
  confusion: "psychic",
  "light-screen": "psychic",
  "solar-beam": "grass",
  "fire-spin": "fire",
  "pin-missile": "bug",
  "leech-seed": "grass",
  growth: "normal",
  twineedle: "bug",
  teleport: "psychic",
  "cosmic-power": "psychic",
  "water-gun": "water",
  "rock-throw": "rock",
  "jump-kick": "fighting",
  "rolling-kick": "fighting",
  recover: "normal",
  "struggle-bug": "bug",
  "sticky-web": "bug",
  earthquake: "ground",
  "quick-attack": "normal",
  "fire-blast": "fire",
  blizzard: "ice",
  "ice-beam": "ice",
  "head smash": "rock",
  hypnosis: "psychic",
  "hyper-beam": "normal",
  "tail-whip": "normal",
  wrap: "normal",
  sing: "normal",
  "low-kick": "fighting",
  "petal-dance": "grass",
  withdraw: "water",
  "defense-curl": "normal",
  rollout: "rock",
  attract: "normal",
  "sonic-boom": "normal",
  charge: "electric",
  spark: "electric",
  scratch: "normal",
  strength: "normal",
  "iron-head": "steel",
  liquidation: "water",
};

const TYPE_SOUND_FREQUENCIES = {
  normal: 360,
  fire: 660,
  water: 260,
  grass: 420,
  electric: 880,
  ice: 310,
  fighting: 520,
  poison: 470,
  ground: 300,
  flying: 640,
  psychic: 560,
  bug: 400,
  rock: 240,
  ghost: 330,
  dragon: 610,
  steel: 520,
  dark: 280,
  fairy: 700,
  default: 360,
};

const TYPE_SOUND_WAVEFORMS = {
  fire: "sawtooth",
  electric: "square",
  water: "sine",
  ice: "triangle",
  ghost: "sine",
  dragon: "sawtooth",
  steel: "square",
  fairy: "triangle",
};

let attackAudioCtx = null;

const ensureAttackAudioContext = async () => {
  if (typeof window.AudioContext === "undefined") {
    return null;
  }
  if (!attackAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    attackAudioCtx = new AudioCtx();
  }
  if (attackAudioCtx.state === "suspended") {
    try {
      await attackAudioCtx.resume();
    } catch (err) {
      console.warn("Falha ao retomar contexto de áudio:", err);
    }
  }
  return attackAudioCtx;
};

export const BattleCore = {
  opponentPokemon: null,

  _getBallSpriteUrl: function (ballName) {
    switch (ballName.toLowerCase()) {
      case "pokébola":
        return "../assets/sprites/items/poke-ball.png";
      case "great ball":
        return "../assets/sprites/items/great-ball.png";
      case "ultra ball":
        return "../assets/sprites/items/ultra-ball.png";
      default:
        return "../assets/sprites/items/poke-ball.png"; // Fallback
    }
  },

  _animateBattleAction: function (
    spriteSelector,
    animationClass,
    duration = 500
  ) {
    const element = document.querySelector(spriteSelector);
    if (element) {
      element.classList.add(animationClass);
      setTimeout(() => {
        element.classList.remove(animationClass);
      }, duration);
    }
  },

  _playMoveSound: async function (moveName) {
    const prefs = window.gameState?.profile?.preferences;
    const isMuted = prefs?.isMuted;
    const volume =
      prefs?.effectsVolume !== undefined
        ? prefs.effectsVolume
        : prefs?.volume ?? 0.5;

    if (isMuted || volume <= 0) {
      return;
    }

    const ctx = await ensureAttackAudioContext();
    if (!ctx) return;

    const type =
      MOVES_TO_TYPE_MAPPING[moveName?.toLowerCase?.()] || "default";

    const baseFrequency = TYPE_SOUND_FREQUENCIES[type] ?? TYPE_SOUND_FREQUENCIES.default;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const waveform = TYPE_SOUND_WAVEFORMS[type] || "triangle";
    oscillator.type = waveform;

    const now = ctx.currentTime;
    const duration = 0.4;

    oscillator.frequency.setValueAtTime(baseFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(120, baseFrequency * 0.6),
      now + duration
    );

    const adjustedVolume = Math.min(0.7, Math.max(0.05, volume * 0.5));
    gainNode.gain.setValueAtTime(adjustedVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  },

  startWildBattle: async function () {
    const randomId =
      Math.floor(Math.random() * window.GameConfig.POKEDEX_LIMIT) + 1; // Usa o limite de dados locais
    const wildPokemonData = await window.PokeAPI.fetchPokemonData(randomId);
    if (!wildPokemonData) {
      window.GameLogic.addExploreLog("Erro ao encontrar Pokémon selvagem.");
      window.AuthSetup?.handleBattleMusic(false);
      return;
    }

    const playerMaxLevel =
      window.gameState.profile.pokemon.length > 0
        ? Math.max(...window.gameState.profile.pokemon.map((p) => p.level))
        : 5;

    let levelAdjustment =
      Math.random() > 0.6
        ? Math.floor(Math.random() * 3) + 1
        : Math.floor(Math.random() * 3) - 3;

    wildPokemonData.level = Math.max(1, playerMaxLevel + levelAdjustment);

    wildPokemonData.maxHp = window.Utils.calculateMaxHp(
      wildPokemonData.stats.hp,
      wildPokemonData.level
    );
    wildPokemonData.currentHp = wildPokemonData.maxHp;

    // --- Define apenas 2 ataques (um comum e um especial do tipo) ---
    const type = (wildPokemonData.types?.[0] || "normal").toLowerCase();

    const typeSpecialMove = {
      fire: "ember",
      water: "water-gun",
      grass: "vine-whip",
      electric: "thunder-shock",
      ground: "mud-slap",
      rock: "rock-throw",
      ice: "ice-beam",
      bug: "bug-bite",
      psychic: "confusion",
      dark: "bite",
      ghost: "night-shade",
      steel: "iron-head",
      fighting: "karate-chop",
      poison: "poison-sting",
      flying: "gust",
      dragon: "dragon-breath",
      fairy: "disarming-voice",
      normal: "tackle",
    };

    // Ataque comum + ataque do tipo
    wildPokemonData.moves = ["tackle", typeSpecialMove[type] || "tackle"];

    // NOVO: Adiciona o status de captura (capturado/novo)
    const isCaught = window.gameState.profile.pokedex.has(wildPokemonData.id);
    const captureStatus = isCaught ? " (JÁ CAPTURADO)" : " (NOVO!)";

    window.gameState.battle = {
      type: "wild",
      opponent: wildPokemonData,
      // CORREÇÃO: Usa o índice 0 como padrão para o Pokémon no slot de líder (o primeiro na lista)
      playerPokemonIndex: 0,
      turn: 0,
      // Mensagem inicial com o status de captura
      lastMessage: `Um ${wildPokemonData.name} selvagem (Nv. ${wildPokemonData.level}) apareceu!${captureStatus}`,
      log: [
        `Um ${wildPokemonData.name} selvagem (Nv. ${wildPokemonData.level}) apareceu!${captureStatus}`,
      ],
      currentMenu: "main",
      participatingIndices: new Set(),
    };

    // Adiciona o índice 0 (Pokémon ativo atual) ao set de participantes
    window.gameState.battle.participatingIndices.add(0);

    window.Renderer.showScreen("battle");
  },

  /**
   * Calcula o dano simplificado de um ataque, incluindo a eficácia de tipos.
   * @param {object} attacker - Pokémon atacante.
   * @param {string} moveName - Nome do movimento (para fins de exibição).
   * @param {object} defender - Pokémon alvo.
   * @returns {{damage: number, isCritical: boolean, effectiveness: number}}
   */
  calculateDamage: function (attacker, moveName, defender) {
    const ATTACK_MODIFIER = 1.6;
    const DEFENSE_MODIFIER = 2.4;
    const POWER_BASE = 50;
    const LEVEL_FACTOR = 0.35;

    // 1. Determina o Tipo do Movimento (fallback para 'normal' se não encontrado)
    const moveType = MOVES_TO_TYPE_MAPPING[moveName.toLowerCase()] || "normal";

    // 2. Cálculo do Modificador de Tipo (Effectiveness)
    let effectiveness = 1;
    const defenderTypes = (defender.types || []).map((t) => t.toLowerCase());

    // Aplica o multiplicador para CADA tipo do defensor
    defenderTypes.forEach((defType) => {
      const chart = TYPE_CHART[moveType];
      if (chart) {
        effectiveness *= chart[defType] !== undefined ? chart[defType] : 1;
      }
    });

    // 3. Escolha das Stats (Simplificado: usa Attack/Defense base)
    const attackStat = (attacker.stats.attack || 50) * ATTACK_MODIFIER;
    const defenseStat = (defender.stats.defense || 50) * DEFENSE_MODIFIER;
    const level = attacker.level || 5;

    // 4. Bônus de Ataque do Mesmo Tipo (STAB - Same Type Attack Bonus)
    let stab = 1;
    const attackerTypes = (attacker.types || []).map((t) => t.toLowerCase());
    if (attackerTypes.includes(moveType)) {
      stab = 1.5;
    }

    // FÓRMULA DE DANO PRINCIPAL
    const baseDamage =
      ((level * LEVEL_FACTOR + 2) * POWER_BASE * attackStat) /
      defenseStat /
      50 +
      2;
    let finalDamage = baseDamage;
    let modifier = 1;

    // 5. Modificadores de Batalha (Crítico, Variação, STAB e Eficácia)

    // Crítico
    const criticalRoll = Math.random();
    let isCritical = false;
    if (criticalRoll < 0.0625) {
      modifier *= 1.5;
      isCritical = true;
    }

    // Variação (0.85 a 1.00)
    const variance = Math.random() * 0.15 + 0.85;
    modifier *= variance;

    // Aplica STAB e Eficácia
    modifier *= stab;
    modifier *= effectiveness;

    finalDamage = baseDamage * modifier;

    // 6. Dano Final
    let damage = Math.max(1, Math.floor(finalDamage));

    // Pokémon imune (dano 0)
    if (effectiveness === 0) {
      damage = 0;
    }

    return { damage, isCritical, effectiveness };
  },

  /**
   * Função auxiliar para encerrar a batalha e sincronizar o log.
   * @param {string} finalMessage Mensagem final para o log de exploração.
   */
  _endBattleAndSyncLog: function (finalMessage) {
    if (window.gameState.battle) {
      // 1. Adiciona a mensagem final ao log principal
      window.GameLogic.addExploreLog(finalMessage);

      // 2. Limpa o estado da batalha
      window.gameState.battle = null;

      // 3. Salva os dados
      window.GameLogic.saveGameData();

      // 4. LÓGICA DE RETORNO DO MAPA (BETA MODE)
      if (window.gameState.profile.preferences?.isBetaMode) {
        window.AuthSetup?.handleBattleMusic(false);
        // Chama a função no MapCore para voltar ao mapa e exibir o modal
        window.MapCore.handleBattleReturn(finalMessage);
        return;
      }

      // 5. Fallback para o Menu Principal (Modo Clássico)
      window.AuthSetup?.handleBattleMusic(false);
      window.Renderer.showScreen("mainMenu");
    }
  },

  /**
   * Calcula e aplica XP e dinheiro ao vencedor da batalha selvagem.
   * @param {number} defeatedLevel Nível do Pokémon derrotado.
   * @param {Set<number>} participatingIndices Índices dos Pokémons que participaram da batalha.
   */
  gainExp: function (defeatedLevel, participatingIndices) {
    // Log de Vitória e Dinheiro (se não foi adicionado antes)
    if (!window.gameState.battle.log.some((log) => log.includes("Parabéns!"))) {
      const winner = window.Utils.getActivePokemon();
      BattleCore.addBattleLog(`Parabéns! ${winner.name} venceu!`);

      const moneyGain = Math.floor(Math.random() * 500) + 200;
      window.gameState.profile.money += moneyGain;
      BattleCore.addBattleLog(`Você ganhou P$${moneyGain}.`);
    }

    const totalExpGain = Math.floor((defeatedLevel * 50) / 5);

    // 1. Converte o Set para Array e ordena pelo índice para log limpo
    // Filtra índices que ainda estão no time (ou seja, não foram soltos, etc.)
    const indicesArray = Array.from(participatingIndices)
      .filter((index) => window.gameState.profile.pokemon[index])
      .sort((a, b) => a - b);

    const uniqueParticipantsCount = indicesArray.length;

    // LOG DE CONSOLE: Divisão
    console.log("--- DISTRIBUIÇÃO DE XP INICIADA ---");
    console.log(
      `POKÉMON DERROTADO (Nv ${defeatedLevel}) XP BASE: ${totalExpGain}`
    );
    console.log(
      `Participantes Válidos (Índices): [${indicesArray.join(", ")}]`
    );

    if (uniqueParticipantsCount === 0) {
      console.log(
        "AVISO: Nenhum participante encontrado para receber XP. (Set Vazio)"
      );
      return;
    }

    const sharedExp = Math.floor(totalExpGain / uniqueParticipantsCount);

    // 2. Log da Divisão de XP (Tela)
    const participatingNames = indicesArray
      .map(
        (index) =>
          window.gameState.profile.pokemon[index]?.name || `Slot ${index + 1}`
      )
      .join(", ");

    BattleCore.addBattleLog(
      `XP Total: ${totalExpGain} | Dividido por ${uniqueParticipantsCount} Pokémons: (${participatingNames}).`
    );
    BattleCore.addBattleLog(`Cada um ganha ${sharedExp} XP.`);
    console.log(`XP DISTRIBUÍDA POR POKÉMON: ${sharedExp}`);

    // 3. Distribuição e Level Up
    indicesArray.forEach((index) => {
      const participant = window.gameState.profile.pokemon[index];
      if (!participant) return;

      participant.exp += sharedExp;

      // Log de ganho individual (Tela)
      if (sharedExp > 0) {
        BattleCore.addBattleLog(`${participant.name} ganhou ${sharedExp} XP!`);
      }

      // Log de Console de Status Atual
      console.log(
        `  - ${participant.name} (Nv ${participant.level}): +${sharedExp} XP. Novo XP Total: ${participant.exp}`
      );

      let expToNextLevel = window.Utils.calculateExpToNextLevel(
        participant.level
      );
      while (participant.exp >= expToNextLevel) {
        if (participant.level >= 100) {
          participant.exp = 0; // Limita XP ao máximo
          break;
        }

        participant.exp -= expToNextLevel;
        participant.level++;

        const newMaxHp = window.Utils.calculateMaxHp(
          participant.stats.hp,
          participant.level
        );
        // Cura proporcional ao ganho de HP base (mantendo o % de HP atual)
        participant.currentHp += newMaxHp - participant.maxHp;
        participant.maxHp = newMaxHp;

        // Log de Level Up
        BattleCore.addBattleLog(
          `${participant.name} subiu para o Nível ${participant.level}!`
        );
        console.log(
          `  >>> ${participant.name} SUBIU DE NÍVEL: Nv ${participant.level} (XP Restante: ${participant.exp})`
        );

        expToNextLevel = window.Utils.calculateExpToNextLevel(
          participant.level
        );
      }
    });

    console.log("--- DISTRIBUÇÃO DE XP FINALIZADA ---");
  },

  battleWin: function (winner, loser) {
    // A lógica de XP e dinheiro é delegada a gainExp.
    const participatingIndices = window.gameState.battle.participatingIndices;
    BattleCore.gainExp(loser.level, participatingIndices);

    // A limpeza do Set acontece aqui, ao fim da batalha, ANTES do retorno para o menu.
    if (
      window.gameState.battle &&
      window.gameState.battle.participatingIndices
    ) {
      window.gameState.battle.participatingIndices.clear();
    }
  },

  addBattleLog: function (message) {
    if (window.gameState.battle) {
      window.gameState.battle.lastMessage = message;
      if (window.gameState.battle.log) {
        window.gameState.battle.log.push(message);
        if (window.gameState.battle.log.length > 8) {
          window.gameState.battle.log.shift();
        }
      }
    }
  },

  calculateCatchRate: function (pokemonHp, maxHp, ballCatchRate) {
    const CATCH_BASE = 85;
    const HP_OFFSET = 0.3;
    const LEVEL_K = 0.022;
    const BALL_EXP = 0.5;
    const MIN_CATCH = 5;
    const MAX_CATCH = 90;
    const statusMultiplier = 1;
    const wildPokemon = window.gameState.battle.opponent;
    const hpRatio = Math.max(0, Math.min(1, pokemonHp / maxHp));
    const level = Math.max(1, wildPokemon.level || 1);

    const levelTerm = 1 / (1 + LEVEL_K * level);
    const ballTerm = Math.pow(Math.max(0.1, ballCatchRate), BALL_EXP);

    const raw =
      (CATCH_BASE / (hpRatio + HP_OFFSET)) *
      levelTerm *
      ballTerm *
      statusMultiplier;
    const pct = Math.floor(raw);
    return Math.min(MAX_CATCH, Math.max(MIN_CATCH, pct));
  },

  animateCapture: function (ballName, ballCatchRate) {
    return new Promise((resolve) => {
      const wildPokemon = window.gameState.battle.opponent;
      const chance = BattleCore.calculateCatchRate(
        wildPokemon.currentHp,
        wildPokemon.maxHp,
        ballCatchRate
      );

      const roll = Math.floor(Math.random() * 100) + 1;
      const opponentSpriteElement = document.querySelector(".opponent-sprite");

      const ballSpriteUrl = BattleCore._getBallSpriteUrl(ballName);

      if (opponentSpriteElement) {
        opponentSpriteElement.src = ballSpriteUrl;

        opponentSpriteElement.classList.remove(
          "top-2",
          "right-0",
          "md:right-24",
          "transform",
          "-translate-y-1/2"
        );

        opponentSpriteElement.classList.add("capture-shake-position");
        opponentSpriteElement.classList.add("animate-spin-slow");
        opponentSpriteElement.style.transform = "scale(1.5)";
      }

      let shakes = 0;
      let isCaptured = roll <= chance;

      const shakeInterval = setInterval(() => {
        shakes++;

        if (shakes <= 3) {
          BattleCore.addBattleLog(
            `... ${ballName} balança ${shakes} vez(es) ...`
          );
        }

        if (shakes === 3) {
          clearInterval(shakeInterval);

          if (opponentSpriteElement) {
            opponentSpriteElement.classList.remove("animate-spin-slow");
            opponentSpriteElement.classList.remove("capture-shake-position");
            opponentSpriteElement.classList.add(
              "top-2",
              "right-0",
              "md:right-24",
              "transform",
              "-translate-y-1/2"
            );
          }

          if (isCaptured) {

            const finalMsg = `Sucesso! ${wildPokemon.name} foi capturado!`;
            BattleCore.addBattleLog(finalMsg);
            BattleCore.updateBattleScreen();

            setTimeout(() => {
              // Lógica de adicionar Pokémon
              const type = (wildPokemon.types?.[0] || "normal").toLowerCase();
              const typeSpecialMove = {
                fire: "ember", water: "water-gun", grass: "vine-whip", electric: "thunder-shock",
                ground: "mud-slap", rock: "rock-throw", ice: "ice-beam", bug: "bug-bite",
                psychic: "confusion", dark: "bite", ghost: "night-shade", steel: "iron-head",
                fighting: "karate-chop", poison: "poison-sting", flying: "gust", dragon: "dragon-breath",
                fairy: "disarming-voice", normal: "tackle",
              };
              wildPokemon.moves = ["tackle", typeSpecialMove[type] || "tackle"];
              window.gameState.profile.pokemon.push(wildPokemon);
              // // AÇÃO DE CAPTURA BEM-SUCEDIDA
              const foiCapturado = window.gameState.profile.pokedex.has(wildPokemon.id);
              if (!foiCapturado) {
                window.Utils.registerPokemon(wildPokemon.id);
                window.GameLogic.saveGameData();
              }
              // Usa a função de encerramento para sincronizar o log
              BattleCore._endBattleAndSyncLog(finalMsg);

              resolve(true);
            }, 1000);
          } else {
            // O Pokémon não foi capturado.
            BattleCore.addBattleLog(`Oh não! ${wildPokemon.name} escapou!`);

            if (opponentSpriteElement) {
              opponentSpriteElement.src = wildPokemon.sprite;
              opponentSpriteElement.style.transform = "scale(1.5)";
            }

            if (roll > 90) {
              // O Pokémon escapou E fugiu da batalha
              const finalMsg = `${wildPokemon.name} fugiu da batalha!`;
              BattleCore.addBattleLog(finalMsg);
              BattleCore.updateBattleScreen();

              setTimeout(() => {
                // Usa a função de encerramento para sincronizar o log
                BattleCore._endBattleAndSyncLog(finalMsg);
                resolve(true);
              }, 1500);
            } else {
              // O Pokémon escapou, mas a batalha continua
              resolve(false);
            }
          }
        }
      }, 1200);
    });
  },

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

    const battleEnded = await BattleCore.animateCapture(
      ballName,
      ballCatchRate
    );

    ballItem.quantity--;
    window.GameLogic.saveGameData();

    BattleCore.updateBattleScreen();

    if (!battleEnded) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await BattleCore.playerTurn("opponent_attack");
    }

    if (window.gameState.battle && !battleEnded) {
      BattleCore.setBattleMenu("main");
    }
  },

  playerTurn: async function (action, moveName = null) {
    const battle = window.gameState.battle;
    const playerPokemon = window.Utils.getActivePokemon();
    const opponent = battle.opponent;
    let ended = false;
    let finalMessage = ""; // Mensagem de saída, se aplicável

    // Bloqueia o menu
    BattleCore.setBattleMenu("disabled");
    BattleCore.updateBattleScreen();

    const item = window.gameState.profile.items.find(
      (i) => i.name === moveName
    );

    if (battle.type === "pvp") {
      if (action === "item" && item && item.catchRate) {
        BattleCore.addBattleLog(
          "Pokébolas não podem ser usadas em batalhas PvP."
        );
        BattleCore.setBattleMenu("main");
        return;
      }
      window.PvpCore.sendPvpAction(action, moveName);
      return;
    }

    // --- Lógica PvE (Wild Battle) ---

    if (action === "run") {
      if (Math.random() < 0.5) {
        finalMessage = `Você fugiu com sucesso!`;
        BattleCore.addBattleLog(finalMessage);
        ended = true;
      } else {
        BattleCore.addBattleLog(`Você falhou em fugir!`);
      }
      BattleCore.updateBattleScreen();
    } else if (action === "move") {
      if (playerPokemon.currentHp <= 0) {
        BattleCore.addBattleLog(
          `${playerPokemon.name} desmaiou e não pode atacar!`
        );
        BattleCore.setBattleMenu("main");
        return;
      }

      // LÓGICA DE REGISTRO DE PARTICIPANTE
      const activeIndex = window.gameState.profile.pokemon.findIndex(
        (p) => p.name === playerPokemon.name
      );
      if (activeIndex !== -1) {
        battle.participatingIndices.add(activeIndex);
      }

      BattleCore._animateBattleAction(".player-sprite", "animate-attack", 300);
    BattleCore._playMoveSound(moveName);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const damageResult = BattleCore.calculateDamage(
        playerPokemon,
        moveName,
        opponent
      );

      const opponentHpBefore = opponent.currentHp;
      opponent.currentHp = Math.max(
        0,
        opponent.currentHp - damageResult.damage
      );
      const opponentTookDamage = opponentHpBefore > opponent.currentHp;

      // LÓGICA DE MENSAGEM DE EFICÁCIA (PLAYER)
      let effectivenessMessage = "";
      if (damageResult.effectiveness === 0)
        effectivenessMessage = " Não teve efeito!";
      else if (damageResult.effectiveness <= 0.5)
        effectivenessMessage = " Não é muito eficaz.";
      else if (damageResult.effectiveness >= 2)
        effectivenessMessage = " É super eficaz!";

      let logMessage = `${playerPokemon.name} usou ${window.Utils.formatName(
        moveName
      )}!${effectivenessMessage}`;
      if (damageResult.damage > 0) {
        logMessage += ` Causou ${damageResult.damage} de dano.`;
      }

      if (damageResult.isCritical) {
        logMessage += ` É UM ACERTO CRÍTICO!`;
      }
      BattleCore.addBattleLog(logMessage);

      BattleCore.updateBattleScreen();

      if (opponentTookDamage) {
        BattleCore._animateBattleAction(
          ".opponent-sprite",
          "animate-damage",
          500
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else if (action === "item" && item) {
      if (item.catchRate) {
        await BattleCore.tryCapture(moveName, item.catchRate);
        return;
      }

      const isHealing = item.healAmount;
      window.GameLogic.useItem(moveName);

      if (isHealing) {
        // LÓGICA DE REGISTRO DE PARTICIPANTE (Cura)
        const activeIndex = window.gameState.profile.pokemon.findIndex(
          (p) => p.name === playerPokemon.name
        );
        if (activeIndex !== -1) {
          battle.participatingIndices.add(activeIndex);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        BattleCore.updateBattleScreen();
        BattleCore.setBattleMenu("disabled");
        action = "opponent_attack";
      }
    } else if (action === "opponent_attack") {
      // Continua para o ataque do oponente
    } else {
      BattleCore.setBattleMenu("main");
      return;
    }

    if (opponent.currentHp === 0) {
      BattleCore.battleWin(playerPokemon, opponent);
      ended = true;
      finalMessage = `${opponent.name} desmaiou! Batalha vencida!`;
    }

    // 2. Turno do Oponente
    if (
      !ended &&
      (action === "move" ||
        action === "opponent_attack" ||
        (action === "item" && item?.healAmount))
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const randomOpponentMove =
        opponent.moves[Math.floor(Math.random() * opponent.moves.length)];
      BattleCore._animateBattleAction(
        ".opponent-sprite",
        "animate-opponent-attack",
        300
      );
      BattleCore._playMoveSound(randomOpponentMove);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const damageResult = BattleCore.calculateDamage(
        opponent,
        randomOpponentMove,
        playerPokemon
      );

      const playerHpBefore = playerPokemon.currentHp;
      playerPokemon.currentHp = Math.max(
        0,
        playerPokemon.currentHp - damageResult.damage
      );
      const playerTookDamage = playerHpBefore > playerPokemon.currentHp;

      // LÓGICA DE MENSAGEM DE EFICÁCIA (OPONENTE)
      let effectivenessMessage = "";
      if (damageResult.effectiveness === 0)
        effectivenessMessage = " Não teve efeito!";
      else if (damageResult.effectiveness <= 0.5)
        effectivenessMessage = " Não é muito eficaz.";
      else if (damageResult.effectiveness >= 2)
        effectivenessMessage = " É super eficaz.";

      let logMessage = `${opponent.name} usou ${window.Utils.formatName(
        randomOpponentMove
      )}!${effectivenessMessage}`;
      if (damageResult.damage > 0) {
        logMessage += ` Recebeu ${damageResult.damage} de dano.`;
      }

      if (damageResult.isCritical) {
        logMessage += ` É UM ACERTO CRÍTICO!`;
      }
      BattleCore.addBattleLog(logMessage);

      BattleCore.updateBattleScreen();

      if (playerTookDamage) {
        BattleCore._animateBattleAction(
          ".player-sprite",
          "animate-damage",
          500
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (playerPokemon.currentHp === 0) {
        const hasLivePokemon = window.gameState.profile.pokemon.some(
          (p) => p.currentHp > 0
        );

        // CORREÇÃO CRÍTICA: Se desmaiou e há substituto, força a troca
        if (hasLivePokemon) {
          BattleCore.addBattleLog(
            `${playerPokemon.name} desmaiou! Você precisa trocar de Pokémon.`
          );
          window.Renderer.showScreen("switchPokemon");
          return;
        } else {
          finalMessage = "Todos os seus Pokémons desmaiados! Você perdeu a batalha.";
          BattleCore.addBattleLog(finalMessage);
          ended = true;
        }
      }
    }

    // 3. Fim do Turno / Batalha
    window.GameLogic.saveGameData(); // Salva o estado atual (HP, XP)
    BattleCore.updateBattleScreen();

    if (ended) {
      setTimeout(() => {
        // Se a mensagem final foi definida (fuga, derrota, vitória por KO), use a função de sincronização
        if (finalMessage) {
          BattleCore._endBattleAndSyncLog(finalMessage);
        } else {
          // Caso contrário, limpe o estado e volte
          window.gameState.battle = null;
          window.AuthSetup?.handleBattleMusic(false);

          // LÓGICA DE RETORNO DO MAPA (BETA MODE)
          if (window.gameState.profile.preferences?.isBetaMode) {
            window.MapCore.handleBattleReturn("Fim de Batalha (Inesperado).");
          } else {
            window.Renderer.showScreen("mainMenu");
          }
          window.GameLogic.saveGameData();
        }
      }, 2000);
    }

    if (!ended && playerPokemon.currentHp > 0) {
      // Se não terminou e o Pokémon está vivo
      BattleCore.setBattleMenu("main");
    }
  },

  switchPokemon: async function (newIndex) {
    const battle = window.gameState.battle;
    const currentPokemon = window.Utils.getActivePokemon();
    // NOTA: newPokemon aqui referencia o Pokémon no índice da lista NÃO REORDENADA.
    const newPokemon = window.gameState.profile.pokemon[newIndex];

    if (newIndex === battle.playerPokemonIndex || newPokemon.currentHp <= 0) {
      return;
    }

    // *** CORREÇÃO: REMOVENDO A MANIPULAÇÃO DO ARRAY ***

    // 1. Ação: Apenas atualiza o índice do Pokémon ativo.
    battle.playerPokemonIndex = newIndex;

    // 2. Registra o novo Pokémon ativo.
    if (battle.type === "wild") {
      battle.participatingIndices.add(newIndex);
    }

    // 3. Salva o estado sem reordenar a lista.
    window.GameLogic.saveGameData();

    // 4. Redesenha a tela de batalha com o novo Pokémon.
    window.Renderer.showScreen("battle");
    BattleCore.addBattleLog(
      `Volte, ${currentPokemon.name}! Vá, ${newPokemon.name}!`
    );

    // 5. Continua o fluxo de batalha.
    if (battle.type === "pvp") {
      BattleCore.setBattleMenu("disabled"); // Desabilita o menu
      window.PvpCore.sendPvpAction("switch", null);
    } else {
      // No PvE, a troca gasta o turno. O oponente ataca em seguida.
      BattleCore.setBattleMenu("disabled");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await BattleCore.playerTurn("opponent_attack");
    }
  },

  setBattleMenu: function (menu) {
    if (
      window.gameState.battle.type === "pvp" &&
      window.gameState.battle.currentMenu === "disabled" &&
      menu !== "main"
    ) {
      return;
    }
    window.gameState.battle.currentMenu = menu;
    BattleCore.updateBattleScreen();
  },

  updateBattleScreen: function () {
    const battleArea = document.getElementById("battle-area");
    if (!battleArea || !window.gameState.battle) return;

    const battle = window.gameState.battle;
    const playerPokemon = window.Utils.getActivePokemon();
    const opponent = battle.opponent;

    if (!playerPokemon) return;

    // O backSprite (e a sprite do oponente) agora usam o índice correto que está em window.Utils.getActivePokemon()
    const playerBackSprite =
      playerPokemon.backSprite ||
      `../assets/sprites/pokemon/${playerPokemon.id}_back.png`;

    const playerHpPercent =
      (playerPokemon.currentHp / playerPokemon.maxHp) * 100;
    const opponentHpPercent = (opponent.currentHp / opponent.maxHp) * 100;

    const logHtml = `<p class="gba-font text-xs">${battle.lastMessage || ""
      }</p>`;

    let optionsHtml = "";
    const isMainMenu = battle.currentMenu === "main";
    const isDisabled = battle.currentMenu === "disabled";

    const isPvpLocked = battle.type === "pvp" && isDisabled;

    if (isMainMenu) {
      optionsHtml = `
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="BattleCore.setBattleMenu('fight')" class="gba-button bg-red-500 hover:bg-red-600">Lutar</button>
                    <button onclick="BattleCore.playerTurn('run')" class="gba-button bg-green-500 hover:bg-green-600" ${battle.type === "pvp" ? "disabled" : ""
        }>Fugir</button>
                    <button onclick="BattleCore.setBattleMenu('item')" class="gba-button bg-yellow-500 hover:bg-yellow-600">Item</button>
                    <button onclick="window.Renderer.showScreen('switchPokemon')" class="gba-button bg-blue-500 hover:bg-blue-600">Pokémon</button>
                </div>
            `;
    } else if (battle.currentMenu === "fight") {
      optionsHtml = playerPokemon.moves
        .map(
          (move) =>
            `<button onclick="BattleCore.playerTurn('move', '${move}')" class="flex-1 gba-button bg-red-400 hover:bg-red-500">${window.Utils.formatName(
              move
            )}</button>`
        )
        .join("");
      optionsHtml = `<div class="grid grid-cols-2 gap-2">${optionsHtml}</div>`;
    } else if (battle.currentMenu === "item") {
      const items = window.gameState.profile.items;
      const battleItems = items.filter(
        (i) => (i.catchRate && battle.type === "wild") || i.healAmount
      );

      const itemsHtml = battleItems
        .map((item) => {
          const disabled = item.quantity <= 0;
          return `<button ${disabled ? "disabled" : ""
            } onclick="BattleCore.playerTurn('item', '${item.name
            }')" class="flex-1 gba-button ${disabled
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

    battleArea.innerHTML = `
            <div class="relative h-48 mb-4 flex-shrink-0">
                <!-- OPPONENT HP BOX -->
                <div class="absolute top-0 left-0 p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner w-1/2">
                    <div class="gba-font text-sm font-bold">${opponent.name
      } (Nv. ${opponent.level})</div>
                    <div class="flex items-center mt-1">
                        <div class="gba-font text-xs mr-1">HP</div>
                        <div class="w-full bg-gray-300 h-2 rounded-full">
                            <div class="h-2 rounded-full transition-all duration-500 ${opponentHpPercent > 50
        ? "bg-green-500"
        : opponentHpPercent > 20
          ? "bg-yellow-500"
          : "bg-red-500"
      }" style="width: ${opponentHpPercent}%;"></div>
                        </div>
                    </div>
                    <div class="gba-font text-xs mt-1">${opponent.currentHp}/${opponent.maxHp
      }</div>
                </div>
                
                <!-- SPRITES: Posições atualizadas para flexibilidade -->
                <div class="relative w-full h-64">
                    <img src="${opponent.sprite}" alt="${opponent.name
      }" class="opponent-sprite w-28 h-28 absolute top-8 right-0 md:right-24 transform -translate-y-1/2 scale-150 z-10">
                    
                    <style>
                        .capture-shake-position {
                            top: -0.8rem; 
                            right: 0; 
                            transform: translateY(-50%) scale(1.5); 
                            z-index: 10; 
                        }

                        @media (min-width: 768px) {
                            .capture-shake-position {
                                right: 6rem; 
                            }
                        }
                    </style>
                </div>
                
                <!-- PLAYER HP BOX -->
                <div class="absolute bottom-0 right-0 p-2 bg-white border-2 border-gray-800 rounded-lg shadow-inner w-1/2">
                    <div class="gba-font text-sm font-bold">${playerPokemon.name
      } (Nv. ${playerPokemon.level})</div>
                    <div class="flex items-center mt-1">
                        <div class="gba-font text-xs mr-1">HP</div>
                        <div class="w-full bg-gray-300 h-2 rounded-full">
                            <div class="h-2 rounded-full transition-all duration-500 ${playerHpPercent > 50
        ? "bg-green-500"
        : playerHpPercent > 20
          ? "bg-yellow-500"
          : "bg-red-500"
      }" style="width: ${playerHpPercent}%;"></div>
                        </div>
                    </div>
                    <div class="gba-font text-xs mt-1">${playerPokemon.currentHp
      }/${playerPokemon.maxHp}</div>
                </div>
                <img src="${playerBackSprite}" alt="${playerPokemon.name
      }" class="player-sprite absolute bottom-7 left-12 md:left-24 w-[104px] h-[104px] transform -translate-x-1/2 translate-y-1/2 scale-150">
            </div>
            
            <!-- LOG MESSAGE AREA -->
            <div class="h-16 p-2 mt-4 mb-4 bg-gray-800 text-white rounded-md flex items-center justify-start text-sm gba-font flex-shrink-0">
                ${logHtml}
            </div>
            
            <!-- BUTTONS AREA -->
            <div class="p-2 bg-gray-200 border-2 border-gray-800 rounded-md flex flex-col min-h-[140px] justify-between flex-grow">
                <div id="battle-options-container" class="flex-grow ${isPvpLocked ? "opacity-50 pointer-events-none" : ""
      }">
                    ${optionsHtml}
                </div>
                <button onclick="BattleCore.setBattleMenu('main')" id="back-button" class="gba-button bg-gray-500 hover:bg-gray-600 w-full mt-2 flex-shrink-0" ${isMainMenu || isDisabled ? "disabled" : ""
      }>Voltar</button>
            </div>
        `;
  },
};
