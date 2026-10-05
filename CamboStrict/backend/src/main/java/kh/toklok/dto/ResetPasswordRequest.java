package kh.toklok.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class ResetPasswordRequest {
    @NotBlank
    public String email;

    @NotBlank
    public String token;

    @NotBlank @Size(min = 12, max = 100)
    public String newPassword;
}
