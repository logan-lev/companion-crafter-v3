import { useState } from 'react';
import type { WizardState } from '../../types/wizard';
import { CLASS_DATA, getCantripsKnown, getSpellsKnown, getSlotsAtLevel, maxSpellLevel } from '../../data/srd-classes';
import { getSpellsForClass, type SpellData } from '../../data/srd-spells';
import { RACE_DATA } from '../../data/srd-races';
import { calcMod } from '../../data/srd';
import { profBonusFromLevel } from '../../data/srd';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: 'text-blue-300', Conjuration: 'text-yellow-300', Divination: 'text-purple-300',
  Enchantment: 'text-pink-300', Evocation: 'text-orange-300', Illusion: 'text-indigo-300',
  Necromancy: 'text-green-300', Transmutation: 'text-red-300',
};

function getFinalScores(state: WizardState) {
  const race = RACE_DATA.find(r => r.name === state.race);
  const bonus: Record<string, number> = { ...race?.abilityBonus };
  if (state.subrace && race?.subraces) {
    const sub = race.subraces.find(s => s.name === state.subrace);
    if (sub) Object.entries(sub.abilityBonus).forEach(([k, v]) => { bonus[k] = (bonus[k] ?? 0) + (v ?? 0); });
  }
  const result: Record<string, number> = {};
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(k => {
    result[k] = (state.baseScores[k as keyof typeof state.baseScores] ?? 8) + (bonus[k] ?? 0);
  });
  return result;
}

