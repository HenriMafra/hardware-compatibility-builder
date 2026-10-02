import { Cpu, Sparkles, Trash2, Github } from "lucide-react";

export function Header({
  onSample,
  onClear,
  hasBuild,
}: {
  onSample: () => void;
  onClear: () => void;
  hasBuild: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-neon-cyan shadow-glow">
          <Cpu size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
            PCForge
            <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
              monte seu PC
            </span>
          </h1>
          <p className="hidden text-[11px] text-slate-500 sm:block">
            Compatibilidade em tempo real · diagrama de conexões · preços em 5 lojas
          </p>
        </div>

        <button onClick={onSample} className="btn-ghost !py-1.5 !px-3 text-xs">
          <Sparkles size={14} className="text-neon-amber" />
          <span className="hidden sm:inline">Build de exemplo</span>
          <span className="sm:hidden">Exemplo</span>
        </button>
        {hasBuild && (
          <button
            onClick={onClear}
            className="btn !py-1.5 !px-3 text-xs text-rose-300 hover:bg-rose-500/10"
            title="Limpar build"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
        <a
          href="https://github.com/HenriMafra/pcforge"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost !p-2"
          title="Código no GitHub"
        >
          <Github size={16} />
        </a>
      </div>
    </header>
  );
}
