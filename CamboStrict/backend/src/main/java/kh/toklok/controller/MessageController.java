package kh.toklok.controller;

import kh.toklok.dto.CreateConversationRequest;
import kh.toklok.dto.SendMessageRequest;
import kh.toklok.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(messageService.getConversations(userId));
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(Authentication auth, @Valid @RequestBody CreateConversationRequest req) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(messageService.createConversation(userId, req.userId));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String id, @RequestParam(defaultValue = "1") int page,
                                          Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(messageService.getMessages(id, userId, page));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<?> sendMessage(Authentication auth, @PathVariable String id,
                                          @Valid @RequestBody SendMessageRequest req) {
        String userId = (String) auth.getPrincipal();
        if (!messageService.isParticipant(id, userId)) {
            return ResponseEntity.status(403).body(Map.of("error", Map.of("code", "NOT_PARTICIPANT", "message", "You are not a member of this conversation")));
        }
        String content = req.content;
        String postId = req.postId;
        if (content == null && postId == null)
            return ResponseEntity.badRequest().body(Map.of("error", "content or postId required"));
        return ResponseEntity.ok(messageService.sendMessage(id, userId, content, postId));
    }

    @PostMapping("/conversations/{id}/read")
    public ResponseEntity<?> markRead(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        messageService.markRead(id, userId);
        return ResponseEntity.ok(Map.of("message", "Marked read"));
    }
}
