package com.prpilot.util;

import com.prpilot.dto.FileChange;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class DiffParser {

    public List<FileChange> parse(String diff) {
        if (!StringUtils.hasText(diff)) {
            return List.of();
        }

        List<FileChange> files = new ArrayList<>();
        String[] lines = diff.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);
        ParsedFile current = null;

        for (String line : lines) {
            if (line.startsWith("diff --git ")) {
                if (current != null) {
                    files.add(current.toFileChange());
                }
                current = new ParsedFile(parseFilenameFromDiffHeader(line));
                current.append(line);
                continue;
            }

            if (current == null) {
                current = new ParsedFile("raw-diff.patch");
            }

            current.append(line);
            if (line.startsWith("+++ b/")) {
                current.filename = line.substring("+++ b/".length()).trim();
            } else if (line.startsWith("--- a/") && !StringUtils.hasText(current.filename)) {
                current.filename = line.substring("--- a/".length()).trim();
            } else if (line.startsWith("new file mode")) {
                current.status = "added";
            } else if (line.startsWith("deleted file mode")) {
                current.status = "removed";
            } else if (isAddedLine(line)) {
                current.additions++;
            } else if (isDeletedLine(line)) {
                current.deletions++;
            }
        }

        if (current != null) {
            files.add(current.toFileChange());
        }

        return files;
    }

    private String parseFilenameFromDiffHeader(String line) {
        String[] parts = line.split(" ");
        if (parts.length >= 4) {
            String target = parts[3];
            if (target.startsWith("b/")) {
                return target.substring(2);
            }
            return target;
        }
        return "raw-diff.patch";
    }

    private boolean isAddedLine(String line) {
        return line.startsWith("+") && !line.startsWith("+++");
    }

    private boolean isDeletedLine(String line) {
        return line.startsWith("-") && !line.startsWith("---");
    }

    private static class ParsedFile {
        private String filename;
        private String status = "modified";
        private int additions;
        private int deletions;
        private final StringBuilder patch = new StringBuilder();

        private ParsedFile(String filename) {
            this.filename = filename;
        }

        private void append(String line) {
            patch.append(line).append('\n');
        }

        private FileChange toFileChange() {
            return new FileChange(
                    StringUtils.hasText(filename) ? filename : "raw-diff.patch",
                    status,
                    additions,
                    deletions,
                    patch.toString().stripTrailing(),
                    List.of()
            );
        }
    }
}
