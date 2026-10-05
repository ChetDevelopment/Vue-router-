package kh.toklok.controller;

import kh.toklok.service.PostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private static final Logger logger = LoggerFactory.getLogger(PostController.class);

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<?> getPosts(Authentication auth,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int limit) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(postService.getPosts(page, limit, userId));
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(Authentication auth,
                                      @RequestParam(defaultValue = "explore") String type,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int limit) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        if ("following".equals(type) && userId != null) {
            return ResponseEntity.ok(postService.getFollowingFeed(userId, page, limit));
        }
        return ResponseEntity.ok(postService.getPosts(page, limit, userId));
    }

    @GetMapping("/explore")
    public ResponseEntity<?> getExplore(Authentication auth,
                                         @RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "20") int limit) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(postService.getExploreFeed(userId, page, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPost(@PathVariable String id, Authentication auth) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(postService.getPost(id, userId));
    }

    @PostMapping
    public ResponseEntity<?> createPost(Authentication auth,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String locationTag,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) Boolean commentsEnabled,
            @RequestParam(required = false) String soundId,
            @RequestParam(required = false) String soundName,
            @RequestParam(required = false) String soundCreator) {
        String userId = (String) auth.getPrincipal();

        String mediaUrl = null;
        String mediaType = "photo";

        if (file != null && !file.isEmpty()) {
            long maxSize = 50 * 1024 * 1024;
            if (file.getSize() > maxSize)
                return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "FILE_TOO_LARGE", "message", "File exceeds 50MB limit")));
            String contentType = file.getContentType();
            if (contentType != null) {
                if (contentType.startsWith("video/")) mediaType = "video";
                else if (contentType.startsWith("image/")) mediaType = "photo";
                else return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "INVALID_FILE", "message", "Only image/video files allowed")));
            }
            // Magic byte validation — prevents MIME-type spoofing
            try {
                byte[] magic = new byte[8];
                try (var is = file.getInputStream()) {
                    is.read(magic, 0, 8);
                }
                boolean valid = (magic[0] == (byte)0xFF && magic[1] == (byte)0xD8) // JPEG
                    || (magic[0] == (byte)0x89 && magic[1] == (byte)0x50 && magic[2] == (byte)0x4E && magic[3] == (byte)0x47) // PNG
                    || (magic[0] == (byte)0x47 && magic[1] == (byte)0x49 && magic[2] == (byte)0x46) // GIF
                    || (magic[4] == (byte)0x66 && magic[5] == (byte)0x74 && magic[6] == (byte)0x79 && magic[7] == (byte)0x70) // MP4
                    || (magic[0] == (byte)0x1A && magic[1] == (byte)0x45 && magic[2] == (byte)0xDF && magic[3] == (byte)0xA3); // WebM
                if (!valid) {
                    if ("photo".equals(mediaType) || "video".equals(mediaType)) {
                        // Known type but magic bytes don't match — reject
                        return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "INVALID_FILE_CONTENT", "message", "File content does not match expected type")));
                    }
                }
            } catch (Exception e) {
                // If reading magic bytes fails, continue with Content-Type check only
                logger.warn("Failed to validate file magic bytes", e);
            }
            try {
                Files.createDirectories(Path.of("uploads"));
                String fn = UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename().replaceAll("[\\\\/:*?\"<>|]", "_") : "file");
                file.transferTo(new File("uploads", fn));
                mediaUrl = "/uploads/" + fn;
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of("error", Map.of("code", "UPLOAD_FAILED", "message", "Upload failed")));
            }
        }

        var post = postService.createPost(userId, caption, locationTag, visibility, commentsEnabled,
            soundId, soundName, soundCreator, mediaUrl, mediaType);
        return ResponseEntity.ok(post);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updatePost(Authentication auth, @PathVariable String id,
                                         @RequestBody Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(postService.updatePost(id, userId, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        postService.deletePost(id, userId);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<?> bookmarkPost(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        postService.bookmarkPost(id, userId);
        return ResponseEntity.ok(Map.of("bookmarked", true));
    }

    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<?> unbookmarkPost(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        postService.unbookmarkPost(id, userId);
        return ResponseEntity.ok(Map.of("bookmarked", false));
    }

    @GetMapping("/bookmarked")
    public ResponseEntity<?> getBookmarkedPosts(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("posts", postService.getBookmarkedPosts(userId)));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(postService.likePost(id, userId));
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<?> unlikePost(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(postService.unlikePost(id, userId));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchPosts(Authentication auth, @RequestParam String q) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(postService.searchPosts(q, userId));
    }

    @GetMapping("/hashtags/trending")
    public ResponseEntity<?> getTrendingHashtags() {
        return ResponseEntity.ok(postService.getTrendingHashtags());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(postService.getAnalytics(userId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(@RequestParam(defaultValue = "weekly") String period) {
        return ResponseEntity.ok(postService.getLeaderboard(period));
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyPosts(Authentication auth,
                                             @RequestParam double lat,
                                             @RequestParam double lng,
                                             @RequestParam(defaultValue = "10") double radius) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(postService.getNearbyPosts(lat, lng, radius, userId));
    }
}
