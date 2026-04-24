import { useState } from 'react';
import type { Character } from './types/character';
import { loadCharacters, saveCharacters, createBlankCharacter } from './utils/storage';
import { normalizeCharacter } from './utils/character-sheet';
import CharacterSheet from './components/CharacterSheet';
import CharacterWizard from './components/CharacterWizard';
import MainMenu from './components/MainMenu';

type AppView = 'menu' | 'wizard' | 'sheet';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>(() => loadCharacters());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('menu');

  const activeCharacter = characters.find(c => c.id === activeId) ?? null;

  const handleNew = () => {
    const blank = createBlankCharacter();
    const updated = [...characters, blank];
    setCharacters(updated);
    setActiveId(blank.id);
    setCreatingId(blank.id);
    setView('wizard');
  };

  const handleChange = (updated: Character) => {
    const normalized = normalizeCharacter(updated);
    setCharacters(prev => prev.map(c => c.id === normalized.id ? normalized : c));
  };

  const handleSave = () => {
    saveCharacters(characters.map(normalizeCharacter));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleDelete = () => {
    if (!activeId) return;
    if (!confirm('Delete this character? This cannot be undone.')) return;
    const updated = characters.filter(c => c.id !== activeId);
    setCharacters(updated);
    saveCharacters(updated);
    setActiveId(null);
    if (creatingId === activeId) setCreatingId(null);
    setView('menu');
  };

  const handleDeleteFromMenu = (id: string) => {
    if (!confirm('Delete this character? This cannot be undone.')) return;
    const updated = characters.filter(c => c.id !== id);
    setCharacters(updated);
    saveCharacters(updated);
    if (activeId === id) setActiveId(null);
    if (creatingId === id) setCreatingId(null);
  };

  const handleCancelCreation = () => {
    if (!activeId) return;
    const updated = characters.filter(c => c.id !== activeId);
    setCharacters(updated);
    setActiveId(null);
    setCreatingId(null);
    setView('menu');
  };

  const handleFinishCreation = (created: Character) => {
    if (!activeId) return;
    const updated = characters.map(character => character.id === activeId ? normalizeCharacter({ ...created, id: activeId }) : character);
    setCharacters(updated);
    setCreatingId(null);
    saveCharacters(updated);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    setView('sheet');
  };

  const handleOpenCharacter = (id: string) => {
    setActiveId(id);
    setCreatingId(null);
    setView('sheet');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <header className="border-b border-[#b8962e] bg-[#080808] px-4 py-3 flex items-center justify-between">
        <span className="text-[#b8962e] text-xl font-bold tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
          ⚔ Companion Crafter
        </span>
        <div className="flex items-center gap-3">
          {savedFlash && <span className="text-xs text-green-400 animate-pulse">Saved!</span>}
          {view !== 'menu' && (
            <button onClick={() => setView('menu')} className="tab-btn">
              Main Menu
            </button>
          )}
          {(view !== 'menu' || characters.length > 0) && (
            <button onClick={handleNew} className="save-btn">+ New Character</button>
          )}
        </div>
      </header>

      <div className="min-h-[calc(100vh-73px)]">
        <main className="min-w-0 px-4 py-4 xl:px-8 xl:py-8">
          <div className="mx-auto w-full max-w-[1900px]">
            {view === 'menu' ? (
              <MainMenu
                characters={characters}
                onCreate={handleNew}
                onOpen={handleOpenCharacter}
                onDelete={handleDeleteFromMenu}
              />
            ) : activeCharacter ? (
              view === 'wizard' && creatingId === activeCharacter.id ? (
                <CharacterWizard
                  onFinish={handleFinishCreation}
                  onCancel={handleCancelCreation}
                />
              ) : (
                <CharacterSheet
                  character={activeCharacter}
                  onChange={handleChange}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              )
            ) : (
              <MainMenu
                characters={characters}
                onCreate={handleNew}
                onOpen={handleOpenCharacter}
                onDelete={handleDeleteFromMenu}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
