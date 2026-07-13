import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/client'

export function HumanHandoffCard({ config, onChange }: any) {
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const handoff = config.handoff_rules || {};
  const escalateWhen = handoff.escalate_when || [];

  useEffect(() => {
    const fetchDepts = async () => {
      const { data } = await createClient().from('departments').select('id, name').order('name');
      if (data) setDepartments(data);
    };
    fetchDepts();
  }, []);

  const toggleEscalation = (reason: string, checked: boolean) => {
    let newRules = [...escalateWhen];
    if (checked && !newRules.includes(reason)) newRules.push(reason);
    else if (!checked) newRules = newRules.filter(r => r !== reason);
    onChange('escalate_when', newRules, 'handoff_rules');
  };

  const categorizedOptions = {
    "Sales": [
      "Budget > ₹50,000",
      "Enterprise customer",
      "Government enquiry",
      "Tender enquiry",
      "Wants onsite meeting",
      "Wants proposal",
      "Wants AMC",
      "Wants implementation timeline"
    ],
    "Technical": [
      "API Integration",
      "ERP Customization",
      "Database Migration",
      "WhatsApp API Setup",
      "AI/ML Consultation",
      "Cloud Infrastructure",
      "Security Questions"
    ],
    "Support": [
      "Bug report",
      "Login issue",
      "Payment failed",
      "Server down",
      "Integration failed"
    ],
    "Priority": [
      "VIP Customer",
      "Existing Client",
      "Repeat Customer",
      "High-value Lead",
      "Urgent Request"
    ],
    "AI Confidence": [
      "AI confidence below 80%",
      "AI cannot answer confidently",
      "AI detects conflicting information",
      "Missing knowledge base information"
    ],
    "General": [
      "Customer explicitly asks for human",
      "Customer is angry or abusive",
      "Customer asks legal questions"
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Human Handoff</CardTitle>
        <CardDescription>Rules for transferring the conversation to a human agent.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          <Label className="text-base">Escalate When</Label>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Object.entries(categorizedOptions).map(([category, opts]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {opts.map(opt => (
                    <div key={opt} className="flex items-start space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox id={opt} checked={escalateWhen.includes(opt)} onCheckedChange={(c) => toggleEscalation(opt, !!c)} className="mt-0.5" />
                      <label htmlFor={opt} className="text-sm font-medium leading-tight cursor-pointer flex-1">{opt}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div className="space-y-2">
            <Label>Assign To Department</Label>
            <Select value={handoff.assign_to || 'unassigned'} onValueChange={(v) => onChange('assign_to', v, 'handoff_rules')}>
              <SelectTrigger>
                <SelectValue>
                  {handoff.assign_to === 'unassigned' || !handoff.assign_to
                    ? 'Unassigned (Inbox)'
                    : departments.find(d => d.id === handoff.assign_to)?.name ?? handoff.assign_to}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned (Inbox)</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fallback Message</Label>
            <Input 
              placeholder="I am transferring you to a human agent..." 
              value={handoff.fallback_message || ''} 
              onChange={(e) => onChange('fallback_message', e.target.value, 'handoff_rules')} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
