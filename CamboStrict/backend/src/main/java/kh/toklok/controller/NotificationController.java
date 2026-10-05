package kh.toklok.controller;

import kh.toklok.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        notificationService.markRead(id, userId);
        return ResponseEntity.ok(Map.of("message", "Marked read"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("message", "All marked read"));
    }
}
