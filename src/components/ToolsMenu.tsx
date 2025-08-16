import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, FileText } from 'lucide-react';

type LinkItem = { name: string; href: string; icon?: React.ComponentType<any> };
type Section = { title: string; items: LinkItem[] };

export type ToolsMenuProps = {
  sections: Section[];
  /** Optional: override trigger content (defaults to "Tools") */
  triggerLabel?: React.ReactNode;
  /** Optional: extra classes for trigger */
  triggerClassName?: string;
};

const ToolsMenu: React.FC<ToolsMenuProps> = ({
  sections,
  triggerLabel = 'Tools',
  triggerClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // default animated gradient trigger
  const baseTrigger =
    'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-white shadow-md ' +
    'hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none';

  const animatedGradientStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(90deg, rgb(236,72,153), rgb(147,51,234), rgb(59,130,246))', // pink→purple→blue
    backgroundSize: '200% 200%',
    animation: 'gradientShift 6s ease infinite',
  };

  return (
    <>
      {/* keyframes for continuous gradient animation */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${baseTrigger} ${triggerClassName}`}
        style={animatedGradientStyle}
      >
        {triggerLabel}
        <ChevronDown className="w-4 h-4 opacity-90" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="fixed right-4 top-20 w-[1000px] max-w-[96vw] max-h-[75vh] overflow-auto z-[100] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec) => (
              <div key={sec.title}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {sec.title}
                </h4>
                <ul className="space-y-2">
                  {sec.items.map((item) => {
                    const Icon = item.icon ?? FileText;
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm text-gray-800 group-hover:text-gray-900">
                            <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                            {item.name}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ToolsMenu;
