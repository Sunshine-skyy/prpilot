package com.prpilot.service;

import com.prpilot.client.GitHubClient;
import com.prpilot.dto.GitHubPullRequestFetchResponse;
import com.prpilot.dto.GitHubPullRequestRef;
import com.prpilot.util.GitHubPrUrlParser;
import org.springframework.stereotype.Service;

@Service
public class GitHubPullRequestService {

    private final GitHubPrUrlParser gitHubPrUrlParser;
    private final GitHubClient gitHubClient;

    public GitHubPullRequestService(GitHubPrUrlParser gitHubPrUrlParser, GitHubClient gitHubClient) {
        this.gitHubPrUrlParser = gitHubPrUrlParser;
        this.gitHubClient = gitHubClient;
    }

    public GitHubPullRequestFetchResponse fetchPullRequest(String prUrl, String githubToken) {
        GitHubPullRequestRef ref = gitHubPrUrlParser.parse(prUrl);
        return gitHubClient.fetchPullRequest(ref, githubToken);
    }
}
