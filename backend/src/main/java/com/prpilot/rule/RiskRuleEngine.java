package com.prpilot.rule;

import com.prpilot.dto.FileChange;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.RiskAssessment;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class RiskRuleEngine {

    private static final int LARGE_CHANGE_LINES_THRESHOLD = 500;
    private static final int MANY_FILES_THRESHOLD = 10;

    public RiskRuleResult analyze(PullRequestInfo pullRequest, List<FileChange> files) {
        List<FileChange> safeFiles = files == null ? List.of() : files;
        List<RiskSignal> signals = new ArrayList<>();
        List<FileChange> taggedFiles = safeFiles.stream()
                .map(file -> analyzeFile(file, signals))
                .toList();

        addPullRequestLevelSignals(pullRequest, taggedFiles, signals);

        int score = Math.min(100, signals.stream().mapToInt(RiskSignal::scoreImpact).sum());
        RiskAssessment riskAssessment = new RiskAssessment(
                score,
                resolveRiskLevel(score),
                signals.stream().map(RiskSignal::reason).distinct().toList()
        );

        return new RiskRuleResult(riskAssessment, taggedFiles, signals);
    }

    private FileChange analyzeFile(FileChange file, List<RiskSignal> signals) {
        Set<String> riskTags = new LinkedHashSet<>();
        if (file.riskTags() != null) {
            riskTags.addAll(file.riskTags());
        }

        String filename = nullToEmpty(file.filename());
        String filenameLower = filename.toLowerCase(Locale.ROOT);
        String patch = nullToEmpty(file.patch());
        String patchLower = patch.toLowerCase(Locale.ROOT);
        String combined = filenameLower + "\n" + patchLower;

        if (containsAny(combined, "auth", "login", "token", "permission", "role", "jwt")) {
            addSignal(signals, riskTags, "auth-permission", "Authentication or permission-related code changed.", filename, 16);
        }
        if (containsAny(combined, "database", "migration", "schema", "sql", "repository")) {
            addSignal(signals, riskTags, "database", "Database or schema-related code changed.", filename, 14);
        }
        if (containsAny(combined, "config", ".env", "secret", "api_key", "apikey", "password", "credential")) {
            addSignal(signals, riskTags, "config-secret", "Configuration or secret-related keywords were changed.", filename, 16);
        }
        if (containsAny(patchLower, "todo", "fixme")) {
            addSignal(signals, riskTags, "todo-fixme", "TODO or FIXME remains in the changed code.", filename, 8);
        }
        if (containsAny(patchLower, "console.log", "system.out.println", "printstacktrace")) {
            addSignal(signals, riskTags, "debug-logging", "Debug logging appears in the changed code.", filename, 10);
        }
        if (hasEmptyCatchBlock(patchLower)) {
            addSignal(signals, riskTags, "empty-catch", "A catch block may swallow exceptions without handling them.", filename, 12);
        }
        if (removesValidationLogic(patchLower)) {
            addSignal(signals, riskTags, "validation-removed", "The diff appears to remove validation or guard logic.", filename, 18);
        }
        if (isSensitiveFile(filenameLower)) {
            addSignal(signals, riskTags, "sensitive-file", "A sensitive configuration, dependency, or security-related file changed.", filename, 14);
        }
        if (isTestFile(filenameLower)) {
            riskTags.add("test-file");
        }

        return new FileChange(
                file.filename(),
                file.status(),
                file.additions(),
                file.deletions(),
                file.patch(),
                List.copyOf(riskTags)
        );
    }

    private void addPullRequestLevelSignals(PullRequestInfo pullRequest, List<FileChange> files, List<RiskSignal> signals) {
        int changedFiles = pullRequest == null ? files.size() : Math.max(pullRequest.changedFiles(), files.size());
        int additions = pullRequest == null ? sumAdditions(files) : pullRequest.additions();
        int deletions = pullRequest == null ? sumDeletions(files) : pullRequest.deletions();
        int changedLines = additions + deletions;

        if (changedLines >= LARGE_CHANGE_LINES_THRESHOLD) {
            signals.add(new RiskSignal("large-change", "Large pull request size increases review risk.", null, 16));
        }
        if (changedFiles >= MANY_FILES_THRESHOLD) {
            signals.add(new RiskSignal("many-files", "Many files changed in a single pull request.", null, 12));
        }
        if (!files.isEmpty() && files.stream().noneMatch(file -> isTestFile(nullToEmpty(file.filename()).toLowerCase(Locale.ROOT)))) {
            signals.add(new RiskSignal("missing-tests", "No test files were changed in this pull request.", null, 14));
        }
        if (hasRiskTag(files, "auth-permission") && !hasRiskTag(files, "test-file")) {
            signals.add(new RiskSignal("auth-without-tests", "Authentication or permission changes do not include test updates.", null, 16));
        }
        if (hasRiskTag(files, "database") && !hasRiskTag(files, "test-file")) {
            signals.add(new RiskSignal("database-without-tests", "Database-related changes do not include test updates.", null, 12));
        }
    }

    private void addSignal(List<RiskSignal> signals, Set<String> riskTags, String tag, String reason, String filename, int scoreImpact) {
        riskTags.add(tag);
        signals.add(new RiskSignal(tag, reason, filename, scoreImpact));
    }

    private boolean containsAny(String value, String... keywords) {
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasEmptyCatchBlock(String patchLower) {
        return patchLower.matches("(?s).*catch\\s*\\([^)]*\\)\\s*\\{\\s*}.*")
                || patchLower.matches("(?s).*catch\\s*\\{\\s*}.*");
    }

    private boolean removesValidationLogic(String patchLower) {
        return patchLower.lines()
                .filter(line -> line.startsWith("-") && !line.startsWith("---"))
                .anyMatch(line -> containsAny(
                        line,
                        "validate",
                        "validation",
                        "guard",
                        "check",
                        "required",
                        "permission",
                        "authorize",
                        "authenticated"
                ));
    }

    private boolean isSensitiveFile(String filenameLower) {
        return filenameLower.endsWith(".env")
                || filenameLower.contains(".env.")
                || filenameLower.contains("application.yml")
                || filenameLower.contains("application.yaml")
                || filenameLower.contains("application.properties")
                || filenameLower.contains("package-lock.json")
                || filenameLower.contains("pom.xml")
                || filenameLower.contains("build.gradle")
                || filenameLower.contains("dockerfile")
                || filenameLower.contains("docker-compose")
                || filenameLower.contains("security")
                || filenameLower.contains("auth")
                || filenameLower.contains("config");
    }

    private boolean isTestFile(String filenameLower) {
        return filenameLower.contains("/test/")
                || filenameLower.contains("/tests/")
                || filenameLower.contains("\\test\\")
                || filenameLower.contains("\\tests\\")
                || filenameLower.endsWith("test.java")
                || filenameLower.endsWith("tests.java")
                || filenameLower.endsWith(".test.ts")
                || filenameLower.endsWith(".spec.ts")
                || filenameLower.endsWith(".test.tsx")
                || filenameLower.endsWith(".spec.tsx")
                || filenameLower.endsWith(".test.js")
                || filenameLower.endsWith(".spec.js");
    }

    private boolean hasRiskTag(List<FileChange> files, String tag) {
        return files.stream()
                .anyMatch(file -> file.riskTags() != null && file.riskTags().contains(tag));
    }

    private int sumAdditions(List<FileChange> files) {
        return files.stream().mapToInt(FileChange::additions).sum();
    }

    private int sumDeletions(List<FileChange> files) {
        return files.stream().mapToInt(FileChange::deletions).sum();
    }

    private String resolveRiskLevel(int score) {
        if (score >= 85) {
            return "Critical";
        }
        if (score >= 60) {
            return "High";
        }
        if (score >= 30) {
            return "Medium";
        }
        return "Low";
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
