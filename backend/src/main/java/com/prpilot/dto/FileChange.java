package com.prpilot.dto;

import java.util.List;

public record FileChange(
        String filename,
        String status,
        int additions,
        int deletions,
        String patch,
        List<String> riskTags
) {
}
