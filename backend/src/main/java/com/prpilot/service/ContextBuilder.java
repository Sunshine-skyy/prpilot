package com.prpilot.service;

import com.prpilot.dto.ChangeSummary;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.RiskAssessment;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ContextBuilder {

    private static final int MAX_PATCH_CHARS_PER_FILE = 4000;

    public String buildReviewContext(
            PullRequestInfo pullRequest,
            ChangeSummary changeSummary,
            RiskAssessment riskAssessment,
            List<FileChange> files,
            List<String> focusAreas
    ) {
        StringBuilder context = new StringBuilder();
        context.append("Pull Request Metadata:\n");
        context.append("- Title: ").append(pullRequest.title()).append("\n");
        context.append("- Source: ").append(pullRequest.url()).append("\n");
        context.append("- Author: ").append(pullRequest.author()).append("\n");
        context.append("- State: ").append(pullRequest.state()).append("\n");
        context.append("- Base branch: ").append(pullRequest.baseBranch()).append("\n");
        context.append("- Head branch: ").append(pullRequest.headBranch()).append("\n");
        context.append("- Changed files: ").append(pullRequest.changedFiles()).append("\n");
        context.append("- Additions: ").append(pullRequest.additions()).append("\n");
        context.append("- Deletions: ").append(pullRequest.deletions()).append("\n\n");

        context.append("Focus Areas:\n");
        if (focusAreas == null || focusAreas.isEmpty()) {
            context.append("- Security\n- Bug Risk\n- Maintainability\n- Testing\n");
        } else {
            focusAreas.forEach(focusArea -> context.append("- ").append(focusArea).append("\n"));
        }
        context.append("\n");

        context.append("Change Summary:\n");
        context.append(changeSummary.overview()).append("\n");
        for (String keyChange : changeSummary.keyChanges()) {
            context.append("- ").append(keyChange).append("\n");
        }
        context.append("\n");

        context.append("Rule-based Risk Assessment:\n");
        context.append("- Score: ").append(riskAssessment.score()).append(" / 100\n");
        context.append("- Level: ").append(riskAssessment.level()).append("\n");
        for (String reason : riskAssessment.reasons()) {
            context.append("- ").append(reason).append("\n");
        }
        context.append("\n");

        context.append("Changed Files and Patches:\n");
        for (FileChange file : prioritizeRiskyFiles(files)) {
            context.append("\nFile: ").append(file.filename()).append("\n");
            context.append("Status: ").append(file.status()).append("\n");
            context.append("Additions/Deletions: +").append(file.additions()).append(" / -").append(file.deletions()).append("\n");
            context.append("Risk Tags: ").append(file.riskTags() == null ? "" : String.join(", ", file.riskTags())).append("\n");
            context.append("Patch:\n");
            context.append(truncatePatch(file.patch())).append("\n");
        }

        return context.toString();
    }

    private List<FileChange> prioritizeRiskyFiles(List<FileChange> files) {
        return files.stream()
                .sorted((left, right) -> Integer.compare(riskTagCount(right), riskTagCount(left)))
                .toList();
    }

    private int riskTagCount(FileChange file) {
        return file.riskTags() == null ? 0 : file.riskTags().size();
    }

    private String truncatePatch(String patch) {
        if (patch == null) {
            return "";
        }
        if (patch.length() <= MAX_PATCH_CHARS_PER_FILE) {
            return patch;
        }
        return patch.substring(0, MAX_PATCH_CHARS_PER_FILE) + "\n[Patch truncated for context length control]";
    }
}
