
import React, { useState } from 'react';
import { ChatInput } from '@/components/ui/chat-input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Paperclip, Trash2, CornerDownLeft, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  text: string;
  author: string;
  authorAvatar: string;
  date: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface TaskCommentsSectionProps {
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'date'>) => void;
  onDeleteComment: (commentId: string) => void;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
  };
  readOnly?: boolean;
}

const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  comments,
  onAddComment,
  onDeleteComment,
  currentUser,
  readOnly = false
}) => {
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || (!newComment.trim() && attachments.length === 0)) return;

    const commentAttachments = attachments.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type
    }));

    onAddComment({
      text: newComment.trim(),
      author: currentUser.name,
      authorAvatar: currentUser.avatar,
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined
    });

    setNewComment('');
    setAttachments([]);
    toast.success('Comentário adicionado com sucesso');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    if (readOnly) return;
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {/* Lista de comentários existentes */}
      <div className="max-h-60 overflow-y-auto space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={comment.authorAvatar} alt={comment.author} />
              <AvatarFallback className="text-xs">{comment.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.date)}</span>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {comment.text && (
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
              )}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comment.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 bg-background px-2 py-1 rounded text-xs border">
                      <Paperclip className="h-3 w-3" />
                      <span>{attachment.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          link.click();
                        }}
                      >
                        <Download className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
        )}
      </div>

      {/* Campo para novo comentário - apenas se não for readOnly */}
      {!readOnly && (
        <form 
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          onSubmit={handleSubmit}
        >
          <ChatInput
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          
          {/* Anexos selecionados */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span>{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAttachment(index)}
                  >
                    <Trash2 className="h-2 w-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center p-3 pt-0">
            <input
              type="file"
              id="attachment-input"
              className="hidden"
              multiple
              onChange={handleFileSelect}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              type="button"
              onClick={() => document.getElementById('attachment-input')?.click()}
            >
              <Paperclip className="size-4" />
              <span className="sr-only">Anexar arquivo</span>
            </Button>

            <Button
              type="submit"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={!newComment.trim() && attachments.length === 0}
            >
              Comentar
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskCommentsSection;
