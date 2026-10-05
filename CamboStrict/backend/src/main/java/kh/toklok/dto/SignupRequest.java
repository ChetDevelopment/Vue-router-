package kh.toklok.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class SignupRequest {
    @NotBlank @Size(min = 3, max = 20)
    public String username;

    @NotBlank @Size(min = 12, max = 100)
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{}|;':\",./<>?]).{12,}$",
             message = "Password must be 12+ chars with uppercase, lowercase, number, and special character")
    public String password;

    @Size(max = 50)
    public String displayName;

    @Email @Size(max = 100)
    public String email;

    @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Invalid phone number format")
    @Size(max = 20)
    public String phone;
}
