/**
 * Enterprise Responsive Layout Primitives
 *
 * Every dashboard module should be built using these components.
 * They handle all breakpoint logic internally so individual pages
 * never need to write custom responsive CSS.
 *
 * Components:
 *  - ThreePanel       — 3-column workspace (list | thread | sidebar)
 *  - DrawerPanel      — full-height slide-out overlay (mobile/tablet panels)
 *  - AppShell         — outermost wrapper for sidebar + header + content
 *  - PageContainer    — standard padded content area with max-width
 *  - PageHeader       — title + actions row, collapses on mobile
 *  - AdaptiveToolbar  — buttons that overflow into a "More" menu
 *  - CardGrid         — auto-fit minmax responsive card grid
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsMobileOrTablet } from "@/lib/breakpoints";
import { MoreHorizontal, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ============================================================
 * ThreePanel — Enterprise 3-column workspace layout
 *
 * Desktop (≥1440px) : left(320px) | center(1fr) | right(360px)
 * Laptop  (1024px)  : left(280px) | center(1fr) | right(320px)
 * Tablet  (<1024px) : Drawer(left) | center(full) | Drawer(right)
 * Mobile  (<768px)  : Drawer(left) | center(full) | Drawer(right)
 * ============================================================ */

interface ThreePanelContextValue {
  leftOpen: boolean;
  rightOpen: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
  openLeft: () => void;
  closeLeft: () => void;
  openRight: () => void;
  closeRight: () => void;
  isMobileOrTablet: boolean;
}

const ThreePanelCtx = createContext<ThreePanelContextValue>({
  leftOpen: false,
  rightOpen: false,
  toggleLeft: () => {},
  toggleRight: () => {},
  openLeft: () => {},
  closeLeft: () => {},
  openRight: () => {},
  closeRight: () => {},
  isMobileOrTablet: false,
});

export function useThreePanel() {
  return useContext(ThreePanelCtx);
}

interface ThreePanelProps {
  /** The conversation list / left panel content */
  leftPanel: React.ReactNode;
  /** Whether the left panel has content to show */
  hasActiveCenter?: boolean;
  /** The main thread / center content */
  centerPanel: React.ReactNode;
  /** The contact sidebar / right panel content */
  rightPanel?: React.ReactNode;
  /** Controlled open state for the right panel (for desktop toggle) */
  rightPanelOpen?: boolean;
  onRightPanelChange?: (open: boolean) => void;
  className?: string;
}

