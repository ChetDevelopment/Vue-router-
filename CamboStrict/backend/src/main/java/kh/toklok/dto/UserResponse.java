package kh.toklok.dto;

import java.util.Map;
import kh.toklok.dto.DtoUtils;

public class UserResponse {
    public String id;
    public String username;
    public String displayName;
    public String email;
    public String phone;
    public String avatarUrl;
    public String bio;
    public String link;
    public boolean isPrivate;
    public boolean isCreator;
    public boolean isVerified;
    public String role;
    public String status;
    public int followerCount;
    public int followingCount;
    public int totalLikesReceived;
    public boolean isFollowing;
    public String createdAt;

    public boolean isOwnProfile;

    public static UserResponse fromMap(Map<String, Object> row) {
        UserResponse u = new UserResponse();
        u.id = (String) row.get("id");
        u.username = (String) row.get("username");
        u.displayName = (String) row.get("display_name");
        // Email and phone are only included for own profile (set by controller)
        u.email = null;
        u.phone = null;
        u.avatarUrl = (String) row.getOrDefault("avatar_url", "");
        u.bio = (String) row.getOrDefault("bio", "");
        u.link = (String) row.getOrDefault("link", "");
        u.isPrivate = DtoUtils.toBool(row.get("is_private"));
        u.isCreator = DtoUtils.toBool(row.get("is_creator"));
        u.isVerified = DtoUtils.toBool(row.get("is_verified"));
        u.role = (String) row.getOrDefault("role", "user");
        u.status = (String) row.getOrDefault("status", "active");
        u.followerCount = DtoUtils.toInt(row.get("follower_count"));
        u.followingCount = DtoUtils.toInt(row.get("following_count"));
        u.totalLikesReceived = DtoUtils.toInt(row.get("total_likes_received"));
        u.isFollowing = DtoUtils.toBool(row.get("is_following"));
        u.createdAt = DtoUtils.formatTimestamp(row.get("created_at"));
        return u;
    }
}
