import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../App';
import PostCard from '../components/PostCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.get('/posts/feed');
      setPosts(res.data);
    } catch (error) {
      // If feed is empty (no follows), show all posts
      try {
        const res = await api.get('/posts');
        setPosts(res.data);
      } catch (err) {
        toast.error('Failed to load feed');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6" data-testid="feed-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono font-bold">Your Feed</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="refresh-feed-btn"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts in your feed yet</p>
          <p className="text-sm text-muted-foreground">Follow some developers or create your first post!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onUpdate={handlePostUpdate}
              onDelete={handlePostDelete}
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
