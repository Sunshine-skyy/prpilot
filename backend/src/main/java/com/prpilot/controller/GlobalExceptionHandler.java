package com.prpilot.controller;

import com.prpilot.dto.ApiErrorResponse;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return buildResponse(exception.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationError() {
        return buildResponse("Request validation failed.", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<ApiErrorResponse> handleGitHubApiError(WebClientResponseException exception) {
        String message = "GitHub API request failed with status " + exception.getStatusCode().value() + ".";
        return buildResponse(message, HttpStatus.BAD_GATEWAY);
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(String message, HttpStatus status) {
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(message, status.value(), Instant.now()));
    }
}
