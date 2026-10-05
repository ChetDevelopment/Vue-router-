package kh.toklok.dto;

import java.util.Map;

public class CommentResponse {
    public String id;
    public String postId;
    public String userId;
    public String username;
    public String userAvatar;
    public String userDisplayName;
    public String content;
    public int likeCount;
    public String createdAt;
    public boolean isLikedByUser;
    public String parentCommentId;

    public static CommentResponse fromMap(Map<String, Object> row) {
        CommentResponse c = new CommentResponse();
        c.id = (String) row.get("id");
        c.postId = (String) row.get("post_id");
        c.userId = (String) row.get("user_id");
        c.username = (String) row.get("username");
        c.userAvatar = (String) row.get("user_avatar");
        c.userDisplayName = (String) row.get("user_display_name");
        c.content = (String) row.get("content");
        c.likeCount = DtoUtils.toInt(row.get("like_count"));
        c.createdAt = DtoUtils.formatTimestamp(row.get("created_at"));
        c.isLikedByUser = false;
        c.parentCommentId = (String) row.get("parent_comment_id");
        return c;
    }
}
