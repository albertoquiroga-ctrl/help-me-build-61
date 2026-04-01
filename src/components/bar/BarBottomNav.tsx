import { NavLink, useLocation } from 'react-router-dom';
import { GlassWater, User } from 'lucide-react';

const tabs = [
  { to: '/bar/dashboard', icon: GlassWater, label: 'Pedidos' },
  { to: '/bar/profile', icon: User, label: 'Perfil' },
];

export default function BarBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-w-bg/95 backdrop-blur-md border-t border-w-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink key={to} to={to} className="flex flex-col items-center gap-0.5 min-w-[60px] relative">
              {isActive && <div className="absolute -top-0.5 w-8 h-0.5 bg-w-brand rounded-full" />}
              <Icon size={20} className={isActive ? 'text-w-brand' : 'text-w-text-secondary'} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-w-brand' : 'text-w-text-secondary'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
