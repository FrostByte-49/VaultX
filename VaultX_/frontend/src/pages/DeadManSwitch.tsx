import { Clock } from 'lucide-react';

export default function DeadManSwitch() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dead Man Switch</h1>
        <p className="text-muted-foreground mb-8">Configure your digital inheritance protocol</p>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Inactivity Period</h3>
              <p className="text-sm text-muted-foreground">Set when the switch triggers</p>
            </div>
          </div>

          <div className="space-y-4">
            <select className="w-full p-3 bg-background border border-border rounded-xl">
              <option>3 months</option>
              <option>6 months</option>
              <option>1 year</option>
              <option>2 years</option>
            </select>

            <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}