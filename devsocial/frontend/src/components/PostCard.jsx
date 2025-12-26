import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../App';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Trash2, 
  Bookmark, Flag, Copy, ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const PostCard = ({ post, onUpdate, onDelete, style }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (likeLoading) return;
    
    setLikeLoading(true);
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      onUpdate?.({
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

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success('Link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  return (
    <article 
      className="bg-card rounded-lg border border-border/50 overflow-hidden card-hover animate-fade-in cursor-pointer"
      style={style}
      onClick={handleCardClick}
      data-testid={`post-card-${post.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link 
          to={`/profile/${post.username}`} 
          className="flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar>
            <AvatarImage src={post.user_avatar} alt={post.username} />
            <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium hover:underline">{post.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleShare}>
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/post/${post.id}`)}>
              <ExternalLink className="w-4 h-4 mr-2" /> Open
            </DropdownMenuItem>
            {post.user_id === user?.id && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap line-clamp-4">{post.content}</p>
      </div>

      {/* Code Snippet */}
      {post.code_snippet && (
        <div className="mx-4 mb-3 code-block">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground font-mono">{post.language || 'code'}</span>
          </div>
          <pre className="p-3 overflow-x-auto text-sm font-mono max-h-48">
            <code>{post.code_snippet}</code>
          </pre>
        </div>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden">
          {post.media_type === 'video' ? (
            <video 
              src={post.media_url} 
              controls 
              className="w-full max-h-96 object-cover"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="w-full max-h-96 object-cover"
            />
          )}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          {post.hashtags.map((tag) => (
            <Link key={tag} to={`/hashtag/${tag}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 text-xs">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-border/50">
        <button 
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2 transition-colors btn-hover ${
            post.is_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          }`}
          data-testid={`like-btn-${post.id}`}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span className="text-sm">{post.likes_count}</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors btn-hover"
          data-testid={`comment-btn-${post.id}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments_count}</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors btn-hover"
          data-testid={`share-btn-${post.id}`}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
};

export default PostCard;
