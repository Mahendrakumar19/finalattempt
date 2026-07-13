import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PricingClient } from "./pricing-client"

export const metadata = {
  title: "Manage Pricing | Platform Admin",
}

export default async function AdminPricingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Check if platform admin (assuming super admin email for now, or RLS policy handles it)
  // Our RLS is set to is_platform_admin() 
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_platform_admin) {
    redirect("/dashboard")
  }

  // Fetch pricing plans
  const { data: plans, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Failed to load pricing plans", error)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pricing Plans</h2>
        <div className="flex items-center space-x-2">
          {/* Add Plan button would go here */}
        </div>
      </div>
      
      <PricingClient initialPlans={plans || []} />
    </div>
  )
}
