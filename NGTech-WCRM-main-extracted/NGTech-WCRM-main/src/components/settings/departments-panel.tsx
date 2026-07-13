'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Trash2,
  UsersRound,
  Building,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RequireRole } from '@/components/auth/require-role';
import { useAuth } from '@/hooks/use-auth';
import { SettingsPanelHead } from './settings-panel-head';
import { createClient } from '@/lib/supabase/client';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface Member {
  user_id: string;
  full_name: string;
  email: string | null;
}

interface DeptMember {
  department_id: string;
  user_id: string;
}

export function DepartmentsPanel() {
  const { canEditSettings, user } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [deptMembers, setDeptMembers] = useState<DeptMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEverything = useCallback(async () => {
    try {
      const supabase = createClient();
      
      const [deptRes, mres, dmMres] = await Promise.all([
        supabase.from('departments').select('id, name, description').order('name'),
        fetch('/api/account/members', { cache: 'no-store' }),
        supabase.from('department_members').select('department_id, user_id'),
      ]);

      if (deptRes.error) throw deptRes.error;
      setDepartments(deptRes.data || []);
      
      if (dmMres.error) throw dmMres.error;
      setDeptMembers(dmMres.data || []);

      if (mres.ok) {
        const mdata = (await mres.json()) as { members: Member[] };
        setMembers(mdata.members || []);
      }
    } catch (err) {
      console.error('[DepartmentsPanel] load error:', err);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEverything();
  }, [loadEverything]);

  async function handleCreateDepartment() {
    if (!newDeptName.trim()) return;
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: newDeptName.trim(),
          description: newDeptDesc.trim() || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setDepartments(prev => [...prev, data]);
      toast.success('Department created');
      setCreateOpen(false);
      setNewDeptName('');
      setNewDeptDesc('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteDepartment(id: string) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast.success('Department deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete department');
    }
  }

  async function handleToggleMember(departmentId: string, userId: string, isAdding: boolean) {
    const supabase = createClient();
    try {
      if (isAdding) {
        const { error } = await supabase.from('department_members').insert({
          department_id: departmentId,
          user_id: userId
        });
        if (error) throw error;
        setDeptMembers(prev => [...prev, { department_id: departmentId, user_id: userId }]);
        toast.success('Member added to department');
      } else {
        const { error } = await supabase.from('department_members').delete()
          .match({ department_id: departmentId, user_id: userId });
        if (error) throw error;
        setDeptMembers(prev => prev.filter(dm => !(dm.department_id === departmentId && dm.user_id === userId)));
        toast.success('Member removed from department');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update member');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="animate-in fade-in-50 space-y-6 duration-200">
      <SettingsPanelHead
        title="Departments"
        description="Organize your team into departments for smart routing and AI handoffs."
        action={
          <RequireRole min="admin">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4 mr-2" />
              New Department
            </Button>
          </RequireRole>
        }
      />

      {departments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-foreground">
              No departments yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a department to route specific customer queries to specialized agents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((dept) => {
            const thisDeptMembers = deptMembers.filter(dm => dm.department_id === dept.id);
            const memberIds = new Set(thisDeptMembers.map(dm => dm.user_id));
            
            return (
              <Card key={dept.id} className="flex flex-col group hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{dept.name}</CardTitle>
                    {dept.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.5rem]">
                        {dept.description}
                      </p>
                    )}
                  </div>
                  <RequireRole min="admin">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-7 w-7 p-0"
                      onClick={() => handleDeleteDepartment(dept.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </RequireRole>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><UsersRound className="size-3" /> Members</span>
                      <span className="text-sm font-semibold">{thisDeptMembers.length}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
                    <Button 
                      variant="default" 
                      className="w-full text-xs h-8 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        window.location.href = `/settings/departments/${dept.id}`;
                      }}
                    >
                      Configure Department
                    </Button>
                  </div>
                  
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>
              Add a new department like "Sales" or "Support" to organize your agents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Department Name</label>
              <Input
                id="name"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Sales Team"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="desc" className="text-sm font-medium">Description (Optional)</label>
              <Input
                id="desc"
                value={newDeptDesc}
                onChange={(e) => setNewDeptDesc(e.target.value)}
                placeholder="Handles purchasing and pricing inquiries"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDepartment} disabled={isSubmitting || !newDeptName.trim()}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
