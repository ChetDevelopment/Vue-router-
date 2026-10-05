package kh.toklok.dto;

import javax.validation.constraints.NotBlank;

public class AddToCollectionRequest {
    @NotBlank
    public String postId;
}
