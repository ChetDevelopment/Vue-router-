package kh.toklok.dto;

import javax.validation.constraints.NotBlank;

public class DeleteAccountRequest {
    @NotBlank(message = "Password is required")
    public String password;
}