export function ThreePanel({
  leftPanel,
  hasActiveCenter = false,
  centerPanel,
  rightPanel,
  rightPanelOpen,
  onRightPanelChange,
  className,
}: ThreePanelProps) {
  const isMobileOrTablet = useIsMobileOrTablet();
  const isMobile = useIsMobile();

  // Left drawer state (mobile/tablet only)
  const [leftOpen, setLeftOpen] = useState(false);

  // Right panel/drawer state
  const [rightOpenInternal, setRightOpenInternal] = useState(!isMobileOrTablet);
  const isRightControlled = rightPanelOpen !== undefined;
  const rightOpen = isRightControlled ? rightPanelOpen : rightOpenInternal;

  const setRightOpen = useCallback(
    (val: boolean) => {
      if (isRightControlled) {
        onRightPanelChange?.(val);
      } else {
        setRightOpenInternal(val);
      }
    },
    [isRightControlled, onRightPanelChange]
  );

  // On resize: auto-close drawers when going to desktop
  useEffect(() => {
    if (!isMobileOrTablet) {
      setLeftOpen(false);
    }
  }, [isMobileOrTablet]);

  const ctx: ThreePanelContextValue = {
    leftOpen,
    rightOpen,
    toggleLeft: () => setLeftOpen((v) => !v),
    toggleRight: () => setRightOpen(!rightOpen),
    openLeft: () => setLeftOpen(true),
    closeLeft: () => setLeftOpen(false),
    openRight: () => setRightOpen(true),
    closeRight: () => setRightOpen(false),
    isMobileOrTablet,
  };

  return (
    <ThreePanelCtx.Provider value={ctx}>
      <div className={cn("relative flex h-full w-full overflow-hidden", className)}>

        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        {isMobileOrTablet ? (
          /* Tablet/Mobile: Drawer */
          <DrawerPanel
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            side="left"
            width="var(--sidebar-mobile-width)"
          >
            {leftPanel}
          </DrawerPanel>
        ) : (
          /* Desktop: Fixed column — show list OR hide it when a conv is active
             to give the thread more space on narrow laptops? No — we always
             show the list on desktop. The user approved 320/280px columns. */
          <div
            className="hidden lg:flex lg:flex-col h-full shrink-0 border-r border-border overflow-hidden"
            style={{
              width: "clamp(var(--panel-left-laptop), 20vw, var(--panel-left-width))",
            }}
          >
            {leftPanel}
          </div>
        )}

        {/* ── CENTER PANEL ───────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col min-w-0 min-h-0 h-full flex-1",
            // Mobile: hide left list when conv not selected (show conv list drawer instead)
            isMobile && !hasActiveCenter && "hidden"
          )}
        >
          {centerPanel}
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────── */}
        {rightPanel && (
          isMobileOrTablet ? (
            /* Tablet/Mobile: Drawer */
            <DrawerPanel
              open={rightOpen}
              onClose={() => setRightOpen(false)}
              side="right"
              width="min(var(--panel-right-width), 92vw)"
            >
              {rightPanel}
            </DrawerPanel>
          ) : (
            /* Desktop: Fixed column with toggle */
            rightOpen && (
              <div
                className="hidden lg:flex lg:flex-col h-full shrink-0 border-l border-border overflow-hidden"
                style={{
                  width: "clamp(var(--panel-right-laptop), 24vw, var(--panel-right-width))",
                }}
              >
                {rightPanel}
              </div>
            )
          )
        )}
      </div>
    </ThreePanelCtx.Provider>
  );
}

/* ============================================================
 * DrawerPanel — full-height slide-out overlay
 * Used for left/right panels on mobile and tablet
 * ============================================================ */

interface DrawerPanelProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: string;
  children: React.ReactNode;
  className?: string;
}

export function DrawerPanel({
  open,
  onClose,
  side = "left",
  width = "280px",
  children,
  className,
}: DrawerPanelProps) {
  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity duration-200",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-card border-border shadow-2xl",
          "transition-transform duration-200 ease-out will-change-transform",
          side === "left"
            ? cn("left-0 border-r", open ? "translate-x-0" : "-translate-x-full")
            : cn("right-0 border-l", open ? "translate-x-0" : "translate-x-full"),
          className
        )}
        style={{ width }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(
            "absolute top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md",
            "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            side === "left" ? "right-3" : "left-3"
          )}
        >
          <X className="h-4 w-4" />
        </button>
        {/* Content */}
        <div className="flex flex-col h-full w-full overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}

/* ============================================================
 * AppShell — outermost responsive shell
 * Wraps [Sidebar] + [Header + main content]
 * ============================================================ */

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  /** When true, main area is flush (no padding) — e.g. Inbox */
  flush?: boolean;
}

