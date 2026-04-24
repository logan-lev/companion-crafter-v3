import { useState } from 'react';
import type { WizardState } from '../../types/wizard';
import type { AbilityKey } from '../../types/character';
import { ABILITY_NAMES, calcMod, modStr } from '../../data/srd';
import { RACE_DATA } from '../../data/srd-races';
import { SKILLS } from '../../data/srd';
import { profBonusFromLevel } from '../../data/srd';
import { BACKGROUND_DATA } from '../../data/srd-backgrounds';
import { CLASS_DATA } from '../../data/srd-classes';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

// Point buy costs
const POINT_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUY_BUDGET = 27;
const DEFAULT_SCORES: Record<AbilityKey, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

function roll4d6drop1(): number {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  dice.sort((a, b) => a - b);
  return dice.slice(1).reduce((a, b) => a + b, 0);
}

function getRacialBonus(state: WizardState): Partial<Record<AbilityKey, number>> {
  const race = RACE_DATA.find(r => r.name === state.race);
  if (!race) return {};

  const bonus: Partial<Record<AbilityKey, number>> = { ...race.abilityBonus };

  if (state.subrace) {
    const sub = race.subraces?.find(s => s.name === state.subrace);
    if (sub) {
      for (const [k, v] of Object.entries(sub.abilityBonus)) {
        const key = k as AbilityKey;
        bonus[key] = (bonus[key] ?? 0) + (v ?? 0);
      }
    }
  }

  if (state.race === 'Half-Elf') {
    for (const [k, v] of Object.entries(state.halfElfBonuses)) {
      const key = k as AbilityKey;
      bonus[key] = (bonus[key] ?? 0) + (v ?? 0);
    }
  }

  return bonus;
}

function getFinalScores(state: WizardState): Record<AbilityKey, number> {
  const bonus = getRacialBonus(state);
  const result = {} as Record<AbilityKey, number>;
  for (const k of ABILITY_KEYS) {
    result[k] = (state.baseScores[k] ?? 8) + (bonus[k] ?? 0);
  }
  return result;
}

function clampClassBonuses(
  state: WizardState,
  nextBaseScores: Record<AbilityKey, number>
): Partial<Record<AbilityKey, number>> {
  const racialBonus = getRacialBonus(state);
  let remainingAsi = Object.values(state.classAbilityBonuses).reduce((sum, value) => sum + (value ?? 0), 0);
  const nextBonuses: Partial<Record<AbilityKey, number>> = {};

  for (const key of ABILITY_KEYS) {
    const current = state.classAbilityBonuses[key] ?? 0;
    const maxAllowed = Math.max(0, 20 - ((nextBaseScores[key] ?? 8) + (racialBonus[key] ?? 0)));
    const allowed = Math.min(current, maxAllowed, remainingAsi);
    if (allowed > 0) {
      nextBonuses[key] = allowed;
      remainingAsi -= allowed;
    }
  }

  return nextBonuses;
}

function pointsSpent(scores: Record<AbilityKey, number>): number {
  return ABILITY_KEYS.reduce((sum, k) => sum + (POINT_COST[scores[k]] ?? 0), 0);
}

function getAbilityPriority(state: WizardState): AbilityKey[] {
  const cls = CLASS_DATA.find(item => item.name === state.className);
  const byClass: Record<string, AbilityKey[]> = {
    Barbarian: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    Bard: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    Cleric: ['wis', 'con', 'str', 'dex', 'cha', 'int'],
    Druid: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
    Fighter: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    Monk: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    Paladin: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
    Ranger: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    Rogue: ['dex', 'con', 'int', 'wis', 'cha', 'str'],
    Sorcerer: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    Warlock: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    Wizard: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
  };

  const baseOrder = cls ? (byClass[cls.name] ?? ABILITY_KEYS) : ABILITY_KEYS;
  const racialBonus = getRacialBonus(state);

  return [...baseOrder].sort((a, b) => {
    const aScore = (baseOrder.length - baseOrder.indexOf(a)) * 10 + (racialBonus[a] ?? 0);
    const bScore = (baseOrder.length - baseOrder.indexOf(b)) * 10 + (racialBonus[b] ?? 0);
    return bScore - aScore;
  });
}

