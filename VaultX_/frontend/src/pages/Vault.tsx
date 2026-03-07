import { Lock, Key, FileText, Plus } from 'lucide-react';

export default function Vault() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Your Vault</h1>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Asset categories */}
          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Passwords</h3>
                <p className="text-xs text-muted-foreground">12 items</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Crypto Wallets</h3>
                <p className="text-xs text-muted-foreground">3 items</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Documents</h3>
                <p className="text-xs text-muted-foreground">8 items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}