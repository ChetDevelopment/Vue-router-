package kh.toklok.controller;

import kh.toklok.dto.ActionReportRequest;
import kh.toklok.dto.CreateReportRequest;
import kh.toklok.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> getReports(Authentication auth,
                                        @RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "50") int limit,
                                        @RequestParam(defaultValue = "all") String status) {
        return ResponseEntity.ok(reportService.getReports(page, limit, status));
    }

    @PostMapping
    public ResponseEntity<?> createReport(Authentication auth, @Valid @RequestBody CreateReportRequest req) {
        String userId = (String) auth.getPrincipal();
        var result = reportService.createReport(userId, req.targetType, req.targetId, req.reason);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<?> actionReport(Authentication auth, @PathVariable String id,
                                           @Valid @RequestBody ActionReportRequest req) {
        String moderatorId = (String) auth.getPrincipal();
        return ResponseEntity.ok(reportService.actionReport(id, moderatorId, req.action));
    }
}
