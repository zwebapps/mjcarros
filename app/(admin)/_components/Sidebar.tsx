import NavItem from "./nav-item";
import Logo from "@/components/Logo";

const Sidebar = () => {
  return (
    <aside className="h-full w-full bg-slate-950 text-slate-100">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/10 flux-dot-grid">
        <div className="shrink-0">
          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-1 flux-glow">
            <Logo />
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold flux-gradient-text">MJ Carros</div>
          <div className="text-xs text-slate-300">Admin Console</div>
        </div>
      </div>
      <div className="px-3 py-4">
        <NavItem />
      </div>
    </aside>
  );
};

export default Sidebar;
