import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Loader2, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const PostDetailPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (error) {
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to load comments');
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPost({
        ...post,
        is_liked: res.data.status === 'liked',
        likes_count: res.data.likes_count
      });
    } catch (error) {
      toast.error('Failed to like post');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || commentLoading) return;
    
    setCommentLoading(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
      setPost({ ...post, comments_count: post.comments_count + 1 });
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6" data-testid="post-detail-page">
      {/* Back button */}
      <Link to="/feed" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to feed</span>
      </Link>

      {/* Post */}
      <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/profile/${post.username}`} className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.user_avatar} alt={post.username} />
              <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
          {post.user_id === user?.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-4">
          <p className="whitespace-pre-wrap">{post.content}</p>

          {/* Code Snippet */}
          {post.code_snippet && (
            <div className="mt-4 code-block">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground font-mono">{post.language || 'code'}</span>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono">
                <code>{post.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Media */}
          {post.media_url && (
            <div className="mt-4 rounded-lg overflow-hidden">
              {post.media_type === 'video' ? (
                <video src={post.media_url} controls className="w-full" />
              ) : (
                <img src={post.media_url} alt="Post media" className="w-full" />
              )}
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.hashtags.map((tag) => (
                <Link key={tag} to={`/hashtag/${tag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 px-4 py-3 border-t border-border/50">
          <button 
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 transition-colors ${post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
            data-testid="like-btn"
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes_count}</span>
          </button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count}</span>
          </div>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            data-testid="share-btn"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Section */}
        <div className="border-t border-border/50">
          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex items-center gap-2 p-4 border-b border-border/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              data-testid="comment-input"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newComment.trim() || commentLoading}
              data-testid="submit-comment-btn"
            >
              {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>

          {/* Comments List */}
          <div className="divide-y divide-border/50">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4">
                  <Link to={`/profile/${comment.username}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user_avatar} alt={comment.username} />
                      <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${comment.username}`} className="font-medium text-sm hover:underline">
                        {comment.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
