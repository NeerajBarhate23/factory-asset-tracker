import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { useAuth } from '../../contexts/AuthContext';
// TODO: Implement backend data export/import
// import { exportDatabase, importDatabase, resetDatabase } from '../../lib/database';
import { toast } from 'sonner@2.0.3';
import { User, Database, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

export function SettingsView() {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleExportDatabase = () => {
    toast.info('Backend data export will be implemented soon');
  };

  const handleImportDatabase = () => {
    toast.info('Backend data import will be implemented soon');
  };

  const handleResetDatabase = () => {
    toast.info('Backend database reset will be implemented soon');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system preferences and database
        </p>
      </div>

      {/* Profile Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3>Profile Information</h3>
            <p className="text-sm text-muted-foreground">Your account details</p>
          </div>
        </div>
        <div className="space-y-3 max-w-xl">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span>{user?.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span>{user?.email}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Role:</span>
            <span className="capitalize">{user?.role.replace('_', ' ')}</span>
          </div>
        </div>
      </Card>

      {/* Database Management */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3>Database Management</h3>
            <p className="text-sm text-muted-foreground">
              Backup, restore, or reset your local database
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This application uses SQLite running in your browser. All data is stored locally
            in IndexedDB and automatically saved every 5 seconds.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Export Database</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Download a backup of your database as a .db file
            </p>
            <Button onClick={handleExportDatabase} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Database
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Import Database</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Restore from a previously exported .db file
            </p>
            <Button onClick={handleImportDatabase} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Import Database
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Reset Database</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Delete all data and reset to initial state with sample data
            </p>
            <Button 
              onClick={handleResetDatabase} 
              variant="destructive" 
              className="w-full"
              disabled={resetting}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {resetting ? 'Resetting...' : 'Reset Database'}
            </Button>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3>System Information</h3>
            <p className="text-sm text-muted-foreground">Application details</p>
          </div>
        </div>
        <div className="space-y-2 text-sm max-w-xl">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Database:</span>
            <span>SQLite (in-browser)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Storage:</span>
            <span>IndexedDB</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Auto-save:</span>
            <span>Every 5 seconds</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
