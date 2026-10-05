package kh.toklok.dto;

import javax.validation.constraints.Size;

public class SendMessageRequest {
    @Size(max = 5000)
    public String content;

    public String postId;
}
