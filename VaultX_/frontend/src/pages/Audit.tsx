import { Activity, Shield } from 'lucide-react';

export default function Audit() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Audit Log</h1>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <Activity className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">Vault accessed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <Shield className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}