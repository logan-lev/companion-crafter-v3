import type { WizardState } from '../../types/wizard';
import { CLASS_DATA, getFeaturesUpToLevel, getSlotsAtLevel, getCantripsKnown, getSpellsKnown } from '../../data/srd-classes';
import { WARLOCK_PACT_SLOTS, WARLOCK_PACT_LEVEL } from '../../data/srd-classes';
import { profBonusFromLevel } from '../../data/srd';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export default function ClassStep({ state, onChange }: Props) {
  const selectedClassData = CLASS_DATA.find(c => c.name === state.className);
  const previewClass = selectedClassData;
  const level = state.level;
  const profBonus = profBonusFromLevel(level);

  const features = previewClass ? getFeaturesUpToLevel(previewClass.name, level) : [];

  const selectClass = (cls: (typeof CLASS_DATA)[number]) => {
    onChange({ className: cls.name, classSkillChoices: [], selectedCantrips: [], selectedSpells: [] });
  };

  const toggleSkill = (skill: string) => {
    const cls = CLASS_DATA.find(c => c.name === state.className);
    if (!cls) return;
    const cur = state.classSkillChoices;
    if (cur.includes(skill)) {
      onChange({ classSkillChoices: cur.filter(s => s !== skill) });
    } else if (cur.length < cls.skillCount) {
      onChange({ classSkillChoices: [...cur, skill] });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Choose Your Class & Level</h2>
        <p className="text-[#7a6020] text-xs">Your class is the primary definition of what your character can do.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="section-box">
          <div className="section-title">Class Selection</div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {CLASS_DATA.map(cls => (
                <button
                  key={cls.name}
                  onClick={() => selectClass(cls)}
                  className={`rounded border px-3 py-3 text-left transition-all ${
                    state.className === cls.name
                      ? 'border-[#f0d080] bg-[#1a1200] text-[#f0d080]'
                      : 'border-[#b8962e] bg-[#0d0d0d] text-[#b8962e] hover:bg-[#111100] hover:border-[#d4a93a]'
                  }`}
                >
                  <div className="text-sm font-bold">{cls.name}</div>
                  <div className="mt-1 text-[0.7rem] text-[#8f7635]">d{cls.hitDie} · {cls.primaryAbility}</div>
                </button>
              ))}
            </div>

            {state.className && (
              <div>
                <div className="field-label mb-2">Character Level</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={1} max={20} value={level}
                    onChange={e => onChange({ level: parseInt(e.target.value) })}
                    className="flex-1 accent-[#b8962e]"
                  />
                  <span className="text-[#f0d080] font-bold text-lg w-8 text-center">{level}</span>
                </div>
              </div>
            )}
          </div>

          {state.className && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="stat-box">
                <div className="font-bold text-base">+{profBonus}</div>
                <div className="field-label">Prof Bonus</div>
              </div>
              <div className="stat-box">
                <div className="font-bold text-base">{Math.ceil(level * 1000 * (level - 1) / 2)} XP</div>
                <div className="field-label">XP Needed</div>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          {previewClass ? (
            <div className="section-box flex max-h-[72vh] flex-col gap-3 overflow-y-auto">
              <div className="flex items-start justify-between sticky top-0 bg-[#111111] pb-2">
                <div>
                  <h3 className="text-[#f0d080] text-xl font-bold">{previewClass.name}</h3>
                  <p className="mt-1 text-sm italic leading-6 text-[#7a6020]">{previewClass.flavorText}</p>
                </div>
                {state.className === previewClass.name && (
                  <span className="text-green-400 text-xs border border-green-700 px-2 py-1 rounded ml-2 flex-shrink-0">Selected ✓</span>
                )}
              </div>

              {/* Core stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="stat-box">
                  <div className="font-bold text-base">d{previewClass.hitDie}</div>
                  <div className="field-label">Hit Die</div>
                </div>
                <div className="stat-box col-span-2">
                  <div className="text-xs font-bold text-[#f0d080]">{previewClass.savingThrows.map(s => s.toUpperCase()).join(', ')}</div>
                  <div className="field-label">Saving Throws</div>
                </div>
              </div>

              {/* Proficiencies */}
              <div>
                <div className="field-label mb-1">Armor & Weapons</div>
                <div className="text-sm leading-6 text-[#c8a84b]">
                  {[...previewClass.armorProf, ...previewClass.weaponProf].join(' · ')}
                </div>
              </div>

              {/* Skills (for selected class only) */}
              {state.className === previewClass.name && (
                <div>
                  <div className="field-label mb-1">
                    Choose {previewClass.skillCount} Skills ({state.classSkillChoices.length}/{previewClass.skillCount})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {previewClass.skillOptions.map(skill => {
                      const chosen = state.classSkillChoices.includes(skill);
                      const canAdd = state.classSkillChoices.length < previewClass.skillCount;
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          disabled={!chosen && !canAdd}
                          className={`text-[0.6rem] px-2 py-0.5 border rounded transition-all ${
                            chosen
                              ? 'border-[#f0d080] bg-[#2a1800] text-[#f0d080]'
                              : canAdd
                              ? 'border-[#b8962e] text-[#b8962e] hover:bg-[#1a1000]'
                              : 'border-[#2a1f00] text-[#3a2a00] cursor-not-allowed'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spellcasting info */}
              {previewClass.spellcasting && (
                <div className="border border-purple-900 rounded p-2 bg-[#0a0014]">
                  <div className="text-purple-300 text-xs font-bold mb-1">✦ Spellcasting</div>
                  <div className="text-[#9a80a0] text-[0.65rem]">
                    Ability: <span className="text-purple-300">{previewClass.spellcasting.ability.toUpperCase()}</span>
                    {' · '}Type: <span className="text-purple-300">{previewClass.spellcasting.type}</span>
                    {' · '}{previewClass.spellcasting.prepares ? 'Prepares spells' : 'Knows spells'}
                  </div>
                  {previewClass.spellcasting.type !== 'pact' ? (
                    <div className="mt-1">
                      <div className="text-[0.6rem] text-[#7a6060] mb-1">
                        Cantrips: {getCantripsKnown(previewClass.spellcasting, state.className === previewClass.name ? level : 1)}
                        {previewClass.spellcasting.spellsKnown && (
                          <> · Spells known: {getSpellsKnown(previewClass.spellcasting, state.className === previewClass.name ? level : 1)}</>
                        )}
                      </div>
                      <div className="grid grid-cols-9 gap-0.5">
                        {getSlotsAtLevel(previewClass.spellcasting, state.className === previewClass.name ? level : 1).map((slots, i) => (
                          <div key={i} className={`text-center text-[0.55rem] p-0.5 rounded ${slots > 0 ? 'bg-purple-900 text-purple-200' : 'bg-[#111] text-[#333]'}`}>
                            <div className="font-bold">{slots > 0 ? slots : '—'}</div>
                            <div>L{i + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[0.65rem] text-purple-300 mt-1">
                      Pact Slots: {WARLOCK_PACT_SLOTS[level - 1]} × {['', '1st', '2nd', '3rd', '4th', '5th'][WARLOCK_PACT_LEVEL[level - 1]]}-level (recharge on short rest)
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              <div>
                <div className="field-label mb-2">
                  Class Features (Level 1{state.className === previewClass.name && level > 1 ? `–${level}` : ''})
                </div>
                <div className="flex flex-col gap-2">
                  {features.map((f, i) => (
                    <div key={i} className="border-l-2 border-[#b8962e] pl-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.55rem] text-[#7a6020] border border-[#3a2a00] px-1 rounded">Lv{f.level}</span>
                        <span className="text-[#f0d080] text-xs font-bold">{f.name}</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-6 text-[#9a8040]">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="section-box flex items-center justify-center h-48 text-[#3a2a00] text-sm italic">
              Select a class to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
