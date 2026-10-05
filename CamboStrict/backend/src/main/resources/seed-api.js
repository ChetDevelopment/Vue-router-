// TokLok Seed Data Generator
// Run: node seed-api.js
// Creates users, posts, follows, and comments through the REAL API
// All data is marked as seed for easy cleanup

const API = 'http://localhost:3001/api';
const SEED_TAG = '[SEED DATA]';

const users = [
  { username: 'sokha_travels', displayName: 'Sokha Ly', email: 'sokha@seed.toklok', password: 'test1234' },
  { username: 'khmer_kitchen', displayName: 'Chef Bopha', email: 'bopha@seed.toklok', password: 'test1234' },
  { username: 'dara_music', displayName: 'Dara Sok', email: 'dara@seed.toklok', password: 'test1234' },
  { username: 'siemreap_daily', displayName: 'Siem Reap Daily', email: 'daily@seed.toklok', password: 'test1234' },
];

const posts = [
  { username: 'sokha_travels', caption: 'Magical sunrise at Angkor Wat! Never gets old. 🏛️✨', locationTag: 'Angkor Wat, Siem Reap' },
  { username: 'sokha_travels', caption: 'Exploring the floating villages on Tonle Sap. These communities are incredible! 🛶', locationTag: 'Tonle Sap, Siem Reap' },
  { username: 'sokha_travels', caption: 'Sunset hike in the Cardamom Mountains. The mist over the rainforest is breathtaking! 🌄', locationTag: 'Cardamom Mountains, Koh Kong' },
  { username: 'khmer_kitchen', caption: 'Cooking the ultimate Fish Amok! Fresh lemongrass, turmeric, and creamy coconut milk 🥥', locationTag: 'Phnom Penh' },
  { username: 'khmer_kitchen', caption: 'Nom Banh Chok for breakfast! Rice noodles with fish gravy is the ultimate Khmer comfort food 🍜', locationTag: 'Phnom Penh' },
  { username: 'khmer_kitchen', caption: 'Fresh Kampot pepper crab! The best seafood you will ever taste 🦀', locationTag: 'Kampot' },
  { username: 'dara_music', caption: 'Performing at Koh Pich concert hall! Thank you Phnom Penh for the incredible energy 🙏❤️', locationTag: 'Koh Pich, Phnom Penh' },
  { username: 'dara_music', caption: 'Behind the scenes at the studio. New single dropping next week! 🎵', locationTag: 'Phnom Penh' },
  { username: 'siemreap_daily', caption: 'Bayon Temple at golden hour. Those 216 smiling faces never get old 🏛️', locationTag: 'Bayon, Siem Reap' },
  { username: 'siemreap_daily', caption: 'Morning alms giving ceremony at the local pagoda. A beautiful tradition 🙏', locationTag: 'Siem Reap' },
];

const comments = [
  { content: 'Absolutely stunning! 🔥' },
  { content: 'This is amazing! 😍' },
  { content: 'I need to visit this place!' },
  { content: 'Wow, incredible shot!' },
  { content: 'How long was the hike?' },
  { content: 'Recipe please! 🙏' },
  { content: 'Looks delicious!' },
  { content: 'When is the next show? 🎵' },
];

const IMAGES = [
  'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1589308078053-be088b0e011a?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800&h=1200',
  'https://images.unsplash.com/photo-1528184039930-bd03972bd974?auto=format&fit=crop&w=800&h=1200',
];

