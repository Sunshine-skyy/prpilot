package com.prpilot.dto;

public record GitHubPullRequestRef(
        String owner,
        String repo,
        int pullNumber,
        String url
) {
}
