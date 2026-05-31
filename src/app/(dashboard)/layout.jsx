import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden pt-14 md:pt-0 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
