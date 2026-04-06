import UsersClient from "@/components/settings/UsersClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/login");
  }

  const userRole = (session.user as any).role;
  
  if (userRole !== "ADMIN_RH") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Vous n&apos;avez pas accès à cette page.</p>
      </div>
    );
  }

  return <UsersClient />;
}
