package com.prpilot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AnalyzePullRequestRequest(
        @NotBlank String prUrl,
        String githubToken,
        @Size(max = 5) List<String> focusAreas,
        String language
) {
}
