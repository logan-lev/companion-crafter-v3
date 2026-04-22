import { useState } from 'react';
import type { Character } from '../types/character';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
}

function StatBlock({
  label,
  value,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  displayValue?: string;
}) {
  return (
    <div className="stat-box flex flex-col items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        value={displayValue ?? String(value)}
        onChange={(e) => onChange(parseInt(e.target.value.replace(/[^\d-]/g, '')) || 0)}
        className="text-xl font-bold text-center w-full bg-transparent border-none outline-none text-[#f0d080]"
      />
      <span className="field-label">{label}</span>
    </div>
  );
}

export default function CombatStats({ character, onChange }: Props) {
  const [attackItemName, setAttackItemName] = useState('');
  const up = <K extends keyof Character>(key: K, val: Character[K]) =>
    onChange({ ...character, [key]: val });
  const inventoryChoices = character.inventory
    .filter(item => item.itemType === 'weapon')
    .map(item => item.name.trim())
    .filter(Boolean);

  const toggleSuccess = (i: number) => {
    const current = character.deathSaves.successes;
    onChange({ ...character, deathSaves: { ...character.deathSaves, successes: current === i + 1 ? i : i + 1 } });
  };
  const toggleFailure = (i: number) => {
    const current = character.deathSaves.failures;
    onChange({ ...character, deathSaves: { ...character.deathSaves, failures: current === i + 1 ? i : i + 1 } });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Core combat stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatBlock label="Armor Class" value={character.armorClass} onChange={(v) => up('armorClass', v)} />
        <StatBlock label="Initiative" value={character.initiative} onChange={(v) => up('initiative', v)} displayValue={`${character.initiative >= 0 ? '+' : ''}${character.initiative}`} />
        <StatBlock label="Speed" value={character.speed} onChange={(v) => up('speed', v)} displayValue={`${character.speed} ft`} />
      </div>

      {/* HP */}
      <div className="section-box">
        <div className="section-title">Hit Points</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="field-label">Maximum</label>
            <input type="number" value={character.maxHp}
              onChange={(e) => up('maxHp', parseInt(e.target.value) || 0)}
              className="field-input" />
          </div>
          <div>
            <label className="field-label">Current</label>
            <input type="number" value={character.currentHp}
              onChange={(e) => up('currentHp', parseInt(e.target.value) || 0)}
              className="field-input" />
          </div>
          <div>
            <label className="field-label">Temporary</label>
            <input type="number" value={character.temporaryHp}
              onChange={(e) => up('temporaryHp', parseInt(e.target.value) || 0)}
              className="field-input" />
          </div>
        </div>
      </div>

      {/* Hit Dice + Death Saves */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="section-box">
          <div className="section-title">Hit Dice</div>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="field-label">Total</label>
              <input type="number" value={character.hitDice.total}
                onChange={(e) => up('hitDice', { ...character.hitDice, total: parseInt(e.target.value) || 0 })}
                className="field-input" />
            </div>
            <div>
              <label className="field-label">Left</label>
              <input type="number" value={character.hitDice.remaining}
                onChange={(e) => up('hitDice', { ...character.hitDice, remaining: parseInt(e.target.value) || 0 })}
                className="field-input" />
            </div>
            <div>
              <label className="field-label">Die</label>
              <select value={character.hitDice.dieType}
                onChange={(e) => up('hitDice', { ...character.hitDice, dieType: parseInt(e.target.value) })}
                className="field-input select">
                {[6, 8, 10, 12].map(d => <option key={d} value={d}>d{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="section-box">
          <div className="section-title">Death Saves</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="field-label w-16">Successes</span>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i}
                    className={`circle-check ${i < character.deathSaves.successes ? 'checked' : ''}`}
                    onClick={() => toggleSuccess(i)} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="field-label w-16">Failures</span>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i}
                    className={`circle-check ${i < character.deathSaves.failures ? 'bg-red-700 border-red-700' : ''}`}
                    onClick={() => toggleFailure(i)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attacks */}
      <div className="section-box">
        <div className="section-title">Attacks & Spellcasting</div>
        <div className="grid grid-cols-12 gap-2 mb-2">
          <span className="field-label col-span-5">Name</span>
          <span className="field-label col-span-2">Atk Bonus</span>
          <span className="field-label col-span-5">Damage/Type</span>
        </div>
        {character.attacks.map((atk, i) => (
          <div key={atk.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
            <input value={atk.name}
              onChange={(e) => {
                const attacks = [...character.attacks];
                attacks[i] = { ...atk, name: e.target.value };
                up('attacks', attacks);
              }}
              disabled={atk.source === 'inventory'}
              className="field-input text-xs col-span-5" placeholder="Attack name" />
            <input value={atk.attackBonus}
              onChange={(e) => {
                const attacks = [...character.attacks];
                attacks[i] = { ...atk, attackBonus: e.target.value };
                up('attacks', attacks);
              }}
              disabled={atk.source === 'inventory'}
              className="field-input text-xs col-span-2" placeholder="+5" />
            <div className="col-span-5 flex gap-2">
              <input value={atk.damageType}
                onChange={(e) => {
                  const attacks = [...character.attacks];
                  attacks[i] = { ...atk, damageType: e.target.value };
                  up('attacks', attacks);
                }}
                disabled={atk.source === 'inventory'}
                className="field-input text-xs flex-1" placeholder="1d6 slashing" />
              {atk.source === 'inventory' && (
                <span className="field-label whitespace-nowrap self-center">From inventory</span>
              )}
              <button
                onClick={() => up('attacks', character.attacks.filter((_, j) => j !== i))}
                disabled={atk.source === 'inventory'}
                className="text-red-500 text-xs px-1">✕</button>
            </div>
          </div>
        ))}
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            value={attackItemName}
            onChange={(e) => setAttackItemName(e.target.value)}
            className="field-input flex-1 text-xs"
            placeholder="Choose an inventory item or type a custom attack name"
            list="attack-item-options"
          />
          <datalist id="attack-item-options">
            {inventoryChoices.map(name => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <button
            onClick={() => {
              const name = attackItemName.trim();
              up('attacks', [
                ...character.attacks,
                { id: crypto.randomUUID(), name, attackBonus: '', damageType: '', source: 'manual' },
              ]);
              setAttackItemName('');
            }}
            className="text-xs text-[#b8962e] border border-[#b8962e] px-3 py-1 hover:bg-[#1a1500]">
            + Add Attack
          </button>
        </div>
      </div>
    </div>
  );
}
