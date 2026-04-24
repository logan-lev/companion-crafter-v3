import type { WizardState } from '../../types/wizard';
import type { AbilityKey } from '../../types/character';
import { ABILITY_NAMES, calcMod, modStr, profBonusFromLevel, SKILLS } from '../../data/srd';
import { RACE_DATA } from '../../data/srd-races';
import { CLASS_DATA, getFeaturesUpToLevel } from '../../data/srd-classes';
import { BACKGROUND_DATA } from '../../data/srd-backgrounds';

interface Props {
  state: WizardState;
  onFinish: () => void;
}

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function getFinalScores(state: WizardState): Record<AbilityKey, number> {
  const race = RACE_DATA.find(r => r.name === state.race);
  const bonus: Partial<Record<AbilityKey, number>> = { ...race?.abilityBonus };
  if (state.subrace && race?.subraces) {
    const sub = race.subraces.find(s => s.name === state.subrace);
    if (sub) ABILITY_KEYS.forEach(k => { bonus[k] = (bonus[k] ?? 0) + (sub.abilityBonus[k] ?? 0); });
  }
  if (state.race === 'Half-Elf') {
    ABILITY_KEYS.forEach(k => { bonus[k] = (bonus[k] ?? 0) + (state.halfElfBonuses[k] ?? 0); });
  }
  const result = {} as Record<AbilityKey, number>;
  ABILITY_KEYS.forEach(k => { result[k] = (state.baseScores[k] ?? 8) + (bonus[k] ?? 0); });
  return result;
}

