import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Clock } from "lucide-react"

export function BusinessHoursCard({ config, onChange }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Hours</CardTitle>
        <CardDescription>Control how the AI behaves during and outside your global business hours.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-zinc-500" />
            <div>
              <Label htmlFor="respect-hours" className="text-base cursor-pointer">Respect Business Hours</Label>
              <p className="text-sm text-muted-foreground">Uses the global Account Business Hours settings.</p>
            </div>
          </div>
          <Switch 
            id="respect-hours" 
            checked={config.respect_business_hours} 
            onCheckedChange={(v) => onChange('respect_business_hours', v)} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-zinc-50 space-y-2 border border-zinc-100">
            <p className="font-semibold text-zinc-700">During Business Hours</p>
            <p className="text-muted-foreground">AI answers instantly. Handoff rules will transfer the chat to active human agents.</p>
          </div>
          <div className="p-4 rounded-lg bg-zinc-50 space-y-2 border border-zinc-100">
            <p className="font-semibold text-zinc-700">Outside Business Hours</p>
            <p className="text-muted-foreground">AI answers instantly but will NOT attempt to transfer to human agents.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
