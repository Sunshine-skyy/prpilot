export type PullRequestInfo = {
  title: string;
  url: string;
  author: string;
  state: string;
  baseBranch: string;
  headBranch: string;
  changedFiles: number;
  additions: number;
  deletions: number;
};

export type ChangeSummary = {
  overview: string;
  keyChanges: string[];
  impactedAreas: string[];
};

export type RiskAssessment = {
  score: number;
  level: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  reasons: string[];
};

export type FileChange = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
  riskTags: string[];
};

export type ReviewFinding = {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  category:
    | 'Security'
    | 'Bug Risk'
    | 'Performance'
    | 'Maintainability'
    | 'Testing'
    | 'Documentation'
    | string;
  file: string;
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
  confidence: number;
};

export type ReviewAnalysisResponse = {
  pullRequest: PullRequestInfo;
  changeSummary: ChangeSummary;
  riskAssessment: RiskAssessment;
  files: FileChange[];
  findings: ReviewFinding[];
  markdownReport: string;
};
