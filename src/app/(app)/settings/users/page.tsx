import { getSession } from "@/lib/auth";
import { listUsers } from "@/server/user-service";
import { UserManager } from "@/components/settings/UserManager";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
  const [session, users] = await Promise.all([getSession(), listUsers()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Users</h1>
        <p className="text-sm text-slate-400">{users.length} user(s)</p>
      </div>
      <UserManager users={users} currentUserId={session?.userId ?? null} />
    </div>
  );
}
