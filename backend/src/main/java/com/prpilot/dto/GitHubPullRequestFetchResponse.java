package com.prpilot.dto;

import java.util.List;

public record GitHubPullRequestFetchResponse(
        GitHubPullRequestRef ref,
        PullRequestInfo pullRequest,
        List<FileChange> files
) {
}
