package com.prpilot.rule;

public record RiskSignal(
        String tag,
        String reason,
        String filename,
        int scoreImpact
) {
}
