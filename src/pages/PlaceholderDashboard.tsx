const PlaceholderDashboard = ({ role }: { role: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-bold text-foreground mb-2">{role} Dashboard</h1>
      <p className="text-muted-foreground">This dashboard is under development. The HR module is fully functional — select HR role to explore the governance suite.</p>
    </div>
  </div>
);

export default PlaceholderDashboard;
