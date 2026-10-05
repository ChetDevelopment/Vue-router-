package kh.toklok.service;

import kh.toklok.exception.BadRequestException;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.repository.ModerationActionRepository;
import kh.toklok.repository.NotificationRepository;
import kh.toklok.repository.PostRepository;
import kh.toklok.repository.ReportRepository;
import kh.toklok.repository.UserRepository;
import kh.toklok.service.PushNotificationService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ReportRepository reportRepo;
    private final UserRepository userRepo;
    private final PostRepository postRepo;
    private final ModerationActionRepository actionRepo;
    private final NotificationRepository notificationRepo;
    private final PushNotificationService pushService;

    public ReportService(ReportRepository reportRepo, UserRepository userRepo,
                          PostRepository postRepo, ModerationActionRepository actionRepo,
                          NotificationRepository notificationRepo,
                          PushNotificationService pushService) {
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
        this.postRepo = postRepo;
        this.actionRepo = actionRepo;
        this.notificationRepo = notificationRepo;
        this.pushService = pushService;
    }

    public Map<String, Object> getReports(int page, int limit, String statusFilter) {
        var reports = reportRepo.findAll(page, limit, statusFilter);
        long total = reportRepo.count(statusFilter);
        return Map.of("reports", reports, "total", total, "page", page);
    }

    public Map<String, Object> createReport(String userId, String targetType, String targetId, String reason) {
        if (targetType == null || targetId == null || reason == null)
            throw new IllegalArgumentException("Missing fields");

        String excerpt = null;
        if ("post".equals(targetType)) {
            var post = postRepo.findById(targetId, null);
            if (post != null) {
                String cap = (String) post.get("caption");
                if (cap != null && cap.length() > 100) cap = cap.substring(0, 100);
                excerpt = cap;
            }
        }

        String id = reportRepo.create(userId, targetType, targetId, reason, excerpt);
        return Map.of("id", id, "status", "pending");
    }

    private static final java.util.Set<String> ALLOWED_ACTIONS = java.util.Set.of(
        "dismiss", "actioned", "remove_post", "warn_user", "suspend_user"
    );

    public Map<String, Object> actionReport(String reportId, String moderatorId, String action) {
        if (action == null || !ALLOWED_ACTIONS.contains(action)) {
            throw new IllegalArgumentException("Invalid action: " + action);
        }

        var report = reportRepo.findById(reportId);
        if (report == null) throw new ResourceNotFoundException("Report not found");

        String targetType = (String) report.get("target_type");
        String targetId = (String) report.get("target_id");
        String targetUserId = null;
        String targetPostId = null;
        String targetCreatorId = null;

        if ("post".equals(targetType)) {
            targetPostId = targetId;
            var post = postRepo.findById(targetId, moderatorId);
            if (post != null) {
                targetCreatorId = (String) post.get("user_id");
            }
        } else if ("user".equals(targetType)) {
            targetUserId = targetId;
        } else if ("comment".equals(targetType)) {
            targetPostId = targetId;
        }

        String status;
        String auditAction;
        String auditReason = (String) report.get("reason");
        Integer durationHours = null;

        switch (action) {
            case "dismiss":
                status = "dismissed";
                auditAction = "dismiss_report";
                break;
            case "actioned":
                status = "actioned";
                auditAction = "actioned";
                break;
            case "remove_post":
                status = "actioned";
                auditAction = "remove_post";
                if (targetPostId != null) {
                    postRepo.updateField(targetPostId, "is_archived", 1);
                }
                break;
            case "warn_user":
                status = "actioned";
                auditAction = "warn";
                if (targetCreatorId != null) {
                    String notifId = notificationRepo.create(
                        targetCreatorId, moderatorId, "moderation_warning", targetPostId,
                        "Your content was flagged: " + auditReason
                    );
                    pushService.sendPush(targetCreatorId, "Content Warning",
                        "Your post was flagged: " + auditReason,
                        Map.of("type", "moderation_warning", "postId", targetPostId, "notificationId", notifId));
                }
                break;
            case "suspend_user":
                status = "actioned";
                auditAction = "suspend";
                String suspendUserId = targetCreatorId != null ? targetCreatorId : targetUserId;
                if (suspendUserId != null) {
                    userRepo.update("UPDATE users SET status = 'suspended' WHERE id = ?", suspendUserId);
                    notificationRepo.create(
                        suspendUserId, moderatorId, "account_suspended", null,
                        "Your account has been suspended: " + auditReason
                    );
                }
                durationHours = 72;
                break;
            default:
                throw new IllegalArgumentException("Invalid action: " + action);
        }

        reportRepo.actionReport(reportId, status, moderatorId);

        String actionId = actionRepo.create(moderatorId, targetCreatorId != null ? targetCreatorId : targetUserId,
            targetPostId, auditAction, auditReason, durationHours, reportId);

        return Map.of(
            "status", status,
            "actionId", actionId,
            "message", "Action recorded"
        );
    }

    public Map<String, Object> getKPIs() {
        long dau = reportRepo.countDAU();
        long flagged = reportRepo.countFlaggedItems();
        long published = reportRepo.countPublishedPosts();
        return Map.of(
            "dau", dau,
            "flaggedItems", flagged,
            "publishedPosts", published
        );
    }
}
