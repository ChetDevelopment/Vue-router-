package kh.toklok.dto;

import javax.validation.constraints.NotBlank;

public class CreateConversationRequest {
    @NotBlank
    public String userId;
}
