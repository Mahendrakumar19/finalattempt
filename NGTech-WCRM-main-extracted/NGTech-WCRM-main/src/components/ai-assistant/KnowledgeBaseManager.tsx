import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileUp, Link as LinkIcon, Plus, Trash2, BookText, HelpCircle, Package, Building2 } from "lucide-react"

interface Props {
  config: any;
  onChange: (field: string, value: any, category?: string) => void;
}

export function KnowledgeBaseManager({ config, onChange }: Props) {
  const kb = config.knowledge_base_structured || {};
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/ai-assistant/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error('Failed to fetch docs', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/ai-assistant/documents', {
        method: 'POST',
        body: formData
      });
      if (res.ok) fetchDocuments();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-assistant/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFAQAdd = () => {
    const faqs = [...(kb.faqs || []), { question: '', answer: '' }];
    onChange('faqs', faqs, 'knowledge_base_structured');
  };

  const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
    const faqs = [...(kb.faqs || [])];
    faqs[index][field] = value;
    onChange('faqs', faqs, 'knowledge_base_structured');
  };

  const handleFAQDelete = (index: number) => {
    const faqs = [...(kb.faqs || [])];
    faqs.splice(index, 1);
    onChange('faqs', faqs, 'knowledge_base_structured');
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>Provide context and data for the AI to answer questions accurately.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6">
            <TabsTrigger value="manual" className="text-xs"><BookText className="w-3 h-3 mr-1"/> Manual</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs"><FileUp className="w-3 h-3 mr-1"/> Documents</TabsTrigger>
            <TabsTrigger value="website" className="text-xs"><LinkIcon className="w-3 h-3 mr-1"/> Website</TabsTrigger>
            <TabsTrigger value="faqs" className="text-xs"><HelpCircle className="w-3 h-3 mr-1"/> FAQs</TabsTrigger>
            <TabsTrigger value="products" className="text-xs"><Package className="w-3 h-3 mr-1"/> Products</TabsTrigger>
            <TabsTrigger value="company" className="text-xs"><Building2 className="w-3 h-3 mr-1"/> Company</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Label>Manual Knowledge Context</Label>
            <Textarea 
              placeholder="Enter any freeform text context, instructions, or data..."
              className="min-h-[200px]"
              value={kb.manual_text || ''}
              onChange={(e) => onChange('manual_text', e.target.value, 'knowledge_base_structured')}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Uploaded Documents</Label>
                <p className="text-sm text-muted-foreground">Supported: PDF, DOCX, TXT, MD, CSV.</p>
              </div>
              <label className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 shadow-sm transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? 'Uploading...' : 'Upload File'}
                <input type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.csv" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <FileUp className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs">
              <strong>Future Ready:</strong> These files are securely saved on the local server and ready for the upcoming RAG/Vector Search pipeline.
            </div>
          </TabsContent>

          <TabsContent value="website" className="space-y-6">
            <div className="text-center p-12 border border-dashed rounded-lg bg-zinc-50">
              <LinkIcon className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">Website Crawling</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">This feature will be available in a future release. You will be able to enter your URL and the AI will automatically learn your entire website.</p>
            </div>
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Frequently Asked Questions</Label>
              <Button size="sm" variant="outline" onClick={handleFAQAdd}><Plus className="w-4 h-4 mr-1"/> Add FAQ</Button>
            </div>
            {(kb.faqs || []).map((faq: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg bg-zinc-50 relative group">
                <div className="flex-1 space-y-4">
                  <Input placeholder="Question" value={faq.question} onChange={(e) => handleFAQChange(i, 'question', e.target.value)} />
                  <Textarea placeholder="Answer" value={faq.answer} onChange={(e) => handleFAQChange(i, 'answer', e.target.value)} className="min-h-[80px]"/>
                </div>
                <Button variant="ghost" size="icon" className="absolute -right-2 -top-2 bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600" onClick={() => handleFAQDelete(i)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {!(kb.faqs?.length) && <div className="text-sm text-muted-foreground text-center p-4">No FAQs added yet.</div>}
          </TabsContent>

          <TabsContent value="products">
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              Product catalog sync (Coming Soon)
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name & Vision</Label>
                <Input value={kb.company_info?.vision || ''} onChange={(e) => onChange('vision', e.target.value, 'company_info')} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={kb.company_info?.website || ''} onChange={(e) => onChange('website', e.target.value, 'company_info')} />
              </div>
              <div className="space-y-2">
                <Label>Support Phone</Label>
                <Input value={kb.company_info?.phone || ''} onChange={(e) => onChange('phone', e.target.value, 'company_info')} />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input value={kb.company_info?.email || ''} onChange={(e) => onChange('email', e.target.value, 'company_info')} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
