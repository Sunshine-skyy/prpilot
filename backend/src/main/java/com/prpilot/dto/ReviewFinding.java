package com.prpilot.dto;

public record ReviewFinding(
        String severity,
        String category,
        String file,
        Integer line,
        String title,
        String description,
        String suggestion,
        String titleZh,
        String descriptionZh,
        String suggestionZh,
        double confidence
) {
}
