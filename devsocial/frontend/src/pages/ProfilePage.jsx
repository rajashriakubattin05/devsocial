import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, useAuth } from '../App';
import PostCard from '../components/PostCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings, MapPin, Calendar, Link as LinkIcon, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/username/${username}`),
        api.get(`/users/${username}/posts`).catch(() => ({ data: [] }))
      ]);
      
      setProfile(profileRes.data);
      
      // Get posts by user_id
      const userPostsRes = await api.get(`/users/${profileRes.data.id}/posts`);
      setPosts(userPostsRes.data);
      
      // Check if following
      if (!isOwnProfile && currentUser) {
        try {
          const followRes = await api.get(`/users/${profileRes.data.id}/is-following`);
          setIsFollowing(followRes.data.is_following);
        } catch (e) {
          console.error('Failed to check follow status');
        }
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const res = await api.post(`/users/${profile.id}/follow`);
      setIsFollowing(res.data.status === 'followed');
      setProfile({
        ...profile,
        followers_count: profile.followers_count + (res.data.status === 'followed' ? 1 : -1)
      });
      toast.success(res.data.status === 'followed' ? 'Following!' : 'Unfollowed');
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
    setProfile({ ...profile, posts_count: profile.posts_count - 1 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6" data-testid="profile-page">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover */}
        <div className="h-32 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20"></div>
        
        {/* Avatar & Info */}
        <div className="px-4 -mt-16">
          <div className="flex items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={profile.avatar} alt={profile.username} />
              <AvatarFallback className="text-2xl">{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-mono font-bold">{profile.full_name}</h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>
                {isOwnProfile ? (
                  <Link to="/settings">
                    <Button variant="outline" size="sm" className="gap-2" data-testid="edit-profile-btn">
                      <Settings className="w-4 h-4" /> Edit
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    size="sm" 
                    className="gap-2"
                    onClick={handleFollow}
                    disabled={followLoading}
                    data-testid="follow-btn"
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <><UserMinus className="w-4 h-4" /> Unfollow</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Follow</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-sm">{profile.bio}</p>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div>
              <span className="font-bold">{profile.posts_count}</span>
              <span className="text-muted-foreground ml-1">posts</span>
            </div>
            <div>
              <span className="font-bold">{profile.followers_count}</span>
              <span className="text-muted-foreground ml-1">followers</span>
            </div>
            <div>
              <span className="font-bold">{profile.following_count}</span>
              <span className="text-muted-foreground ml-1">following</span>
            </div>
          </div>

          {/* Joined date */}
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="posts" data-testid="posts-tab">Posts</TabsTrigger>
          <TabsTrigger value="likes" data-testid="likes-tab">Likes</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Liked posts coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
