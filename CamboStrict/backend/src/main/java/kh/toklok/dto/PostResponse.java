package kh.toklok.dto;

import java.util.List;
import java.util.Map;

public class PostResponse {
    public String id;
    public String userId;
    public String username;
    public String userAvatar;
    public String userDisplayName;
    public boolean isUserVerified;
    public String type;
    public List<String> mediaUrls;
    public String coverThumbnailUrl;
    public String caption;
    public String locationTag;
    public String visibility;
    public boolean commentsEnabled;
    public int likeCount;
    public int commentCount;
    public int shareCount;
    public int viewCount;
    public String createdAt;
    public boolean isLikedByUser;
    public boolean isBookmarkedByUser;
    public boolean isFollowingCreator;
    public boolean isArchived;
    public String soundId;
    public String soundName;
    public String soundCreator;
    public String recommendationReason;

    public static PostResponse fromMap(Map<String, Object> row, String currentUserId) {
        PostResponse p = new PostResponse();
        p.id = (String) row.get("id");
        p.userId = (String) row.get("user_id");
        p.username = (String) row.get("username");
        p.userAvatar = (String) row.get("user_avatar");
        p.userDisplayName = (String) row.get("user_display_name");
        p.isUserVerified = DtoUtils.toBool(row.get("is_user_verified"));
        p.type = (String) row.getOrDefault("type", "photo");
        p.coverThumbnailUrl = (String) row.getOrDefault("cover_thumbnail_url", "");
        p.caption = (String) row.getOrDefault("caption", "");
        p.locationTag = (String) row.getOrDefault("location_tag", "");
        p.visibility = (String) row.getOrDefault("visibility", "public");
        p.commentsEnabled = DtoUtils.toBool(row.get("comments_enabled"));
        p.likeCount = DtoUtils.toInt(row.get("like_count"));
        p.commentCount = DtoUtils.toInt(row.get("comment_count"));
        p.shareCount = DtoUtils.toInt(row.get("share_count"));
        p.viewCount = DtoUtils.toInt(row.get("view_count"));
        p.createdAt = DtoUtils.formatTimestamp(row.get("created_at"));
        p.isArchived = DtoUtils.toBool(row.get("is_archived"));
        p.soundId = (String) row.get("sound_id");
        p.soundName = (String) row.get("sound_name");
        p.soundCreator = (String) row.get("sound_creator");
        p.isLikedByUser = false;
        p.isBookmarkedByUser = false;
        p.isFollowingCreator = false;
        p.mediaUrls = DtoUtils.parseMediaUrls(row.get("media_urls"));
        return p;
    }
}
