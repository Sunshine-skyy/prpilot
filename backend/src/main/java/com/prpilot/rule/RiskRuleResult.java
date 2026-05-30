package com.prpilot.rule;

import com.prpilot.dto.FileChange;
import com.prpilot.dto.RiskAssessment;
import java.util.List;

public record RiskRuleResult(
        RiskAssessment riskAssessment,
        List<FileChange> files,
        List<RiskSignal> signals
) {
}
