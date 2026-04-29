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

  const features = cls
    ? getFeaturesUpToLevel(cls.name, state.level, {
        barbarianPath: state.barbarianPath,
        barbarianTotemSpirit: state.barbarianTotemSpirit,
        barbarianAspectSpirit: state.barbarianAspectSpirit,
        barbarianAttunementSpirit: state.barbarianAttunementSpirit,
        bardCollege: state.bardCollege,
        clericDomain: state.clericDomain,
        druidCircle: state.druidCircle,
        paladinOath: state.paladinOath,
      })
    : [];

  const isValid = state.name && state.race && state.className && state.background;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[var(--color-text-strong)] text-lg font-bold tracking-wide mb-1">Character Summary</h2>
        <p className="text-[var(--color-text-dim)] text-xs">Review your choices before creating your character.</p>
      </div>

      <div className="section-box">
        <div className="text-sm leading-6 text-[var(--color-text)]">
          This page is read-only. If you want to change your build, go back to an earlier step and then return here to confirm.
        </div>
      </div>

      {!isValid && (
        <div className="border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] rounded p-3 text-[var(--color-danger-text)] text-sm">
          ⚠ Missing required fields: {[
            !state.name && 'Character Name',
            !state.race && 'Race',
            !state.className && 'Class',
            !state.background && 'Background',
          ].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Header card */}
      <div className="section-box border-2 border-[var(--color-accent)]">
        <div className="text-center">
          <div className="text-3xl font-bold text-[var(--color-text-strong)]">{state.name || '—'}</div>
          <div className="text-[var(--color-accent)] text-sm mt-1">
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
              <div className="text-[var(--color-accent)] text-[0.55rem] font-bold uppercase">{ABILITY_NAMES[key].slice(0, 3)}</div>
              <div className="text-[var(--color-text-strong)] text-xl font-bold">{finalScores[key]}</div>
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
                  <span className={`text-[0.6rem] flex-1 ${prof ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-dim)]'}`}>{name}</span>
                  <span className={`text-[0.65rem] font-bold ${prof ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-dim)]'}`}>
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
              <div key={i} className="border-l-2 border-[var(--color-accent)] pl-2">
                <div className="flex items-center gap-1">
                  <span className="text-[0.5rem] text-[var(--color-text-dim)] border border-[var(--color-border-subtle)] px-0.5 rounded">Lv{f.level}</span>
                  <span className="text-[var(--color-text-strong)] text-[0.65rem] font-bold">{f.name}</span>
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
                    <span key={s} className="text-[0.65rem] bg-[var(--color-spell-panel)] border border-[var(--color-spell-border)] px-2 py-0.5 rounded text-[var(--color-spell-strong)]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {state.selectedSpells.length > 0 && (
              <div>
                <div className="field-label mb-1">Known/Prepared Spells</div>
                <div className="flex flex-wrap gap-1">
                  {state.selectedSpells.map(s => (
                    <span key={s} className="text-[0.65rem] bg-[var(--color-spell-panel)] border border-[var(--color-spell-border)] px-2 py-0.5 rounded text-[var(--color-spell-strong)]">{s}</span>
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
            <div className="text-[0.65rem] text-[var(--color-text-soft)] mb-1">{bg.flavorText.slice(0, 120)}...</div>
            <div className="text-[var(--color-accent)] text-xs font-bold">{bg.feature.name}</div>
            <div className="text-[var(--color-text-dim)] text-[0.6rem]">{bg.feature.description.slice(0, 100)}...</div>
          </div>
        )}
      </div>

      {/* Personality */}
      {(state.personalityTraits || state.ideals || state.backstory) && (
        <div className="section-box">
          <div className="section-title">Personality & Backstory</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--color-text-soft)]">
            {state.personalityTraits && <div><span className="text-[var(--color-accent)] font-bold">Traits: </span>{state.personalityTraits}</div>}
            {state.ideals && <div><span className="text-[var(--color-accent)] font-bold">Ideals: </span>{state.ideals}</div>}
            {state.bonds && <div><span className="text-[var(--color-accent)] font-bold">Bonds: </span>{state.bonds}</div>}
            {state.flaws && <div><span className="text-[var(--color-accent)] font-bold">Flaws: </span>{state.flaws}</div>}
            {state.backstory && <div className="col-span-2"><span className="text-[var(--color-accent)] font-bold">Backstory: </span>{state.backstory.slice(0, 200)}{state.backstory.length > 200 ? '...' : ''}</div>}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={onFinish}
          disabled={!isValid}
          className={`text-base px-12 py-3 font-bold tracking-widest uppercase border-2 transition-all ${
            isValid
              ? 'bg-[#b8962e] text-[#0a0a0a] border-[var(--color-text-strong)] hover:bg-[#d4a93a] shadow-[0_0_20px_rgba(184,150,46,0.5)]'
              : 'bg-[var(--color-hover)] text-[var(--color-text-dim)] border-[var(--color-border-subtle)] cursor-not-allowed'
          }`}
        >
          ⚔ Create Character ⚔
        </button>
      </div>
    </div>
  );
}
