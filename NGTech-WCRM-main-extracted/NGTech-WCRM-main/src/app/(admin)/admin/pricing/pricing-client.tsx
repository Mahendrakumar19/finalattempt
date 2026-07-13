"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function PricingClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleEdit = (plan: any) => {
    setEditingPlan({ ...plan })
  }

  const handleSave = async () => {
    if (!editingPlan) return
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update({
          name: editingPlan.name,
          monthly_price: editingPlan.monthly_price,
          annual_price: editingPlan.annual_price,
          max_contacts: editingPlan.max_contacts,
          max_messages_pm: editingPlan.max_messages_pm,
          user_limits: editingPlan.user_limits,
          automation_limits: editingPlan.automation_limits,
          is_active: editingPlan.is_active,
        })
        .eq('id', editingPlan.id)
        
      if (error) throw error
      
      // Update local state
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p))
      setEditingPlan(null)
      router.refresh()
    } catch (e) {
      console.error("Failed to save plan:", e)
      alert("Failed to save plan limits. Check console for details.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Monthly (₹)</TableHead>
            <TableHead className="text-right">Annual (₹)</TableHead>
            <TableHead className="text-right">Contacts</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>
                {plan.is_active ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                    Inactive
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">₹{plan.monthly_price}</TableCell>
              <TableCell className="text-right font-mono">₹{plan.annual_price}</TableCell>
              <TableCell className="text-right font-mono">{plan.max_contacts}</TableCell>
              <TableCell className="text-right font-mono">{plan.user_limits}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                  Edit Limits
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {plans.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No pricing plans found. Run the database migration first.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingPlan} onOpenChange={(o) => !o && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Plan Limits</DialogTitle>
            <DialogDescription>
              Changes made here will instantly reflect on the public pricing page.
            </DialogDescription>
          </DialogHeader>
          
          {editingPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monthly" className="text-right">
                  Monthly ₹
                </Label>
                <Input
                  id="monthly"
                  type="number"
                  value={editingPlan.monthly_price}
                  onChange={(e) => setEditingPlan({...editingPlan, monthly_price: Number(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="annual" className="text-right">
                  Annual ₹
                </Label>
                <Input
                  id="annual"
                  type="number"
                  value={editingPlan.annual_price}
                  onChange={(e) => setEditingPlan({...editingPlan, annual_price: Number(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contacts" className="text-right">
                  Max Contacts
                </Label>
                <Input
                  id="contacts"
                  type="number"
                  value={editingPlan.max_contacts}
                  onChange={(e) => setEditingPlan({...editingPlan, max_contacts: Number(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="users" className="text-right">
                  User Seats
                </Label>
                <Input
                  id="users"
                  type="number"
                  value={editingPlan.user_limits}
                  onChange={(e) => setEditingPlan({...editingPlan, user_limits: Number(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Active?
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch 
                    id="active" 
                    checked={editingPlan.is_active} 
                    onCheckedChange={(c) => setEditingPlan({...editingPlan, is_active: c})} 
                  />
                  <Label htmlFor="active">{editingPlan.is_active ? 'Yes' : 'No'}</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
