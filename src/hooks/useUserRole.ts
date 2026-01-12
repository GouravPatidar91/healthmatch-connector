import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'patient' | 'pharmacy' | 'admin' | 'delivery_partner' | 'doctor';

export const useUserRole = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
        setRoles(data.map(r => r.role as UserRole));
      }
      setLoading(false);
    };

    fetchRoles();

    // Subscribe to role changes
    const channel = supabase
      .channel('user-roles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}` },
        () => fetchRoles()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return {
    roles,
    loading,
    isAdmin: roles.includes('admin'),
    isPharmacy: roles.includes('pharmacy'),
    isDoctor: roles.includes('doctor'),
    isDeliveryPartner: roles.includes('delivery_partner'),
    isPatient: roles.includes('patient') || roles.length === 0, // Default to patient
  };
};
