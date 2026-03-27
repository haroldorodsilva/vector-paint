import { useState, useRef, useEffect } from 'react';

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Infantil',
    emojis: ['🧸', '🪀', '🪁', '🎠', '🎡', '🎢', '🎪', '🤡', '🧚', '🧜', '🧞', '🪆', '🪅', '🎎', '🪃', '🫧', '🛝', '🏰', '👶', '🍼', '🧷', '🪄', '💫', '🌈', '⭐'],
  },
  {
    label: 'Princesas & Fantasia',
    emojis: ['👸', '🤴', '👑', '🏰', '🦄', '🧚', '🧜‍♀️', '🧝‍♀️', '🪄', '💎', '💍', '🪞', '✨', '🌹', '🎀', '👗', '👠', '💄', '🦢', '🕊️', '🫅', '🧙', '🧛', '🧟', '🦸', '🦹'],
  },
  {
    label: 'Dinossauros & Pré-história',
    emojis: ['🦕', '🦖', '🪨', '🌋', '🦴', '🥚', '🪺', '🐾', '🌿', '🦎', '🐊', '🐉', '🐲'],
  },
  {
    label: 'Animais',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🦩', '🦜', '🦚', '🦔', '🦦', '🦥', '🐿️'],
  },
  {
    label: 'Natureza',
    emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍀', '🍁', '🍂', '🌳', '🌴', '🌵', '🌾', '🌱', '🍄', '💐', '🪻', '🪷', '🪹', '☀️', '🌙', '⭐', '🌈', '🌊', '❄️', '🔥', '💧', '🌍'],
  },
  {
    label: 'Comida',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥕', '🌽', '🍕', '🍔', '🍟', '🌮', '🍩', '🍰', '🧁', '🍫', '🍬', '🍭', '🍿', '☕', '🧃', '🍪', '🧇', '🥞', '🍦', '🥤'],
  },
  {
    label: 'Transporte',
    emojis: ['🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🚂', '🚲', '🛴', '🏍️', '🚜', '🚤', '🛶', '🚃', '🚄', '🛺', '🛵'],
  },
  {
    label: 'Escola & Arte',
    emojis: ['📁', '📂', '📚', '📖', '✏️', '🖍️', '🎨', '🖌️', '✂️', '📎', '📌', '📐', '📏', '🔬', '🔭', '🧮', '🗂️', '📝', '🎒', '🏫'],
  },
  {
    label: 'Brincadeiras & Jogos',
    emojis: ['🎁', '🎈', '🎀', '🏆', '🎯', '🎲', '🧩', '🎮', '🎸', '🎹', '🎺', '🎻', '🎬', '📷', '🪘', '🥁', '🎤', '🎧', '🎭', '🎪', '🎰', '🪩'],
  },
  {
    label: 'Esportes',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🤸', '⛷️', '🏄', '🚴', '🏊', '🧗', '🤾', '🏋️', '⛸️', '🛹', '🤿', '🏇'],
  },
  {
    label: 'Pessoas & Profissões',
    emojis: ['👨‍🚒', '👩‍🚒', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🍳', '👩‍🍳', '👨‍🌾', '👩‍🌾', '🧑‍⚕️', '💂', '🥷', '🦸‍♂️', '🦸‍♀️', '🦹‍♂️', '🦹‍♀️'],
  },
  {
    label: 'Símbolos',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '✨', '💫', '🌟', '💥', '💢', '💤', '🎵', '🎶', '💬', '👁️', '👀', '🙌', '👏', '🤝', '✅', '❌', '⭕', '🔴', '🟡', '🟢', '🔵', '🟣'],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ value, onChange, className = '' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function selectEmoji(emoji: string) {
    onChange(emoji);
    setOpen(false);
    setSearch('');
  }

  const filteredGroups = search.trim()
    ? EMOJI_GROUPS.map((g) => ({
        ...g,
        emojis: g.emojis.filter(() =>
          g.label.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((g) => g.emojis.length > 0)
    : EMOJI_GROUPS;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-full rounded-xl border border-gray-300 px-3 py-2 text-center text-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors cursor-pointer"
        aria-label="Selecionar emoji"
      >
        {value || '📁'}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              autoFocus
            />
          </div>

          {/* Emoji grid */}
          <div className="max-h-56 overflow-y-auto p-2">
            {filteredGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">
                  {group.label}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => selectEmoji(emoji)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-base hover:bg-purple-100 transition-colors cursor-pointer ${
                        value === emoji ? 'bg-purple-200 ring-2 ring-purple-400' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum resultado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
