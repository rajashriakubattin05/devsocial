import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Code2, Image, Sparkles, X, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const languages = [
  'javascript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'typescript',
  'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'other'
];

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleAddHashtag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMediaUrl(res.data.url);
      setMediaType(res.data.media_type);
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!content && !codeSnippet) {
      toast.error('Add some content first');
      return;
    }

    setAiLoading(true);
    try {
      const res = await api.post('/ai/generate-caption', {
        content: content || 'Code snippet post',
        code_snippet: codeSnippet
      });
      if (res.data.caption && res.data.caption !== content) {
        setContent(res.data.caption);
      }
      if (res.data.hashtags?.length > 0) {
        setHashtags([...new Set([...hashtags, ...res.data.hashtags])]);
      }
      toast.success('AI suggestions applied!');
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please add some content');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        content: content.trim(),
        code_snippet: codeSnippet || null,
        language: language || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        hashtags
      };

      await api.post('/posts', postData);
      toast.success('Post created!');
      navigate('/feed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6" data-testid="create-post-page">
      <h1 className="text-2xl font-mono font-bold mb-6">Create Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">What's on your mind?</CardTitle>
            <CardDescription>Share your coding thoughts, learnings, or questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Today I learned about..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="post-content-input"
            />
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className="gap-2"
                data-testid="ai-generate-btn"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Enhance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Snippet */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Code Snippet</CardTitle>
            </div>
            <CardDescription>Add a code snippet to your post (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger data-testid="language-select">
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
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              rows={8}
              className="font-mono text-sm resize-none"
              data-testid="code-snippet-input"
            />
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Media</CardTitle>
            </div>
            <CardDescription>Upload an image or video (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            {mediaUrl ? (
              <div className="relative">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} controls className="w-full rounded-lg" />
                ) : (
                  <img src={mediaUrl} alt="Upload preview" className="w-full rounded-lg" />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => { setMediaUrl(''); setMediaType(''); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="file-upload-input"
                />
                {uploadLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  </>
                )}
              </label>
            )}
          </CardContent>
        </Card>

        {/* Hashtags */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Hashtags</CardTitle>
            <CardDescription>Add relevant hashtags to help others find your post</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  #{tag}
                  <button type="button" onClick={() => removeHashtag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Type a hashtag and press Enter"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleAddHashtag}
              data-testid="hashtag-input"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90" 
          disabled={loading || !content.trim()}
          data-testid="submit-post-btn"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Post
        </Button>
      </form>
    </div>
  );
};

export default CreatePostPage;
