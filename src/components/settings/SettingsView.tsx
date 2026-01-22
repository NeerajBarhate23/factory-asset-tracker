import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { User } from 'lucide-react';

export function SettingsView() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and preferences
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
    </div>
  );
}
