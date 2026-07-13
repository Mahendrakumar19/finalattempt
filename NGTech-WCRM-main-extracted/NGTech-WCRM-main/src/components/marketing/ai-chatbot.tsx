"use client"

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Bot, X, Send, Minimize2, Sparkles, User, AlertCircle } from 'lucide-react'

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm the NGTech WCRM AI assistant. How can I help you learn about our WhatsApp CRM platform today?"
      }
    ]
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <>
      {/* ─── Floating Action Button ─── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
        {/* Ambient ping */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-primary"></span>
        </span>
      </button>

      {/* ─── Chat Window ─── */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex w-[calc(100vw-3rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out sm:w-[380px] ${
          isOpen
            ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
            : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: 'min(600px, calc(100vh - 6rem))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/30 bg-gradient-to-r from-primary/10 to-blue-500/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-inner">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                NGTech AI
                <Sparkles className="h-3 w-3 text-primary" />
              </h3>
              <p className="text-[10px] text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <div className="flex gap-1 text-muted-foreground">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30 scroll-smooth">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1 ${
                  m.role === 'user' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-border/40 text-foreground rounded-tl-sm shadow-sm'
                  }`}
                >
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    m.content.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={idx} className="font-bold text-primary dark:text-blue-400">{part.slice(2, -2)}</strong>
                      }
                      return part
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex gap-2 flex-row max-w-[85%]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1 bg-primary/10 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-card border border-border/40 px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mx-auto flex max-w-[90%] items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Failed to connect to the AI.</p>
                <p className="opacity-80 break-all">{error.message || 'Unknown error occurred.'}</p>
                <p className="text-[10px] break-all">{JSON.stringify(error)}</p>
              </div>
            </div>
          )}

          {/* ─── WhatsApp Lock Message ─── */}
          {messages.filter(m => m.role === 'user').length >= 10 && !isLoading && (
            <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-2 flex-row max-w-[85%]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1 bg-emerald-500/10 text-emerald-500">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
                  I hope I was able to help! 💬 You have reached the limit of our AI Assistant session. To continue our conversation or get direct assistance from our team, please chat with us on WhatsApp.
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/30 bg-card p-3">
          {messages.filter(m => m.role === 'user').length >= 10 ? (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <a
                href="https://wa.me/918092225777?text=Hi!%20I%20was%20chatting%20with%20your%20AI%20assistant%20on%20the%20website%20and%20wanted%20to%20continue%20our%20conversation%20here."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#20bd5a] hover:shadow-[#25D366]/30 hover:scale-[1.02]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Continue on WhatsApp
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50"
            >
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask anything about our CRM..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          )}
          <div className="mt-2 text-center text-[9px] font-medium text-muted-foreground/60 uppercase tracking-widest">
            Powered by Groq
          </div>
        </div>
      </div>
    </>
  )
}
