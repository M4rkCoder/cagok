interface DotNavigationProps {
  sections: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const DotNavigation = ({
  sections,
  activeId,
  onChange,
}: DotNavigationProps) => {
  return (
    <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-[40] flex flex-col gap-6">
      {sections.map((section) => {
        const isActive = activeId === section.id;

        return (
          <button
            key={section.id}
            onClick={() => onChange(section.id)}
            className="relative group flex items-center justify-center w-6 h-6"
          >
            {/* Tooltip label */}
            <span className="absolute right-9 top-1/2 -translate-y-1/2 px-2 py-1 text-sm rounded-md bg-slate-500 text-white whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100  group-hover:scale-100 transition-all duration-200 pointer-events-none shadow-lg">
              {section.label}
            </span>

            {/* Dot */}
            <div
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300
                  ${
                    isActive
                      ? "bg-black border-black scale-125 shadow-lg shadow-blue-500/50"
                      : "bg-white border-slate-300"
                  }`}
            />
          </button>
        );
      })}
    </nav>
  );
};
