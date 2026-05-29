package com.prpilot.dto;

import java.util.List;

public record ChangeSummary(
        String overview,
        List<String> keyChanges,
        List<String> impactedAreas
) {
}
