package kh.toklok.dto;

import javax.validation.constraints.Size;

public class UpdateProfileRequest {
    @Size(max = 50)
    public String displayName;

    @Size(max = 200)
    public String bio;

    @Size(max = 200)
    public String link;

    @Size(max = 500)
    public String avatarUrl;

    @Size(max = 20)
    public String phone;

    public Boolean isPrivate;
    public Boolean isCreator;
}
