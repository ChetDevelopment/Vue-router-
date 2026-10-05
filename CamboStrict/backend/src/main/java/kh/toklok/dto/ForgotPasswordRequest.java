package kh.toklok.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

public class ForgotPasswordRequest {
    @NotBlank @Email
    public String email;
}
