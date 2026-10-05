package kh.toklok.controller;

import kh.toklok.dto.DeleteAccountRequest;
import kh.toklok.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAccount(Authentication auth, @Valid @RequestBody DeleteAccountRequest req) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(accountService.deleteAccount(userId, req.password));
    }

    @PostMapping("/deactivate")
    public ResponseEntity<?> deactivateAccount(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(accountService.deactivateAccount(userId));
    }

    @PostMapping("/reactivate")
    public ResponseEntity<?> reactivateAccount(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(accountService.reactivateAccount(userId));
    }
}
