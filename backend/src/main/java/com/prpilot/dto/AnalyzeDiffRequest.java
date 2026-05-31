package com.prpilot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AnalyzeDiffRequest(
        String title,
        String description,
        @NotBlank String diff,
        @Size(max = 5) List<String> focusAreas,
        String language
) {
}
