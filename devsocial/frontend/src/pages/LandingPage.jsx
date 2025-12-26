import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Code2, Users, Sparkles, Terminal, GitBranch, Zap, ArrowRight, Github, Twitter } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/feed');
    return null;
  }

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Share Code Snippets",
      description: "Post your code, get feedback, and learn from other developers' solutions."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Analysis",
      description: "Get instant code explanations, bug detection, and improvement suggestions."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Developer Community",
      description: "Connect with developers worldwide, follow your favorites, and grow your network."
    },
    {
      icon: <Terminal className="w-6 h-6" />,
      title: "Tech-Only Content",
      description: "AI moderation ensures only coding-related content appears on your feed."
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Career Guidance",
      description: "Get personalized career advice based on your skills and interests."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Hashtags",
      description: "AI-generated hashtags help your posts reach the right audience."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1590010358311-55d7c0769a3a?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Terminal className="w-8 h-8 text-primary" />
            <span className="text-xl font-mono font-bold tracking-tight">DevSocial</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" data-testid="login-btn">Log in</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button className="bg-primary hover:bg-primary/90" data-testid="signup-btn">
                Sign up
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Developer Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight mb-6 animate-fade-in stagger-1">
            Where <span className="text-gradient">Developers</span> Connect
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-10 animate-fade-in stagger-2">
            The social network built exclusively for coders. Share code snippets, 
            get AI-powered insights, and connect with developers worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in stagger-3">
            <Link to="/auth?mode=register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2" data-testid="hero-get-started-btn">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" data-testid="hero-login-btn">
                Explore Platform
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in stagger-4">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-mono font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Developers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-mono font-bold text-accent">50K+</div>
              <div className="text-sm text-muted-foreground">Code Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-mono font-bold text-primary">100K+</div>
              <div className="text-sm text-muted-foreground">AI Analyses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-4">
            Built for Developers, By Developers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to share your code, learn from others, and advance your career.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-lg bg-card border border-border/50 card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-mono font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="px-6 py-24 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-mono font-bold mb-6">
                Share Your Code, Get Instant Insights
              </h2>
              <p className="text-muted-foreground mb-8">
                Post code snippets in any language. Our AI analyzes your code, explains complex logic, 
                detects potential bugs, and suggests improvements—all in real-time.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm">Syntax highlighting for 50+ languages</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm">One-click AI code explanation</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm">Automatic bug detection & fixes</span>
                </li>
              </ul>
            </div>
            <div className="code-block">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                <div className="w-3 h-3 rounded-full bg-destructive/60"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-accent/60"></div>
                <span className="ml-2 text-xs text-muted-foreground font-mono">example.py</span>
              </div>
              <pre className="font-mono text-sm p-4 overflow-x-auto">
<code>{`def fibonacci(n):
    """Generate Fibonacci sequence"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

# Get first 10 numbers
print(fibonacci(10))`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-mono font-bold mb-6">
            Ready to Join the Developer Community?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start sharing your code, connect with developers, and accelerate your growth.
          </p>
          <Link to="/auth?mode=register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2" data-testid="cta-signup-btn">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            <span className="font-mono font-bold">DevSocial</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
