import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AIRulesCard({ config, onChange }: any) {
  const rules = config.ai_rules || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Rules & Boundaries</CardTitle>
        <CardDescription>Strict constraints on what the AI can and cannot say.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Allowed Topics</Label>
            <Input placeholder="e.g. Sales, Support, Refunds" value={rules.allowed_topics || ''} onChange={(e) => onChange('allowed_topics', e.target.value, 'ai_rules')} />
          </div>
          <div className="space-y-2">
            <Label className="text-red-500">Restricted Topics</Label>
            <Input placeholder="e.g. Politics, Competitors" value={rules.restricted_topics || ''} onChange={(e) => onChange('restricted_topics', e.target.value, 'ai_rules')} />
          </div>
          <div className="space-y-2">
             <Label>Always Mention</Label>
             <Input placeholder="e.g. Current Promotion" value={rules.always_mention || ''} onChange={(e) => onChange('always_mention', e.target.value, 'ai_rules')} />
          </div>
          <div className="space-y-2">
             <Label>Reply Format</Label>
             <Select value={rules.reply_format || 'paragraph'} onValueChange={(v) => onChange('reply_format', v, 'ai_rules')}>
               <SelectTrigger><SelectValue/></SelectTrigger>
               <SelectContent>
                 <SelectItem value="paragraph">Professional Paragraphs</SelectItem>
                 <SelectItem value="bullet_points">Bullet Points</SelectItem>
                 <SelectItem value="casual">Casual Chat</SelectItem>
               </SelectContent>
             </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
