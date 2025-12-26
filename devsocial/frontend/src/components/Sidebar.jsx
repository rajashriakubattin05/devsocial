import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, api } from '../App';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { 
  Home, Search, PlusSquare, Bell, User, Settings, 
  Terminal, Sparkles, LogOut, TrendingUp 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count');
    }
  };

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/ai-tools', icon: Sparkles, label: 'AI Tools' },
    { 
      path: '/notifications', 
      icon: Bell, 
      label: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => {
    if (path === '/feed' && location.pathname === '/feed') return true;
    if (path === `/profile/${user?.username}` && location.pathname.startsWith('/profile')) return true;
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-card border-r border-border/50 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <Terminal className="w-8 h-8 text-primary" />
        <span className="text-xl font-mono font-bold tracking-tight">DevSocial</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
              isActive(item.path)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Trending */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-2 px-4 mb-3 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>Trending</span>
        </div>
        <TrendingHashtags />
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">@{user?.username}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const TrendingHashtags = () => {
  const [hashtags, setHashtags] = useState([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await api.get('/trending/hashtags?limit=5');
      setHashtags(res.data);
    } catch (error) {
      console.error('Failed to fetch trending');
    }
  };

  if (hashtags.length === 0) return null;

  return (
    <div className="space-y-1">
      {hashtags.slice(0, 5).map((tag) => (
        <Link
          key={tag.hashtag}
          to={`/hashtag/${tag.hashtag}`}
          className="block px-4 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
        >
          <span className="text-primary">#</span>{tag.hashtag}
          <span className="text-xs text-muted-foreground ml-2">{tag.count} posts</span>
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
