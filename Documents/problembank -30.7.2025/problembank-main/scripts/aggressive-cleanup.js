const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseKey)

const cleanText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Aggressive pattern cleaning
  let cleaned = text
    // Remove specific corrupted patterns
    .replace(/ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/DefMtEgac6S9Zq7_gEDiXVbix/g, '')
    .replace(/LYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/=s\d+[-\w]*/g, '')
    .replace(/ya29\.[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/eyJ[a-zA-Z0-9+/=_-]*\.[a-zA-Z0-9+/=_-]*\.[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/[A-Za-z0-9+/=_-]{25,}/g, '')
    .replace(/googleapis\.com[^\s]*/g, '')
    .replace(/googleusercontent\.com[^\s]*/g, '')
    .replace(/supabase\.co[^\s]*/g, '')
    .replace(/[a-f0-9]{32,}/g, '')
    .replace(/%[0-9A-Fa-f]{2}/g, '')
    .replace(/[^a-zA-Z0-9\s\-_.,:!?'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned || null;
};

async function aggressiveCleanup() {
  try {
    console.log('🧹 Starting aggressive cleanup of discussions...');
    
    // Fetch all discussions
    const { data: discussions, error } = await supabase
      .from('discussions')
      .select('*');
    
    if (error) {
      console.error('Error fetching discussions:', error);
      return;
    }
    
    console.log(`Found ${discussions.length} discussions to clean`);
    
    for (const discussion of discussions) {
      const updates = {};
      let needsUpdate = false;
      
      // Clean title
      const cleanedTitle = cleanText(discussion.title);
      if (cleanedTitle !== discussion.title) {
        updates.title = cleanedTitle || 'Discussion Thread';
        needsUpdate = true;
        console.log(`📝 Cleaning title: "${discussion.title}" -> "${updates.title}"`);
      }
      
      // Clean content
      const cleanedContent = cleanText(discussion.content);
      if (cleanedContent !== discussion.content) {
        updates.content = cleanedContent || 'Join this discussion to learn more.';
        needsUpdate = true;
        console.log(`📄 Cleaning content for discussion ${discussion.id}`);
      }
      
      // Clean author name
      const cleanedAuthor = cleanText(discussion.author_name);
      if (cleanedAuthor !== discussion.author_name) {
        updates.author_name = cleanedAuthor || 'Anonymous';
        needsUpdate = true;
        console.log(`👤 Cleaning author: "${discussion.author_name}" -> "${updates.author_name}"`);
      }
      
      // Clean author avatar
      if (discussion.author_avatar) {
        const cleanedAvatar = cleanText(discussion.author_avatar);
        if (cleanedAvatar !== discussion.author_avatar || 
            discussion.author_avatar.includes('ocLYGZMcc9bDx') ||
            discussion.author_avatar.includes('=s96')) {
          updates.author_avatar = null; // Remove corrupted avatars
          needsUpdate = true;
          console.log(`🖼️ Removing corrupted avatar for discussion ${discussion.id}`);
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('discussions')
          .update(updates)
          .eq('id', discussion.id);
        
        if (updateError) {
          console.error(`Error updating discussion ${discussion.id}:`, updateError);
        } else {
          console.log(`✅ Updated discussion ${discussion.id}`);
        }
      }
    }
    
    // Also clean discussion posts
    console.log('🧹 Cleaning discussion posts...');
    
    const { data: posts, error: postsError } = await supabase
      .from('discussion_posts')
      .select('*');
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    for (const post of posts) {
      const updates = {};
      let needsUpdate = false;
      
      // Clean content
      const cleanedContent = cleanText(post.content);
      if (cleanedContent !== post.content) {
        updates.content = cleanedContent || 'This post has been cleaned.';
        needsUpdate = true;
      }
      
      // Clean author name
      const cleanedAuthor = cleanText(post.author_name);
      if (cleanedAuthor !== post.author_name) {
        updates.author_name = cleanedAuthor || 'Anonymous';
        needsUpdate = true;
      }
      
      // Clean author avatar
      if (post.author_avatar) {
        const cleanedAvatar = cleanText(post.author_avatar);
        if (cleanedAvatar !== post.author_avatar || 
            post.author_avatar.includes('ocLYGZMcc9bDx') ||
            post.author_avatar.includes('=s96')) {
          updates.author_avatar = null;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('discussion_posts')
          .update(updates)
          .eq('id', post.id);
        
        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError);
        }
      }
    }
    
    console.log('🎉 Aggressive cleanup completed!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

aggressiveCleanup(); 