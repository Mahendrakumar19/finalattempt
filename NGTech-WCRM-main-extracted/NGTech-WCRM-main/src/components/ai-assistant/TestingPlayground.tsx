import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, RefreshCw, Trash2, Copy, AlertCircle, Sparkles } from "lucide-react"

const formatWhatsAppText = (text: string) => {
  if (!text) return '';
  
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  let formatted = escapeHtml(text)
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
    .replace(/```(.*?)```/gs, '<code class="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>');
    
  return <span dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br />') }} />;
};

export function TestingPlayground({ config }: { config: any }) {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const newHistory = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory as any);
    setInput('');
    setLoading(true);
    setError('');
    setStats(null);

    try {
      const res = await fetch('/api/ai-assistant/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          config,
          history: messages // pass history up to this point
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate response");
      
      setMessages([...newHistory, { role: 'assistant', content: data.text }] as any);
      
      if (data.usage || data.timeMs) {
        setStats({
          timeMs: data.timeMs,
          tokens: data.usage?.totalTokens,
          provider: data.provider,
          model: data.model
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setStats(null);
    setError('');
  };

  return (
    <Card className="flex flex-col h-[650px] shadow-2xl border-zinc-800/60 bg-[#0b141a] overflow-hidden rounded-2xl relative">
      {/* Background Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/whatsapp-bg.png')" }}></div>

      <CardHeader className="border-b border-zinc-800/60 bg-[#202c33]/90 backdrop-blur-md pb-4 pt-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-zinc-100 font-semibold tracking-tight">AI Simulator</CardTitle>
              <CardDescription className="text-zinc-400 text-xs">Test your unsaved AI drafts in real-time</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={messages.length === 0} className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 min-h-0 p-4 relative z-10" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {messages.length === 0 && !loading && (
            <div className="flex justify-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center text-zinc-300 text-sm bg-[#202c33]/80 backdrop-blur-sm px-6 py-5 rounded-2xl border border-zinc-700/30 max-w-sm shadow-xl">
                <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-3 opacity-80" />
                <p className="font-medium">Send a message to start simulating a WhatsApp conversation.</p>
                <p className="text-xs text-zinc-500 mt-2">The AI will use your configurations from the left menu.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isSystem = msg.content.startsWith('[System:');
            
            if (isSystem) {
              return (
                <div key={i} className="flex justify-center my-4 animate-in fade-in duration-300">
                  <div className="bg-zinc-800/80 border border-zinc-700/50 text-amber-500/90 text-xs px-4 py-2 rounded-full shadow-sm backdrop-blur-sm max-w-[90%] text-center leading-relaxed">
                    {formatWhatsAppText(msg.content)}
                  </div>
                </div>
              );
            }

            return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] px-4 py-2 relative group shadow-md ${
                msg.role === 'user' 
                  ? 'bg-emerald-800 text-emerald-50 rounded-2xl rounded-tr-sm' 
                  : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm'
              }`}>
                <div className="text-[15px] leading-relaxed font-normal">{formatWhatsAppText(msg.content)}</div>
                {msg.role === 'assistant' && (
                  <Button variant="ghost" size="icon" className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 h-8 w-8 text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-full shadow-lg transition-all" onClick={() => navigator.clipboard.writeText(msg.content)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )})}

          {loading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md flex items-center gap-2">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
             <div className="flex justify-center mt-4">
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-sm">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 {error}
               </div>
             </div>
          )}
        </div>
      </ScrollArea>

      <div className="relative z-10 bg-[#111b21] border-t border-zinc-800/60">
        {stats && (
          <div className="px-4 py-2 flex items-center justify-between text-[10px] text-zinc-400 uppercase font-semibold tracking-wider border-b border-zinc-800/40 bg-[#111b21]">
            <span className="flex items-center gap-1.5"><Bot className="w-3 h-3 text-emerald-500" /> {stats.provider} <span className="text-zinc-600">|</span> {stats.model}</span>
            <div className="flex gap-4">
              <span><span className="text-zinc-500">Latency:</span> {stats.timeMs ? `${Math.round(stats.timeMs)}ms` : '-'}</span>
              <span><span className="text-zinc-500">Tokens:</span> {stats.tokens || '-'}</span>
            </div>
          </div>
        )}
        <div className="p-3 flex items-end gap-2 bg-[#111b21]">
          <Input 
            placeholder="Type a message..." 
            className="flex-1 bg-[#2a3942] border-transparent text-[#e9edef] placeholder:text-[#8696a0] rounded-2xl px-5 py-6 focus-visible:ring-1 focus-visible:ring-emerald-500/50 transition-all shadow-inner" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading} className="rounded-full w-12 h-12 p-0 shadow-lg shrink-0 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
