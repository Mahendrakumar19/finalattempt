import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Props {
  config: any;
  onChange: (field: string, value: any) => void;
}

const PRESETS = [
  { id: 'Technical Consultant', desc: 'Focuses on ROI, system architecture, and advanced features.' },
  { id: 'Sales Executive', desc: 'Persuasive, focuses on closing, next steps, and pricing.' },
  { id: 'Customer Support', desc: 'Empathetic, patient, heavily relies on documentation.' },
  { id: 'Custom', desc: 'Define your own unique personality rules.' }
];

export function PersonalityCard({ config, onChange }: Props) {
  const currentPersonality = config.personality || 'Technical Consultant';
  const isCustom = !PRESETS.find(p => p.id === currentPersonality) || currentPersonality === 'Custom';

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Personality</CardTitle>
        <CardDescription>Select how the AI should behave and communicate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={isCustom ? 'Custom' : currentPersonality} 
          onValueChange={(val) => {
            if (val !== 'Custom') {
              onChange('personality', val);
            } else {
              onChange('personality', 'Custom');
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {PRESETS.map(preset => (
            <div key={preset.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={preset.id} id={`preset-${preset.id}`} className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor={`preset-${preset.id}`} className="font-semibold cursor-pointer">{preset.id}</Label>
                <p className="text-sm text-muted-foreground">{preset.desc}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        {isCustom && (
          <div className="space-y-2 pt-4 animate-in fade-in slide-in-from-top-4">
            <Label>Custom Personality Prompt</Label>
            <Textarea 
              placeholder="e.g., You are a witty, fast-talking marketing guru who uses a lot of analogies..."
              className="min-h-[100px]"
              value={config.personality === 'Custom' ? '' : config.personality}
              onChange={(e) => onChange('personality', e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
