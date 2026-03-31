import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Bell, DollarSign, User } from 'lucide-react';
import { useNotificationsStore } from '@/stores/notificationsStore';

const tabs = [
  { to: '/waiter/dashboard', icon: ClipboardList, label: 'Mesas' },
  { to: '/waiter/alerts', icon: Bell, label: 'Alertas' },
  { to: '/waiter/tips', icon: DollarSign, label: 'Propinas' },
  { to: '/waiter/profile', icon: User, label: 'Perfil' },
];

export default function WaiterBottomNav() {
  const location = useLocation();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-w-bg/95 backdrop-blur-md border-t border-w-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 min-w-[60px] relative"
            >
              {isActive && (
                <div className="absolute -top-0.5 w-8 h-0.5 bg-w-brand rounded-full" />
              )}
              <div className="relative">
                <Icon size={20} className={isActive ? 'text-w-brand' : 'text-w-text-secondary'} />
                {label === 'Alertas' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-w-error text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </div>
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
