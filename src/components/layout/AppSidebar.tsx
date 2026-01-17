import {
  Home,
  Package,
  ArrowRightLeft,
  ClipboardList,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '../ui/sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // Which roles can see this menu item
}

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home, roles: ['admin', 'shop_incharge', 'operator', 'ADMIN', 'SHOP_INCHARGE', 'OPERATOR'] as any },
    { id: "assets", label: "Assets", icon: Package, roles: ['admin', 'shop_incharge', 'operator', 'ADMIN', 'SHOP_INCHARGE', 'OPERATOR'] as any },
    { id: "movements", label: "Movements", icon: ArrowRightLeft, roles: ['admin', 'shop_incharge', 'operator', 'ADMIN', 'SHOP_INCHARGE', 'OPERATOR'] as any },
    { id: "audits", label: "Audits", icon: ClipboardList, roles: ['admin', 'shop_incharge', 'operator', 'ADMIN', 'SHOP_INCHARGE', 'OPERATOR'] as any },
    { id: "reports", label: "Reports", icon: BarChart3, roles: ['admin', 'shop_incharge', 'operator', 'ADMIN', 'SHOP_INCHARGE', 'OPERATOR'] as any },
    { id: "users", label: "Users", icon: Users, roles: ['admin', 'ADMIN'] as any },
    { id: "settings", label: "Settings", icon: Settings, roles: ['admin', 'shop_incharge', 'operator', 'ADMIN', 'SHOP_INCHARGE', 'OPERATOR'] as any },
  ];

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { user } = useAuth();

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm">Asset Tracker</h2>
            <p className="text-xs text-muted-foreground">Factory Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.id)}
                    isActive={activeView === item.id}
                    tooltip={item.label}
                    className="min-h-[44px]"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
