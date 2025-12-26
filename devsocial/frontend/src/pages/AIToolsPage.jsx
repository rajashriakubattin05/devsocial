import React, { useState } from 'react';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Code2, Bug, Lightbulb, Compass, Sparkles, Loader2, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const languages = [
  'javascript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'typescript',
  'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash'
];

const experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

const AIToolsPage = () => {
  const [activeTab, setActiveTab] = useState('explain');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Career guidance state
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [interests, setInterests] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');

  const handleExplainCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code');
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/explain-code', { code, language });
      setResult(res.data.explanation);
    } catch (error) {
      toast.error('Failed to analyze code');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectBugs = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code');
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/detect-bugs', { code, language });
      setResult(res.data.analysis);
    } catch (error) {
      toast.error('Failed to analyze code');
    } finally {
      setLoading(false);
    }
  };

  const handleCareerGuidance = async () => {
    if (skills.length === 0) {
      toast.error('Please add at least one skill');
      return;
    }

    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/career-guidance', {
        skills,
        interests,
        experience_level: experienceLevel
      });
      setResult(res.data.guidance);
    } catch (error) {
      toast.error('Failed to get career guidance');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const skill = skillInput.trim();
      if (skill && !skills.includes(skill)) {
        setSkills([...skills, skill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="px-4 py-6" data-testid="ai-tools-page">
      <h1 className="text-2xl font-mono font-bold mb-2">AI Tools</h1>
      <p className="text-muted-foreground mb-6">Powered by Gemini 2.5 Flash</p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="explain" className="gap-2" data-testid="explain-tab">
            <Lightbulb className="w-4 h-4" /> Explain
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-2" data-testid="debug-tab">
            <Bug className="w-4 h-4" /> Debug
          </TabsTrigger>
          <TabsTrigger value="career" className="gap-2" data-testid="career-tab">
            <Compass className="w-4 h-4" /> Career
          </TabsTrigger>
        </TabsList>

        {/* Code Explanation */}
        <TabsContent value="explain">
          <Card className="border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Code Explanation
              </CardTitle>
              <CardDescription>
                Paste your code and get a clear, beginner-friendly explanation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger data-testid="explain-language-select">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="// Paste your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                className="font-mono text-sm resize-none"
                data-testid="explain-code-input"
              />
              <Button 
                onClick={handleExplainCode} 
                disabled={loading || !code.trim()}
                className="w-full bg-primary hover:bg-primary/90 gap-2"
                data-testid="explain-code-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Explain Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bug Detection */}
        <TabsContent value="debug">
          <Card className="border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-destructive" />
                Bug Detection & Improvements
              </CardTitle>
              <CardDescription>
                Find potential bugs and get improvement suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger data-testid="debug-language-select">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="// Paste your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                className="font-mono text-sm resize-none"
                data-testid="debug-code-input"
              />
              <Button 
                onClick={handleDetectBugs} 
                disabled={loading || !code.trim()}
                className="w-full bg-destructive hover:bg-destructive/90 gap-2"
                data-testid="detect-bugs-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                Detect Bugs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Guidance */}
        <TabsContent value="career">
          <Card className="border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-accent" />
                AI Career Guidance
              </CardTitle>
              <CardDescription>
                Get personalized career advice based on your skills and interests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a skill and press Enter (e.g., React, Python)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  data-testid="skills-input"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Experience Level</label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger data-testid="experience-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Interests (Optional)</label>
                <Textarea
                  placeholder="What areas of tech interest you? (e.g., AI, Web Development, Mobile Apps)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  rows={3}
                  className="resize-none"
                  data-testid="interests-input"
                />
              </div>

              <Button 
                onClick={handleCareerGuidance} 
                disabled={loading || skills.length === 0}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                data-testid="career-guidance-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                Get Career Guidance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result */}
      {result && (
        <Card className="border-border/50 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Result</CardTitle>
            <Button variant="ghost" size="sm" onClick={copyResult} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-secondary/50 p-4 rounded-lg overflow-x-auto">
                {result}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIToolsPage;
