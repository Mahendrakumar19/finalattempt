import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Expand, RotateCcw, Sparkles } from "lucide-react"

interface Props {
  config: any;
  onChange: (field: string, value: any) => void;
}

const DEFAULT_PROMPT = 'You are a helpful customer support assistant for this business.';

export function SystemPromptEditor({ config, onChange }: Props) {
  const prompt = config.system_prompt || DEFAULT_PROMPT;
  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  // very rough estimate: 1 word ~ 1.3 tokens
  const estimatedTokens = Math.ceil(wordCount * 1.3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>The core instructions that govern the AI's behavior.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onChange('system_prompt', DEFAULT_PROMPT)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore Default
            </Button>
            <Button variant="secondary" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Improve (AI)
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative font-mono text-sm">
          <Textarea 
            className="min-h-[250px] font-mono leading-relaxed bg-zinc-950 text-green-400 p-4 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/50"
            value={prompt}
            onChange={(e) => onChange('system_prompt', e.target.value)}
            placeholder="Enter system instructions..."
          />
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-zinc-500 hover:text-white hover:bg-zinc-800">
            <Expand className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
          <div className="flex gap-4">
            <span>Words: {wordCount}</span>
            <span>Est. Tokens: {estimatedTokens}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Auto-saving
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
