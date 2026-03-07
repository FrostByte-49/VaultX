import { UserPlus } from 'lucide-react';

export default function Nominees() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nominees</h1>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Nominee
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground text-center py-12">
            You haven't added any nominees yet. Add trusted individuals who can access your vault.
          </p>
        </div>
      </div>
    </div>
  );
}