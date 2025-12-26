import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, api } from '../App';
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react';

const MobileNav = () => {
  const { user } = useAuth();
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
    { 
      path: '/notifications', 
      icon: Bell, 
      label: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/feed' && location.pathname === '/feed') return true;
    if (path === `/profile/${user?.username}` && location.pathname.startsWith('/profile')) return true;
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 mobile-nav z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
            data-testid={`mobile-nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
            {item.badge && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
