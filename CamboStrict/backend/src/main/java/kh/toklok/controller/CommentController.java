package kh.toklok.controller;

import kh.toklok.dto.AddCommentRequest;
import kh.toklok.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<?> getComments(Authentication auth, @PathVariable String postId) {
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        return ResponseEntity.ok(commentService.getComments(postId, userId));
    }

    @PostMapping
    public ResponseEntity<?> addComment(Authentication auth, @PathVariable String postId,
                                         @Valid @RequestBody AddCommentRequest req) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(commentService.addComment(postId, userId, req.content, req.parentCommentId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(Authentication auth, @PathVariable String postId,
                                            @PathVariable String commentId) {
        String userId = (String) auth.getPrincipal();
        commentService.deleteComment(postId, commentId, userId);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<?> likeComment(Authentication auth, @PathVariable String postId,
                                          @PathVariable String commentId) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(commentService.likeComment(commentId, userId));
    }

    @DeleteMapping("/{commentId}/like")
    public ResponseEntity<?> unlikeComment(Authentication auth, @PathVariable String postId,
                                            @PathVariable String commentId) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(commentService.unlikeComment(commentId, userId));
    }
}
