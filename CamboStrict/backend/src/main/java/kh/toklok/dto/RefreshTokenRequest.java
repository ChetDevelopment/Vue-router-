package kh.toklok.dto;

import javax.validation.constraints.NotBlank;

public class RefreshTokenRequest {
    @NotBlank(message = "Refresh token is required")
    public String refreshToken;
}
