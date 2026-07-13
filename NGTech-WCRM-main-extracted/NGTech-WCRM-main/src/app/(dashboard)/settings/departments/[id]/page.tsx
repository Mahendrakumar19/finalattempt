"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DepartmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [department, setDepartment] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      
      const [deptRes, mres, dmMres, analyticsRes] = await Promise.all([
        supabase.from("departments").select("*").eq("id", id).single(),
        fetch("/api/account/members", { cache: "no-store" }),
        supabase.from("department_members").select("user_id, role").eq("department_id", id),
        fetch(`/api/analytics/department/${id}`, { cache: "no-store" }),
      ]);
        
      if (deptRes.error) {
        toast.error("Department not found");
        router.push("/settings?tab=departments");
        return;
      }
      
      setDepartment(deptRes.data);

      if (mres.ok && !dmMres.error) {
        const mdata = await mres.json();
        const globalMembers = mdata.members || [];
        setAllMembers(globalMembers);
        
        // Map the assigned members
        const dmList = dmMres.data || [];
        const assigned = dmList.map(dm => {
          const profile = globalMembers.find((m: any) => m.user_id === dm.user_id);
          return {
            ...profile,
            dept_role: dm.role || 'agent'
          };
        }).filter(m => m.user_id);
        
        setMembers(assigned);
      }
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      setLoading(false);
    }
    
    if (id) load();
  }, [id, router]);

  async function handleSaveAISettings(e: any) {
    e.preventDefault();
    const form = new FormData(e.target);
    const aiConfig = {
      enabled: form.get("ai_enabled") === "on",
      prompt_override: form.get("prompt_override"),
      escalation_threshold: form.get("escalation_threshold")
    };
    
    const supabase = createClient();
    const { error } = await supabase
      .from("departments")
      .update({ ai_configuration: aiConfig })
      .eq("id", id);
      
    if (error) {
      toast.error("Failed to save AI settings");
    } else {
      toast.success("AI Settings updated successfully");
      setDepartment({ ...department, ai_configuration: aiConfig });
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/settings?tab=departments")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{department.name}</h1>
          <p className="text-muted-foreground">{department.description || "Enterprise Department Configuration"}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted text-muted-foreground flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="routing">Routing Rules</TabsTrigger>
          <TabsTrigger value="ai-settings">AI Overrides</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Currently being handled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Waiting for assignment</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--%</div>
                <p className="text-xs text-muted-foreground">Collecting data...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">100%</div>
                <p className="text-xs text-muted-foreground">All targets met</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Members</CardTitle>
              <CardDescription>Manage who belongs to this department and their workloads.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Member Name</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Workload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground border-t border-border" colSpan={4}>
                          No members assigned to this department yet.
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr key={member.user_id} className="border-t border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {(member.full_name || member.email || "?").charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <p className="font-medium text-foreground">{member.full_name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize">{member.dept_role}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Active
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium">0</div>
                            <div className="text-xs text-muted-foreground">Open Convos</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Routing Rules</CardTitle>
              <CardDescription>Determine how incoming conversations are assigned in this department.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Assignment Strategy</label>
                  <select 
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary md:w-[300px]"
                    value={department.queue_strategy || "least_busy"}
                    onChange={async (e) => {
                      const newStrategy = e.target.value;
                      const supabase = createClient();
                      const { error } = await supabase
                        .from("departments")
                        .update({ queue_strategy: newStrategy })
                        .eq("id", id);
                      if (error) toast.error("Failed to update routing strategy");
                      else {
                        toast.success("Routing strategy updated");
                        setDepartment({ ...department, queue_strategy: newStrategy });
                      }
                    }}
                  >
                    <option value="round_robin">Round Robin</option>
                    <option value="least_busy">Least Busy Agent</option>
                    <option value="manager_first">Manager First</option>
                    <option value="vip">VIP Priority Only</option>
                    <option value="manual">Manual (No Auto-assign)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Controls how the AI hands off humans to the queue.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-settings" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>AI Override Settings</CardTitle>
              <CardDescription>Configure how the AI agent behaves specifically for this department. These settings override global AI settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAISettings} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Enable Department AI</h4>
                    <p className="text-xs text-muted-foreground">Allow AI to auto-reply to conversations assigned to this department.</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" name="ai_enabled" className="peer sr-only" defaultChecked={department.ai_configuration?.enabled !== false} />
                    <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Department AI Prompt Override</label>
                  <textarea 
                    name="prompt_override"
                    className="min-h-[120px] w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. You are a highly technical support agent for the Enterprise team..."
                    defaultValue={department.ai_configuration?.prompt_override || ""}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to use the Global AI System Prompt.</p>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Auto-Escalation Threshold</label>
                  <select 
                    name="escalation_threshold"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary md:w-[300px]"
                    defaultValue={department.ai_configuration?.escalation_threshold || "medium"}
                  >
                    <option value="low">Low (Handoff to human easily)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Try hard to resolve)</option>
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end border-t border-border/50">
                  <Button type="submit">Save AI Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="animate-in fade-in-50 duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Department Analytics</CardTitle>
              <CardDescription>Monitor performance, resolution rates, and team workload.</CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">Connecting to live analytics stream...</p>
                  <div className="mt-4 flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Conversations</div>
                    <div className="text-2xl font-bold">{analytics.totalConversations}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg Response Time</div>
                    <div className="text-2xl font-bold">{analytics.avgResponseTimeMin !== null ? `${analytics.avgResponseTimeMin}m` : '--'}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Avg CSAT</div>
                    <div className="text-2xl font-bold">{analytics.avgCsat !== null ? `${analytics.avgCsat} / 5` : '--'}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <div className="text-sm font-medium text-muted-foreground mb-1">SLA Compliance</div>
                    <div className="text-2xl font-bold text-green-500">{analytics.slaComplianceRate}%</div>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-muted/30 md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Resolution Rate</div>
                    <div className="text-2xl font-bold">{analytics.resolutionRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Percentage of conversations fully resolved</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
