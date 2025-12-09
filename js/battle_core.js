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

const TYPE_BADGE_COLORS = {
  normal: { bg: "#d1d5db", border: "#9ca3af", text: "#111827" },
  fire: { bg: "#fdba74", border: "#ea580c", text: "#7c2d12" },
  water: { bg: "#bfdbfe", border: "#2563eb", text: "#1e3a8a" },
  grass: { bg: "#bbf7d0", border: "#16a34a", text: "#14532d" },
  electric: { bg: "#fef08a", border: "#f59e0b", text: "#92400e" },
  ice: { bg: "#bae6fd", border: "#0ea5e9", text: "#0f172a" },
  fighting: { bg: "#fecdd3", border: "#dc2626", text: "#7f1d1d" },
  poison: { bg: "#f5d0fe", border: "#a21caf", text: "#581c87" },
  ground: { bg: "#fde68a", border: "#b45309", text: "#78350f" },
  flying: { bg: "#ddd6fe", border: "#7c3aed", text: "#312e81" },
  psychic: { bg: "#fbcfe8", border: "#db2777", text: "#831843" },
  bug: { bg: "#d9f99d", border: "#65a30d", text: "#365314" },
  rock: { bg: "#e7e5e4", border: "#78716c", text: "#292524" },
  ghost: { bg: "#c7d2fe", border: "#4c1d95", text: "#312e81" },
  dragon: { bg: "#c4b5fd", border: "#6d28d9", text: "#2e1065" },
  dark: { bg: "#cbd5f5", border: "#1f2937", text: "#0f172a" },
  steel: { bg: "#e2e8f0", border: "#64748b", text: "#0f172a" },
  fairy: { bg: "#f5d0fe", border: "#d946ef", text: "#86198f" },
  default: { bg: "#e5e7eb", border: "#111827", text: "#111827" },
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
      overflow: hidden;
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
      min-height: 150px;
      background: linear-gradient(145deg, #dfe9ff 0%, #fbfdff 55%, #f8f1ff 100%);
      border: 3px solid #111827;
      border-radius: 18px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      overflow: hidden;
    }
    #battle-area .boss-battle-header ~ .battle-scene {
      min-height: 180px;
      padding: 8px;
      gap: 8px;
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
    #battle-area .battle-row {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
      width: 100%;
    }
    #battle-area .battle-card {
      background: rgba(255, 255, 255, 0.88);
      border: 2px solid #111827;
      border-radius: 14px;
      padding: 4px 6px;
      box-shadow: 0 6px 0 rgba(17, 24, 39, 0.18);
      width: clamp(200px, 60%, 320px);
      font-size: 0.55rem;
      line-height: 1.15;
    }
    #battle-area .battle-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.6rem;
      letter-spacing: 0.05em;
    }
    #battle-area .battle-type-row {
      margin-top: 4px;
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
      margin-top: 6px;
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
      margin-top: 3px;
      font-size: 0.55rem;
      color: #1f2937;
      display: flex;
      justify-content: space-between;
    }
    #battle-area .battle-platform {
      align-self: center;
      width: 140px;
      height: 44px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.08) 60%, transparent 70%);
      box-shadow: 0 18px 24px rgba(17, 24, 39, 0.22);
    }
    #battle-area .battle-sprite-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      min-width: 80px;
      flex: 0 0 26%;
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
      padding: 10px 12px;
      color: #f9fafb;
      font-size: 0.6rem;
      min-height: 85px;
      max-height: 100px;
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.06);
      line-height: 1.35;
      word-break: break-word;
      position: relative;
      overflow-y: auto;
    }
    #battle-area .battle-log-line + .battle-log-line {
      margin-top: 6px;
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
      min-height: 190px;
      max-height: 190px;
      overflow: hidden;
    }
    #battle-area .battle-menu-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    #battle-area .battle-scroll-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding-right: 4px;
      gap: 8px;
    }
    #battle-area .battle-scroll-area > * {
      flex: 1;
      min-height: 0;
    }
    #battle-area .battle-main-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      grid-auto-rows: minmax(0, 1fr);
      height: 100%;
      align-items: stretch;
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
      min-height: 52px;
      height: 100%;
      line-height: 1.2;
    }
    #battle-area .battle-secondary--moves,
    #battle-area .battle-secondary--items {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      grid-auto-rows: minmax(0, 1fr);
      height: 100%;
    }
    #battle-area .battle-secondary-message {
      font-size: 0.65rem;
      color: #374151;
      background: rgba(255, 255, 255, 0.85);
      border: 2px solid #cbd5f5;
      border-radius: 12px;
      padding: 10px;
      text-align: center;
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #battle-area .battle-move-btn {
      font-size: 0.7rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 10px 12px;
      position: relative;
      min-height: 70px;
      color: #f8fafc;
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
      position: absolute;
      top: 4px;
      right: 6px;
      font-size: 0.55rem;
      font-weight: 700;
      background: #0b0b0b;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 6px;
      line-height: 1.2;
    }
    #battle-area .battle-move-label {
      display: block;
      width: 100%;
      margin-top: 4px;
      font-weight: 600;
      color: #f8fafc;
    }
    #battle-area .battle-move-pa {
      position: absolute;
      top: 4px;
      right: 6px;
      font-size: 0.5rem;
      font-weight: 700;
      background: #0b0b0b;
      color: #ffffff;
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
    #battle-area .capture-minigame-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      gap: 20px;
    }
    #battle-area .capture-minigame-container {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      border: 4px solid #000;
      border-radius: 20px;
      padding: 30px;
      max-width: 90%;
      width: 400px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    #battle-area .capture-minigame-title {
      font-size: 1.2rem;
      font-weight: bold;
      text-align: center;
      color: #fbbf24;
      text-shadow: 2px 2px 0px #000;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    #battle-area .capture-timing-bar-container {
      width: 100%;
      height: 60px;
      background: #1e293b;
      border: 4px solid #000;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      margin: 20px 0;
    }
    #battle-area .capture-timing-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 20px;
      background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
      border: 2px solid #fff;
      border-radius: 4px;
      transition: left 0.05s linear;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
    }
    #battle-area .capture-success-zone {
      position: absolute;
      top: 0;
      height: 100%;
      background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
      border: 2px solid #fff;
      opacity: 0.6;
      box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.8);
    }
    #battle-area .capture-timing-center {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 100%;
      background: #fbbf24;
      box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
    }
    #battle-area .capture-minigame-button {
      width: 100%;
      padding: 15px;
      font-size: 1rem;
      font-weight: bold;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border: 4px solid #000;
      border-radius: 10px;
      color: #fff;
      text-shadow: 2px 2px 0px #000;
      cursor: pointer;
      transition: transform 0.1s;
      text-transform: uppercase;
    }
    #battle-area .capture-minigame-button:hover:not(:disabled) {
      transform: scale(1.05);
    }
    #battle-area .capture-minigame-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    #battle-area .capture-minigame-instructions {
      text-align: center;
      color: #fff;
      font-size: 0.9rem;
      margin-bottom: 15px;
      text-shadow: 1px 1px 0px #000;
    }
    #battle-area .capture-minigame-feedback {
      text-align: center;
      font-size: 1rem;
      font-weight: bold;
      margin-top: 15px;
      text-shadow: 2px 2px 0px #000;
    }
    #battle-area .capture-minigame-feedback.success {
      color: #22c55e;
    }
    #battle-area .capture-minigame-feedback.fail {
      color: #ef4444;
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

