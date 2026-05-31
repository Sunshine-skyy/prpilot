package com.prpilot.dto;

public record ReviewAnalysisStreamEvent(
        String stage,
        String status,
        String message,
        ReviewAnalysisResponse result
) {
    public static ReviewAnalysisStreamEvent progress(String stage, String message) {
        return new ReviewAnalysisStreamEvent(stage, "progress", message, null);
    }

    public static ReviewAnalysisStreamEvent completed(ReviewAnalysisResponse result) {
        return new ReviewAnalysisStreamEvent("completed", "completed", "Analysis completed.", result);
    }

    public static ReviewAnalysisStreamEvent error(String message) {
        return new ReviewAnalysisStreamEvent("error", "error", message, null);
    }
}
