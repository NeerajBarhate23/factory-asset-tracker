import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { AppSidebar } from './components/layout/AppSidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AssetsList } from './components/assets/AssetsList';
import { AssetDetail } from './components/assets/AssetDetail';
import { MovementsView } from './components/movements/MovementsView';
import { AuditsView } from './components/audits/AuditsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { UserManagement } from './components/admin/UserManagement';
import APITester from './components/admin/APITester';
import { LoginForm } from './components/auth/LoginForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Handle deep linking from QR code scans
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const assetParam = urlParams.get('asset');
    
    if (assetParam && user) {
      // Find asset by UID and navigate to it
      import('./lib/api-client').then(({ assetsApi }) => {
        assetsApi.getAll().then((assets) => {
          try {
            const asset = assets.find((a: any) => a.assetUid === assetParam || a.asset_uid === assetParam);
            if (asset) {
              setActiveView('assets');
              setSelectedAssetId(asset.id);
              // Clear URL parameter
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch (err) {
            console.error('Error finding asset:', err);
          }
        }).catch(err => {
          console.error('Error fetching assets:', err);
        });
      });
    }
  }, [user]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading Factory Asset Tracker...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  const renderView = () => {
    // Asset detail view
    if (selectedAssetId) {
      return (
        <AssetDetail
          assetId={selectedAssetId}
          onBack={() => setSelectedAssetId(null)}
        />
      );
    }

    // Main views
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'assets':
        return <AssetsList onViewAsset={setSelectedAssetId} />;
      case 'movements':
        return <MovementsView />;
      case 'audits':
        return <AuditsView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        // Only show User Management to admins
        return user?.role === 'admin' || user?.role === 'ADMIN' ? <UserManagement /> : <DashboardView />;
      case 'api-test':
        return <APITester />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          {/* Sidebar */}
          <AppSidebar activeView={activeView} onViewChange={setActiveView} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile Sidebar Trigger */}
            <div className="lg:hidden border-b bg-background p-4">
              <SidebarTrigger />
            </div>

            {/* Navbar */}
            <Navbar />

            {/* Main View */}
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto p-6 max-w-7xl">
                {renderView()}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
