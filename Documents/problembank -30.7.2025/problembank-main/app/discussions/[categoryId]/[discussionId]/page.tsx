'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Users, Clock, Send } from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import MediaUpload from '@/app/components/ui/MediaUpload';
import { supabase, Discussion, DiscussionPost, DiscussionCategory } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cleanDiscussionTitle, cleanDiscussionContent, cleanAuthorName } from '@/lib/textUtils';

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video' | 'document'
  uploading?: boolean
  uploaded?: boolean
  error?: string
}

export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [category, setCategory] = useState<DiscussionCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMediaFiles, setReplyMediaFiles] = useState<MediaFile[]>([]);


  const categoryId = params.categoryId as string;
  const discussionId = params.discussionId as string;

  // Function to clean and validate discussion titles
  const cleanTitle = (title: string): string => {
    if (!title || typeof title !== 'string') {
      return 'Untitled Discussion';
    }
    
    // Clean corrupted patterns
    let cleanedTitle = title
      .replace(/^ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/, '')
      .replace(/ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
      .replace(/DefMtEgac6S9Zq7_gEDiXVbix=s96-/g, '')
      .replace(/6S9Zq7_gEDiXVbix=s96-/g, '')
      .replace(/[a-zA-Z0-9+/=_-]*s96-[a-zA-Z0-9+/=_-]*/g, '')
      .replace(/=s\d+[-\w]*/g, '')
      .replace(/eyJ[a-zA-Z0-9+/=_-]*\.[a-zA-Z0-9+/=_-]*\.[a-zA-Z0-9+/=_-]*/g, '')
      .replace(/[A-Za-z0-9+/=_-]{15,}/g, '')
      .replace(/%[0-9A-Fa-f]{2}/g, '')
      .replace(/^(https?:\/\/)?[a-zA-Z0-9.-]*\.supabase\.co.*$/g, '')
      .replace(/[a-f0-9]{32,}/g, '')
      .replace(/[A-F0-9]{32,}/g, '')
      .replace(/[^a-zA-Z0-9\s\-_.,:!?'"()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Fallback if empty
    if (!cleanedTitle || cleanedTitle.length < 2) {
      const words = title.match(/\b[a-zA-Z]{2,}\b/g);
      if (words && words.length > 0) {
        cleanedTitle = words.slice(0, 5).join(' ');
      }
    }
    
    if (!cleanedTitle || cleanedTitle.length < 2) {
      return category?.name ? `${category.name} Discussion` : 'Discussion Thread';
    }
    
    if (cleanedTitle.length > 80) {
      cleanedTitle = cleanedTitle.substring(0, 77) + '...';
    }
    
    return cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  };

  // Fetch discussion data
  const fetchDiscussionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category details
      const { data: categoryData, error: categoryError } = await supabase
        .from('discussion_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      // Fetch discussion details
      const { data: discussionData, error: discussionError } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', discussionId)
        .eq('category_id', categoryId)
        .single();

      if (discussionError) throw discussionError;
      
      // Clean the discussion data before setting it
      const cleanedDiscussion = {
        ...discussionData,
        title: cleanTitle(discussionData.title),
        content: discussionData.content || 'Join this discussion to learn more.'
      };
      setDiscussion(cleanedDiscussion);

      // Fetch posts for this discussion
      const { data: postsData, error: postsError } = await supabase
        .from('discussion_posts')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (postsError) throw postsError;
      setPosts(postsData || []);

    } catch (err) {
      console.error('Error fetching discussion data:', err);
      setError('Failed to load discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryId, discussionId, category?.name]);



  // Set up real-time subscriptions
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (!mounted) return;
      
      await fetchDiscussionData();
      
      if (!mounted) return;
    };
    
    initializeData();

    // Subscribe to discussion changes
    const discussionSubscription = supabase
      .channel(`discussion_${discussionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'discussions',
          filter: `id=eq.${discussionId}`
        },
        (payload) => {
          if (!mounted) return;
          
          // Update discussion state for any changes
          if (payload.new) {
            setDiscussion(prev => prev ? {
              ...prev,
              ...payload.new,
              title: cleanTitle(payload.new.title || prev.title),
              content: payload.new.content || prev.content || 'Join this discussion to learn more.'
            } : null);
          }
        }
      )
      .subscribe();

    // Subscribe to posts changes
    const postsSubscription = supabase
      .channel(`posts_${discussionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_posts',
          filter: `discussion_id=eq.${discussionId}`
        },
        (payload) => {
          if (!mounted) return;
          if (payload.new) {
            // Check if post already exists to prevent duplicates
            setPosts(current => {
              const existingPost = current.find(post => post.id === payload.new.id);
              if (existingPost) {
                return current; // Post already exists, don't add duplicate
              }
              return [...current, payload.new as DiscussionPost];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'discussion_posts',
          filter: `discussion_id=eq.${discussionId}`
        },
        (payload) => {
          if (!mounted) return;
          if (payload.new) {
            setPosts(current => 
              current.map(post => 
                post.id === payload.new.id ? payload.new as DiscussionPost : post
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'discussion_posts',
          filter: `discussion_id=eq.${discussionId}`
        },
        (payload) => {
          if (!mounted) return;
          if (payload.old) {
            setPosts(current => current.filter(post => post.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      discussionSubscription.unsubscribe();
      postsSubscription.unsubscribe();
    };
  }, [discussionId, categoryId]); // Minimal dependencies

  const handleReplyMediaFilesChange = (files: MediaFile[]) => {
    setReplyMediaFiles(files)
  }

  const uploadReplyMediaFiles = async (): Promise<string[]> => {
    if (replyMediaFiles.length === 0) return []

    const uploadedUrls: string[] = []

    for (const mediaFile of replyMediaFiles) {
      try {
        // Update file status to uploading
        setReplyMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: true, error: undefined } : f
        ))

        // Create unique filename
        const timestamp = Date.now()
        const fileExtension = mediaFile.file.name.split('.').pop()
        const fileName = `discussion-reply-media/${user?.id}/${timestamp}-${mediaFile.id}.${fileExtension}`

        // Upload to Supabase Storage (if configured)
        const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                                     process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here'

        if (isSupabaseConfigured) {
          const { data, error } = await supabase.storage
            .from('media')
            .upload(fileName, mediaFile.file)

          if (error) {
            console.error('Storage upload error:', error)
            throw new Error(error.message || 'Failed to upload file')
          }

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(fileName)

          uploadedUrls.push(publicUrl)
        } else {
          // Fallback: Create a data URL for preview
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(mediaFile.file)
          })
          uploadedUrls.push(dataUrl)
        }

        // Update file status to uploaded
        setReplyMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { ...f, uploading: false, uploaded: true } : f
        ))

      } catch (error) {
        console.error('File upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        // Update file status to error
        setReplyMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id ? { 
            ...f, 
            uploading: false, 
            error: errorMessage 
          } : f
        ))
      }
    }

    return uploadedUrls
  }

  const handleSubmitPost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user || !discussion) return;

    setIsSubmitting(true);
    try {
      // Upload media files first
      const mediaUrls = await uploadReplyMediaFiles()

      const postData: any = {
        discussion_id: discussionId,
        content: newPostContent.trim(),
        author_id: user.id,
        author_name: user.user_metadata?.full_name || user.email || 'Anonymous'
      };
      
      // Add media_urls if there are any uploaded files
      if (mediaUrls.length > 0) {
        postData.media_urls = mediaUrls;
      }
      
      const { data, error } = await supabase
        .from('discussion_posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      // Log activity for streak calculation
      if (data && user?.id) {
        await supabase.from('activity_logs').insert([
          {
            user_id: user.id,
            activity_type: 'discussion_post',
            entity_type: 'discussion',
            entity_id: data.id,
            entity_title: 'Discussion post',
            points_earned: 10
          }
        ])
      }

      // Immediately add the new post to local state (optimistic update)
      if (data) {
        setPosts(current => [...current, data as DiscussionPost]);
      }

      // Update discussion post count and last post info
      await supabase
        .from('discussions')
        .update({
          post_count: discussion.post_count + 1,
          last_post_at: new Date().toISOString(),
          last_post_author: user.user_metadata?.full_name || user.email || 'Anonymous'
        })
        .eq('id', discussionId);

      // Update local discussion state
      setDiscussion(prev => prev ? {
        ...prev,
        post_count: prev.post_count + 1,
        last_post_at: new Date().toISOString(),
        last_post_author: user.user_metadata?.full_name || user.email || 'Anonymous'
      } : null);

      setNewPostContent('');
      setReplyMediaFiles([]);
    } catch (err) {
      console.error('Error submitting post:', err);
      alert('Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [newPostContent, user, discussion, discussionId, replyMediaFiles]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getAuthorAvatar = (authorName: string, authorAvatar?: string) => {
    // Clean corrupted avatar URLs
    if (authorAvatar) {
      if (authorAvatar.includes('ocLYGZMcc9bDx') || 
          authorAvatar.includes('DefMt') ||
          authorAvatar.includes('=s96') ||
          authorAvatar.includes('ya29.') ||
          authorAvatar.includes('eyJ') ||
          authorAvatar.includes('googleapis') ||
          /[A-Za-z0-9]{25,}/.test(authorAvatar)) {
        return authorName ? authorName.charAt(0).toUpperCase() : 'A';
      }
      return authorAvatar;
    }
    return authorName ? authorName.charAt(0).toUpperCase() : 'A';
  };

  // Clean title for display (no console.log to avoid render loops)
  const displayTitle = useMemo(() => {
    if (!discussion) return 'Discussion Thread';
    
    const title = discussion.title || '';
    if (title.includes('ocLYGZMcc9bDx') || 
        title.includes('DefMt') ||
        title.includes('=s96') ||
        title.includes('ya29.') ||
        title.includes('eyJ') ||
        title.includes('googleapis') ||
        /[A-Za-z0-9]{25,}/.test(title)) {
      return 'Discussion Thread';
    }
    return title.trim() || 'Discussion Thread';
  }, [discussion?.title]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load discussion</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDiscussionData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mr-4"
          >
            Try Again
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!discussion || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Discussion not found</h2>
          <p className="text-gray-600 mb-4">The discussion you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to {category.name}
          </button>
          
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-4">
            <span>Discussions</span>
            <span className="mx-2">›</span>
            <span>{category.name}</span>
            <span className="mx-2">›</span>
            <span className="text-gray-900 truncate">{displayTitle}</span>
          </div>
        </div>

        {/* Discussion Header */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-heading-2 font-bold text-gray-900 mb-2">{displayTitle}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                      {getAuthorAvatar(discussion.author_name || '', discussion.author_avatar)}
                    </div>
                    <span className="font-medium">{cleanAuthorName(discussion.author_name || 'Anonymous')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(discussion.created_at)}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{discussion.post_count} replies</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                discussion.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : discussion.status === 'closed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {discussion.status}
              </span>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap discussion-content break-words">{cleanDiscussionContent(discussion.content)}</p>
            </div>

            {discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                {discussion.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Posts */}
        <div className="space-y-4 mb-6">
          {posts.length === 0 ? (
            <Card>
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No replies yet. Be the first to reply!</p>
              </div>
            </Card>
          ) : (
            posts.map((post, index) => (
              <Card key={post.id}>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600 flex-shrink-0">
                      {getAuthorAvatar(post.author_name || '', post.author_avatar)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{post.author_name || 'Anonymous'}</span>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <span className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</span>
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap discussion-content break-words">{post.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Reply Form */}
        {user ? (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to this discussion</h3>
              <form onSubmit={handleSubmitPost}>
                <div className="mb-4">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Write your reply..."
                    required
                  />
                </div>
                
                {/* Media Upload Section */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Supporting Media (Optional)
                  </label>
                  <MediaUpload
                    onFilesChange={handleReplyMediaFilesChange}
                    maxFiles={2}
                    maxSizePerFile={5}
                    acceptedTypes={['image/*', 'video/*', '.pdf']}
                    className="mb-1"
                  />
                  <div className="text-xs text-gray-500 text-center">
                    📎 Add files
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newPostContent.trim()}
                    className="flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? 'Posting...' : 'Post Reply'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Join the discussion</h3>
              <p className="text-gray-600 mb-4">Sign up to reply to this discussion and share your thoughts.</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}