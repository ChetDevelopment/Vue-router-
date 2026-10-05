package kh.toklok.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AddCommentRequest {
    @NotBlank @Size(min = 1, max = 1000)
    public String content;

    public String parentCommentId;
}
