
export default function NomineeAccess() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Nominee Access</h1>

        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground text-center py-12">
            No access requests pending
          </p>
        </div>
      </div>
    </div>
  );
}