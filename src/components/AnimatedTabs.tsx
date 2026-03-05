// src/components/ui/AnimatedTabs.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon | React.ElementType;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}

interface TabContentProps {
  activeKey: string;
  children: React.ReactNode;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  layoutId = "defaultTabUnderline",
  className,
}: AnimatedTabsProps) {
  return (
    <div
      className={cn(
        "flex border-b border-slate-200 dark:border-slate-800 w-full relative overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-6 py-2 text-sm font-bold transition-all flex items-center gap-2 outline-none whitespace-nowrap cursor-pointer",
              isActive
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive
                    ? "text-blue-600"
                    : "text-slate-300 dark:text-slate-600"
                )}
              />
            )}
            {tab.label}

            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabContent({ activeKey, children }: TabContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
