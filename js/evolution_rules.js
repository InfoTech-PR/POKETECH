// js/evolution_rules.js
// Regras globais e resolvedor para evoluções ramificadas.

window.BRANCHED_RULES = {
  236: { // Tyrogue
    trigger: "level",
    minLevel: 20,
    choose: ({ stats }) => {
      const { attack: atk, defense: def } = stats;
      if (atk > def) return 106;          // Hitmonlee
      if (atk < def) return 107;          // Hitmonchan
      return 237;                         // Hitmontop
    }
  },
  265: { // Wurmple
    trigger: "level",
    minLevel: 7,
    choose: ({ seed }) => (seed % 2 === 0 ? 266 : 268) // Silcoon/Cascoon
  },
  44:  { trigger: "item", choices: { "leaf-stone": 45, "sun-stone": 182 } }, // Gloom
  61:  { trigger: "itemOrTrade", choices: { "water-stone": 62, "kings-rock": 186 } }, // Poliwhirl
  79:  { trigger: "itemOrLevel", choose: ({ item, level }) => item === "kings-rock" ? 199 : (level >= 37 ? 80 : null) }, // Slowpoke
  281: { trigger: "itemOrLevelGender", choose: ({ item, gender }) => (item === "dawn-stone" && gender === "male") ? 475 : 282 }, // Kirlia
  361: { trigger: "itemOrLevelGender", choose: ({ item, gender, level }) => (item === "dawn-stone" && gender === "female") ? 478 : (level >= 42 ? 362 : null) }, // Snorunt
  366: { trigger: "item", choices: { "deep-sea-tooth": 367, "deep-sea-scale": 368 } }, // Clamperl
  123: { trigger: "itemOrTrade", choices: { "metal-coat": 212, "black-augurite": 900 } }, // Scyther
  840: { trigger: "item", choices: { "tart-apple": 841, "sweet-apple": 842, "syrupy-apple": 1011 } }, // Applin
  935: { trigger: "item", choices: { "auspicious-armor": 936, "malicious-armor": 937 } }, // Charcadet
};

// Helper global para reuso no GameLogic.
window.GameLogic = window.GameLogic || {};
window.GameLogic.resolveBranchedEvolution = function(current, ctx) {
  const rule = window.BRANCHED_RULES[current.id];
  if (!rule) return null;
  if (rule.choices && ctx.item) return rule.choices[ctx.item] || null;
  if (rule.choose) return rule.choose(ctx) || null;
  return null;
};
