
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { grantDoctorAccess, revokeDoctorAccess } from "@/services/doctorService";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye, Pill } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminWalletStats } from "@/components/admin/AdminWalletStats";
import { AdminWithdrawalRequests } from "@/components/admin/AdminWithdrawalRequests";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { AdminCommissionWallet } from "@/components/admin/AdminCommissionWallet";
import { adminWalletService } from "@/services/adminWalletService";
import type { AdminWalletStats as StatsType } from "@/services/adminWalletService";
import type { WalletTransaction } from "@/services/walletService";
import type { WithdrawalRequest } from "@/services/adminWalletService";

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_doctor: boolean;
}

interface DoctorApplication {
  id: string;
  name: string; 
  specialization: string;
  hospital: string;
  degrees: string;
  experience: number;
  registration_number: string;
  verified: boolean;
  degree_verification_photo?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  region?: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: rolesLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [doctorApplications, setDoctorApplications] = useState<DoctorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorApplication | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  
  // Wallet management states
  const [walletStats, setWalletStats] = useState<StatsType>({
    totalWallets: 0,
    totalBalance: 0,
    totalEarnings: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalAmount: 0,
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    if (!rolesLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have administrator permissions.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [user, isAdmin, rolesLoading, navigate, toast]);

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
    
    // Fetch doctor applications
    const fetchDoctorApplications = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        
        // Get all doctor applications
        const { data, error } = await supabase
          .from('doctors')
          .select('*');
        
        if (error) {
          console.error("Error fetching doctor applications:", error);
          setDoctorApplications([]);
          return;
        }
        
        if (!data || data.length === 0) {
          setDoctorApplications([]);
          return;
        }

        setDoctorApplications(data as DoctorApplication[]);
      } catch (error) {
        console.error("Error fetching doctor applications:", error);
        toast({
          title: "Error",
          description: "Failed to load doctor applications. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Fetch wallet data
    const fetchWalletData = async () => {
      if (!isAdmin) return;
      
      setWalletLoading(true);
      try {
        const [statsData, transactionsData, requestsData] = await Promise.all([
          adminWalletService.getAdminStats(),
          adminWalletService.getAllTransactions({ limit: 50 }),
          adminWalletService.getWithdrawalRequests(),
        ]);

        setWalletStats(statsData);
        setTransactions(transactionsData);
        setWithdrawalRequests(requestsData);
      } catch (error) {
        console.error("Error loading wallet data:", error);
      } finally {
        setWalletLoading(false);
      }
    };
    
    if (isAdmin) {
      fetchUsers();
      fetchDoctorApplications();
      fetchWalletData();
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
            description: "Doctor access has been revoked from this user. They will no longer appear in the appointments section."
          });
        }
      } else {
        // Grant access
        success = await grantDoctorAccess(userId);
        if (success) {
          toast({
            title: "Access Granted",
            description: "Doctor access has been granted to this user. They will now appear in the appointments section."
          });
        }
      }
      
      // Update local state
      if (success) {
        // Update users list
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_doctor: !currentStatus } : u
        ));
        
        // Update doctor applications if necessary
        setDoctorApplications(doctorApplications.map(d => 
          d.id === userId ? { ...d, verified: !currentStatus } : d
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

  const handleViewApplication = (doctor: DoctorApplication) => {
    setSelectedDoctor(doctor);
    setViewDialogOpen(true);
  };

  if (rolesLoading || loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-6xl grid-cols-5">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="doctors">Doctor Applications</TabsTrigger>
            <TabsTrigger value="medicines" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Medicine Catalog
            </TabsTrigger>
            <TabsTrigger value="wallets">
              💰 Wallets
              {walletStats.pendingWithdrawals > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {walletStats.pendingWithdrawals}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="earnings">💰 Platform Earnings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Grant or revoke doctor dashboard access</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-600">
                  <strong>Note:</strong> When you grant doctor access to a user, they will appear in the appointments section for patients to book with them.
                  Only doctors with verified accounts will be visible in the appointment booking system.
                </p>
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
          </TabsContent>
          
          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Applications</CardTitle>
                <CardDescription>Review and approve doctor registration applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      doctorApplications.map(doctor => (
                        <TableRow key={doctor.id}>
                          <TableCell>{doctor.name}</TableCell>
                          <TableCell>{doctor.email || `user-${doctor.id.substring(0, 8)}@example.com`}</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={doctor.verified ? "default" : "secondary"}
                            >
                              {doctor.verified ? 'Approved' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewApplication(doctor)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                            <Button 
                              size="sm" 
                              variant={doctor.verified ? "destructive" : "default"}
                              onClick={() => handleToggleDoctorAccess(doctor.id, doctor.verified)}
                            >
                              {doctor.verified ? 'Revoke' : 'Approve'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medicines">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicine Catalog Management
                </CardTitle>
                <CardDescription>
                  Manage the medicines available for customers to order. All nearby pharmacies will be notified when orders are placed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Pill className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Medicine Catalog</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Add and manage medicines in the central catalog. When customers order, nearby pharmacies receive notifications and can accept orders.
                  </p>
                  <Button onClick={() => navigate('/admin-dashboard/medicines')} size="lg">
                    <Pill className="h-4 w-4 mr-2" />
                    Manage Medicine Catalog
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="wallets" className="space-y-6">
            <AdminWalletStats stats={walletStats} loading={walletLoading} />
            
            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                <TabsTrigger value="withdrawals">
                  Withdrawal Requests
                  {walletStats.pendingWithdrawals > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {walletStats.pendingWithdrawals}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions">
                <TransactionHistory transactions={transactions} loading={walletLoading} />
              </TabsContent>

              <TabsContent value="withdrawals">
                <AdminWithdrawalRequests
                  requests={withdrawalRequests}
                  loading={walletLoading}
                  onUpdate={async () => {
                    const [statsData, requestsData] = await Promise.all([
                      adminWalletService.getAdminStats(),
                      adminWalletService.getWithdrawalRequests(),
                    ]);
                    setWalletStats(statsData);
                    setWithdrawalRequests(requestsData);
                  }}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <AdminCommissionWallet />
          </TabsContent>
        </Tabs>
      </div>

      {/* Doctor Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Doctor Application Details</DialogTitle>
            <DialogDescription>
              Review the information provided by the doctor below.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDoctor && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Name</h3>
                  <p className="text-sm">{selectedDoctor.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Email</h3>
                  <p className="text-sm">{selectedDoctor.email || `user-${selectedDoctor.id.substring(0, 8)}@example.com`}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Specialization</h3>
                  <p className="text-sm">{selectedDoctor.specialization}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Experience</h3>
                  <p className="text-sm">{selectedDoctor.experience} years</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Degrees</h3>
                  <p className="text-sm">{selectedDoctor.degrees}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Registration Number</h3>
                  <p className="text-sm">{selectedDoctor.registration_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Hospital</h3>
                  <p className="text-sm">{selectedDoctor.hospital}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Location</h3>
                  <p className="text-sm">{selectedDoctor.address || 'Not provided'}, {selectedDoctor.region || 'Not provided'}</p>
                </div>
              </div>
              
              {selectedDoctor.degree_verification_photo && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Verification Document</h3>
                  <div className="border rounded-md overflow-hidden">
                    {selectedDoctor.degree_verification_photo.endsWith('.pdf') ? (
                      <div className="p-4 flex flex-col items-center justify-center bg-gray-50">
                        <img src="/placeholder.svg" alt="PDF Document" className="w-12 h-12 mb-2" />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(selectedDoctor.degree_verification_photo, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" /> View PDF
                        </Button>
                      </div>
                    ) : (
                      <img 
                        src={selectedDoctor.degree_verification_photo} 
                        alt="Verification document" 
                        className="w-full h-48 object-cover" 
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedDoctor && (
              <div className="w-full flex justify-between">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant={selectedDoctor.verified ? "destructive" : "default"}
                  onClick={() => {
                    handleToggleDoctorAccess(selectedDoctor.id, selectedDoctor.verified);
                    setViewDialogOpen(false);
                  }}
                >
                  {selectedDoctor.verified ? 'Revoke Access' : 'Approve Application'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
