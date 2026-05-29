package com.prpilot.util;

import com.prpilot.dto.GitHubPullRequestRef;
import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class GitHubPrUrlParser {

    private static final Pattern PULL_REQUEST_PATH = Pattern.compile("^/([^/]+)/([^/]+)/pull/(\\d+)/?$");

    public GitHubPullRequestRef parse(String prUrl) {
        URI uri = URI.create(prUrl.trim());
        String host = uri.getHost();

        if (host == null || !host.equalsIgnoreCase("github.com")) {
            throw new IllegalArgumentException("Only github.com pull request URLs are supported.");
        }

        Matcher matcher = PULL_REQUEST_PATH.matcher(uri.getPath());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Invalid GitHub pull request URL format.");
        }

        String owner = matcher.group(1);
        String repo = matcher.group(2);
        int pullNumber = Integer.parseInt(matcher.group(3));
        return new GitHubPullRequestRef(owner, repo, pullNumber, prUrl.trim());
    }
}
