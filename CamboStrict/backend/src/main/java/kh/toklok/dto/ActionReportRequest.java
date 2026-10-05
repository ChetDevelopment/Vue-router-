package kh.toklok.dto;

import javax.validation.constraints.NotBlank;

public class ActionReportRequest {
    @NotBlank
    public String action;
}
