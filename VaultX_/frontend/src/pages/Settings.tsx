import { User, Bell, Shield as ShieldIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Profile</h2>
            </div>
            <p className="text-muted-foreground text-sm">Manage your account information</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            </div>
            <p className="text-muted-foreground text-sm">Configure alert preferences</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldIcon className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-foreground">Security</h2>
            </div>
            <p className="text-muted-foreground text-sm">2FA, passwords, and encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}