const data = {
  id: 'post_8',
  user_id: 'user_10',
  media_urls: JSON.stringify(["https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&h=1200"]),
  is_archived: 0,
  is_user_verified: 0,
  created_at: "2026-07-16T03:51:43.000+00:00",
  caption: "Test caption",
  username: "test_user",
  user_avatar: "https://example.com/avatar.jpg",
  user_display_name: "Test User",
  like_count: 100,
  comment_count: 10,
  share_count: 5,
  view_count: 1000
};

function toCamelCase(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj) {
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (obj !== null && typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      let v = transformKeys(value);
      const boolFields = ["isPrivate","isCreator","isVerified","isUserVerified","commentsEnabled","isArchived","isRead","isLikedByUser","isBookmarkedByUser","isFollowingCreator"];
      if (boolFields.includes(camelKey) && typeof v === "number") v = v === 1;
      result[camelKey] = v;
    }
    return result;
  }
  return obj;
}

function fixBooleans(obj) {
  if (Array.isArray(obj)) return obj.map(fixBooleans);
  if (obj !== null && typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      let v = fixBooleans(value);
      if (typeof v === "string" && v.startsWith("[")) {
        try { v = JSON.parse(v); } catch {}
      }
      result[key] = v;
    }
    return result;
  }
  return obj;
}

const t1 = transformKeys(data);
console.log("AFTER transformKeys:");
console.log("  mediaUrls type:", typeof t1.mediaUrls);
console.log("  mediaUrls value:", t1.mediaUrls);
console.log("  isArchived type:", typeof t1.isArchived, "value:", t1.isArchived);
console.log("  isUserVerified type:", typeof t1.isUserVerified, "value:", t1.isUserVerified);

const t2 = fixBooleans(t1);
console.log("\nAFTER fixBooleans:");
console.log("  mediaUrls type:", typeof t2.mediaUrls, "isArray:", Array.isArray(t2.mediaUrls));
console.log("  mediaUrls[0]:", t2.mediaUrls && t2.mediaUrls[0]);
console.log("  isArchived type:", typeof t2.isArchived, "value:", t2.isArchived);
