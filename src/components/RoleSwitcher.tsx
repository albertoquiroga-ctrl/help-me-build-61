import { useNavigate } from 'react-router-dom';
import { useRoleStore, type AppRole } from '@/stores/roleStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roles: { value: AppRole; emoji: string; label: string; path: string }[] = [
  { value: 'waiter', emoji: '🍽️', label: 'Mesero', path: '/waiter/dashboard' },
  { value: 'hostess', emoji: '💁', label: 'Hostess', path: '/hostess/dashboard' },
  { value: 'bar', emoji: '🍸', label: 'Barra', path: '/bar/dashboard' },
];

export default function RoleSwitcher() {
  const { activeRole, setRole } = useRoleStore();
  const navigate = useNavigate();
  const current = roles.find((r) => r.value === activeRole)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-w-elevated border border-w-border text-[13px] font-medium text-w-text min-h-[36px]">
          <span>{current.emoji}</span>
          <span>{current.label}</span>
          <span className="text-w-text-secondary text-[10px]">▼</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => {
              setRole(role.value);
              navigate(role.path);
            }}
            className={`gap-2 ${role.value === activeRole ? 'bg-w-elevated' : ''}`}
          >
            <span>{role.emoji}</span>
            <span>{role.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
