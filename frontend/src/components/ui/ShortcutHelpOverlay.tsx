import { useState } from 'react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { useTheme } from '../../context/ThemeProvider';

export const ShortcutHelpOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useKeyboardShortcut('?', () => setIsOpen((prev) => !prev), { preventDefault: true });
  useKeyboardShortcut('n', () => navigate('/product/new'), { preventDefault: true });
  useKeyboardShortcut('/', () => navigate('/search'), { preventDefault: true });

  const shortcuts = [
    { key: '?', description: 'Kısayol menüsünü aç / kapat' },
    { key: 'n', description: 'Yeni ürün ekle sayfasına git' },
    { key: '/', description: 'Arama sayfasına git' },
    { key: 'Esc', description: 'Açık menüleri veya pencereleri kapat' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Klavye Kısayolları</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-800/50 border-white/[0.05]' : 'bg-slate-50 border-slate-200/50'}`}>
              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{shortcut.description}</span>
              <kbd className={`px-2 py-1.5 text-xs font-mono font-bold rounded-md border shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}>
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
