
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { grantDoctorAccess, revokeDoctorAccess } from "@/services/doctorService";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_doctor: boolean;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error checking admin status:", error);
            navigate('/dashboard');
            return;
          }
          
          const hasAdminAccess = !!data?.is_admin;
          setIsAdmin(hasAdminAccess);
          
          if (!hasAdminAccess) {
            toast({
              title: "Access Denied",
              description: "You don't have administrator permissions.",
              variant: "destructive"
            });
            navigate('/dashboard');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          navigate('/dashboard');
        }
      } else {
        navigate('/');
      }
    };
    
    checkAdmin();
  }, [user, navigate, toast]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        
        // Get all profiles with is_doctor field
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, is_doctor');
        
        if (error) {
          console.error("Error fetching profiles:", error);
          setUsers([]);
          setLoading(false);
          return;
        }
        
        if (!data || data.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // Get user emails from auth.users (simulated here)
        // In a real app, this would require an admin API or edge function
        const combinedUsers: UserProfile[] = data.map(profile => {
          return {
            id: profile.id,
            email: `user-${profile.id.substring(0, 8)}@example.com`, // Simulated email
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined,
            is_doctor: !!profile.is_doctor
          };
        });
        
        setUsers(combinedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, toast]);

  const handleToggleDoctorAccess = async (userId: string, currentStatus: boolean) => {
    try {
      let success;
      
      if (currentStatus) {
        // Revoke access
        success = await revokeDoctorAccess(userId);
        if (success) {
          toast({
            title: "Access Revoked",
            description: "Doctor access has been revoked from this user."
          });
        }
      } else {
        // Grant access
        success = await grantDoctorAccess(userId);
        if (success) {
          toast({
            title: "Access Granted",
            description: "Doctor access has been granted to this user."
          });
        }
      }
      
      // Update local state
      if (success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_doctor: !currentStatus } : u
        ));
      }
    } catch (error) {
      console.error("Error updating doctor access:", error);
      toast({
        title: "Error",
        description: "Failed to update doctor access. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Admin Dashboard</h1>
          <p className="text-slate-500">Manage user access and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Grant or revoke doctor dashboard access</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Doctor Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                          : 'Not provided'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_doctor 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_doctor ? 'Enabled' : 'Disabled'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant={user.is_doctor ? "destructive" : "default"}
                          onClick={() => handleToggleDoctorAccess(user.id, user.is_doctor)}
                        >
                          {user.is_doctor ? 'Revoke Access' : 'Grant Access'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
