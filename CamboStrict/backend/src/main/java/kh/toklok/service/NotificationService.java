package kh.toklok.service;

import kh.toklok.dto.NotificationResponse;
import kh.toklok.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepo;

    public NotificationService(NotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    public List<NotificationResponse> getNotifications(String userId) {
        var rows = notificationRepo.findByUserId(userId);
        return rows.stream().map(NotificationResponse::fromMap).collect(Collectors.toList());
    }

    public void markRead(String notificationId, String userId) {
        notificationRepo.markRead(notificationId, userId);
    }

    public void markAllRead(String userId) {
        notificationRepo.markAllRead(userId);
    }

    public long countUnread(String userId) {
        return notificationRepo.countUnread(userId);
    }
}
