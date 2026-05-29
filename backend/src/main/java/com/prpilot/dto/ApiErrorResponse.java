package com.prpilot.dto;

import java.time.Instant;

public record ApiErrorResponse(
        String message,
        int status,
        Instant timestamp
) {
}
