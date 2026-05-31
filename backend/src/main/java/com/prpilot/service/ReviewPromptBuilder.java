package com.prpilot.service;

import org.springframework.stereotype.Component;

@Component
public class ReviewPromptBuilder {

    public String buildSystemPrompt(String language) {
        String findingLanguageRule = isChinese(language)
                ? "For titleZh, descriptionZh, and suggestionZh, write polished Simplified Chinese. Also provide accurate English equivalents in title, description, and suggestion."
                : "For title, description, and suggestion, write polished English. Also provide accurate Simplified Chinese equivalents in titleZh, descriptionZh, and suggestionZh.";

        return """
                You are a senior code reviewer helping developers review pull requests before human review.

                Focus on correctness, security, maintainability, performance, and testing.

                Rules:
                1. Only report issues supported by the provided diff and context.
                2. Do not invent code, files, dependencies, or behavior that is not present in the context.
                3. Avoid generic advice. Every finding must be concrete and actionable.
                4. If evidence is weak, lower the confidence.
                5. Do not mark style preferences as High or Critical severity.
                6. Prefer fewer high-signal findings over many noisy findings.
                7. Each finding should reference a file whenever possible.
                8. Output valid JSON only. Do not include markdown fences.
                9. %s
                10. Keep severity and category values in English exactly as the allowed enum values so the UI can classify findings.
                11. File paths, symbols, function names, class names, package names, and technical identifiers may remain in their original language.

                Return exactly this JSON shape:
                {
                  "findings": [
                    {
                      "severity": "Critical | High | Medium | Low",
                      "category": "Security | Bug Risk | Performance | Maintainability | Testing | Documentation",
                      "file": "path/to/file",
                      "line": null,
                      "title": "short English title",
                      "description": "evidence-based English description",
                      "suggestion": "specific English suggestion",
                      "titleZh": "简体中文短标题",
                      "descriptionZh": "简体中文、有证据支撑的问题描述",
                      "suggestionZh": "简体中文、具体可执行的修改建议",
                      "confidence": 0.0
                    }
                  ]
                }

                If there are no evidence-based issues, return:
                { "findings": [] }
                """.formatted(findingLanguageRule);
    }

    public String buildUserPrompt(String reviewContext, String language) {
        String languageInstruction = isChinese(language)
                ? "Prefer Simplified Chinese for the primary localized fields titleZh, descriptionZh, and suggestionZh."
                : "Prefer English for the primary fields title, description, and suggestion.";

        return """
                Review the following pull request context and generate structured review findings.

                Remember:
                - Use only the provided evidence.
                - Prefer findings related to the selected focus areas and rule-based risk signals.
                - Keep confidence between 0 and 1.
                - Use only the allowed severity and category values.
                - Return JSON only.
                - %s
                - Always include both English fields and Simplified Chinese fields.
                - Keep file paths and code identifiers unchanged.

                Context:
                %s
                """.formatted(languageInstruction, reviewContext);
    }

    private boolean isChinese(String language) {
        return "zh".equalsIgnoreCase(language);
    }
}
