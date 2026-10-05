package kh.toklok.controller;

import kh.toklok.repository.ModerationActionRepository;
import kh.toklok.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ReportService reportService;
    private final ModerationActionRepository actionRepo;

    public AdminController(ReportService reportService, ModerationActionRepository actionRepo) {
        this.reportService = reportService;
        this.actionRepo = actionRepo;
    }

    @GetMapping("/kpi")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> getKPIs() {
        return ResponseEntity.ok(reportService.getKPIs());
    }

    @GetMapping("/audit-log")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> getAuditLog(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {
        var actions = actionRepo.findAll(page, limit);
        long total = actionRepo.count();
        return ResponseEntity.ok(Map.of("actions", actions, "total", total, "page", page));
    }
}
