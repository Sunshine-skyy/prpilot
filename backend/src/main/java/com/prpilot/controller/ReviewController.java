package com.prpilot.controller;

import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.service.DemoReviewService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final DemoReviewService demoReviewService;

    public ReviewController(DemoReviewService demoReviewService) {
        this.demoReviewService = demoReviewService;
    }

    @GetMapping("/demo")
    public ReviewAnalysisResponse getDemoReview() {
        return demoReviewService.getDemoAnalysis();
    }
}
