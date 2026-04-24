import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar }  from "@/components/shared/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F3FA] md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <Topbar />
        <main className="flex-1 p-4 md:overflow-y-auto md:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
