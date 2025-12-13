import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Search, ArrowLeft, Pill, Loader2 } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  brand: string;
  generic_name?: string;
  manufacturer: string;
  category: string;
  composition?: string;
  dosage: string;
  form: string;
  pack_size: string;
  mrp: number;
  description?: string;
  side_effects?: string;
  contraindications?: string;
  storage_instructions?: string;
  prescription_required: boolean;
  drug_schedule?: string;
  image_url?: string;
  created_at: string;
}

const categories = [
  'Pain Relief',
  'Cold & Cough',
  'Fever',
  'Digestive Health',
  'Cardiovascular',
  'Diabetes',
  'Vitamins & Supplements',
  'Dermatology',
  'Pediatric',
  'First Aid',
  'Antibiotics',
  'Antifungal',
  'Antiviral',
  'Mental Health',
  'Respiratory',
  'Other'
];

const medicineForm = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Powder',
  'Gel',
  'Spray',
  'Patch',
  'Suspension',
  'Other'
];

export default function AdminMedicineCatalog() {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    generic_name: '',
    manufacturer: '',
    category: '',
    composition: '',
    dosage: '',
    form: '',
    pack_size: '',
    mrp: '',
    description: '',
    side_effects: '',
    contraindications: '',
    storage_instructions: '',
    prescription_required: false,
    drug_schedule: '',
    image_url: ''
  });

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

  useEffect(() => {
    if (isAdmin) {
      fetchMedicines();
    }
  }, [isAdmin]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to load medicines.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      generic_name: '',
      manufacturer: '',
      category: '',
      composition: '',
      dosage: '',
      form: '',
      pack_size: '',
      mrp: '',
      description: '',
      side_effects: '',
      contraindications: '',
      storage_instructions: '',
      prescription_required: false,
      drug_schedule: '',
      image_url: ''
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.brand || !formData.manufacturer || !formData.category || !formData.dosage || !formData.form || !formData.pack_size || !formData.mrp) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('medicines')
        .insert({
          name: formData.name,
          brand: formData.brand,
          generic_name: formData.generic_name || null,
          manufacturer: formData.manufacturer,
          category: formData.category,
          composition: formData.composition || null,
          dosage: formData.dosage,
          form: formData.form,
          pack_size: formData.pack_size,
          mrp: parseFloat(formData.mrp),
          description: formData.description || null,
          side_effects: formData.side_effects || null,
          contraindications: formData.contraindications || null,
          storage_instructions: formData.storage_instructions || null,
          prescription_required: formData.prescription_required,
          drug_schedule: formData.drug_schedule || null,
          image_url: formData.image_url || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine added to catalog successfully."
      });
      
      setIsAddDialogOpen(false);
      resetForm();
      fetchMedicines();
    } catch (error: any) {
      console.error('Error adding medicine:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add medicine.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMedicine) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('medicines')
        .update({
          name: formData.name,
          brand: formData.brand,
          generic_name: formData.generic_name || null,
          manufacturer: formData.manufacturer,
          category: formData.category,
          composition: formData.composition || null,
          dosage: formData.dosage,
          form: formData.form,
          pack_size: formData.pack_size,
          mrp: parseFloat(formData.mrp),
          description: formData.description || null,
          side_effects: formData.side_effects || null,
          contraindications: formData.contraindications || null,
          storage_instructions: formData.storage_instructions || null,
          prescription_required: formData.prescription_required,
          drug_schedule: formData.drug_schedule || null,
          image_url: formData.image_url || null
        })
        .eq('id', selectedMedicine.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine updated successfully."
      });
      
      setIsEditDialogOpen(false);
      setSelectedMedicine(null);
      resetForm();
      fetchMedicines();
    } catch (error: any) {
      console.error('Error updating medicine:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update medicine.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMedicine) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', selectedMedicine.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine deleted from catalog."
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedMedicine(null);
      fetchMedicines();
    } catch (error: any) {
      console.error('Error deleting medicine:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete medicine.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      brand: medicine.brand,
      generic_name: medicine.generic_name || '',
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      composition: medicine.composition || '',
      dosage: medicine.dosage,
      form: medicine.form,
      pack_size: medicine.pack_size,
      mrp: medicine.mrp.toString(),
      description: medicine.description || '',
      side_effects: medicine.side_effects || '',
      contraindications: medicine.contraindications || '',
      storage_instructions: medicine.storage_instructions || '',
      prescription_required: medicine.prescription_required || false,
      drug_schedule: medicine.drug_schedule || '',
      image_url: medicine.image_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (rolesLoading || loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const MedicineForm = () => (
    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Medicine Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Paracetamol 500mg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="e.g., Crocin"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="generic_name">Generic Name</Label>
          <Input
            id="generic_name"
            value={formData.generic_name}
            onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
            placeholder="e.g., Paracetamol"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer *</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            placeholder="e.g., GSK"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="form">Form *</Label>
          <Select
            value={formData.form}
            onValueChange={(value) => setFormData({ ...formData, form: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select form" />
            </SelectTrigger>
            <SelectContent>
              {medicineForm.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage *</Label>
          <Input
            id="dosage"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            placeholder="e.g., 500mg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pack_size">Pack Size *</Label>
          <Input
            id="pack_size"
            value={formData.pack_size}
            onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
            placeholder="e.g., 10 tablets"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mrp">MRP (₹) *</Label>
          <Input
            id="mrp"
            type="number"
            value={formData.mrp}
            onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
            placeholder="e.g., 25.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="composition">Composition</Label>
        <Textarea
          id="composition"
          value={formData.composition}
          onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
          placeholder="Active ingredients and their quantities"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the medicine"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="side_effects">Side Effects</Label>
          <Textarea
            id="side_effects"
            value={formData.side_effects}
            onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
            placeholder="Common side effects"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contraindications">Contraindications</Label>
          <Textarea
            id="contraindications"
            value={formData.contraindications}
            onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
            placeholder="When not to use"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="storage_instructions">Storage Instructions</Label>
          <Input
            id="storage_instructions"
            value={formData.storage_instructions}
            onChange={(e) => setFormData({ ...formData, storage_instructions: e.target.value })}
            placeholder="e.g., Store below 25°C"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="drug_schedule">Drug Schedule</Label>
          <Input
            id="drug_schedule"
            value={formData.drug_schedule}
            onChange={(e) => setFormData({ ...formData, drug_schedule: e.target.value })}
            placeholder="e.g., Schedule H"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="prescription_required"
          checked={formData.prescription_required}
          onCheckedChange={(checked) => setFormData({ ...formData, prescription_required: checked })}
        />
        <Label htmlFor="prescription_required">Prescription Required</Label>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/admin-dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Pill className="h-8 w-8" />
                Medicine Catalog
              </h1>
              <p className="text-muted-foreground">Manage medicines available for customers</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{medicines.length}</div>
              <p className="text-xs text-muted-foreground">Total Medicines</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{medicines.filter(m => m.prescription_required).length}</div>
              <p className="text-xs text-muted-foreground">Rx Required</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{new Set(medicines.map(m => m.category)).size}</div>
              <p className="text-xs text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{new Set(medicines.map(m => m.manufacturer)).size}</div>
              <p className="text-xs text-muted-foreground">Manufacturers</p>
            </CardContent>
          </Card>
        </div>

        {/* Medicine Table */}
        <Card>
          <CardHeader>
            <CardTitle>Medicine Catalog</CardTitle>
            <CardDescription>
              {filteredMedicines.length} medicines found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Rx</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No medicines match your search' : 'No medicines in catalog. Add your first medicine!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicines.map(medicine => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.brand}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{medicine.category}</Badge>
                      </TableCell>
                      <TableCell>{medicine.form}</TableCell>
                      <TableCell>₹{medicine.mrp.toFixed(2)}</TableCell>
                      <TableCell>
                        {medicine.prescription_required ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="outline">OTC</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(medicine)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => { setSelectedMedicine(medicine); setIsDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Medicine Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>
              Add a medicine to the catalog. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <MedicineForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Medicine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>
              Update medicine details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <MedicineForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMedicine?.name}" from the catalog? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
