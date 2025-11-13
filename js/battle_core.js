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
  "mud-slap": "ground",
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
  "dragon-breath": "dragon",
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
  "disarming-voice": "fairy",
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

const ensureBattleStyles = () => {
  if (typeof document === "undefined") {
    return;
  }
  if (document.getElementById("battle-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "battle-style";
  style.textContent = `
    #battle-area {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
    }
    #battle-area .battle-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
    }
    #battle-area .battle-scene {
      position: relative;
      flex: 1 1 auto;
      min-height: 240px;
      background: linear-gradient(145deg, #dfe9ff 0%, #fbfdff 55%, #f8f1ff 100%);
      border: 3px solid #111827;
      border-radius: 18px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 20px;
      overflow: hidden;
    }
    #battle-area .battle-scene::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
      background-size: 22px 22px;
      opacity: 0.5;
      pointer-events: none;
    }
    #battle-area .battle-entity {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 1;
    }
    #battle-area .battle-entity.player {
      align-items: flex-start;
    }
    #battle-area .battle-entity.opponent {
      align-items: flex-end;
    }
    #battle-area .battle-row {
      display: flex;
      align-items: stretch;
      gap: 12px;
      justify-content: space-between;
      flex-wrap: nowrap;
      width: 100%;
    }
    #battle-area .battle-row-opponent {
      flex-direction: row;
    }
    #battle-area .battle-row-player {
      flex-direction: row;
    }
    #battle-area .battle-card {
      background: rgba(255, 255, 255, 0.88);
      border: 2px solid #111827;
      border-radius: 14px;
      padding: 10px 12px;
      box-shadow: 0 6px 0 rgba(17, 24, 39, 0.18);
      width: clamp(200px, 60%, 320px);
      font-size: 0.55rem;
      line-height: 1.3;
    }
    #battle-area .battle-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.6rem;
      letter-spacing: 0.05em;
    }
    #battle-area .battle-type-row {
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    #battle-area .battle-type-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.5rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: 2px solid rgba(17, 24, 39, 0.8);
      background: rgba(255, 255, 255, 0.85);
      color: #111827;
      text-transform: uppercase;
    }
    #battle-area .battle-hp-bar {
      margin-top: 8px;
    }
    #battle-area .battle-hp-bar-track {
      width: 100%;
      height: 9px;
      background: rgba(17, 24, 39, 0.15);
      border-radius: 9999px;
      overflow: hidden;
      border: 2px solid rgba(17, 24, 39, 0.75);
    }
    #battle-area .battle-hp-bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.35s ease;
    }
    #battle-area .battle-hp-text {
      margin-top: 4px;
      font-size: 0.55rem;
      color: #1f2937;
      display: flex;
      justify-content: space-between;
    }
    #battle-area .battle-special {
      margin-top: 6px;
      font-size: 0.55rem;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    #battle-area .battle-special span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    #battle-area .battle-platform {
      align-self: center;
      width: 160px;
      height: 52px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.08) 60%, transparent 70%);
      box-shadow: 0 18px 24px rgba(17, 24, 39, 0.22);
    }
    #battle-area .battle-sprite-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      min-width: 120px;
      flex: 0 0 34%;
    }
    #battle-area .battle-sprite-wrap .battle-platform {
      margin-top: 6px;
    }
    #battle-area .battle-sprite {
      width: 120px;
      max-width: 32vw;
      position: relative;
      image-rendering: pixelated;
      filter: drop-shadow(0 8px 8px rgba(17, 24, 39, 0.35));
    }
    #battle-area .battle-log {
      background: #1f2937;
      border: 3px solid #111827;
      border-radius: 14px;
      padding: 12px;
      color: #f9fafb;
      font-size: 0.6rem;
      min-height: 90px;
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.06);
      line-height: 1.25;
      word-break: break-word;
      position: relative;
    }
    #battle-area .battle-log-line + .battle-log-line {
      margin-top: 4px;
      opacity: 0.85;
    }
    #battle-area .battle-menu {
      background: #f9fafb;
      border: 3px solid #111827;
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 6px 0 rgba(17, 24, 39, 0.15);
    }
    #battle-area .battle-main-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    #battle-area .battle-action-btn {
      font-size: 0.7rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 12px;
      letter-spacing: 0.04em;
      position: relative;
    }
    #battle-area .battle-action-btn i {
      font-size: 0.8rem;
    }
    #battle-area .battle-action-btn.active {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 0 4px rgba(30, 64, 175, 0.4);
    }
    #battle-area .battle-secondary {
      display: block;
    }
    #battle-area .battle-secondary--moves,
    #battle-area .battle-secondary--items {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    #battle-area .battle-secondary-message {
      font-size: 0.65rem;
      color: #374151;
      background: rgba(255, 255, 255, 0.85);
      border: 2px solid #cbd5f5;
      border-radius: 12px;
      padding: 10px;
      text-align: center;
    }
    #battle-area .battle-move-btn {
      font-size: 0.7rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 10px 12px;
      position: relative;
    }
    #battle-area .battle-move-btn.battle-move-special {
      background: #c084fc;
      border-color: #7c3aed;
    }
    #battle-area .battle-move-btn.battle-move-special:hover:not([disabled]) {
      background: #a855f7;
    }
    #battle-area .battle-move-btn.battle-move-normal {
      background: #f87171;
      border-color: #b91c1c;
    }
    #battle-area .battle-move-btn.battle-move-normal:hover:not([disabled]) {
      background: #ef4444;
    }
    #battle-area .battle-move-btn.battle-move-disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    #battle-area .battle-move-meta {
      font-size: 0.5rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      display: block;
      width: 100%;
      background: rgba(17, 24, 39, 0.9);
      color: #f8fafc;
      padding: 3px 6px;
      border-radius: 8px 8px 4px 4px;
      text-align: left;
    }
    #battle-area .battle-move-label {
      display: block;
      width: 100%;
      margin-top: 4px;
      font-weight: 600;
      color: #111827;
    }
    #battle-area .battle-move-pa {
      position: absolute;
      top: 4px;
      right: 6px;
      font-size: 0.5rem;
      font-weight: 700;
      background: rgba(17, 24, 39, 0.85);
      color: #f8fafc;
      padding: 2px 5px;
      border-radius: 6px;
      line-height: 1.2;
      z-index: 1;
    }
    #battle-area .battle-sprite.capture-shake-position,
    #battle-area .capture-shake-position {
      top: -18px;
      right: 0;
      transform: translateY(-10%) scale(1.5);
      z-index: 10;
    }
    @media (min-width: 768px) {
      #battle-area .battle-sprite.capture-shake-position,
      #battle-area .capture-shake-position {
        right: -12px;
      }
    }
    @media (max-width: 640px) {
      #battle-area .battle-scene {
        padding: 12px;
        min-height: 220px;
      }
      #battle-area .battle-entity.player,
      #battle-area .battle-entity.opponent {
        align-items: stretch;
      }
      #battle-area .battle-row {
        gap: 8px;
      }
      #battle-area .battle-card {
        width: clamp(60%, 70vw, 320px);
      }
      #battle-area .battle-main-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #battle-area .battle-secondary--moves,
      #battle-area .battle-secondary--items {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #battle-area .battle-action-btn {
        font-size: 0.68rem;
      }
      #battle-area .battle-move-btn {
        font-size: 0.68rem;
      }
    }
  `;
  document.head.appendChild(style);
};

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
    const profile = window.gameState.profile;
    
    // Garante que os campos existam
    if (typeof profile.trainerLevel !== 'number') {
      const maxLevel = profile.pokemon.length > 0
        ? Math.max(...profile.pokemon.map(p => p.level || 1))
        : 1;
      profile.trainerLevel = Math.min(100, Math.max(1, maxLevel));
    }
    if (typeof profile.trainerExp !== 'number') profile.trainerExp = 0;
    if (typeof profile.normalBattleCount !== 'number') profile.normalBattleCount = 0;

    const trainerLevel = profile.trainerLevel;
    let pokemonId = null;
    let isEvolved = false;
    let isLegendary = false;

    // Sistema de contagem de batalhas
    // A cada 100 batalhas normais: 1 lendário (nível + 10)
    if (profile.normalBattleCount > 0 && profile.normalBattleCount % 100 === 0) {
      // Busca um lendário usando cache global
      if (!window._legendaryCache) {
        window._legendaryCache = [];
        // Usa PokeAPI para buscar dados de espécie
        for (let id = 1; id <= window.GameConfig.POKEDEX_LIMIT; id++) {
          try {
            const speciesData = await window.PokeAPI.fetchSpeciesData(id);
            if (speciesData && speciesData.isLegendary) {
              window._legendaryCache.push(id);
            }
          } catch (e) {
            // Ignora erros
          }
        }
      }
      if (window._legendaryCache.length > 0) {
        pokemonId = window._legendaryCache[Math.floor(Math.random() * window._legendaryCache.length)];
        isLegendary = true;
      }
    }
    // A cada 10 batalhas normais: 1 evoluído (nível + 5)
    else if (profile.normalBattleCount > 0 && profile.normalBattleCount % 10 === 0) {
      // Busca um Pokémon evoluído usando cache global
      if (!window._evolvedCache) {
        window._evolvedCache = [];
        // Busca cadeias evolutivas e identifica evoluídos
        for (let id = 1; id <= window.GameConfig.POKEDEX_LIMIT; id++) {
          try {
            const chain = await window.PokeAPI.fetchEvolutionChainData(id);
            if (chain && chain.length > 1) {
              // Verifica se este ID não é o primeiro da cadeia (ou seja, é evoluído)
              const chainFirstId = chain[0]?.id;
              if (chainFirstId && id !== chainFirstId && !window._evolvedCache.includes(id)) {
                window._evolvedCache.push(id);
              }
            }
          } catch (e) {
            // Ignora erros
          }
        }
      }
      if (window._evolvedCache.length > 0) {
        pokemonId = window._evolvedCache[Math.floor(Math.random() * window._evolvedCache.length)];
        isEvolved = true;
      }
    }

    // Se não encontrou especial, busca um Pokémon normal
    if (!pokemonId) {
      pokemonId = Math.floor(Math.random() * window.GameConfig.POKEDEX_LIMIT) + 1;
    }

    const wildPokemonData = await window.PokeAPI.fetchPokemonData(pokemonId);
    if (!wildPokemonData) {
      window.GameLogic.addExploreLog("Erro ao encontrar Pokémon selvagem.");
      window.AuthSetup?.handleBattleMusic(false);
      return;
    }

    // Calcula o nível baseado no nível do treinador
    // Normal: nível do treinador ± 2
    // Evoluído: nível do treinador + 5
    // Lendário: nível do treinador + 10
    let baseLevel = trainerLevel;
    if (isLegendary) {
      baseLevel = trainerLevel + 10;
    } else if (isEvolved) {
      baseLevel = trainerLevel + 5;
    } else {
      // Normal: variação de ±2 níveis
      const variation = Math.floor(Math.random() * 5) - 2; // -2 a +2
      baseLevel = trainerLevel + variation;
    }

    wildPokemonData.level = Math.max(1, Math.min(100, baseLevel));

    wildPokemonData.maxHp = window.Utils.calculateMaxHp(
      wildPokemonData.stats.hp,
      wildPokemonData.level
    );
    wildPokemonData.currentHp = wildPokemonData.maxHp;

    window.Utils.applyMoveTemplate(wildPokemonData, { forceResetUses: true });

    // NOVO: Adiciona o status de captura (capturado/novo)
    const isCaught = window.gameState.profile.pokedex.has(wildPokemonData.id);
    const captureStatus = isCaught ? " (JÁ CAPTURADO)" : " (NOVO!)";
    
    // Mensagem especial para evoluídos e lendários
    let specialType = "";
    if (isLegendary) {
      specialType = " ⭐ LENDÁRIO ⭐";
    } else if (isEvolved) {
      specialType = " ⚡ EVOLUÍDO ⚡";
    }

    window.gameState.battle = {
      type: "wild",
      opponent: wildPokemonData,
      isEvolved: isEvolved,
      isLegendary: isLegendary,
      // CORREÇÃO: Usa o índice 0 como padrão para o Pokémon no slot de líder (o primeiro na lista)
      playerPokemonIndex: 0,
      turn: 0,
      // Mensagem inicial com o status de captura
      lastMessage: `Um ${wildPokemonData.name} selvagem${specialType} (Nv. ${wildPokemonData.level}) apareceu!${captureStatus}`,
      log: [
        `Um ${wildPokemonData.name} selvagem${specialType} (Nv. ${wildPokemonData.level}) apareceu!${captureStatus}`,
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
    if (!window.gameState.battle.lastMessage || !window.gameState.battle.lastMessage.includes("Parabéns!")) {
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

    // NOVO: Treinador também ganha XP (10% do total)
    const trainerExpGain = Math.floor(totalExpGain * 0.1);
    if (trainerExpGain > 0 && window.Utils.giveTrainerExp) {
      window.Utils.giveTrainerExp(trainerExpGain);
      BattleCore.addBattleLog(`Treinador ganhou ${trainerExpGain} XP!`);
    }

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

    // NOVO: Incrementa contador de batalhas normais (apenas se não for evoluído ou lendário)
    const profile = window.gameState.profile;
    if (window.gameState.battle && window.gameState.battle.type === "wild") {
      const isSpecial = window.gameState.battle.isEvolved || window.gameState.battle.isLegendary;
      if (!isSpecial) {
        profile.normalBattleCount = (profile.normalBattleCount || 0) + 1;
      }
    }

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
      // NOVO: Mantém apenas a última mensagem (substitui a anterior)
      if (window.gameState.battle.log) {
        window.gameState.battle.log = [message];
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
              window.Utils.applyMoveTemplate(wildPokemon, {
                forceResetUses: true,
              });
              window.gameState.profile.pokemon.push(wildPokemon);
              
              // NOVO: Treinador ganha XP ao capturar (baseado no nível do Pokémon)
              const captureExp = Math.floor(wildPokemon.level * 5);
              if (captureExp > 0 && window.Utils.giveTrainerExp) {
                window.Utils.giveTrainerExp(captureExp);
                BattleCore.addBattleLog(`Treinador ganhou ${captureExp} XP pela captura!`);
              }
              
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
    BattleCore.setBattleMenu("disabled", true);

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
    let finalMessage = "";

    window.Utils.ensureMoveCounters(playerPokemon);
    window.Utils.ensureMoveCounters(opponent);

    BattleCore.setBattleMenu("disabled", true);
    BattleCore.updateBattleScreen();

    const item = window.gameState.profile.items.find(
      (i) => i.name === moveName
    );

    if (battle.type === "pvp") {
      if (action === "item" && item && item.catchRate) {
        BattleCore.addBattleLog(
          "Pokébolas não podem ser usadas em batalhas PvP."
        );
        BattleCore.setBattleMenu("main", true);
        return;
      }
      window.PvpCore.sendPvpAction(action, moveName);
      return;
    }

    if (action === "run") {
      // NOVO: Fuga sempre bem-sucedida (sem porcentagem de falha)
      finalMessage = `Você fugiu com sucesso!`;
      BattleCore.addBattleLog(finalMessage);
      ended = true;
      BattleCore.updateBattleScreen();
    } else if (action === "move") {
      if (playerPokemon.currentHp <= 0) {
        BattleCore.addBattleLog(
          `${playerPokemon.name} desmaiou e não pode atacar!`
        );
        BattleCore.setBattleMenu("main", true);
        return;
      }

      const isSpecialMove = window.Utils.isSpecialMove(
        playerPokemon,
        moveName
      );
      const isNormalMove = !isSpecialMove;
      
      // NOVO: Verifica PA individual do movimento
      const movePA = window.Utils.getMovePA(playerPokemon, moveName);
      if (movePA.remaining <= 0) {
        const moveType = isSpecialMove ? "energia" : "PA";
        BattleCore.addBattleLog(
          `${playerPokemon.name} está sem ${moveType} para ${window.Utils.formatName(
            moveName
          )}!`
        );
        BattleCore.setBattleMenu("fight", true);
        BattleCore.updateBattleScreen();
        return;
      }

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

      let effectivenessMessage = "";
      if (damageResult.effectiveness === 0)
        effectivenessMessage = " Não teve efeito!";
      else if (damageResult.effectiveness <= 0.5)
        effectivenessMessage = " Não é muito eficaz.";
      else if (damageResult.effectiveness >= 2)
        effectivenessMessage = " É super eficaz!";

      // NOVO: Usa PA individual do movimento
      const paUsed = window.Utils.useMovePA(playerPokemon, moveName);
      if (!paUsed) {
        BattleCore.addBattleLog(
          `${playerPokemon.name} não conseguiu usar ${window.Utils.formatName(moveName)}!`
        );
        BattleCore.setBattleMenu("fight", true);
        BattleCore.updateBattleScreen();
        return;
      }

      // Obtém PA atualizado após o uso
      const updatedMovePA = window.Utils.getMovePA(playerPokemon, moveName);

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
      const isPpRestore = item.ppRestore;
      const itemUsed = window.GameLogic.useItem(moveName);

      if (isHealing || isPpRestore) {
        if (!itemUsed) {
          BattleCore.setBattleMenu("main", true);
          return;
        }
        const activeIndex = window.gameState.profile.pokemon.findIndex(
          (p) => p.name === playerPokemon.name
        );
        if (activeIndex !== -1) {
          battle.participatingIndices.add(activeIndex);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        BattleCore.updateBattleScreen();
        BattleCore.setBattleMenu("disabled", true);
        action = "opponent_attack";
      }
    } else if (action === "opponent_attack") {
      // segue para o turno do oponente
    } else {
      BattleCore.setBattleMenu("main", true);
      return;
    }

    if (opponent.currentHp === 0) {
      BattleCore.battleWin(playerPokemon, opponent);
      ended = true;
      finalMessage = `${opponent.name} desmaiou! Batalha vencida!`;
    }

    if (
      !ended &&
      (action === "move" ||
        action === "opponent_attack" ||
        (action === "item" && (item?.healAmount || item?.ppRestore)))
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const opponentMoves = Array.isArray(opponent.moves)
        ? opponent.moves.slice()
        : [];
      // NOVO: Filtra movimentos usando PA individual
      let selectableMoves = opponentMoves.filter((move) => {
        const moveName = typeof move === "string" ? move : move.name || move;
        const movePA = window.Utils.getMovePA(opponent, moveName);
        return movePA.remaining > 0;
      });
      if (selectableMoves.length === 0) {
        BattleCore.addBattleLog(
          `${opponent.name} está sem energia para atacar!`
        );
      }
      const randomOpponentMove =
        selectableMoves[Math.floor(Math.random() * selectableMoves.length)];
      if (!randomOpponentMove) {
        window.GameLogic.saveGameData();
        BattleCore.updateBattleScreen();
        BattleCore.setBattleMenu("main", true);
        return;
      }

      const opponentMoveName = typeof randomOpponentMove === "string" 
        ? randomOpponentMove 
        : randomOpponentMove.name || randomOpponentMove;
      
      // NOVO: Usa PA individual do movimento do oponente
      const opponentPAUsed = window.Utils.useMovePA(opponent, opponentMoveName);
      if (!opponentPAUsed) {
        BattleCore.addBattleLog(
          `${opponent.name} não conseguiu usar ${window.Utils.formatName(opponentMoveName)}!`
        );
        window.GameLogic.saveGameData();
        BattleCore.updateBattleScreen();
        BattleCore.setBattleMenu("main", true);
        return;
      }

      BattleCore._animateBattleAction(
        ".opponent-sprite",
        "animate-opponent-attack",
        300
      );
      BattleCore._playMoveSound(opponentMoveName);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const damageResult = BattleCore.calculateDamage(
        opponent,
        opponentMoveName,
        playerPokemon
      );

      const playerHpBefore = playerPokemon.currentHp;
      playerPokemon.currentHp = Math.max(
        0,
        playerPokemon.currentHp - damageResult.damage
      );
      const playerTookDamage = playerHpBefore > playerPokemon.currentHp;

      let effectivenessMessage = "";
      if (damageResult.effectiveness === 0)
        effectivenessMessage = " Não teve efeito!";
      else if (damageResult.effectiveness <= 0.5)
        effectivenessMessage = " Não é muito eficaz.";
      else if (damageResult.effectiveness >= 2)
        effectivenessMessage = " É super eficaz.";

      let logMessage = `${opponent.name} usou ${window.Utils.formatName(
        opponentMoveName
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

        if (hasLivePokemon) {
          BattleCore.addBattleLog(
            `${playerPokemon.name} desmaiou! Você precisa trocar de Pokémon.`
          );
          window.Renderer.showScreen("switchPokemon");
          return;
        } else {
          finalMessage =
            "Todos os seus Pokémons desmaiados! Você perdeu a batalha.";
          BattleCore.addBattleLog(finalMessage);
          ended = true;
        }
      }
    }

    window.GameLogic.saveGameData();
    BattleCore.updateBattleScreen();

    if (ended) {
      setTimeout(() => {
        if (finalMessage) {
          BattleCore._endBattleAndSyncLog(finalMessage);
        } else {
          window.gameState.battle = null;
          window.AuthSetup?.handleBattleMusic(false);

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
      BattleCore.setBattleMenu("disabled", true); // Desabilita o menu
      window.PvpCore.sendPvpAction("switch", null);
    } else {
      // No PvE, a troca gasta o turno. O oponente ataca em seguida.
      BattleCore.setBattleMenu("disabled", true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await BattleCore.playerTurn("opponent_attack");
    }
  },

  setBattleMenu: function (menu, force = false) {
    if (
      window.gameState.battle.type === "pvp" &&
      window.gameState.battle.currentMenu === "disabled" &&
      menu !== "main"
    ) {
      return;
    }
    const current = window.gameState.battle.currentMenu;
    let nextMenu = menu;
    if (!force && menu !== "disabled" && menu !== "main" && current === menu) {
      nextMenu = "main";
    }
    window.gameState.battle.currentMenu = nextMenu;
    BattleCore.updateBattleScreen();
  },

  updateBattleScreen: function () {
    const battleArea = document.getElementById("battle-area");
    if (!battleArea || !window.gameState.battle) return;

    ensureBattleStyles();

    const battle = window.gameState.battle;
    const playerPokemon = window.Utils.getActivePokemon();
    const opponent = battle.opponent;

    if (!playerPokemon) return;
    window.Utils.ensureMoveCounters(playerPokemon);
    window.Utils.ensureMoveCounters(opponent);

    // O backSprite (e a sprite do oponente) agora usam o índice correto que está em window.Utils.getActivePokemon()
    const playerBackSprite =
      playerPokemon.backSprite ||
      `../assets/sprites/pokemon/${playerPokemon.id}_back.png`;

    const playerHpPercent =
      (playerPokemon.currentHp / playerPokemon.maxHp) * 100;
    const opponentHpPercent = (opponent.currentHp / opponent.maxHp) * 100;

    const playerNormalMax =
      playerPokemon.normalMoveMaxUses ||
      window.GameConfig?.NORMAL_MOVE_MAX_USES ||
      25;
    const playerNormalRemaining =
      playerPokemon.normalMoveRemaining ?? playerNormalMax;
    const playerSpecialMax =
      playerPokemon.specialMoveMaxUses ||
      window.GameConfig?.SPECIAL_MOVE_MAX_USES ||
      10;
    const playerSpecialRemaining =
      playerPokemon.specialMoveRemaining ?? playerSpecialMax;

    const getHpColor = (percent) => {
      if (percent > 50) return "#22c55e";
      if (percent > 20) return "#facc15";
      return "#ef4444";
    };

    const renderTypes = (types) =>
      (types || [])
        .map(
          (type) =>
            `<span class="battle-type-badge">${String(type).toUpperCase()}</span>`
        )
        .join("");

    // NOVO: Mostra apenas a última mensagem (substitui a anterior)
    const lastMessage = battle.lastMessage || (battle.log && battle.log.length > 0 ? battle.log[battle.log.length - 1] : null);
    const displayMessage = lastMessage || "A batalha começou!";
    const logHtml = `<span class="battle-log-line">${displayMessage}</span>`;

    const isMainMenu = battle.currentMenu === "main";
    const isDisabled = battle.currentMenu === "disabled";
    const isFightMenu = battle.currentMenu === "fight";
    const isItemMenu = battle.currentMenu === "item";
    const disableInteractions = isDisabled;

    const battleItems = (window.gameState.profile.items || []).filter(
      (i) =>
        (i.catchRate && battle.type === "wild") ||
        i.healAmount ||
        i.ppRestore
    );

    const escapeMove = (move) =>
      move.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    const fightButtonHtml = `
      <button onclick="BattleCore.setBattleMenu('fight')" class="gba-button battle-action-btn bg-red-500 hover:bg-red-600 ${isFightMenu ? "active" : ""}" ${disableInteractions ? "disabled" : ""}>
        <i class="fa-solid fa-bolt"></i> Lutar
      </button>
    `;
    const itemButtonColor = battleItems.length
      ? "bg-yellow-500 hover:bg-yellow-600"
      : "bg-gray-300 text-gray-700";
    const itemButtonHtml = `
      <button onclick="BattleCore.setBattleMenu('item')" class="gba-button battle-action-btn ${itemButtonColor} ${isItemMenu ? "active" : ""}" ${disableInteractions ? "disabled" : ""}>
        <i class="fa-solid fa-suitcase-medical"></i> Item
      </button>
    `;
    const pokemonButtonHtml = `
      <button onclick="window.Renderer.showScreen('switchPokemon')" class="gba-button battle-action-btn bg-blue-500 hover:bg-blue-600" ${disableInteractions ? "disabled" : ""}>
        <i class="fa-solid fa-dragon"></i> Pokémon
      </button>
    `;
    const runDisabled =
      battle.type === "pvp" || disableInteractions ? "disabled" : "";
    const runButtonHtml = `
      <button onclick="BattleCore.playerTurn('run')" class="gba-button battle-action-btn bg-green-500 hover:bg-green-600" ${runDisabled}>
        <i class="fa-solid fa-running"></i> Fugir
      </button>
    `;
    const mainActionsHtml =
      fightButtonHtml + itemButtonHtml + pokemonButtonHtml + runButtonHtml;

    let secondaryHtml = "";
    if (isFightMenu) {
      const movesHtml = (playerPokemon.moves || [])
        .map((move) => {
          const moveName = typeof move === "string" ? move : move.name || move;
          const isSpecial = window.Utils.isSpecialMove(playerPokemon, moveName);
          
          // NOVO: Usa PA individual por movimento
          const movePA = window.Utils.getMovePA(playerPokemon, moveName);
          const disabled = movePA.remaining <= 0;
          
          const label = window.Utils.formatName(moveName);
          // PA no canto superior direito (menor)
          const paBadge = `<span class="battle-move-pa">${movePA.remaining}/${movePA.max}</span>`;
          
          return `<button onclick="BattleCore.playerTurn('move', '${escapeMove(
            moveName
          )}')" class="gba-button battle-move-btn ${
            isSpecial ? "battle-move-special" : "battle-move-normal"
          }${disabled ? " battle-move-disabled" : ""}" ${
            disabled ? "disabled" : ""
          }>
              ${paBadge}
              <span class="battle-move-label">${label}</span>
            </button>`;
        })
        .join("");
      secondaryHtml = `<div class="battle-secondary battle-secondary--moves">${movesHtml}</div>`;
    } else if (isItemMenu) {
      if (!battleItems.length) {
        secondaryHtml =
          `<div class="battle-secondary battle-secondary-message">Sem itens utilizáveis no momento.</div>`;
      } else {
        const itemsHtml = battleItems
          .map((item) => {
            const disabled = item.quantity <= 0;
            const typeClass = item.catchRate
              ? "bg-yellow-400 hover:bg-yellow-500"
              : item.ppRestore
              ? "bg-purple-400 hover:bg-purple-500"
              : "bg-green-400 hover:bg-green-500";
            const effectLabel = item.catchRate
              ? "Capturar"
              : item.ppRestore
              ? "Recupera PA"
              : `Cura ${item.healAmount} HP`;
            return `<button onclick="BattleCore.playerTurn('item', '${item.name}')" class="gba-button battle-move-btn ${typeClass}${
              disabled ? " battle-move-disabled" : ""
            }" ${disabled ? "disabled" : ""}>
                <span>${item.name}</span>
                <span class="battle-move-meta">${effectLabel} • x${item.quantity}</span>
              </button>`;
          })
          .join("");
        secondaryHtml = `<div class="battle-secondary battle-secondary--items">${itemsHtml}</div>`;
      }
    } else if (isDisabled) {
      secondaryHtml =
        `<div class="battle-secondary battle-secondary-message">Aguarde a ação do oponente...</div>`;
    }

    const normalMoveName = window.Utils.formatName(
      playerPokemon.normalMove || playerPokemon.moves?.[0] || "Golpe"
    );
    const specialMoveName = window.Utils.formatName(
      playerPokemon.specialMove || playerPokemon.moves?.[1] || "Especial"
    );
    const normalHtml = `<div class="battle-special gba-font">
            <span><i class="fa-solid fa-sword text-red-500"></i> Golpe</span>
            <span>${normalMoveName} • ${playerNormalRemaining}/${playerNormalMax} PA</span>
         </div>`;
    const specialHtml = playerPokemon.specialMove
      ? `<div class="battle-special gba-font">
            <span><i class="fa-solid fa-star text-yellow-500"></i> Especial</span>
            <span>${specialMoveName} • ${playerSpecialRemaining}/${playerSpecialMax}</span>
         </div>`
      : "";

    const opponentTypes = renderTypes(opponent.types);
    const playerTypes = renderTypes(playerPokemon.types);

    // NOVO: Verifica se o oponente já foi capturado
    const pokedex = window.gameState?.profile?.pokedex;
    const isOpponentCaught = pokedex && (pokedex instanceof Set ? pokedex.has(opponent.id) : pokedex.includes(opponent.id));
    const caughtIcon = isOpponentCaught 
      ? '<img src="../assets/sprites/items/poke-ball.png" alt="Capturado" class="inline-block w-4 h-4 ml-1" title="Já capturado" style="image-rendering: pixelated;">' 
      : '';

    let menuSections = "";
    if (isDisabled) {
      menuSections =
        secondaryHtml ||
        `<div class="battle-secondary battle-secondary-message">Aguarde a ação do oponente...</div>`;
    } else if (isMainMenu) {
      menuSections = `<div class="battle-main-actions">${mainActionsHtml}</div>`;
    } else {
      menuSections = `
        ${secondaryHtml || ""}
        <button onclick="BattleCore.setBattleMenu('main')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full">
          Voltar
        </button>
      `;
    }

    battleArea.innerHTML = `
      <div class="battle-wrapper">
        <div class="battle-scene">
          <div class="battle-entity opponent">
            <div class="battle-row battle-row-opponent">
              <div class="battle-card">
                <div class="battle-name-row gba-font">
                  <span>${opponent.name}${caughtIcon}</span>
                  <span>Nv. ${opponent.level}</span>
                </div>
                <div class="battle-type-row">
                  ${opponentTypes}
                </div>
                <div class="battle-hp-bar">
                  <div class="battle-hp-bar-track">
                    <div class="battle-hp-bar-fill" style="width: ${Math.max(
                      0,
                      opponentHpPercent
                    )}%; background: ${getHpColor(opponentHpPercent)};"></div>
                  </div>
                  <div class="battle-hp-text gba-font">
                    <span>HP</span>
                    <span>${opponent.currentHp}/${opponent.maxHp}</span>
                  </div>
                </div>
              </div>
              <div class="battle-sprite-wrap">
                <img src="${opponent.sprite}" alt="${opponent.name}" class="battle-sprite opponent-sprite opponent">
                <div class="battle-platform"></div>
              </div>
            </div>
          </div>

          <div class="battle-entity player">
            <div class="battle-row battle-row-player">
              <div class="battle-sprite-wrap">
                <img src="${playerBackSprite}" alt="${playerPokemon.name}" class="battle-sprite player-sprite player">
                <div class="battle-platform"></div>
              </div>
              <div class="battle-card">
                <div class="battle-name-row gba-font">
                  <span>${playerPokemon.name}</span>
                  <span>Nv. ${playerPokemon.level}</span>
                </div>
                <div class="battle-type-row">
                  ${playerTypes}
                </div>
                <div class="battle-hp-bar">
                  <div class="battle-hp-bar-track">
                    <div class="battle-hp-bar-fill" style="width: ${Math.max(
                      0,
                      playerHpPercent
                    )}%; background: ${getHpColor(playerHpPercent)};"></div>
                  </div>
                  <div class="battle-hp-text gba-font">
                    <span>HP</span>
                    <span>${playerPokemon.currentHp}/${playerPokemon.maxHp}</span>
                  </div>
                </div>
                ${normalHtml}
                ${specialHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="battle-log gba-font" id="battle-log-container">
          ${logHtml}
        </div>

        <div class="battle-menu">
          ${menuSections}
        </div>
      </div>
    `;

  },
};
