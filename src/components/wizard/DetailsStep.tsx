import type { WizardState } from '../../types/wizard';
import { ALIGNMENTS } from '../../data/srd';
import { BACKGROUND_DATA } from '../../data/srd-backgrounds';

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const RACE_NAME_SUGGESTIONS: Record<string, string[]> = {
  Dragonborn: ['Arjhan', 'Balasar', 'Rhogar', 'Akra'],
  Dwarf: ['Bruenor', 'Dain', 'Eldeth', 'Vistra'],
  Elf: ['Aelar', 'Faelar', 'Lia', 'Shava'],
  Gnome: ['Alston', 'Boddynock', 'Nissa', 'Tana'],
  'Half-Elf': ['Kael', 'Liora', 'Theren', 'Mira'],
  'Half-Orc': ['Grom', 'Shura', 'Dench', 'Kethra'],
  Halfling: ['Alton', 'Milo', 'Rosie', 'Seraphina'],
  Human: ['Alden', 'Bryn', 'Clara', 'Jonas'],
  Tiefling: ['Akmenos', 'Mordai', 'Nemeia', 'Orianna'],
};

export default function DetailsStep({ state, onChange }: Props) {
  const bg = BACKGROUND_DATA.find(b => b.name === state.background);
  const suggestedNames = RACE_NAME_SUGGESTIONS[state.race] ?? ['Rowan', 'Ember', 'Sable', 'Tarin'];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[#f0d080] text-lg font-bold tracking-wide mb-1">Character Details</h2>
        <p className="text-[#7a6020] text-xs">Give your character a name, define their personality, and write their backstory.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identity */}
        <div className="section-box">
          <div className="section-title">Identity</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="field-label">Character Name *</label>
              <input value={state.name}
                onChange={e => onChange({ name: e.target.value })}
                className="field-input" placeholder="Enter character name..." />
              <div className="mt-2">
                <div className="field-label mb-1">Suggested Names</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedNames.map(name => (
                    <button
                      key={name}
                      onClick={() => onChange({ name })}
                      className="rounded border border-[#b8962e] bg-[#0d0d0d] px-3 py-1 text-xs text-[#b8962e] hover:bg-[#1a1000]"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="field-label">Player Name</label>
              <input value={state.playerName}
                onChange={e => onChange({ playerName: e.target.value })}
                className="field-input" />
            </div>
            <div>
              <label className="field-label">Alignment</label>
              <select value={state.alignment}
                onChange={e => onChange({ alignment: e.target.value })}
                className="field-input select">
                <option value="">—</option>
                {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Personality from background */}
        <div className="section-box">
          <div className="section-title">Personality Traits</div>
          <div className="flex flex-col gap-2">
            <div>
              <label className="field-label">Personality Traits</label>
              <textarea value={state.personalityTraits}
                onChange={e => onChange({ personalityTraits: e.target.value })}
                className="field-input w-full" rows={2} placeholder="How does your character present themselves?" />
              {bg?.suggestedTraits && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {bg.suggestedTraits.slice(0, 2).map((t, i) => (
                    <button key={i} onClick={() => onChange({ personalityTraits: t })}
                      className="text-left text-[0.6rem] text-[#7a6020] hover:text-[#b8962e] italic">
                      Suggestion: "{t.length > 60 ? t.slice(0, 60) + '...' : t}"
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="field-label">Ideals</label>
              <textarea value={state.ideals}
                onChange={e => onChange({ ideals: e.target.value })}
                className="field-input w-full" rows={2} placeholder="What principles does your character believe in?" />
              {bg?.suggestedIdeals && (
                <button onClick={() => onChange({ ideals: bg.suggestedIdeals![0] })}
                  className="text-left text-[0.6rem] text-[#7a6020] hover:text-[#b8962e] italic mt-0.5">
                  Suggestion: "{bg.suggestedIdeals[0].slice(0, 60)}..."
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="section-box">
          <div className="section-title">Bonds & Flaws</div>
          <div className="flex flex-col gap-2">
            <div>
              <label className="field-label">Bonds</label>
              <textarea value={state.bonds ?? ''}
                onChange={e => onChange({ bonds: e.target.value } as Partial<WizardState>)}
                className="field-input w-full" rows={2} placeholder="What connects your character to the world?" />
              {bg?.suggestedBonds && (
                <button onClick={() => onChange({ bonds: bg.suggestedBonds![0] } as Partial<WizardState>)}
                  className="text-left text-[0.6rem] text-[#7a6020] hover:text-[#b8962e] italic mt-0.5">
                  Suggestion: "{bg.suggestedBonds[0].slice(0, 60)}..."
                </button>
              )}
            </div>
            <div>
              <label className="field-label">Flaws</label>
              <textarea value={state.flaws ?? ''}
                onChange={e => onChange({ flaws: e.target.value } as Partial<WizardState>)}
                className="field-input w-full" rows={2} placeholder="What weaknesses does your character have?" />
              {bg?.suggestedFlaws && (
                <button onClick={() => onChange({ flaws: bg.suggestedFlaws![0] } as Partial<WizardState>)}
                  className="text-left text-[0.6rem] text-[#7a6020] hover:text-[#b8962e] italic mt-0.5">
                  Suggestion: "{bg.suggestedFlaws[0].slice(0, 60)}..."
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="section-box">
          <div className="section-title">Backstory</div>
          <textarea value={state.backstory}
            onChange={e => onChange({ backstory: e.target.value })}
            className="field-input w-full" rows={6}
            placeholder="Where did your character come from? What events shaped who they are? What drives them to adventure?" />
        </div>
      </div>
    </div>
  );
}
