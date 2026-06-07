import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Trash2, Users, Loader2 } from "lucide-react";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface MarketingMember extends ProfileRow {
  granted_at?: string;
}

export const TeamAccessManagement = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<MarketingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data: roleRows, error } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "marketing");
      if (error) throw error;
      const ids = (roleRows || []).map((r: any) => r.user_id);
      if (ids.length === 0) {
        setMembers([]);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      setMembers(
        (roleRows || []).map((r: any) => ({
          id: r.user_id,
          first_name: map.get(r.user_id)?.first_name ?? null,
          last_name: map.get(r.user_id)?.last_name ?? null,
          granted_at: r.created_at,
        }))
      );
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load members", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      // Match by name parts or by id prefix
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,id.eq.${isUuid(q) ? q : "00000000-0000-0000-0000-000000000000"}`)
        .limit(20);
      if (error) throw error;
      setResults(data || []);
    } catch (e: any) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const grantAccess = async (userId: string) => {
    setActionId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "marketing" as any });
      if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
      toast({ title: "Access granted", description: "User can now access the Marketing Dashboard." });
      await loadMembers();
    } catch (e: any) {
      toast({ title: "Failed to grant access", description: e.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const revokeAccess = async (userId: string) => {
    setActionId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "marketing");
      if (error) throw error;
      toast({ title: "Access revoked" });
      await loadMembers();
    } catch (e: any) {
      toast({ title: "Failed to revoke", description: e.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const memberIds = new Set(members.map((m) => m.id));
  const displayName = (p: ProfileRow) =>
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Unnamed user";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Grant Marketing Access
          </CardTitle>
          <CardDescription>
            Search for a user by name or user ID, then grant them access to the Marketing Dashboard (Notifications + Campaigns only).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or paste user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          {results.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{displayName(r)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                    <TableCell className="text-right">
                      {memberIds.has(r.id) ? (
                        <Badge variant="secondary">Already has access</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => grantAccess(r.id)}
                          disabled={actionId === r.id}
                        >
                          {actionId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          <span className="ml-2">Grant</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Marketing Team Members
            <Badge variant="secondary" className="ml-2">{members.length}</Badge>
          </CardTitle>
          <CardDescription>Users with active access to the Marketing Dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No marketing team members yet. Search above to grant access.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{displayName(m)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => revokeAccess(m.id)}
                        disabled={actionId === m.id}
                      >
                        {actionId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="ml-2">Revoke</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAccessManagement;