export default function ReviewStep({ state, onFinish }: Props) {
  const finalScores = getFinalScores(state);
  const profBonus = profBonusFromLevel(state.level);
  const cls = CLASS_DATA.find(c => c.name === state.className);
  const bg = BACKGROUND_DATA.find(b => b.name === state.background);

  const allSkillProfs = [
    ...(state.classSkillChoices || []),
    ...(bg?.skillProfs || []),
  ];

  const features = cls ? getFeaturesUpToLevel(cls.name, state.level) : [];

  const isValid = state.name && state.race && state.className && state.background;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Character Summary</h2>
        <p className="text-[#7a6020] text-xs">Review your choices before creating your character.</p>
      </div>

      <div className="section-box">
        <div className="text-sm leading-6 text-[#c8a84b]">
          This page is read-only. If you want to change your build, go back to an earlier step and then return here to confirm.
        </div>
      </div>

      {!isValid && (
        <div className="border border-red-700 bg-[#1a0000] rounded p-3 text-red-400 text-sm">
          ⚠ Missing required fields: {[
            !state.name && 'Character Name',
            !state.race && 'Race',
            !state.className && 'Class',
            !state.background && 'Background',
          ].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Header card */}
      <div className="section-box border-2 border-[#b8962e]">
        <div className="text-center">
          <div className="text-3xl font-bold text-[#f0d080]">{state.name || '—'}</div>
          <div className="text-[#b8962e] text-sm mt-1">
            {[
              state.subrace || state.race,
              state.className && `${state.className} ${state.level}`,
              state.background,
              state.alignment,
            ].filter(Boolean).join(' · ')}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 mt-4">
          {ABILITY_KEYS.map(key => (
            <div key={key} className="stat-box">
              <div className="text-[#b8962e] text-[0.55rem] font-bold uppercase">{ABILITY_NAMES[key].slice(0, 3)}</div>
              <div className="text-[#f0d080] text-xl font-bold">{finalScores[key]}</div>
              <div className="modifier-badge text-xs">{modStr(finalScores[key])}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="stat-box">
            <div className="font-bold">{10 + calcMod(finalScores.dex)}</div>
            <div className="field-label">Base AC</div>
          </div>
          <div className="stat-box">
            <div className="font-bold">+{profBonus}</div>
            <div className="field-label">Prof Bonus</div>
          </div>
          <div className="stat-box">
            <div className="font-bold">d{cls?.hitDie ?? 8}</div>
            <div className="field-label">Hit Die</div>
          </div>
          <div className="stat-box">
            <div className="font-bold">{modStr(finalScores.dex)}</div>
            <div className="field-label">Initiative</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Skills */}
        <div className="section-box">
          <div className="section-title">Skill Proficiencies</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {SKILLS.map(({ name, ability }) => {
              const mod = calcMod(finalScores[ability]);
              const prof = allSkillProfs.includes(name);
              const total = mod + (prof ? profBonus : 0);
              return (
                <div key={name} className="flex items-center gap-1">
                  <span className={`circle-check ${prof ? 'checked' : ''}`} style={{ width: '0.6rem', height: '0.6rem' }} />
                  <span className={`text-[0.6rem] flex-1 ${prof ? 'text-[#f0d080]' : 'text-[#7a6020]'}`}>{name}</span>
                  <span className={`text-[0.65rem] font-bold ${prof ? 'text-[#f0d080]' : 'text-[#7a6020]'}`}>
                    {total >= 0 ? '+' : ''}{total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="section-box max-h-64 overflow-y-auto">
          <div className="section-title">Class Features (Level 1–{state.level})</div>
          <div className="flex flex-col gap-1.5">
            {features.map((f, i) => (
              <div key={i} className="border-l-2 border-[#b8962e] pl-2">
                <div className="flex items-center gap-1">
                  <span className="text-[0.5rem] text-[#7a6020] border border-[#2a1f00] px-0.5 rounded">Lv{f.level}</span>
                  <span className="text-[#f0d080] text-[0.65rem] font-bold">{f.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spells */}
        {(state.selectedCantrips.length > 0 || state.selectedSpells.length > 0) && (
          <div className="section-box">
            <div className="section-title">Spells</div>
            {state.selectedCantrips.length > 0 && (
              <div className="mb-2">
                <div className="field-label mb-1">Cantrips</div>
                <div className="flex flex-wrap gap-1">
                  {state.selectedCantrips.map(s => (
                    <span key={s} className="text-[0.65rem] bg-[#0a0014] border border-purple-800 px-2 py-0.5 rounded text-purple-300">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {state.selectedSpells.length > 0 && (
              <div>
                <div className="field-label mb-1">Known/Prepared Spells</div>
                <div className="flex flex-wrap gap-1">
                  {state.selectedSpells.map(s => (
                    <span key={s} className="text-[0.65rem] bg-[#0a0014] border border-indigo-800 px-2 py-0.5 rounded text-indigo-300">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Background */}
        {bg && (
          <div className="section-box">
            <div className="section-title">Background: {bg.name}</div>
            <div className="text-[0.65rem] text-[#9a8040] mb-1">{bg.flavorText.slice(0, 120)}...</div>
            <div className="text-[#b8962e] text-xs font-bold">{bg.feature.name}</div>
            <div className="text-[#7a6020] text-[0.6rem]">{bg.feature.description.slice(0, 100)}...</div>
          </div>
        )}
      </div>

      {/* Personality */}
      {(state.personalityTraits || state.ideals || state.backstory) && (
        <div className="section-box">
          <div className="section-title">Personality & Backstory</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#9a8040]">
            {state.personalityTraits && <div><span className="text-[#b8962e] font-bold">Traits: </span>{state.personalityTraits}</div>}
            {state.ideals && <div><span className="text-[#b8962e] font-bold">Ideals: </span>{state.ideals}</div>}
            {state.bonds && <div><span className="text-[#b8962e] font-bold">Bonds: </span>{state.bonds}</div>}
            {state.flaws && <div><span className="text-[#b8962e] font-bold">Flaws: </span>{state.flaws}</div>}
            {state.backstory && <div className="col-span-2"><span className="text-[#b8962e] font-bold">Backstory: </span>{state.backstory.slice(0, 200)}{state.backstory.length > 200 ? '...' : ''}</div>}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={onFinish}
          disabled={!isValid}
          className={`text-base px-12 py-3 font-bold tracking-widest uppercase border-2 transition-all ${
            isValid
              ? 'bg-[#b8962e] text-[#0a0a0a] border-[#f0d080] hover:bg-[#d4a93a] shadow-[0_0_20px_rgba(184,150,46,0.5)]'
              : 'bg-[#1a1500] text-[#3a2a00] border-[#2a1f00] cursor-not-allowed'
          }`}
        >
          ⚔ Create Character ⚔
        </button>
      </div>
    </div>
  );
}
