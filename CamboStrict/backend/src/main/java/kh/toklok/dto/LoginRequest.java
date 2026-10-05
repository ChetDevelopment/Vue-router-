package kh.toklok.dto;

import javax.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank
    public String login;
    @NotBlank
    public String password;
}
