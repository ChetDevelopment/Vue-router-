package kh.toklok.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class CreateReportRequest {
    @NotBlank
    public String targetType;

    @NotBlank
    public String targetId;

    @NotBlank @Size(max = 500)
    public String reason;
}
