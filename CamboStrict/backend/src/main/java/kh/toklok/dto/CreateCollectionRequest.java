package kh.toklok.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class CreateCollectionRequest {
    @NotBlank @Size(min = 1, max = 100)
    public String name;

    @Size(max = 10)
    public String emoji;
}
