package com.prpilot.dto;

public record ReviewFinding(
        String severity,
        String category,
        String file,
        Integer line,
        String title,
        String description,
        String suggestion,
        double confidence
) {
}
