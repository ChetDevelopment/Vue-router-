package kh.toklok.controller;

import kh.toklok.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam String q,
                                     @RequestParam(defaultValue = "1") int page,
                                     Authentication auth) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.ok(Map.of(
                "query", "", "posts", java.util.List.of(),
                "users", java.util.List.of(), "hashtags", java.util.List.of(),
                "sounds", java.util.List.of(), "totalResults", 0
            ));
        }
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(searchService.searchAll(q, userId, page));
    }

    @PostMapping("/click")
    public ResponseEntity<?> logClick(@RequestBody Map<String, String> body) {
        searchService.logSearchClick(
            body.get("searchHistoryId"),
            body.get("resultId"),
            body.get("resultType")
        );
        return ResponseEntity.ok(Map.of("message", "Logged"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication auth,
                                        @RequestParam(defaultValue = "20") int limit) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("history", searchService.getSearchHistory(userId, limit)));
    }

    @GetMapping("/trending")
    public ResponseEntity<?> getTrending(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(Map.of("trending", searchService.getTrendingSearches(limit)));
    }
}