function SpellCard({ spell, isSelected, onClick }: { spell: SpellData; isSelected: boolean; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded mb-1 transition-all ${isSelected ? 'border-[#f0d080] bg-[#1a1200]' : 'border-[#2a1f00] bg-[#0d0d0d] hover:border-[#b8962e]'}`}>
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={onClick}
          className={`w-4 h-4 border rounded flex-shrink-0 transition-all ${isSelected ? 'bg-[#b8962e] border-[#f0d080]' : 'border-[#b8962e]'}`}
        />
        <button className="flex-1 text-left" onClick={() => setExpanded(!expanded)}>
          <span className={`text-xs font-bold ${isSelected ? 'text-[#f0d080]' : 'text-[#c8a84b]'}`}>{spell.name}</span>
          <span className={`text-[0.55rem] ml-2 ${SCHOOL_COLORS[spell.school] ?? 'text-[#7a6020]'}`}>{spell.school}</span>
          <span className="text-[0.55rem] text-[#7a6020] ml-2">{spell.castingTime} · {spell.range}</span>
        </button>
        <span className="text-[#7a6020] text-[0.6rem]">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="px-3 pb-2 border-t border-[#1a1500]">
          <div className="flex gap-3 mb-1 flex-wrap">
            <span className="text-[0.6rem] text-[#7a6020]">Components: {spell.components}</span>
            <span className="text-[0.6rem] text-[#7a6020]">Duration: {spell.duration}</span>
          </div>
          <p className="text-[0.65rem] text-[#9a8040]">{spell.description}</p>
          {spell.upcast && <p className="text-[0.6rem] text-purple-400 mt-1"><em>At Higher Levels:</em> {spell.upcast}</p>}
        </div>
      )}
    </div>
  );
}

export default function SpellsStep({ state, onChange }: Props) {
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterSchool, setFilterSchool] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const cls = CLASS_DATA.find(c => c.name === state.className);
  if (!cls?.spellcasting) {
    return (
      <div className="section-box flex items-center justify-center h-48 text-[#7a6020] italic">
        {state.className || 'Your class'} is not a spellcaster. Skip this step.
      </div>
    );
  }

  const sc = cls.spellcasting;
  const finalScores = getFinalScores(state);
  const spellAbilityScore = finalScores[sc.ability] ?? 10;
  const profBonus = profBonusFromLevel(state.level);
  const spellMod = calcMod(spellAbilityScore);
  const saveDC = 8 + spellMod + profBonus;
  const spellAttack = spellMod + profBonus;

  const slots = getSlotsAtLevel(sc, state.level);
  const maxSpLv = maxSpellLevel(slots);

  const cantripsAllowed = getCantripsKnown(sc, state.level);
  let spellsAllowed = getSpellsKnown(sc, state.level);
  if (sc.prepares) {
    const abilityMod = calcMod(finalScores[sc.ability] ?? 10);
    const base = sc.type === 'half' ? Math.max(1, Math.ceil(state.level / 2)) : state.level;
    spellsAllowed = Math.max(1, abilityMod + base);
  }

  const classSpells = getSpellsForClass(state.className);
  const cantrips = classSpells.filter(s => s.level === 0);
  const spells = classSpells.filter(s => s.level > 0 && s.level <= Math.max(1, maxSpLv));

  const filteredCantrips = cantrips.filter(s =>
    (!filterSchool || s.school === filterSchool) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredSpells = spells.filter(s =>
    (filterLevel === null || s.level === filterLevel) &&
    (!filterSchool || s.school === filterSchool) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleCantrip = (name: string) => {
    const cur = state.selectedCantrips;
    if (cur.includes(name)) onChange({ selectedCantrips: cur.filter(c => c !== name) });
    else if (cur.length < cantripsAllowed) onChange({ selectedCantrips: [...cur, name] });
  };

  const toggleSpell = (name: string) => {
    const cur = state.selectedSpells;
    if (cur.includes(name)) onChange({ selectedSpells: cur.filter(s => s !== name) });
    else if (cur.length < spellsAllowed) onChange({ selectedSpells: [...cur, name] });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Choose Your Spells</h2>
        <p className="text-[#7a6020] text-xs">Select cantrips and spells from your class spell list based on your level.</p>
      </div>

      {/* Spellcasting stats */}
      <div className="section-box">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="stat-box"><div className="font-bold">{saveDC}</div><div className="field-label">Spell Save DC</div></div>
          <div className="stat-box"><div className="font-bold">{spellAttack >= 0 ? '+' : ''}{spellAttack}</div><div className="field-label">Spell Attack</div></div>
          <div className="stat-box">
            <div className="font-bold">{state.selectedCantrips.length}/{cantripsAllowed}</div>
            <div className="field-label">Cantrips</div>
          </div>
          <div className="stat-box">
            <div className="font-bold">{state.selectedSpells.length}/{spellsAllowed}</div>
            <div className="field-label">{sc.prepares ? 'Prepared' : 'Known'} Spells</div>
          </div>
        </div>
        {sc.prepares && (
          <p className="text-[#7a6020] text-[0.65rem] mt-2">
            You can prepare {spellsAllowed} spells ({sc.ability.toUpperCase()} mod + {sc.type === 'half' ? 'half ' : ''}level). After a long rest, you may change your prepared spells.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search spells..." className="field-input w-40 text-xs px-2 py-1 border border-[#b8962e] rounded bg-[#0d0d0d]" />
        <button onClick={() => setFilterSchool(null)} className={`tab-btn text-[0.6rem] py-0.5 px-2 ${!filterSchool ? 'active' : ''}`}>All Schools</button>
        {SCHOOLS.map(s => (
          <button key={s} onClick={() => setFilterSchool(filterSchool === s ? null : s)}
            className={`tab-btn text-[0.6rem] py-0.5 px-2 ${filterSchool === s ? 'active' : ''}`}>{s.slice(0, 4)}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cantrips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="section-title flex-1">Cantrips ({state.selectedCantrips.length}/{cantripsAllowed})</div>
          </div>
          {filteredCantrips.length === 0 && <div className="text-[#3a2a00] text-xs italic">No cantrips available for this filter.</div>}
          {filteredCantrips.map(spell => (
            <SpellCard key={spell.name} spell={spell}
              isSelected={state.selectedCantrips.includes(spell.name)}
              onClick={() => toggleCantrip(spell.name)} />
          ))}
        </div>

        {/* Spells by level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="section-title flex-1">Spells ({state.selectedSpells.length}/{spellsAllowed})</div>
          </div>

          {/* Level filter buttons */}
          <div className="flex gap-1 flex-wrap mb-2">
            <button onClick={() => setFilterLevel(null)} className={`tab-btn text-[0.6rem] py-0.5 px-2 ${filterLevel === null ? 'active' : ''}`}>All</button>
            {Array.from({ length: maxSpLv }, (_, i) => i + 1).map(l => (
              <button key={l} onClick={() => setFilterLevel(filterLevel === l ? null : l)}
                className={`tab-btn text-[0.6rem] py-0.5 px-2 ${filterLevel === l ? 'active' : ''}`}>Lv{l}</button>
            ))}
          </div>

          {/* Slot summary */}
          <div className="flex gap-1 mb-2">
            {slots.map((count, i) => count > 0 ? (
              <div key={i} className="stat-box py-0.5 px-1.5">
                <div className="text-xs font-bold">{count}</div>
                <div className="text-[0.5rem]">L{i + 1}</div>
              </div>
            ) : null)}
          </div>

          {filteredSpells.length === 0 && <div className="text-[#3a2a00] text-xs italic">No spells available for this filter.</div>}
          {filteredSpells.map(spell => (
            <SpellCard key={spell.name} spell={spell}
              isSelected={state.selectedSpells.includes(spell.name)}
              onClick={() => toggleSpell(spell.name)} />
          ))}
        </div>
      </div>
    </div>
  );
}
