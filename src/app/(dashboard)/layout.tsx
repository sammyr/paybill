import { Sidebar } from "@/components/sidebar/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="md:pl-64 min-h-screen">
        <div className="p-4">
          {children}
        </div>
      </main>
    </>
  );
}