export function AppShell({ sidebar, header, children, flush }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebar}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {header}
        <main
          className={cn(
            "flex-1 overflow-hidden",
            !flush && "overflow-y-auto p-4 sm:p-6"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
 * PageContainer — standard padded content area
 * ============================================================ */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Max-width cap for ultra-wide screens */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const MAX_WIDTH_MAP = {
  sm:   "max-w-screen-sm",
  md:   "max-w-screen-md",
  lg:   "max-w-screen-lg",
  xl:   "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "2xl",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8",
        MAX_WIDTH_MAP[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ============================================================
 * PageHeader — title + actions row
 * Actions collapse into overflow menu on mobile
 * ============================================================ */

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-6",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-fluid-2xl font-bold text-foreground leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-fluid-sm text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * AdaptiveToolbar — action buttons with overflow "More" menu
 *
 * Pass `items` as an array of { key, label, icon, onClick, primary? }.
 * On desktop: shows all items.
 * On tablet/mobile: shows `visibleCount` items + "More" dropdown.
 * ============================================================ */

export interface ToolbarItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** If true, always show (never overflow). Default: false. */
  primary?: boolean;
  /** Render as a custom node (replaces the default button) */
  custom?: React.ReactNode;
}

interface AdaptiveToolbarProps {
  items: ToolbarItem[];
  /** How many items to show before overflow. Auto-computed from breakpoint if not set. */
  visibleCount?: number;
  className?: string;
  buttonClassName?: string;
}

export function AdaptiveToolbar({
  items,
  visibleCount,
  className,
  buttonClassName,
}: AdaptiveToolbarProps) {
  const isMobileOrTablet = useIsMobileOrTablet();
  const isMobile = useIsMobile();

  const limit =
    visibleCount ??
    (isMobile ? 1 : isMobileOrTablet ? 3 : items.length);

  const primaries = items.filter((i) => i.primary);
  const secondaries = items.filter((i) => !i.primary);

  // Always show primaries; fill remaining slots with secondaries
  const visibleSecondaries = secondaries.slice(0, Math.max(0, limit - primaries.length));
  const overflowItems = secondaries.slice(visibleSecondaries.length);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Primary items — always visible */}
      {primaries.map((item) =>
        item.custom ? (
          <div key={item.key}>{item.custom}</div>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
              "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
              "min-h-[var(--touch-min)] min-w-[var(--touch-min)]",
              buttonClassName
            )}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        )
      )}

      {/* Visible secondary items */}
      {visibleSecondaries.map((item) =>
        item.custom ? (
          <div key={item.key}>{item.custom}</div>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
              "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
              "min-h-[var(--touch-min)] min-w-[var(--touch-min)]",
              buttonClassName
            )}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        )
      )}

      {/* Overflow "More" menu */}
      {overflowItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs",
              "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              "min-h-[var(--touch-min)] min-w-[var(--touch-min)]"
            )}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border bg-popover min-w-[160px]">
            {overflowItems.map((item) => (
              <DropdownMenuItem
                key={item.key}
                onClick={item.onClick}
                disabled={item.disabled}
                className="text-sm gap-2"
              >
                {item.icon && (
                  <span className="h-4 w-4 shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/* ============================================================
 * CardGrid — auto-fit responsive card grid
 * ============================================================ */

interface CardGridProps {
  children: React.ReactNode;
  /** Minimum card width before wrapping */
  minCardWidth?: string;
  gap?: string;
  className?: string;
}

export function CardGrid({
  children,
  minCardWidth = "300px",
  gap = "var(--space-4)",
  className,
}: CardGridProps) {
  return (
    <div
      className={cn("w-full", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minCardWidth}, 100%), 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
 * SplitView — 2-column layout that collapses to 1 on mobile
 * ============================================================ */

interface SplitViewProps {
  children: React.ReactNode;
  /** Width of the side panel (the non-primary column) */
  sideWidth?: string;
  side?: "left" | "right";
  className?: string;
}

export function SplitView({
  children,
  sideWidth = "320px",
  side = "right",
  className,
}: SplitViewProps) {
  const cols =
    side === "right"
      ? `1fr ${sideWidth}`
      : `${sideWidth} 1fr`;

  return (
    <div
      className={cn("w-full", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `minmax(0, ${cols.split(" ").map(() => "1fr").join(" ")})`,
      }}
    >
      {/* On mobile: stack vertically */}
      <style>{`
        @media (max-width: 767px) {
          .split-view-${side} {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