function getPointBuyTemplate(state: WizardState): number[] {
  const dualStatClasses = new Set(['Barbarian', 'Monk', 'Paladin', 'Ranger']);
  return dualStatClasses.has(state.className) ? [15, 15, 14, 10, 8, 8] : [15, 14, 14, 10, 10, 8];
}

export default function AbilityScoreStep({ state, onChange }: Props) {
  const [selectedStandardIndex, setSelectedStandardIndex] = useState<number | null>(null);
  const [selectedRollIndex, setSelectedRollIndex] = useState<number | null>(null);
  const racialBonus = getRacialBonus(state);
  const finalScores = getFinalScores(state);
  const profBonus = profBonusFromLevel(state.level);
  const bg = BACKGROUND_DATA.find(b => b.name === state.background);

  const allSkillProfs = [
    ...(state.classSkillChoices || []),
    ...(state.backgroundSkillChoices || []),
    ...(bg?.skillProfs || []),
  ];
  const rolls = state.rolledScores ?? [];
  const assignedRolls = state.assignedRolls;
  const standardAssignments = state.standardAssignments;

  // Point buy helpers
  const setBase = (key: AbilityKey, val: number) => {
    if (val < 8 || val > 15) return;
    const trial = { ...state.baseScores, [key]: val };
    if (pointsSpent(trial) <= POINT_BUY_BUDGET) {
      onChange({ baseScores: trial, classAbilityBonuses: clampClassBonuses(state, trial) });
    }
  };

  const rerollAll = () => {
    const newRolls = Array.from({ length: 6 }, roll4d6drop1);
    setSelectedRollIndex(null);
    setSelectedStandardIndex(null);
    onChange({
      rolledScores: newRolls,
      assignedRolls: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      baseScores: { ...DEFAULT_SCORES },
      classAbilityBonuses: clampClassBonuses(state, { ...DEFAULT_SCORES }),
    });
  };

  const resetAssignments = () => {
    setSelectedRollIndex(null);
    setSelectedStandardIndex(null);
    onChange({
      assignedRolls: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      baseScores: { ...DEFAULT_SCORES },
      classAbilityBonuses: clampClassBonuses(state, { ...DEFAULT_SCORES }),
    });
  };

  const assignRoll = (key: AbilityKey, rollIndex: number) => {
    const clearedAssignments = Object.fromEntries(
      Object.entries(assignedRolls).map(([ability, index]) => [ability, index === rollIndex ? null : index])
    ) as Record<AbilityKey, number | null>;
    const newAssigned = { ...clearedAssignments, [key]: rollIndex };
    const nextBaseScores = { ...state.baseScores, [key]: rolls[rollIndex] ?? 8 };
    onChange({
      assignedRolls: newAssigned,
      baseScores: nextBaseScores,
      classAbilityBonuses: clampClassBonuses(state, nextBaseScores),
    });
    setSelectedRollIndex(null);
  };

  const assignStandard = (key: AbilityKey, tokenIndex: number) => {
    const clearedAssignments = Object.fromEntries(
      Object.entries(standardAssignments).map(([ability, index]) => [ability, index === tokenIndex ? null : index])
    ) as Record<AbilityKey, number | null>;
    const newAssign = { ...clearedAssignments, [key]: tokenIndex };
    const nextBaseScores = { ...state.baseScores, [key]: STANDARD_ARRAY[tokenIndex] ?? 8 };
    onChange({
      standardAssignments: newAssign,
      baseScores: nextBaseScores,
      classAbilityBonuses: clampClassBonuses(state, nextBaseScores),
    });
    setSelectedStandardIndex(null);
  };

  const autoAssignScores = () => {
    const priority = getAbilityPriority(state);

    if (state.abilityMethod === 'pointbuy') {
      const template = getPointBuyTemplate(state);
      const nextScores = { ...DEFAULT_SCORES };
      priority.forEach((ability, index) => {
        nextScores[ability] = template[index] ?? 8;
      });
      onChange({ baseScores: nextScores, classAbilityBonuses: clampClassBonuses(state, nextScores) });
      return;
    }

    if (state.abilityMethod === 'standard') {
      const nextAssignments = { str: null, dex: null, con: null, int: null, wis: null, cha: null } as Record<AbilityKey, number | null>;
      const nextScores = { ...DEFAULT_SCORES };
      priority.forEach((ability, index) => {
        nextAssignments[ability] = index;
        nextScores[ability] = STANDARD_ARRAY[index] ?? 8;
      });
      onChange({
        standardAssignments: nextAssignments,
        assignedRolls: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        baseScores: nextScores,
        classAbilityBonuses: clampClassBonuses(state, nextScores),
      });
      setSelectedStandardIndex(null);
      setSelectedRollIndex(null);
      return;
    }

    const workingRolls = rolls.length === 6 ? [...rolls] : Array.from({ length: 6 }, roll4d6drop1);
    const sorted = workingRolls
      .map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value);
    const nextAssignments = { str: null, dex: null, con: null, int: null, wis: null, cha: null } as Record<AbilityKey, number | null>;
    const nextScores = { ...DEFAULT_SCORES };
    priority.forEach((ability, index) => {
      nextAssignments[ability] = sorted[index]?.index ?? null;
      nextScores[ability] = sorted[index]?.value ?? 8;
    });
    onChange({
      rolledScores: workingRolls,
      assignedRolls: nextAssignments,
      standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      baseScores: nextScores,
      classAbilityBonuses: clampClassBonuses(state, nextScores),
    });
    setSelectedStandardIndex(null);
    setSelectedRollIndex(null);
  };

  const usedStandard = Object.values(standardAssignments).filter(v => v !== null) as number[];
  // Unassigned rolls
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Set Ability Scores</h2>
        <p className="text-[#7a6020] text-xs">Choose how to generate your ability scores. Racial bonuses are applied automatically.</p>
      </div>

      {/* Method tabs */}
      <div className="flex gap-0">
        {(['standard', 'pointbuy', 'roll'] as const).map(m => (
          <button key={m} onClick={() => {
            setSelectedStandardIndex(null);
            setSelectedRollIndex(null);
            onChange({
              abilityMethod: m,
              baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
              rolledScores: [],
              assignedRolls: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
              standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
              classAbilityBonuses: clampClassBonuses(state, { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }),
            });
          }}
            className={`tab-btn ${state.abilityMethod === m ? 'active' : ''}`}>
            {m === 'standard' ? 'Standard Array' : m === 'pointbuy' ? 'Point Buy' : 'Roll (4d6)'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        {/* Score assignment */}
        <div className="section-box">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button onClick={autoAssignScores} className="save-btn text-xs px-3 py-1">
              Auto Assign Best Fit
            </button>
            <button onClick={resetAssignments} className="tab-btn text-[0.65rem] py-1 px-3">
              Reset
            </button>
          </div>

          {state.abilityMethod === 'standard' && (
            <div className="mb-3">
              <div className="section-title">Assign Standard Array [15, 14, 13, 12, 10, 8]</div>
              <p className="text-[#7a6020] text-[0.65rem] mb-2">Click a value, then click an ability score row to assign it. Click an assigned value to free it up.</p>
              <div className="flex gap-2 mb-3">
                {STANDARD_ARRAY.map((v, i) => {
                      const alreadyUsed = usedStandard.includes(i);
                      const isSelected = selectedStandardIndex === i;
                      return (
                        <button key={i}
                          onClick={() => {
                            const assignedAbility = ABILITY_KEYS.find(ability => standardAssignments[ability] === i);
                            if (assignedAbility) {
                              onChange({
                                standardAssignments: { ...standardAssignments, [assignedAbility]: null },
                                baseScores: { ...state.baseScores, [assignedAbility]: 8 },
                              });
                              setSelectedStandardIndex(null);
                              return;
                            }
                            setSelectedStandardIndex(current => current === i ? null : i);
                          }}
                          className={`px-3 py-1 border rounded text-sm font-bold transition-all ${
                            alreadyUsed
                              ? 'border-[#5e4c1c] bg-[#1b1404] text-[#f0d080]'
                              : isSelected
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                          }`}
                        >{v}</button>
                  );
                })}
              </div>
            </div>
          )}

          {state.abilityMethod === 'pointbuy' && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="section-title">Point Buy</div>
                <span className={`text-xs font-bold ${pointsSpent(state.baseScores) > POINT_BUY_BUDGET ? 'text-red-400' : 'text-green-400'}`}>
                  {POINT_BUY_BUDGET - pointsSpent(state.baseScores)} pts remaining
                </span>
              </div>
            </div>
          )}

          {state.abilityMethod === 'roll' && (
            <div className="mb-3">
              <div className="section-title">Roll 4d6, Drop Lowest</div>
              <button onClick={rerollAll} className="save-btn text-xs px-3 py-1 mb-2">
                {rolls.length ? 'Re-Roll All' : 'Roll Dice!'}
              </button>
              {rolls.length > 0 && (
                <>
                  <div className="flex gap-2 mb-2">
                    {rolls.map((r, i) => {
                      const alreadyUsed = Object.values(assignedRolls).includes(i);
                      const isSelected = selectedRollIndex === i;
                      return (
                        <button key={i}
                          onClick={() => {
                            const assignedAbility = ABILITY_KEYS.find(ability => assignedRolls[ability] === i);
                            if (assignedAbility) {
                              onChange({
                                assignedRolls: { ...assignedRolls, [assignedAbility]: null },
                                baseScores: { ...state.baseScores, [assignedAbility]: 8 },
                              });
                              setSelectedRollIndex(null);
                              return;
                            }
                            setSelectedRollIndex(current => current === i ? null : i);
                          }}
                          className={`px-2 py-1 border rounded text-sm font-bold transition-all ${
                            alreadyUsed
                              ? 'border-[#5e4c1c] bg-[#1b1404] text-[#f0d080]'
                              : isSelected
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                          }`}
                        >{r}</button>
                      );
                    })}
                  </div>
                  <div className="text-[0.65rem] text-[#7a6020]">
                    Total: {rolls.reduce((a, b) => a + b, 0)} · Avg: {(rolls.reduce((a, b) => a + b, 0) / 6).toFixed(1)}
                  </div>
                  <button onClick={resetAssignments} className="tab-btn text-[0.65rem] py-1 px-3 mt-2">
                    Clear Assignments
                  </button>
                </>
              )}
            </div>
          )}

          {/* Ability score rows */}
          <div className="flex flex-col gap-2">
            {ABILITY_KEYS.map(key => {
              const base = state.baseScores[key];
              const bonus = racialBonus[key] ?? 0;
              const final = base + bonus;
              const assignedStandardValue = standardAssignments[key] !== null ? STANDARD_ARRAY[standardAssignments[key]!] : null;
              const assignedRollValue = assignedRolls[key] !== null ? rolls[assignedRolls[key]!] ?? null : null;
              const assignedValue = state.abilityMethod === 'standard' ? assignedStandardValue : assignedRollValue;

              return (
                <div
                  key={key}
                  onClick={() => {
                    if (state.abilityMethod === 'standard' && selectedStandardIndex !== null) {
                      assignStandard(key, selectedStandardIndex);
                    }
                    if (state.abilityMethod === 'roll' && selectedRollIndex !== null) {
                      assignRoll(key, selectedRollIndex);
                    }
                  }}
                  className={`flex items-center gap-3 rounded border px-3 py-2 text-left transition-all ${
                    (state.abilityMethod === 'standard' && selectedStandardIndex !== null) || (state.abilityMethod === 'roll' && selectedRollIndex !== null)
                      ? 'border-[#b8962e] hover:bg-[#120f08]'
                      : 'border-[#2a1f00]'
                  }`}
                >
                  <div className="w-24 text-[#b8962e] text-xs font-bold">{ABILITY_NAMES[key]}</div>

                  {state.abilityMethod === 'pointbuy' && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setBase(key, base - 1)} className="text-[#b8962e] w-5 h-5 border border-[#b8962e] rounded text-xs hover:bg-[#1a1000]">−</button>
                      <span className="w-6 text-center text-[#f0d080] font-bold">{base}</span>
                      <button onClick={() => setBase(key, base + 1)} className="text-[#b8962e] w-5 h-5 border border-[#b8962e] rounded text-xs hover:bg-[#1a1000]">+</button>
                      <span className="text-[#7a6020] text-[0.6rem] w-12">({POINT_COST[base] ?? '?'} pts)</span>
                    </div>
                  )}

                  {(state.abilityMethod === 'standard' || state.abilityMethod === 'roll') && (
                    <div className={`w-16 h-10 border rounded text-base font-bold flex items-center justify-center ${
                      assignedValue !== null ? 'border-[#b8962e] text-[#f0d080]' : 'border-[#2a1f00] text-[#7a6020]'
                    }`}>
                      {assignedValue ?? '—'}
                    </div>
                  )}

                  {bonus !== 0 && (
                    <span className={`text-[0.65rem] font-bold ${bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {bonus > 0 ? '+' : ''}{bonus}
                    </span>
                  )}

                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-[#f0d080] font-bold w-10 text-center text-xl">{final}</span>
                    <div className="modifier-badge text-sm">{modStr(final)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex flex-col gap-3">
          {/* Derived stats */}
          <div className="section-box">
            <div className="section-title">Derived Statistics</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="stat-box">
                <div className="font-bold">{10 + calcMod(finalScores.dex)}</div>
                <div className="field-label">Base AC</div>
              </div>
              <div className="stat-box">
                <div className="font-bold">{modStr(finalScores.dex)}</div>
                <div className="field-label">Initiative</div>
              </div>
              <div className="stat-box">
                <div className="font-bold">+{profBonus}</div>
                <div className="field-label">Prof Bonus</div>
              </div>
              <div className="stat-box">
                <div className="font-bold">{10 + calcMod(finalScores.wis) + (allSkillProfs.includes('Perception') ? profBonus : 0)}</div>
                <div className="field-label">Passive Perc</div>
              </div>
            </div>
          </div>

          {/* Skill preview */}
          <div className="section-box max-h-56 overflow-y-auto">
            <div className="section-title">Skill Modifiers</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {SKILLS.map(({ name, ability }) => {
                const mod = calcMod(finalScores[ability]);
                const prof = allSkillProfs.includes(name);
                const total = mod + (prof ? profBonus : 0);
                return (
                  <div key={name} className="flex items-center gap-1">
                    <span className={`circle-check ${prof ? 'checked' : ''} w-2 h-2`} style={{ width: '0.5rem', height: '0.5rem' }} />
                    <span className="text-[0.6rem] text-[#c8a84b] flex-1">{name}</span>
                    <span className={`text-[0.65rem] font-bold ${prof ? 'text-[#f0d080]' : 'text-[#7a6020]'}`}>
                      {total >= 0 ? '+' : ''}{total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Racial bonus reminder */}
          {Object.keys(racialBonus).length > 0 && (
            <div className="section-box">
              <div className="section-title">Racial Bonuses Applied</div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(racialBonus).map(([k, v]) => (
                  <span key={k} className="text-[0.65rem] bg-[#0a1a00] border border-green-800 px-2 py-0.5 rounded text-green-400">
                    +{v} {ABILITY_NAMES[k as AbilityKey].slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
