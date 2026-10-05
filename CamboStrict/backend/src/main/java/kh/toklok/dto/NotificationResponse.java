package kh.toklok.dto;

import java.util.Map;

public class NotificationResponse {
    public String id;
    public String userId;
    public String actorId;
    public String actorUsername;
    public String actorAvatar;
    public String type;
    public String targetId;
    public String message;
    public boolean isRead;
    public String createdAt;

    public static NotificationResponse fromMap(Map<String, Object> row) {
        NotificationResponse n = new NotificationResponse();
        n.id = (String) row.get("id");
        n.userId = (String) row.get("user_id");
        n.actorId = (String) row.get("actor_id");
        n.actorUsername = (String) row.get("actor_username");
        n.actorAvatar = (String) row.get("actor_avatar");
        n.type = (String) row.get("type");
        n.targetId = (String) row.get("target_id");
        n.message = (String) row.get("message");
        n.isRead = DtoUtils.toBool(row.get("is_read"));
        n.createdAt = DtoUtils.formatTimestamp(row.get("created_at"));
        return n;
    }
}
