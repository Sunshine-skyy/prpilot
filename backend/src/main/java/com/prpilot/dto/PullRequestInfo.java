package com.prpilot.dto;

public record PullRequestInfo(
        String title,
        String url,
        String author,
        String state,
        String baseBranch,
        String headBranch,
        int changedFiles,
        int additions,
        int deletions
) {
}
