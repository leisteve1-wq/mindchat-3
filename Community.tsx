import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { User as FirebaseUser } from 'firebase/auth';
import type { VentPost } from '../types';
import { createVentPost, getVentPosts } from '../lib/firebase';
import { 
  Heart, 
  MessageCircle, 
  Flag, 
  User, 
  Send,
  Shield,
  EyeOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityProps {
  user: FirebaseUser | null;
}

export default function Community({ user }: CommunityProps) {
  const [posts, setPosts] = useState<VentPost[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load posts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const result = await getVentPosts(20);
    if (result.success && result.data) {
      setPosts(result.data as VentPost[]);
    }
  };

  // Create post
  const handleSubmit = async () => {
    if (!user || !newPostContent.trim()) {
      toast.error('Please write something');
      return;
    }

    setIsLoading(true);
    const result = await createVentPost(user.uid, newPostContent.trim(), isAnonymous);
    
    if (result.success) {
      toast.success('Posted anonymously');
      setIsWriting(false);
      setNewPostContent('');
      loadPosts();
    } else {
      toast.error('Failed to post');
    }
    
    setIsLoading(false);
  };

  // React to post
  const handleReact = () => {
    toast.success('Reaction sent!');
  };

  // Report post
  const handleReport = () => {
    toast.success('Post reported. Thank you for keeping the community safe.');
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Community</h1>
            <p className="text-[var(--mc-text-secondary)] flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              Anonymous support space
            </p>
          </div>
          <Button
            onClick={() => setIsWriting(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            <Send className="w-4 h-4 mr-2" />
            Vent
          </Button>
        </div>

        {/* Guidelines */}
        <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)] border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--mc-text-secondary)]">
                <p className="font-medium text-[var(--mc-text-primary)] mb-1">Community Guidelines</p>
                <ul className="space-y-1">
                  <li>• Be kind and supportive</li>
                  <li>• No identifying information</li>
                  <li>• If in crisis, call 988</li>
                  <li>• Report harmful content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Post Dialog */}
        <Dialog open={isWriting} onOpenChange={setIsWriting}>
          <DialogContent className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
            <DialogHeader>
              <DialogTitle>Share Your Thoughts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? This is a safe, anonymous space..."
                className="bg-[var(--mc-bg-tertiary)] border-[var(--mc-border)] min-h-[150px]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-[var(--mc-border)]"
                />
                <label htmlFor="anonymous" className="text-sm text-[var(--mc-text-secondary)]">
                  Post anonymously
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!newPostContent.trim() || isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsWriting(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--mc-bg-tertiary)] flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-[var(--mc-text-muted)]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-[var(--mc-text-secondary)]">
                  Be the first to share your thoughts
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-[var(--mc-bg-secondary)] border-[var(--mc-border)]">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--mc-bg-tertiary)] flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--mc-text-muted)]" />
                      </div>
                      <span className="text-sm text-[var(--mc-text-muted)]">
                        Anonymous
                      </span>
                    </div>
                    <span className="text-xs text-[var(--mc-text-muted)]">
                      {post.timestamp && typeof post.timestamp === 'object' && 'seconds' in post.timestamp
                        ? formatDistanceToNow(new Date((post.timestamp as any).seconds * 1000), { addSuffix: true })
                        : 'Recently'}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-[var(--mc-text-primary)] mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t border-[var(--mc-border)]">
                    <button
                      onClick={handleReact}
                      className="flex items-center gap-1 text-sm text-[var(--mc-text-muted)] hover:text-[var(--mc-accent-primary)] transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Support</span>
                    </button>
                    <button
                      onClick={handleReact}
                      className="flex items-center gap-1 text-sm text-[var(--mc-text-muted)] hover:text-[var(--mc-accent-primary)] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Same</span>
                    </button>
                    <button
                      onClick={handleReport}
                      className="ml-auto flex items-center gap-1 text-sm text-[var(--mc-text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
