import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { User as FirebaseUser } from 'firebase/auth';
import type { JournalEntry } from '../types';
import { saveJournalEntry, getJournalEntries, deleteJournalEntry } from '../lib/firebase';
import { Plus, Search, Trash2, Edit3, Lock, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface JournalProps {
  user: FirebaseUser | null;
}

const MOODS = ['great', 'good', 'okay', 'bad', 'terrible'];

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export default function Journal({ user }: JournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Load entries
  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    const result = await getJournalEntries(user.uid);
    if (result.success && result.data) {
      setEntries(result.data as JournalEntry[]);
    }
  };

  // Save entry
  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast.error('Please add a title and content');
      return;
    }

    const entry = {
      id: editingEntry?.id,
      title: title.trim(),
      content: content.trim(),
      mood: mood as any,
      tags,
      isEncrypted: true,
      timestamp: editingEntry?.timestamp || new Date()
    };

    const result = await saveJournalEntry(user.uid, entry);
    
    if (result.success) {
      toast.success(editingEntry ? 'Entry updated!' : 'Entry saved!');
      setIsWriting(false);
      setEditingEntry(null);
      resetForm();
      loadEntries();
    } else {
      toast.error('Failed to save entry');
    }
  };

  // Delete entry
  const handleDelete = async (entryId: string) => {
    if (!user) return;
    
    if (confirm('Are you sure you want to delete this entry?')) {
      const result = await deleteJournalEntry(user.uid, entryId);
      if (result.success) {
        toast.success('Entry deleted');
        loadEntries();
      } else {
        toast.error('Failed to delete');
      }
    }
  };

  // Edit entry
  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || '');
    setTags(entry.tags || []);
    setIsWriting(true);
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setContent('');
    setMood('');
    setTags([]);
    setTagInput('');
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // New entry
  const handleNewEntry = () => {
    resetForm();
    setEditingEntry(null);
    setIsWriting(true);
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Private Journal</h1>
            <p className="text-[var(--mc-text-secondary)] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Your thoughts are encrypted and private
            </p>
          </div>
          <Button
            onClick={handleNewEntry}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mc-text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your journal..."
            className="pl-10 bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]"
          />
        </div>

        {/* Write/Edit Dialog */}
        <Dialog open={isWriting} onOpenChange={setIsWriting}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                className="bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)] text-lg font-medium"
              />
              
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts here..."
                className="bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)] min-h-[200px]"
              />
              
              {/* Mood */}
              <div className="space-y-2">
                <label className="text-sm text-[var(--mc-text-secondary)]">How are you feeling?</label>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm capitalize transition-colors
                        ${mood === m
                          ? 'bg-[var(--mc-accent-primary)] text-white'
                          : 'bg-[var(--mc-bg-tertiary)] text-[var(--mc-text-secondary)] hover:bg-[var(--mc-bg-elevated)]'
                        }
                      `}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm text-[var(--mc-text-secondary)]">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)]"
                  />
                  <Button type="button" onClick={addTag} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-2 py-1 rounded-full bg-[var(--mc-accent-primary)]/20 text-[var(--mc-accent-primary)] text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {editingEntry ? 'Update' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsWriting(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--mc-bg-tertiary)] flex items-center justify-center">
                  <Edit3 className="w-8 h-8 text-[var(--mc-text-muted)]" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No entries found' : 'Start your journal'}
                </h3>
                <p className="text-[var(--mc-text-secondary)]">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Write your first entry to begin your journaling journey'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => {
              const ts = entry.timestamp as unknown as FirestoreTimestamp;
              return (
                <Card 
                  key={entry.id} 
                  className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)] card-hover cursor-pointer"
                  onClick={() => handleEdit(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{entry.title}</h3>
                        <p className="text-[var(--mc-text-secondary)] line-clamp-2 mb-3">
                          {entry.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-[var(--mc-text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(ts.seconds * 1000), 'MMM d, yyyy')}
                          </span>
                          {entry.mood && (
                            <span className="capitalize">{entry.mood}</span>
                          )}
                          {entry.tags && entry.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {entry.tags.length} tags
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--mc-text-muted)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
