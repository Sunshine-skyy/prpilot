package com.prpilot.client;

import com.prpilot.dto.ReviewFinding;
import java.util.List;

public interface LlmClient {

    List<ReviewFinding> generateReviewFindings(String systemPrompt, String userPrompt);

    boolean isAvailable();
}
