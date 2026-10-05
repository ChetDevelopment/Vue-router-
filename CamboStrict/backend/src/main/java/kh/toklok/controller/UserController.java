package kh.toklok.controller;

import kh.toklok.dto.UpdateProfileRequest;
import kh.toklok.service.PostService;
import kh.toklok.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PostService postService;

    public UserController(UserService userService, PostService postService) {
        this.userService = userService;
        this.postService = postService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(Authentication auth, @PathVariable String id) {
        String currentUserId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(userService.getUser(id, currentUserId));
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> followUser(Authentication auth, @PathVariable String id) {
        String myId = (String) auth.getPrincipal();
        userService.followUser(myId, id);
        return ResponseEntity.ok(Map.of("message", "Followed"));
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<?> unfollowUser(Authentication auth, @PathVariable String id) {
        String myId = (String) auth.getPrincipal();
        userService.unfollowUser(myId, id);
        return ResponseEntity.ok(Map.of("message", "Unfollowed"));
    }

    @PostMapping("/{id}/approve-request")
    public ResponseEntity<?> approveFollowRequest(Authentication auth, @PathVariable String id) {
        String myId = (String) auth.getPrincipal();
        userService.approveFollowRequest(myId, id);
        return ResponseEntity.ok(Map.of("message", "Follow request approved"));
    }

    @DeleteMapping("/{id}/decline-request")
    public ResponseEntity<?> declineFollowRequest(Authentication auth, @PathVariable String id) {
        String myId = (String) auth.getPrincipal();
        userService.declineFollowRequest(myId, id);
        return ResponseEntity.ok(Map.of("message", "Follow request declined"));
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable String id) {
        return ResponseEntity.ok(userService.getFollowers(id));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<?> getUserPosts(Authentication auth, @PathVariable String id,
                                           @RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "12") int limit) {
        String currentUserId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(userService.getUserPosts(id, page, limit, currentUserId));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<?> getFollowing(@PathVariable String id) {
        return ResponseEntity.ok(userService.getFollowing(id));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(Authentication auth, @RequestParam String q) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(userService.searchUsers(q, userId));
    }

    @PostMapping("/block/{id}")
    public ResponseEntity<?> blockUser(Authentication auth, @PathVariable String id) {
        String myId = (String) auth.getPrincipal();
        userService.blockUser(myId, id);
        return ResponseEntity.ok(Map.of("message", "Blocked"));
    }

    @DeleteMapping("/block/{id}")
    public ResponseEntity<?> unblockUser(Authentication auth, @PathVariable String id) {
        String myId = (String) auth.getPrincipal();
        userService.unblockUser(myId, id);
        return ResponseEntity.ok(Map.of("message", "Unblocked"));
    }

    @GetMapping("/blocked")
    public ResponseEntity<?> getBlockedUsers(Authentication auth) {
        String myId = (String) auth.getPrincipal();
        return ResponseEntity.ok(userService.getBlockedUsers(myId));
    }

    @GetMapping("/suggested")
    public ResponseEntity<?> getSuggestedUsers(Authentication auth) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(userService.getSuggestedUsers(userId));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(Authentication auth, @RequestParam("file") MultipartFile file) {
        String userId = (String) auth.getPrincipal();
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "FILE_REQUIRED", "message", "No file provided")));
        }
        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "FILE_TOO_LARGE", "message", "Avatar exceeds 5MB limit")));
        }
        // Magic byte validation for images
        try {
            byte[] magic = new byte[4];
            try (var is = file.getInputStream()) { is.read(magic, 0, 4); }
            boolean validImage = (magic[0] == (byte)0xFF && magic[1] == (byte)0xD8) // JPEG
                || (magic[0] == (byte)0x89 && magic[1] == (byte)0x50 && magic[2] == (byte)0x4E && magic[3] == (byte)0x47) // PNG
                || (magic[0] == (byte)0x47 && magic[1] == (byte)0x49 && magic[2] == (byte)0x46); // GIF
            if (!validImage) {
                return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "INVALID_IMAGE", "message", "Only JPEG, PNG, and GIF images are allowed for avatars")));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "FILE_READ_ERROR", "message", "Could not read file")));
        }
        try {
            java.nio.file.Files.createDirectories(java.nio.file.Path.of("uploads/avatars"));
            String ext = "";
            String name = file.getOriginalFilename();
            if (name != null && name.contains(".")) ext = name.substring(name.lastIndexOf("."));
            String filename = "avatar_" + userId + "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + ext;
            file.transferTo(new java.io.File("uploads/avatars", filename));
            String avatarUrl = "/uploads/avatars/" + filename;
            // Update avatar via service
            var updateReq = new UpdateProfileRequest();
            updateReq.avatarUrl = avatarUrl;
            userService.updateProfile(userId, updateReq);
            return ResponseEntity.ok(java.util.Map.of("avatarUrl", avatarUrl));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", Map.of("code", "UPLOAD_FAILED", "message", "Avatar upload failed")));
        }
    }
}
