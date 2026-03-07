import { Vault, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back to your vault</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
            <Vault className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Your Vault</h3>
            <p className="text-sm text-muted-foreground mb-4">Manage your digital assets</p>
            <button 
              onClick={() => navigate('/vault')}
              className="text-primary text-sm font-medium hover:underline"
            >
              View Vault →
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
            <Users className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nominees</h3>
            <p className="text-sm text-muted-foreground mb-4">Manage trusted contacts</p>
            <button 
              onClick={() => navigate('/nominees')}
              className="text-purple-500 text-sm font-medium hover:underline"
            >
              View Nominees →
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
            <Clock className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Dead Man Switch</h3>
            <p className="text-sm text-muted-foreground mb-4">Configure inheritance</p>
            <button 
              onClick={() => navigate('/dead-man-switch')}
              className="text-amber-500 text-sm font-medium hover:underline"
            >
              Configure →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}