package com.prpilot.dto;

import jakarta.validation.constraints.NotBlank;

public record FetchPullRequestRequest(
        @NotBlank String prUrl,
        String githubToken
) {
}
