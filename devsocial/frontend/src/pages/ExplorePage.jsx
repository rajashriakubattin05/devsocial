import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../App';
import PostCard from '../components/PostCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Search, TrendingUp, Users, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ExplorePage = () => {
  const { hashtag } = useParams();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(hashtag ? 'hashtags' : 'trending');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingHashtags();
    if (hashtag) {
      fetchHashtagPosts(hashtag);
    } else {
      fetchExplorePosts();
    }
  }, [hashtag]);

  const fetchTrendingHashtags = async () => {
    try {
      const res = await api.get('/trending/hashtags');
      setTrendingHashtags(res.data);
    } catch (error) {
      console.error('Failed to fetch trending hashtags');
    }
  };

  const fetchExplorePosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts?limit=30');
      setPosts(res.data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchHashtagPosts = async (tag) => {
    setLoading(true);
    try {
      const res = await api.get(`/hashtags/${tag}/posts`);
      setPosts(res.data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await api.get(`/search/users?q=${encodeURIComponent(searchQuery)}`);
        setUsers(res.data);
      } else {
        const res = await api.get(`/search/posts?q=${encodeURIComponent(searchQuery)}`);
        setPosts(res.data);
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div className="px-4 py-6" data-testid="explore-page">
      {/* Header */}
      <h1 className="text-2xl font-mono font-bold mb-6">
        {hashtag ? `#${hashtag}` : 'Explore'}
      </h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts, users, or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
      </form>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="trending" className="gap-2" data-testid="trending-tab">
            <TrendingUp className="w-4 h-4" /> Trending
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" data-testid="users-tab">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-2" data-testid="hashtags-tab">
            <Hash className="w-4 h-4" /> Hashtags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-6">
          {/* Trending Hashtags */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Trending Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {trendingHashtags.map((tag) => (
                <Link key={tag.hashtag} to={`/hashtag/${tag.hashtag}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                    #{tag.hashtag} <span className="ml-1 text-muted-foreground">{tag.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {searchQuery ? 'No users found' : 'Search for developers'}
            </p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Link 
                  key={user.id} 
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/50 card-hover"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{user.followers_count} followers</div>
                    <div>{user.posts_count} posts</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-6">
          {/* Trending Hashtags */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {trendingHashtags.map((tag) => (
              <Link 
                key={tag.hashtag} 
                to={`/hashtag/${tag.hashtag}`}
                className="p-4 rounded-lg bg-card border border-border/50 card-hover"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" />
                  <span className="font-medium">{tag.hashtag}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{tag.count} posts</p>
              </Link>
            ))}
          </div>

          {/* Posts with hashtag */}
          {hashtag && (
            <>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExplorePage;
