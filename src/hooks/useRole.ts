import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "owner" | "member" | null;

interface UseRoleReturn {
  role: UserRole;
  ownerId: string | null; // the workspace owner's id
  loading: boolean;
  isOwner: boolean;
  isMember: boolean;
}

export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<UserRole>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detectRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Check if this user is a member of someone else's workspace
      const { data: membership } = await supabase
        .from("team_members")
        .select("role, owner_id, status")
        .eq("member_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (membership) {
        // This user is a member of another owner's workspace
        setRole("member");
        setOwnerId(membership.owner_id);
      } else {
        // This user is an owner (their own workspace)
        setRole("owner");
        setOwnerId(user.id);
      }

      setLoading(false);
    }

    detectRole();
  }, []);

  return {
    role,
    ownerId,
    loading,
    isOwner: role === "owner",
    isMember: role === "member",
  };
}