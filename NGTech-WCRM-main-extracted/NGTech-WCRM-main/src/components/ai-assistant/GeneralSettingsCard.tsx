import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface Props {
  config: any;
  onChange: (field: string, value: any, category?: string) => void;
}

export function GeneralSettingsCard({ config, onChange }: Props) {
  const advanced = config.advanced_settings || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure the core AI provider and model parameters.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enable-ai" className="font-medium">Enable AI Assistant</Label>
            <Switch
              id="enable-ai"
              checked={config.enabled}
              onCheckedChange={(v) => onChange('enabled', v)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select value={config.provider || 'gemini'} onValueChange={(v) => onChange('provider', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="groq">Groq (Llama)</SelectItem>
                <SelectItem value="openai" disabled>OpenAI (Coming Soon)</SelectItem>
                <SelectItem value="claude" disabled>Anthropic Claude (Coming Soon)</SelectItem>
                <SelectItem value="ollama" disabled>Ollama Local (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={config.model || 'gemini-1.5-pro'} onValueChange={(v) => onChange('model', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {config.provider === 'groq' ? (
                  <>
                    <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
                    <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B Instant</SelectItem>
                    <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature ({advanced.temperature || 0.7})</Label>
              </div>
              <input 
                type="range"
                min="0" max="2" step="0.1" 
                value={advanced.temperature || 0.7} 
                onChange={(e) => onChange('temperature', parseFloat(e.target.value), 'advanced_settings')} 
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">Higher values make output more random, lower values make it more focused.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Top P ({advanced.top_p || 1})</Label>
              </div>
              <input 
                type="range"
                min="0" max="1" step="0.05" 
                value={advanced.top_p || 1} 
                onChange={(e) => onChange('top_p', parseFloat(e.target.value), 'advanced_settings')} 
                className="w-full accent-primary"
              />
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="space-y-2">
              <Label>Maximum Tokens</Label>
              <Input 
                type="number" 
                placeholder="Leave blank for model default" 
                value={advanced.max_tokens || ''}
                onChange={(e) => onChange('max_tokens', e.target.value ? parseInt(e.target.value) : undefined, 'advanced_settings')}
              />
            </div>
            <div className="space-y-2">
              <Label>Response Language Override</Label>
              <Select value={advanced.response_language || 'auto'} onValueChange={(v) => onChange('response_language', v, 'advanced_settings')}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect (Match Customer)</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