// NOVO: Função auxiliar para obter os índices dos pokémons disponíveis para batalha
function getBattleTeamIndices() {
  const profile = window.gameState.profile;
  const battleTeam = profile.battleTeam || [];
  const pokemonArray = profile.pokemon || [];
  const MAX_BATTLE_TEAM = 5;

  // Se há uma equipe definida e válida, usa ela
  if (Array.isArray(battleTeam) && battleTeam.length > 0) {
    // Filtra apenas índices válidos e pokémons que existem
    return battleTeam
      .filter(
        (index) =>
          index >= 0 && index < pokemonArray.length && pokemonArray[index]
      )
      .slice(0, MAX_BATTLE_TEAM);
  }

  // Se não há equipe definida, usa os 5 primeiros pokémons
  const defaultIndices = [];
  for (let i = 0; i < Math.min(MAX_BATTLE_TEAM, pokemonArray.length); i++) {
    defaultIndices.push(i);
  }
  return defaultIndices;
}

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

    const type = MOVES_TO_TYPE_MAPPING[moveName?.toLowerCase?.()] || "default";

    const baseFrequency =
      TYPE_SOUND_FREQUENCIES[type] ?? TYPE_SOUND_FREQUENCIES.default;
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

    // NOVO: Verifica pokémons da equipe de batalha especificamente
    const battleTeamIndices = getBattleTeamIndices();
    const battleTeamPokemon = battleTeamIndices
      .map((index) => profile.pokemon[index])
      .filter((p) => p && p.currentHp > 0);

    if (battleTeamPokemon.length === 0) {
      window.GameLogic.addExploreLog(
        "Nenhum pokémon da sua equipe de batalha está em condições de lutar! Visite o Centro Pokémon antes de explorar novamente."
      );
      window.AuthSetup?.handleBattleMusic(false);
      return;
    }

    // Garante que os campos existam
    if (typeof profile.trainerLevel !== "number") {
      const maxLevel =
        profile.pokemon.length > 0
          ? Math.max(...profile.pokemon.map((p) => p.level || 1))
          : 1;
      profile.trainerLevel = Math.min(100, Math.max(1, maxLevel));
    }
    if (typeof profile.trainerExp !== "number") profile.trainerExp = 0;
    if (typeof profile.normalBattleCount !== "number")
      profile.normalBattleCount = 0;
    if (!Array.isArray(profile.badges)) profile.badges = [];

    const trainerLevel = profile.trainerLevel;

    // NOVO: Verifica se é hora do chefe de zona (a cada 50 batalhas)
    if (profile.normalBattleCount > 0 && profile.normalBattleCount % 50 === 0) {
      // Calcula qual zona é baseado no número de batalhas
      const zoneNumber = Math.floor(profile.normalBattleCount / 50);
      const zoneBadgeName = `Zona ${zoneNumber}`;

      // Verifica se o jogador já tem essa insígnia (para evitar repetir)
      if (!profile.badges.includes(zoneBadgeName)) {
        await BattleCore.startBossBattle(
          zoneNumber,
          trainerLevel,
          battleTeamIndices
        );
        return;
      }
    }

    let pokemonId = null;
    let isEvolved = false;
    let isLegendary = false;

    // Sistema de contagem de batalhas
    // A cada 100 batalhas normais: 1 lendário (nível + 10)
    if (
      profile.normalBattleCount > 0 &&
      profile.normalBattleCount % 100 === 0
    ) {
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
        pokemonId =
          window._legendaryCache[
            Math.floor(Math.random() * window._legendaryCache.length)
          ];
        isLegendary = true;
      }
    }
    // A cada 10 batalhas normais: 1 evoluído (nível + 5)
    else if (
      profile.normalBattleCount > 0 &&
      profile.normalBattleCount % 10 === 0
    ) {
      // Busca um Pokémon evoluído usando cache global (sem lendários/miticos)
      if (!window._evolvedCache) {
        window._evolvedCache = [];
        // Busca cadeias evolutivas e identifica evoluídos (excluindo lendários/miticos)
        for (let id = 1; id <= window.GameConfig.POKEDEX_LIMIT; id++) {
          try {
            // Verifica se é lendário ou mitico
            const speciesData = await window.PokeAPI.fetchSpeciesData(id);
            if (speciesData && (speciesData.isLegendary || speciesData.isMythical)) {
              continue; // Pula lendários e miticos
            }

            const chain = await window.PokeAPI.fetchEvolutionChainData(id);
            if (chain && chain.length > 1) {
              // Verifica se este ID não é o primeiro da cadeia (ou seja, é evoluído)
              const chainFirstId = chain[0]?.id;
              if (
                chainFirstId &&
                id !== chainFirstId &&
                !window._evolvedCache.includes(id)
              ) {
                window._evolvedCache.push(id);
              }
            }
          } catch (e) {
            // Ignora erros
          }
        }
      }
      if (window._evolvedCache.length > 0) {
        pokemonId =
          window._evolvedCache[
            Math.floor(Math.random() * window._evolvedCache.length)
          ];
        isEvolved = true;
      }
    }

    // Se não encontrou especial, busca um Pokémon normal (sem lendários/miticos)
    if (!pokemonId) {
      // NOVO: Sistema de Eventos Semanais
      // Obtém as regiões ativas no evento semanal atual
      const weeklyEvent = window.GameConfig.getWeeklyEventRegions();
      let allowedIds = [];
      
      // Coleta todos os IDs das regiões do evento
      if (weeklyEvent && weeklyEvent.regions && Array.isArray(weeklyEvent.regions)) {
        for (const regionId of weeklyEvent.regions) {
          const region = window.GameConfig.POKEDEX_REGIONS.find(r => r.id === regionId);
          if (region) {
            for (let id = region.startId; id <= region.endId; id++) {
              allowedIds.push(id);
            }
          }
        }
      }
      
      // Se não há evento ou nenhuma região encontrada, usa todas as regiões
      if (allowedIds.length === 0) {
        for (let id = 1; id <= window.GameConfig.POKEDEX_LIMIT; id++) {
          allowedIds.push(id);
        }
      }
      
      // Cria cache de Pokémon comuns baseado nas regiões do evento
      const cacheKey = `_weeklyEventCache_${weeklyEvent ? weeklyEvent.regions.join('_') : 'all'}`;
      if (!window[cacheKey]) {
        window[cacheKey] = [];
        
        for (const id of allowedIds) {
          try {
            const speciesData = await window.PokeAPI.fetchSpeciesData(id);
            // Inclui apenas se NÃO for lendário e NÃO for mitico
            if (speciesData && !speciesData.isLegendary && !speciesData.isMythical) {
              window[cacheKey].push(id);
            }
          } catch (e) {
            // Se não conseguir buscar species, adiciona ao cache para evitar travamentos
            window[cacheKey].push(id);
          }
        }
      }
      
      if (window[cacheKey].length > 0) {
        pokemonId =
          window[cacheKey][
            Math.floor(Math.random() * window[cacheKey].length)
          ];
      } else {
        // Fallback: escolhe aleatoriamente das regiões permitidas
        if (allowedIds.length > 0) {
          pokemonId = allowedIds[Math.floor(Math.random() * allowedIds.length)];
        } else {
          pokemonId = Math.floor(Math.random() * window.GameConfig.POKEDEX_LIMIT) + 1;
        }
      }
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

    // NOVO: Encontra o primeiro pokémon da equipe que está vivo para ser o inicial
    const firstAvailableIndex =
      battleTeamIndices.find(
        (index) =>
          profile.pokemon[index] && profile.pokemon[index].currentHp > 0
      ) ??
      battleTeamIndices[0] ??
      0;

    window.gameState.battle = {
      type: "wild",
      opponent: wildPokemonData,
      isEvolved: isEvolved,
      isLegendary: isLegendary,
      // NOVO: Usa o primeiro pokémon da equipe de batalha disponível
      playerPokemonIndex: firstAvailableIndex,
      // NOVO: Armazena os índices da equipe de batalha na batalha
      battleTeamIndices: battleTeamIndices,
      turn: 0,
      // Mensagem inicial com o status de captura
      lastMessage: `Um ${wildPokemonData.name} selvagem${specialType} (Nv. ${wildPokemonData.level}) apareceu!${captureStatus}`,
      log: [
        `Um ${wildPokemonData.name} selvagem${specialType} (Nv. ${wildPokemonData.level}) apareceu!${captureStatus}`,
      ],
      currentMenu: "disabled",
      participatingIndices: new Set(),
      forceSwitchSelection: false,
      forceSwitchMessage: null,
      // NOVO: Cooldown de 3 segundos para o botão de fugir no início da batalha
      runButtonCooldown: true,
    };

    // Adiciona o índice do pokémon inicial ao set de participantes
    window.gameState.battle.participatingIndices.add(firstAvailableIndex);

    // Remove o cooldown após 3 segundos
    setTimeout(() => {
      if (window.gameState.battle) {
        window.gameState.battle.runButtonCooldown = false;
        BattleCore.updateBattleScreen();
      }
    }, 3000);

    window.Renderer.showScreen("battle");
    BattleCore._checkActivePokemonOnBattleStart();

    // NOVO: Inimigo toma a primeira ação após um pequeno delay
    setTimeout(async () => {
      if (window.gameState.battle && !window.gameState.battle.forceSwitchSelection) {
        await BattleCore.playerTurn("opponent_attack");
      }
    }, 1500);
  },

  /**
   * Inicia uma batalha contra um chefe de zona com 5 pokémons.
   * @param {number} zoneNumber - Número da zona (1, 2, 3, etc.)
   * @param {number} trainerLevel - Nível do treinador
   * @param {Array<number>} battleTeamIndices - Índices da equipe de batalha do jogador
   */
  startBossBattle: async function (
    zoneNumber,
    trainerLevel,
    battleTeamIndices
  ) {
    const profile = window.gameState.profile;

    // Gera 5 pokémons para o chefe (todos evoluídos e com nível maior)
    const bossPokemon = [];
    const bossLevel = trainerLevel + 10; // Chefe sempre 10 níveis acima

    // Busca pokémons evoluídos para o chefe
    if (!window._evolvedCache) {
      window._evolvedCache = [];
      for (let id = 1; id <= window.GameConfig.POKEDEX_LIMIT; id++) {
        try {
          const chain = await window.PokeAPI.fetchEvolutionChainData(id);
          if (chain && chain.length > 1) {
            const chainFirstId = chain[0]?.id;
            if (
              chainFirstId &&
              id !== chainFirstId &&
              !window._evolvedCache.includes(id)
            ) {
              window._evolvedCache.push(id);
            }
          }
        } catch (e) {
          // Ignora erros
        }
      }
    }

    // Seleciona 5 pokémons aleatórios evoluídos
    const availableEvolved = [...window._evolvedCache];
    const selectedIds = [];
    for (let i = 0; i < 5 && availableEvolved.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableEvolved.length);
      const selectedId = availableEvolved.splice(randomIndex, 1)[0];
      selectedIds.push(selectedId);
    }

    // Se não tiver 5 evoluídos, completa com pokémons normais
    while (selectedIds.length < 5) {
      const randomId =
        Math.floor(Math.random() * window.GameConfig.POKEDEX_LIMIT) + 1;
      if (!selectedIds.includes(randomId)) {
        selectedIds.push(randomId);
      }
    }

    // Carrega os dados dos pokémons do chefe
    for (const pokemonId of selectedIds) {
      try {
        const pokemonData = await window.PokeAPI.fetchPokemonData(pokemonId);
        if (pokemonData) {
          pokemonData.level = Math.max(1, Math.min(100, bossLevel));
          pokemonData.maxHp = window.Utils.calculateMaxHp(
            pokemonData.stats.hp,
            pokemonData.level
          );
          pokemonData.currentHp = pokemonData.maxHp;
          window.Utils.applyMoveTemplate(pokemonData, { forceResetUses: true });
          bossPokemon.push(pokemonData);
        }
      } catch (e) {
        console.error(`Erro ao carregar pokémon ${pokemonId} do chefe:`, e);
      }
    }

    if (bossPokemon.length === 0) {
      window.GameLogic.addExploreLog("Erro ao gerar chefe de zona.");
      window.AuthSetup?.handleBattleMusic(false);
      return;
    }

    // Encontra o primeiro pokémon da equipe que está vivo
    const firstAvailableIndex =
      battleTeamIndices.find(
        (index) =>
          profile.pokemon[index] && profile.pokemon[index].currentHp > 0
      ) ??
      battleTeamIndices[0] ??
      0;

    const zoneBadgeName = `Zona ${zoneNumber}`;

    // Nomes de líderes por zona
    const leaderNames = [
      "Líder Brock",
      "Líder Misty",
      "Líder Lt. Surge",
      "Líder Erika",
      "Líder Koga",
      "Líder Sabrina",
      "Líder Blaine",
      "Líder Giovanni",
    ];
    const leaderName =
      leaderNames[(zoneNumber - 1) % leaderNames.length] ||
      `Líder da ${zoneBadgeName}`;

    window.gameState.battle = {
      type: "boss",
      opponent: bossPokemon[0], // Primeiro pokémon do chefe
      bossTeam: bossPokemon, // Todos os 5 pokémons do chefe
      currentBossIndex: 0, // Índice do pokémon atual do chefe
      zoneNumber: zoneNumber,
      zoneBadgeName: zoneBadgeName,
      leaderName: leaderName,
      playerPokemonIndex: firstAvailableIndex,
      battleTeamIndices: battleTeamIndices,
      turn: 0,
      lastMessage: `🏆 ${leaderName.toUpperCase()} DESAFIOU VOCÊ PARA UMA BATALHA! 🏆\n${
        bossPokemon[0].name
      } (Nv. ${bossPokemon[0].level}) lidera o time do ${leaderName}!`,
      log: [
        `🏆 ${leaderName.toUpperCase()} DESAFIOU VOCÊ PARA UMA BATALHA! 🏆`,
        `${bossPokemon[0].name} (Nv. ${bossPokemon[0].level}) lidera o time do ${leaderName}!`,
        `O ${leaderName} tem ${bossPokemon.length} pokémons poderosos!`,
        `Próxima luta: Batalha contra ${leaderName}`,
      ],
      currentMenu: "disabled",
      participatingIndices: new Set(),
      forceSwitchSelection: false,
      forceSwitchMessage: null,
      // NOVO: Cooldown de 3 segundos para o botão de fugir no início da batalha
      runButtonCooldown: true,
    };

    // Adiciona o índice do pokémon inicial ao set de participantes
    window.gameState.battle.participatingIndices.add(firstAvailableIndex);

    // Remove o cooldown após 3 segundos
    setTimeout(() => {
      if (window.gameState.battle) {
        window.gameState.battle.runButtonCooldown = false;
        BattleCore.updateBattleScreen();
      }
    }, 3000);

    window.Renderer.showScreen("battle");
    BattleCore._checkActivePokemonOnBattleStart();

    // NOVO: Inimigo toma a primeira ação após um pequeno delay
    setTimeout(async () => {
      if (window.gameState.battle && !window.gameState.battle.forceSwitchSelection) {
        await BattleCore.playerTurn("opponent_attack");
      }
    }, 1500);
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
    const battle = window.gameState.battle;
    if (battle) {
      // 1. contabiliza batalhas normais (exceto fugas e chefes)
      // Chefes não contam como batalhas normais para o contador
      if (battle.type === "wild" && !battle.didEscape) {
        const profile = window.gameState.profile;
        profile.normalBattleCount = (profile.normalBattleCount || 0) + 1;
      }

      // 2. Adiciona a mensagem final ao log principal
      window.GameLogic.addExploreLog(finalMessage);

      // 3. Limpa flags temporárias e estado da batalha
      delete battle.didEscape;
      window.gameState.battle = null;

      // 4. Salva os dados
      window.GameLogic.saveGameData();

      // 5. LÓGICA DE RETORNO DO MAPA (BETA MODE)
      if (window.gameState.profile.preferences?.isBetaMode) {
        window.AuthSetup?.handleBattleMusic(false);
        // Chama a função no MapCore para voltar ao mapa e exibir o modal
        window.MapCore.handleBattleReturn(finalMessage);
        return;
      }

      // 6. Fallback para o Menu Principal (Modo Clássico)
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
    if (
      !window.gameState.battle.lastMessage ||
      !window.gameState.battle.lastMessage.includes("Parabéns!")
    ) {
      const winner = window.Utils.getActivePokemon();
      BattleCore.addBattleLog(`Parabéns! ${winner.name} venceu!`);

      const moneyGain = Math.floor(Math.random() * 500) + 200;
      window.gameState.profile.money += moneyGain;
      BattleCore.addBattleLog(`Você ganhou P$${moneyGain}.`);
    }

    const totalExpGain = Math.floor(((defeatedLevel * 50) / 5) * 1.1); // NOVO: Aumentado em 10%

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

    // NOVO: Recompensa doces aos Pokémon que participaram da batalha
    // 1 doce do Pokémon derrotado + 2 doces para cada Pokémon próprio que lutou
    if (participatingIndices && participatingIndices.size > 0) {
      // 1. Adiciona 1 doce do Pokémon derrotado (baseado na linha evolutiva do oponente)
      const loserBaseId = window.GameLogic.getEvolutionChainBaseId(loser.id);
      window.GameLogic.addPokemonCandy(loser.id, 1);
      const loserTotalCandy = window.GameLogic.getPokemonCandy(loserBaseId);
      const loserName = window.Utils.formatName(loser.name);
      BattleCore.addBattleLog(
        `Você ganhou 1 doce de ${loserName}! (Total: ${loserTotalCandy} doces)`
      );

      // 2. Adiciona 2 doces para cada Pokémon próprio que participou da batalha
      const indicesArray = Array.from(participatingIndices)
        .filter((index) => window.gameState.profile.pokemon[index])
        .sort((a, b) => a - b);

      indicesArray.forEach(index => {
        const pokemon = window.gameState.profile.pokemon[index];
        if (pokemon) {
          // Adiciona 2 doces baseado na linha evolutiva do Pokémon próprio
          window.GameLogic.addPokemonCandy(pokemon.id, 2);
          const pokemonBaseId = window.GameLogic.getEvolutionChainBaseId(pokemon.id);
          const pokemonTotalCandy = window.GameLogic.getPokemonCandy(pokemonBaseId);
          const pokemonName = window.Utils.formatName(pokemon.name);
          BattleCore.addBattleLog(
            `${pokemonName} ganhou 2 doces! (Total: ${pokemonTotalCandy} doces)`
          );
        }
      });
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

  // NOVO: Minigame de captura
  showCaptureMinigame: function (ballName, ballCatchRate) {
    return new Promise((resolve) => {
      const wildPokemon = window.gameState.battle.opponent;
      const battleMenu = document.querySelector(".battle-menu");

      if (!battleMenu) {
        // Fallback se não encontrar o menu
        resolve({
          success: false,
          chance: BattleCore.calculateCatchRate(
            wildPokemon.currentHp,
            wildPokemon.maxHp,
            ballCatchRate
          ),
        });
        return;
      }

      // Calcula a dificuldade baseada nos fatores
      const hpRatio = Math.max(
        0,
        Math.min(1, wildPokemon.currentHp / wildPokemon.maxHp)
      );
      const level = Math.max(1, wildPokemon.level || 1);

      // Fatores de dificuldade:
      // - Vida baixa = mais fácil (zona verde maior)
      // - Nível alto = mais difícil (zona verde menor)
      // - Bola melhor = mais fácil (zona verde maior)
      // NOVO: Verde é o menor, amarelo médio, vermelho maior
      const baseGreenZoneSize = 12; // Tamanho base da zona verde (centro, menor) em %
      const baseYellowZoneSize = 35; // Tamanho total da zona amarela (médio, engloba verde) em % - aumentado 10%
      const hpBonus = (1 - hpRatio) * 8; // Até 8% de bônus se HP baixo
      const levelPenalty = (level / 100) * 6; // Até 6% de penalidade se nível alto
      const ballBonus = (ballCatchRate - 0.5) * 4; // Bônus baseado na qualidade da bola

      // Tamanho das zonas: verde menor (centro), amarelo médio (ao redor), vermelho maior (extremas)
      const greenZoneSize = Math.max(
        8,
        Math.min(20, baseGreenZoneSize + hpBonus - levelPenalty + ballBonus)
      );
      const yellowTotalZoneSize = Math.max(
        30,
        Math.min(50, baseYellowZoneSize + hpBonus - levelPenalty * 0.5)
      );

      // Velocidade da barra aumentada (nível alto = mais rápido)
      const baseSpeed = 4; // Velocidade base aumentada (era 2)
      const speedMultiplier = 1 + level / 40; // Mais rápido com nível alto
      const barSpeed = baseSpeed * speedMultiplier;

      // Substitui o conteúdo do menu pelo minigame
      battleMenu.innerHTML = `
        <div class="battle-menu-body">
          <div style="padding: 15px; text-align: center;">
            <div style="font-size: 0.9rem; font-weight: bold; color: #fbbf24; text-shadow: 2px 2px 0px #000; margin-bottom: 10px; text-transform: uppercase;">
              MINIGAME DE CAPTURA
            </div>
            <div style="font-size: 0.7rem; color: #fff; margin-bottom: 15px; text-shadow: 1px 1px 0px #000;">
              Clique na área quando a barra estiver na zona verde!
            </div>
            <div id="capture-timing-container" style="width: 100%; height: 60px; background: #1e293b; border: 3px solid #000; border-radius: 8px; position: relative; overflow: hidden; margin: 15px 0; cursor: pointer;">
              <!-- Zona vermelha (extremos - erro) -->
              <div id="capture-red-zone-left" style="position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); opacity: 0.5;"></div>
              <div id="capture-red-zone-right" style="position: absolute; top: 0; right: 0; height: 100%; background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); opacity: 0.5;"></div>
              <!-- Zona amarela (meio - acerta sem bônus) -->
              <div id="capture-yellow-zone" style="position: absolute; top: 0; height: 100%; background: linear-gradient(180deg, #facc15 0%, #eab308 100%); border: 2px solid #fff; opacity: 0.6; box-shadow: inset 0 0 15px rgba(250, 204, 21, 0.6);"></div>
              <!-- Zona verde (centro - maior chance) -->
              <div id="capture-green-zone" style="position: absolute; top: 0; height: 100%; background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%); border: 2px solid #fff; opacity: 0.7; box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.8);"></div>
              <!-- Linha central -->
              <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 2px; height: 100%; background: #fbbf24; box-shadow: 0 0 10px rgba(251, 191, 36, 0.8); z-index: 10;"></div>
              <!-- Barra móvel -->
              <div id="capture-timing-bar" style="position: absolute; top: 0; left: 0; height: 100%; width: 20px; background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); border: 2px solid #fff; border-radius: 4px; box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); transition: left 0.03s linear; z-index: 5;"></div>
            </div>
            <div id="capture-feedback" style="text-align: center; font-size: 0.8rem; font-weight: bold; margin-top: 10px; text-shadow: 2px 2px 0px #000; min-height: 20px;"></div>
          </div>
        </div>
      `;

      const barElement = document.getElementById("capture-timing-bar");
      const greenZoneElement = document.getElementById("capture-green-zone");
      const yellowZoneElement = document.getElementById("capture-yellow-zone");
      const redZoneLeftElement = document.getElementById(
        "capture-red-zone-left"
      );
      const redZoneRightElement = document.getElementById(
        "capture-red-zone-right"
      );
      const feedbackElement = document.getElementById("capture-feedback");
      const container = document.getElementById("capture-timing-container");

      // Aguarda um frame para garantir que o elemento está renderizado
      setTimeout(() => {
        // Configura as zonas
        const containerWidth = container.offsetWidth;

        // Zona verde (centro - MENOR)
        const greenWidth = (containerWidth * greenZoneSize) / 100;
        const greenLeft = (containerWidth - greenWidth) / 2;

        // Zona amarela (ao redor do verde - MÉDIO, engloba o verde)
        const yellowTotalWidth = (containerWidth * yellowTotalZoneSize) / 100;
        const yellowLeft = (containerWidth - yellowTotalWidth) / 2;

        // Zonas vermelhas (extremas - MAIOR, o que sobra nas laterais, fora do amarelo)
        const redZoneWidth = (containerWidth - yellowTotalWidth) / 2;

        // Aplica os tamanhos
        greenZoneElement.style.width = `${greenWidth}px`;
        greenZoneElement.style.left = `${greenLeft}px`;

        yellowZoneElement.style.width = `${yellowTotalWidth}px`;
        yellowZoneElement.style.left = `${yellowLeft}px`;

        redZoneLeftElement.style.width = `${redZoneWidth}px`;
        redZoneRightElement.style.width = `${redZoneWidth}px`;

        // Variáveis para o handler do clique
        const greenStart = greenLeft;
        const greenEnd = greenLeft + greenWidth;
        const yellowStart = yellowLeft;
        const yellowEnd = yellowLeft + yellowTotalWidth;

        let barPosition = 0;
        let direction = 1; // 1 = direita, -1 = esquerda
        let gameActive = true;
        let clicked = false;
        let animateBarInterval = null;

        // Animação da barra usando setInterval para melhor controle
        const startAnimation = () => {
          animateBarInterval = setInterval(() => {
            if (!gameActive || clicked) {
              if (animateBarInterval) clearInterval(animateBarInterval);
              return;
            }

            barPosition += barSpeed * direction;

            // Inverte direção nas bordas
            if (barPosition >= containerWidth - 20) {
              barPosition = containerWidth - 20;
              direction = -1;
            } else if (barPosition <= 0) {
              barPosition = 0;
              direction = 1;
            }

            barElement.style.left = `${barPosition}px`;
          }, 12); // ~83 FPS para movimento mais suave
        };

        startAnimation();

        // Handler do clique na área toda
        const handleClick = (e) => {
          if (!gameActive || clicked) return;

          clicked = true;
          gameActive = false;
          if (animateBarInterval) clearInterval(animateBarInterval);
          container.style.cursor = "not-allowed";
          container.style.opacity = "0.7";

          // Verifica em qual zona a barra está
          const barCenter = barPosition + 10; // Centro da barra (largura 20px)

          const baseChance = BattleCore.calculateCatchRate(
            wildPokemon.currentHp,
            wildPokemon.maxHp,
            ballCatchRate
          );

          // Verifica primeiro a zona verde (mais interna)
          if (barCenter >= greenStart && barCenter <= greenEnd) {
            // ZONA VERDE - Aumenta probabilidade de captura
            const zoneCenter = greenLeft + greenWidth / 2;
            const distanceFromCenter = Math.abs(barCenter - zoneCenter);
            const maxDistance = greenWidth / 2;
            const precision = 1 - distanceFromCenter / maxDistance; // 0 a 1

            // Bônus de precisão: até 25% extra se clicou no centro exato
            const precisionBonus = precision * 25;
            const finalChance = Math.min(95, baseChance + precisionBonus);

            feedbackElement.textContent = `PERFEITO! Precisão: ${Math.round(
              precision * 100
            )}%!`;
            feedbackElement.style.color = "#22c55e";

            setTimeout(() => {
              resolve({ success: true, chance: finalChance, missed: false });
            }, 1000);
          }
          // Depois verifica a zona amarela (meio, mas não no verde)
          else if (barCenter >= yellowStart && barCenter <= yellowEnd) {
            // ZONA AMARELA - Não aumenta nem diminui (neutral)
            const finalChance = baseChance; // Chance base, sem modificação

            feedbackElement.textContent = "Bom! Mas poderia ser melhor...";
            feedbackElement.style.color = "#facc15";

            setTimeout(() => {
              resolve({ success: true, chance: finalChance, missed: false });
            }, 1000);
          }
          // Por último, zona vermelha (extremos)
          else {
            // ZONA VERMELHA - Errou completamente, perde pokébola e passa turno
            feedbackElement.textContent = "Errou! A pokébola falhou!";
            feedbackElement.style.color = "#ef4444";

            setTimeout(() => {
              resolve({ success: false, chance: 0, missed: true });
            }, 1500);
          }
        };

        container.addEventListener("click", handleClick);

        // Timeout de segurança (se não clicar em 8 segundos, falha)
        setTimeout(() => {
          if (!clicked) {
            gameActive = false;
            clicked = true;
            if (animateBarInterval) clearInterval(animateBarInterval);
            container.style.cursor = "not-allowed";
            container.style.opacity = "0.7";

            const baseChance = BattleCore.calculateCatchRate(
              wildPokemon.currentHp,
              wildPokemon.maxHp,
              ballCatchRate
            );

            feedbackElement.textContent = "Tempo esgotado!";
            feedbackElement.style.color = "#ef4444";

            setTimeout(() => {
              resolve({ success: false, chance: baseChance * 0.3, missed: false });
            }, 1000);
          }
        }, 8000);
      }, 50); // Pequeno delay para garantir renderização
    });
  },

  animateCapture: function (ballName, ballCatchRate) {
    return new Promise(async (resolve) => {
      const wildPokemon = window.gameState.battle.opponent;
      const opponentSpriteElement = document.querySelector(".opponent-sprite");

      // Mostra o minigame primeiro
      const minigameResult = await BattleCore.showCaptureMinigame(
        ballName,
        ballCatchRate
      );

      // NOVO: Se errou no vermelho, não mostra animação de captura
      if (minigameResult.missed) {
        // Retorna informação de que errou
        resolve({ battleEnded: false, missed: true });
        return;
      }

      const ballSpriteUrl = BattleCore._getBallSpriteUrl(ballName);

      // Atualiza sprite para pokebola
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

      // Usa a chance ajustada do minigame
      const finalChance = minigameResult.chance;
      const roll = Math.floor(Math.random() * 100) + 1;
      let isCaptured = roll <= finalChance;

      // Se o minigame foi bem-sucedido, aumenta ainda mais a chance
      if (minigameResult.success) {
        isCaptured = roll <= finalChance;
      }

      let shakes = 0;
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

              // NOVO: Adiciona data de captura e pokébola usada
              wildPokemon.captureDate = new Date().toISOString();
              wildPokemon.captureBall = ballName;

              window.gameState.profile.pokemon.push(wildPokemon);

              // NOVO: Adiciona doce quando Pokémon é capturado
              window.GameLogic.addPokemonCandy(wildPokemon.id, 1);

              // NOVO: Treinador ganha XP ao capturar (baseado no nível do Pokémon)
              const captureExp = Math.floor(wildPokemon.level * 5);
              if (captureExp > 0 && window.Utils.giveTrainerExp) {
                window.Utils.giveTrainerExp(captureExp);
                BattleCore.addBattleLog(
                  `Treinador ganhou ${captureExp} XP pela captura!`
                );
              }

              // // AÇÃO DE CAPTURA BEM-SUCEDIDA
              const foiCapturado = window.gameState.profile.pokedex.has(
                wildPokemon.id
              );
              if (!foiCapturado) {
                window.Utils.registerPokemon(wildPokemon.id);
                window.GameLogic.saveGameData();
              }
              
              // NOVO: Salva automaticamente o save em arquivo após captura
              if (window.GameLogic.autoSaveToFile) {
                window.GameLogic.autoSaveToFile();
              }
              
              // Usa a função de encerramento para sincronizar o log
              BattleCore._endBattleAndSyncLog(finalMsg);

              resolve({ battleEnded: true, missed: false });
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
                resolve({ battleEnded: true, missed: false });
              }, 1500);
            } else {
              // O Pokémon escapou, mas a batalha continua
              resolve({ battleEnded: false, missed: false });
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

    const captureResult = await BattleCore.animateCapture(
      ballName,
      ballCatchRate
    );

    // NOVO: Se errou no vermelho (missed), perde pokébola e passa turno imediatamente
    if (captureResult.missed) {
      BattleCore.addBattleLog("Errou! A pokébola falhou!");
      ballItem.quantity--;
      window.GameLogic.saveGameData();
      BattleCore.updateBattleScreen();
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await BattleCore.playerTurn("opponent_attack");
      
      if (window.gameState.battle && !captureResult.battleEnded) {
        BattleCore.setBattleMenu("main");
      }
      return;
    }

    // Se não errou, subtrai a pokébola normalmente
    ballItem.quantity--;
    window.GameLogic.saveGameData();
    BattleCore.updateBattleScreen();

    if (!captureResult.battleEnded) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await BattleCore.playerTurn("opponent_attack");
    }

    if (window.gameState.battle && !captureResult.battleEnded) {
      BattleCore.setBattleMenu("main");
    }
  },

  playerTurn: async function (action, moveName = null) {
    const battle = window.gameState.battle;
    
    // Previne múltiplos cliques rápidos
    if (battle.isProcessingAction) {
      return;
    }
    
    // Marca que uma ação está sendo processada
    battle.isProcessingAction = true;
    
    try {
      const playerPokemon = window.Utils.getActivePokemon();
      const opponent = battle.opponent;
      let ended = false;
      let finalMessage = "";

      window.Utils.ensureMoveCounters(playerPokemon);
      window.Utils.ensureMoveCounters(opponent);

      // Desabilita os botões imediatamente
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
        battle.didEscape = true;
        finalMessage = `Você fugiu com sucesso!`;
        BattleCore.addBattleLog(finalMessage);
        ended = true;
        BattleCore.updateBattleScreen();
      } else if (action === "move") {
      if (playerPokemon.currentHp <= 0) {
        BattleCore.addBattleLog(
          `${window.Utils.getPokemonDisplayName(
            playerPokemon
          )} desmaiou e não pode atacar!`
        );
        BattleCore.setBattleMenu("main", true);
        return;
      }

      const isSpecialMove = window.Utils.isSpecialMove(playerPokemon, moveName);
      const isNormalMove = !isSpecialMove;

      // NOVO: Verifica PA individual do movimento
      const movePA = window.Utils.getMovePA(playerPokemon, moveName);
      if (movePA.remaining <= 0) {
        const moveType = isSpecialMove ? "energia" : "PA";
        BattleCore.addBattleLog(
          `${window.Utils.getPokemonDisplayName(
            playerPokemon
          )} está sem ${moveType} para ${window.Utils.formatName(moveName)}!`
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
          `${window.Utils.getPokemonDisplayName(
            playerPokemon
          )} não conseguiu usar ${window.Utils.formatName(moveName)}!`
        );
        BattleCore.setBattleMenu("fight", true);
        BattleCore.updateBattleScreen();
        return;
      }

      // Obtém PA atualizado após o uso
      const updatedMovePA = window.Utils.getMovePA(playerPokemon, moveName);

      let logMessage = `${window.Utils.getPokemonDisplayName(
        playerPokemon
      )} usou ${window.Utils.formatName(moveName)}!${effectivenessMessage}`;
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
        const battle = window.gameState.battle;

        // NOVO: Lógica especial para chefe de zona
        if (
          battle.type === "boss" &&
          battle.bossTeam &&
          battle.currentBossIndex !== undefined
        ) {
          // Derrotou o pokémon atual do chefe
          BattleCore.battleWin(playerPokemon, opponent);

          // Verifica se há mais pokémons no time do chefe
          const nextBossIndex = battle.currentBossIndex + 1;
          if (nextBossIndex < battle.bossTeam.length) {
            // Ainda há pokémons, troca para o próximo
            const nextBossPokemon = battle.bossTeam[nextBossIndex];
            nextBossPokemon.currentHp = nextBossPokemon.maxHp; // Restaura HP
            battle.opponent = nextBossPokemon;
            battle.currentBossIndex = nextBossIndex;

            BattleCore.addBattleLog(`${opponent.name} desmaiou!`);
            const remainingCount = battle.bossTeam.length - nextBossIndex;
            BattleCore.addBattleLog(
              `O ${battle.leaderName || "chefe"} enviou ${
                nextBossPokemon.name
              } (Nv. ${nextBossPokemon.level})!`
            );
            BattleCore.addBattleLog(
              `Restam ${remainingCount} pokémon${
                remainingCount > 1 ? "s" : ""
              } do ${battle.leaderName || "chefe"}!`
            );

            // Atualiza a tela para mostrar as pokébolas atualizadas
            BattleCore.updateBattleScreen();

            // Não encerra a batalha, continua
            ended = false;
            finalMessage = null;
          } else {
            // Todos os pokémons do chefe foram derrotados!
            ended = true;
            const profile = window.gameState.profile;
            const zoneBadgeName = battle.zoneBadgeName;

            // Adiciona a insígnia se ainda não tiver
            if (!profile.badges.includes(zoneBadgeName)) {
              profile.badges.push(zoneBadgeName);
              finalMessage = `🎉 VITÓRIA CONTRA O CHEFE DE ${zoneBadgeName.toUpperCase()}! 🎉\nVocê recebeu a Insígnia ${zoneBadgeName}!`;
              BattleCore.addBattleLog(
                `🏅 Você recebeu a Insígnia ${zoneBadgeName}!`
              );
            } else {
              finalMessage = `🎉 VITÓRIA CONTRA O CHEFE DE ${zoneBadgeName.toUpperCase()}! 🎉`;
            }
          }
        } else {
          // Batalha normal (wild)
          BattleCore.battleWin(playerPokemon, opponent);
          ended = true;
          finalMessage = `${opponent.name} desmaiou! Batalha vencida!`;
        }
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

        const opponentMoveName =
          typeof randomOpponentMove === "string"
            ? randomOpponentMove
            : randomOpponentMove.name || randomOpponentMove;

        // NOVO: Usa PA individual do movimento do oponente
        const opponentPAUsed = window.Utils.useMovePA(opponent, opponentMoveName);
        if (!opponentPAUsed) {
          BattleCore.addBattleLog(
            `${opponent.name} não conseguiu usar ${window.Utils.formatName(
              opponentMoveName
            )}!`
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
            const faintedMessage = `${window.Utils.getPokemonDisplayName(
              playerPokemon
            )} desmaiou! Você precisa trocar de Pokémon.`;
            BattleCore.addBattleLog(faintedMessage);
            BattleCore.forceSwitchSelection(faintedMessage);
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
    } finally {
      // Sempre limpa o flag de processamento, mesmo em caso de erro
      if (battle) {
        battle.isProcessingAction = false;
      }
    }
  },

  switchPokemon: async function (newIndex) {
    const battle = window.gameState.battle;
    const currentPokemon = window.Utils.getActivePokemon();

    // NOVO: Verifica se o pokémon está na equipe de batalha
    const battleTeamIndices =
      battle?.battleTeamIndices ||
      (window.gameState.profile.battleTeam &&
      window.gameState.profile.battleTeam.length > 0
        ? window.gameState.profile.battleTeam
        : window.gameState.profile.pokemon.map((_, i) => i).slice(0, 5));

    if (!battleTeamIndices.includes(newIndex)) {
      window.Utils.showModal(
        "infoModal",
        "Este pokémon não está na sua equipe de batalha! Selecione um pokémon da equipe."
      );
      return;
    }

    // NOTA: newPokemon aqui referencia o Pokémon no índice da lista NÃO REORDENADA.
    const newPokemon = window.gameState.profile.pokemon[newIndex];

    if (newIndex === battle.playerPokemonIndex || newPokemon.currentHp <= 0) {
      return;
    }

    const wasForcedSwitch = Boolean(battle.forceSwitchSelection);

    // *** CORREÇÃO: REMOVENDO A MANIPULAÇÃO DO ARRAY ***

    // 1. Ação: Apenas atualiza o índice do Pokémon ativo.
    battle.playerPokemonIndex = newIndex;

    // 2. Registra o novo Pokémon ativo.
    if (battle.type === "wild") {
      battle.participatingIndices.add(newIndex);
    }

    // 2.1 Limpa flags de troca forçada (se existirem)
    battle.forceSwitchSelection = false;
    battle.forceSwitchMessage = null;

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
      if (wasForcedSwitch) {
        BattleCore.setBattleMenu("main", true);
      } else {
        // No PvE, a troca gasta o turno. O oponente ataca em seguida.
        BattleCore.setBattleMenu("disabled", true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await BattleCore.playerTurn("opponent_attack");
      }
    }
  },

  forceSwitchSelection: function (message) {
    const battle = window.gameState.battle;
    if (!battle) {
      return;
    }

    const hasReplacement =
      Array.isArray(window.gameState.profile?.pokemon) &&
      window.gameState.profile.pokemon.some((pokemon) => pokemon.currentHp > 0);

    if (!hasReplacement) {
      return;
    }

    battle.forceSwitchSelection = true;
    battle.forceSwitchMessage =
      message || "Selecione um Pokémon em condições de lutar.";

    window.Renderer.showScreen("switchPokemon");
  },

  _checkActivePokemonOnBattleStart: function () {
    const battle = window.gameState.battle;
    if (!battle) {
      return;
    }
    const activePokemon = window.Utils.getActivePokemon();
    if (!activePokemon || activePokemon.currentHp <= 0) {
      const message = activePokemon
        ? `${activePokemon.name} está desmaiado! Escolha outro Pokémon para iniciar a batalha.`
        : "Escolha um Pokémon em condições de lutar para iniciar a batalha.";
      BattleCore.forceSwitchSelection(message);
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

    const getHpColor = (percent) => {
      if (percent > 50) return "#22c55e";
      if (percent > 20) return "#facc15";
      return "#ef4444";
    };

    const renderTypes = (types) =>
      (types || [])
        .map((type) => {
          const lower = String(type).toLowerCase();
          const colors = TYPE_BADGE_COLORS[lower] || TYPE_BADGE_COLORS.default;
          return `<span class="battle-type-badge" style="background:${
            colors.bg
          }; color:${colors.text}; border-color:${colors.border};">${String(
            type
          ).toUpperCase()}</span>`;
        })
        .join("");

    // NOVO: Mostra apenas a última mensagem (substitui a anterior)
    const lastMessage =
      battle.lastMessage ||
      (battle.log && battle.log.length > 0
        ? battle.log[battle.log.length - 1]
        : null);
    const displayMessage = lastMessage || "A batalha começou!";
    const logHtml = `<span class="battle-log-line">${displayMessage}</span>`;

    const isMainMenu = battle.currentMenu === "main";
    const isDisabled = battle.currentMenu === "disabled";
    const isFightMenu = battle.currentMenu === "fight";
    const isItemMenu = battle.currentMenu === "item";
    const disableInteractions = isDisabled;

    const battleItems = (window.gameState.profile.items || []).filter(
      (i) =>
        (i.catchRate && battle.type === "wild") || i.healAmount || i.ppRestore
    );

    const escapeMove = (move) =>
      move.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    const fightButtonHtml = `
      <button onclick="BattleCore.setBattleMenu('fight')" class="gba-button battle-action-btn bg-red-500 hover:bg-red-600 ${
        isFightMenu ? "active" : ""
      }" ${disableInteractions ? "disabled" : ""}>
        <i class="fa-solid fa-bolt"></i> Lutar
      </button>
    `;
    const itemButtonColor = battleItems.length
      ? "bg-yellow-500 hover:bg-yellow-600"
      : "bg-gray-300 text-gray-700";
    const itemButtonHtml = `
      <button onclick="BattleCore.setBattleMenu('item')" class="gba-button battle-action-btn ${itemButtonColor} ${
      isItemMenu ? "active" : ""
    }" ${disableInteractions ? "disabled" : ""}>
        <i class="fa-solid fa-suitcase-medical"></i> Item
      </button>
    `;
    const pokemonButtonHtml = `
      <button onclick="window.Renderer.showScreen('switchPokemon')" class="gba-button battle-action-btn bg-blue-500 hover:bg-blue-600" ${
        disableInteractions ? "disabled" : ""
      }>
        <i class="fa-solid fa-dragon"></i> Pokémon
      </button>
    `;
    // NOVO: Desabilita o botão de fugir se estiver em cooldown (3 segundos no início da batalha)
    const runButtonInCooldown = battle.runButtonCooldown === true;
    const runDisabled =
      battle.type === "pvp" || disableInteractions || battle.isProcessingAction || runButtonInCooldown ? "disabled" : "";
    const runButtonHtml = `
      <button onclick="const btn=this; btn.disabled=true; BattleCore.playerTurn('run')" class="gba-button battle-action-btn bg-green-500 hover:bg-green-600" ${runDisabled}>
        <i class="fa-solid fa-running"></i> Fugir
      </button>
    `;
    const mainActionsHtml = `
      <div class="battle-main-actions">
        ${fightButtonHtml}
        ${itemButtonHtml}
        ${pokemonButtonHtml}
        ${runButtonHtml}
      </div>
    `;

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
        secondaryHtml = `<div class="battle-secondary battle-secondary-message">Sem itens utilizáveis no momento.</div>`;
      } else {
        const itemsHtml = battleItems
          .map((item) => {
            const disabled = item.quantity <= 0;
            const typeClass = item.catchRate
              ? "bg-red-500 hover:bg-red-600"
              : item.ppRestore
              ? "bg-purple-500 hover:bg-purple-600"
              : "bg-green-500 hover:bg-green-600";
            return `<button onclick="BattleCore.playerTurn('item', '${
              item.name
            }')" class="gba-button battle-move-btn ${typeClass}${
              disabled ? " battle-move-disabled" : ""
            }" ${disabled ? "disabled" : ""}>
                <span>${item.name}</span>
                <span class="battle-move-meta">x${item.quantity}</span>
              </button>`;
          })
          .join("");
        secondaryHtml = `<div class="battle-secondary battle-secondary--items">${itemsHtml}</div>`;
      }
    } else if (isDisabled) {
      secondaryHtml = `<div class="battle-secondary battle-secondary-message">Aguarde a ação do oponente...</div>`;
    }

    const opponentTypes = renderTypes(opponent.types);
    const playerTypes = renderTypes(playerPokemon.types);

    // NOVO: Verifica se o oponente já foi capturado
    const pokedex = window.gameState?.profile?.pokedex;
    const isOpponentCaught =
      pokedex &&
      (pokedex instanceof Set
        ? pokedex.has(opponent.id)
        : pokedex.includes(opponent.id));
    const caughtIcon = isOpponentCaught
      ? '<img src="../assets/sprites/items/poke-ball.png" alt="Capturado" class="inline-block w-4 h-4 ml-1" title="Já capturado" style="image-rendering: pixelated;">'
      : "";

    let scrollContent = "";
    let backButtonHtml = "";
    if (isDisabled) {
      scrollContent =
        secondaryHtml ||
        `<div class="battle-secondary battle-secondary-message">Aguarde a ação do oponente...</div>`;
    } else if (isMainMenu) {
      scrollContent = mainActionsHtml;
    } else {
      scrollContent = secondaryHtml || "";
      backButtonHtml = `
        <button onclick="BattleCore.setBattleMenu('main')" class="gba-button bg-gray-500 hover:bg-gray-600 w-full">
          Voltar
        </button>
      `;
    }

    const menuSections = `
      <div class="battle-menu-body">
        <div class="battle-scroll-area">
          ${scrollContent}
        </div>
        ${backButtonHtml}
      </div>
    `;

    // NOVO: Indicador de pokébolas para batalha de chefe
    let bossIndicatorHtml = "";
    if (
      battle.type === "boss" &&
      battle.bossTeam &&
      battle.currentBossIndex !== undefined
    ) {
      const totalBossPokemon = battle.bossTeam.length;
      const defeatedCount = battle.currentBossIndex;
      const remainingCount = totalBossPokemon - defeatedCount;

      const pokeballsHtml = battle.bossTeam
        .map((_, index) => {
          const isDefeated = index < battle.currentBossIndex;
          const isCurrent = index === battle.currentBossIndex;
          const opacity = isDefeated ? "0.3" : isCurrent ? "1" : "0.7";
          const scale = isCurrent ? "1.2" : "1";
          return `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                     alt="Pokébola" 
                     class="boss-pokeball-indicator" 
                     style="width: 20px; height: 20px; opacity: ${opacity}; transform: scale(${scale}); image-rendering: pixelated; transition: all 0.3s;" 
                     title="${
                       isDefeated
                         ? "Derrotado"
                         : isCurrent
                         ? "Em batalha"
                         : "Aguardando"
                     }">`;
        })
        .join("");

      bossIndicatorHtml = `
        <div class="boss-battle-header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border: 3px solid #7f1d1d; border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="flex: 1;">
              <div class="gba-font" style="font-size: 0.5rem; color: #fbbf24; text-shadow: 2px 2px 0px #000; line-height: 1.2;">
                🏆 ${battle.leaderName || "LÍDER DE ZONA"}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.3); padding: 3px 6px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.2);">
              ${pokeballsHtml}
              <span class="gba-font" style="font-size: 0.55rem; color: #fbbf24; margin-left: 3px;">${remainingCount}/${totalBossPokemon}</span>
            </div>
          </div>
        </div>
      `;
    }

    battleArea.innerHTML = `
      <div class="battle-wrapper">
        ${bossIndicatorHtml}
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
                <img src="${opponent.sprite}" alt="${
      opponent.name
    }" class="battle-sprite opponent-sprite opponent">
                <div class="battle-platform"></div>
              </div>
            </div>
          </div>

          <div class="battle-entity player">
            <div class="battle-row battle-row-player">
              <div class="battle-sprite-wrap">
                <img src="${playerBackSprite}" alt="${window.Utils.getPokemonDisplayName(
      playerPokemon
    )}" class="battle-sprite player-sprite player">
                <div class="battle-platform"></div>
              </div>
              <div class="battle-card">
                <div class="battle-name-row gba-font">
                  <span>${window.Utils.getPokemonDisplayName(
                    playerPokemon
                  )}</span>
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
                    <span>${playerPokemon.currentHp}/${
      playerPokemon.maxHp
    }</span>
                  </div>
                </div>
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
