import { createClient } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';

export class AIStorageService {
  /**
   * Uploads a document to the local server file system and records metadata in the database.
   */
  static async uploadKnowledgeDocument(accountId: string, file: File) {
    const supabase = await createClient();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    // Create local directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'knowledge_base', accountId);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, fileName);
    const dbPath = `/uploads/knowledge_base/${accountId}/${fileName}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
    } catch (uploadError) {
      console.error('[AIStorageService] Local upload failed:', uploadError);
      throw new Error('Failed to save file to server');
    }

    // 2. Save metadata to database
    const { data: doc, error: dbError } = await supabase
      .from('ai_knowledge_documents')
      .insert({
        account_id: accountId,
        file_name: file.name,
        file_path: dbPath,
        file_size: file.size,
        file_type: file.type || 'unknown'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[AIStorageService] DB insert failed:', dbError);
      // Attempt to clean up orphaned file
      await fs.unlink(filePath).catch(() => {});
      throw new Error('Failed to save document metadata');
    }

    return doc;
  }

  static async listDocuments(accountId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ai_knowledge_documents')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch documents');
    return data;
  }

  static async deleteDocument(accountId: string, documentId: string) {
    const supabase = await createClient();
    
    // Get file path first
    const { data: doc } = await supabase
      .from('ai_knowledge_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('account_id', accountId)
      .single();
      
    if (!doc) throw new Error('Document not found');

    // Remove from local storage
    try {
       const absolutePath = path.join(process.cwd(), 'public', doc.file_path);
       await fs.unlink(absolutePath);
    } catch (err) {
       console.warn('[AIStorageService] Failed to delete local file (might already be missing):', err);
    }

    // Remove from DB
    const { error } = await supabase
      .from('ai_knowledge_documents')
      .delete()
      .eq('id', documentId)
      .eq('account_id', accountId);

    if (error) throw new Error('Failed to delete document metadata');
    return true;
  }
}
