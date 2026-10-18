const fs = require('fs');

const files = [
  'src/pages/ProductDetailPage.tsx',
  'src/pages/ProjectsPage.tsx',
  'src/pages/ProjectDetailPage.tsx',
  'src/pages/SettingsPage.tsx',
  'src/components/ui/PwaInstallPrompt.tsx',
  'src/components/ui/PwaUpdatePrompt.tsx',
  'src/components/ui/ConflictResolutionModal.tsx',
  'src/components/ui/ShortcutHelpOverlay.tsx',
];

function takeLight(s) {
  s = s.replace(/\$\{isDark \? '([^']*)' : '([^']*)'\}/g, '$2');
  s = s.replace(/\$\{isDark \? `([^`]*)` : `([^`]*)`\}/g, '$2');
  s = s.replace(/\s?dark:[a-zA-Z0-9[\]/._%-:]+/g, '');
  s = s.replaceAll('bg-amber-600 hover:bg-amber-700', 'bg-blue-600 hover:bg-blue-700');
  s = s.replaceAll('bg-amber-500/10', 'bg-blue-50');
  s = s.replaceAll('bg-amber-50', 'bg-blue-50');
  s = s.replaceAll('bg-amber-100', 'bg-blue-100');
  s = s.replaceAll('text-amber-600', 'text-blue-600');
  s = s.replaceAll('text-amber-500', 'text-blue-600');
  s = s.replaceAll('text-amber-400', 'text-blue-600');
  s = s.replaceAll('hover:text-amber-600', 'hover:text-blue-600');
  s = s.replaceAll('hover:border-amber-200', 'hover:border-blue-200');
  s = s.replaceAll('hover:bg-amber-50', 'hover:bg-blue-50');
  s = s.replaceAll('focus:ring-amber-500/40', 'focus:ring-blue-600/30');
  s = s.replaceAll('focus:ring-amber-500', 'focus:ring-blue-500');
  s = s.replaceAll('bg-[#1e293b]', 'bg-white');
  s = s.replaceAll("border-white/[0.07]", 'border-slate-200/80');
  return s;
}

for (const f of files) {
  const s = takeLight(fs.readFileSync(f, 'utf8'));
  fs.writeFileSync(f, s);
  console.log(f, {
    isDark: s.includes('isDark'),
    darkClass: s.includes('dark:'),
    amber: s.includes('amber-'),
  });
}
