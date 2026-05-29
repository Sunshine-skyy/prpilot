package com.prpilot.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.GitHubPullRequestFetchResponse;
import com.prpilot.dto.GitHubPullRequestRef;
import com.prpilot.dto.PullRequestInfo;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class GitHubClient {

    private final WebClient webClient;

    public GitHubClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://api.github.com")
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .build();
    }

    public GitHubPullRequestFetchResponse fetchPullRequest(GitHubPullRequestRef ref, String githubToken) {
        GitHubPullRequestApiResponse pullRequest = webClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{pullNumber}", ref.owner(), ref.repo(), ref.pullNumber())
                .headers(headers -> applyToken(headers, githubToken))
                .retrieve()
                .bodyToMono(GitHubPullRequestApiResponse.class)
                .block();

        List<GitHubFileApiResponse> githubFiles = webClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{pullNumber}/files", ref.owner(), ref.repo(), ref.pullNumber())
                .headers(headers -> applyToken(headers, githubToken))
                .retrieve()
                .bodyToFlux(GitHubFileApiResponse.class)
                .collectList()
                .block();

        if (pullRequest == null || githubFiles == null) {
            throw new IllegalStateException("GitHub API returned an empty pull request response.");
        }

        PullRequestInfo pullRequestInfo = new PullRequestInfo(
                pullRequest.title(),
                pullRequest.htmlUrl(),
                pullRequest.user() == null ? "unknown" : pullRequest.user().login(),
                pullRequest.state(),
                pullRequest.base() == null ? "" : pullRequest.base().ref(),
                pullRequest.head() == null ? "" : pullRequest.head().ref(),
                pullRequest.changedFiles(),
                pullRequest.additions(),
                pullRequest.deletions()
        );

        List<FileChange> files = githubFiles.stream()
                .map(file -> new FileChange(
                        file.filename(),
                        file.status(),
                        file.additions(),
                        file.deletions(),
                        file.patch() == null ? "" : file.patch(),
                        List.of()
                ))
                .toList();

        return new GitHubPullRequestFetchResponse(ref, pullRequestInfo, files);
    }

    private void applyToken(HttpHeaders headers, String githubToken) {
        if (StringUtils.hasText(githubToken)) {
            headers.setBearerAuth(githubToken.trim());
        }
        headers.setAccept(List.of(MediaType.valueOf("application/vnd.github+json")));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubPullRequestApiResponse(
            String title,
            String state,
            @JsonProperty("html_url") String htmlUrl,
            GitHubUser user,
            GitHubBranch base,
            GitHubBranch head,
            @JsonProperty("changed_files") int changedFiles,
            int additions,
            int deletions
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubUser(String login) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubBranch(String ref) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubFileApiResponse(
            String filename,
            String status,
            int additions,
            int deletions,
            String patch
    ) {
    }
}