async function main() {
  console.log('🌱 TokLok Seed Data Generator\n');

  const tokens = {};

  // Step 1: Create users
  console.log('📝 Creating users...');
  for (const u of users) {
    try {
      // First try logging in (user might already exist)
      const loginRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: u.email, password: u.password }),
      });
      if (loginRes.ok) {
        const data = await loginRes.json();
        tokens[u.username] = data.token;
        console.log(`  ✅ Logged in: ${u.username}`);
        continue;
      }
    } catch {}

    // Sign up new user
    try {
      const signupRes = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u),
      });
      if (signupRes.ok) {
        const data = await signupRes.json();
        tokens[u.username] = data.token;
        console.log(`  ✅ Created: ${u.username}`);
      } else {
        const err = await signupRes.text();
        console.log(`  ⚠️  Failed to create ${u.username}: ${err}`);
      }
    } catch (e) {
      console.log(`  ❌ Error creating ${u.username}: ${e.message}`);
    }
  }

  // Are we on a fresh DB?
  const needPosts = Object.keys(tokens).length > 0;
  if (!needPosts) {
    console.log('\n⚠️  No users created — trying API health check...');
    const health = await fetch(`${API}/health`).then(r => r.json());
    console.log(`   API status: ${health.status}`);
    return;
  }

  // Step 2: Create posts
  console.log('\n📝 Creating posts...');
  const postIds = [];
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const token = tokens[p.username];
    if (!token) {
      console.log(`  ⚠️  No token for ${p.username}, skipping post`);
      continue;
    }

    try {
      const form = new FormData();
      form.append('caption', `${p.caption} ${SEED_TAG}`);
      form.append('locationTag', p.locationTag);
      form.append('visibility', 'public');
      form.append('commentsEnabled', 'true');

      const postRes = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });

      if (postRes.ok) {
        const data = await postRes.json();
        postIds.push(data.id || data.postId);
        console.log(`  ✅ Post ${i + 1}: ${p.caption.substring(0, 40)}...`);
      } else {
        const err = await postRes.text();
        console.log(`  ⚠️  Failed post ${i + 1}: ${err.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`  ❌ Error posting ${i + 1}: ${e.message}`);
    }
  }

  if (postIds.length === 0) {
    console.log('\n⚠️  No posts created. Exiting.');
    return;
  }

  // Step 3: Create likes
  console.log('\n❤️  Creating likes...');
  const usernames = Object.keys(tokens);
  for (const postId of postIds) {
    // Each post gets 2-4 random likes from other users
    const likers = usernames.sort(() => Math.random() - 0.5).slice(1, Math.min(4, usernames.length));
    for (const liker of likers) {
      try {
        await fetch(`${API}/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokens[liker]}` },
        });
      } catch {}
    }
    console.log(`  ✅ Liked post ${postId.substring(0, 8)}... by ${likers.length} users`);
  }

  // Step 4: Create comments
  console.log('\n💬 Creating comments...');
  for (const postId of postIds.slice(0, 6)) {
    const commentCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < commentCount; i++) {
      const commenter = usernames[Math.floor(Math.random() * usernames.length)];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      try {
        await fetch(`${API}/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens[commenter]}`,
          },
          body: JSON.stringify({ content: comment.content }),
        });
      } catch {}
    }
    console.log(`  ✅ ${commentCount} comments on post ${postId.substring(0, 8)}...`);
  }

  // Step 5: Create follows
  console.log('\n🤝 Creating follow relationships...');
  for (const follower of usernames) {
    for (const target of usernames) {
      if (follower !== target && Math.random() > 0.4) {
        try {
          const userRes = await fetch(`${API}/users/search?q=${target}`, {
            headers: { 'Authorization': `Bearer ${tokens[follower]}` },
          });
          const users = await userRes.json();
          if (users.length > 0) {
            await fetch(`${API}/users/${users[0].id}/follow`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${tokens[follower]}` },
            });
          }
        } catch {}
      }
    }
    console.log(`  ✅ ${follower} followed some creators`);
  }

  console.log('\n✨ Seed complete!');
  console.log(`   Created: ${Object.keys(tokens).length} users, ${postIds.length} posts`);
  console.log('\n⚠️  All seed data is tagged with "[SEED DATA]" in captions for easy identification.');
  console.log('   Delete with: DELETE FROM posts WHERE caption LIKE "%[SEED DATA]%";');
}

main().catch(console.error);
