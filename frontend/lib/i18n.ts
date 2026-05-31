export type Language = 'zh' | 'en';

export const languageStorageKey = 'prpilot-language';

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
};

export function isLanguage(value: string | null): value is Language {
  return value === 'zh' || value === 'en';
}

export const focusAreaLabels: Record<Language, Record<string, string>> = {
  zh: {
    security: '安全',
    'bug-risk': '缺陷风险',
    performance: '性能',
    maintainability: '可维护性',
    testing: '测试',
  },
  en: {
    security: 'Security',
    'bug-risk': 'Bug Risk',
    performance: 'Performance',
    maintainability: 'Maintainability',
    testing: 'Testing',
  },
};

export const riskLevelLabels: Record<Language, Record<string, string>> = {
  zh: {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '严重风险',
  },
  en: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  },
};

export const categoryLabels: Record<Language, Record<string, string>> = {
  zh: {
    security: '安全',
    'bug risk': '缺陷风险',
    performance: '性能',
    maintainability: '可维护性',
    testing: '测试',
    documentation: '文档',
  },
  en: {
    security: 'Security',
    'bug risk': 'Bug Risk',
    performance: 'Performance',
    maintainability: 'Maintainability',
    testing: 'Testing',
    documentation: 'Documentation',
  },
};

export const riskReasonLabels: Record<string, string> = {
  'Authentication or permission-related code changed.': '认证或权限相关代码发生变更。',
  'Database or schema-related code changed.': '数据库或数据结构相关代码发生变更。',
  'Configuration or secret-related keywords were changed.': '配置或密钥相关关键词发生变更。',
  'TODO or FIXME remains in the changed code.': '变更代码中仍存在 TODO 或 FIXME。',
  'Debug logging appears in the changed code.': '变更代码中出现调试日志。',
  'A catch block may swallow exceptions without handling them.': '可能存在未处理异常的空 catch 代码块。',
  'The diff appears to remove validation or guard logic.': '本次变更可能删除了校验或保护逻辑。',
  'A sensitive configuration, dependency, or security-related file changed.': '敏感配置、依赖或安全相关文件发生变更。',
  'Large pull request size increases review risk.': 'PR 规模较大，会增加 Review 风险。',
  'Many files changed in a single pull request.': '单个 PR 修改了较多文件。',
  'No test files were changed in this pull request.': '本次 PR 没有修改测试文件。',
  'Authentication or permission changes do not include test updates.': '认证或权限相关变更没有包含对应测试更新。',
  'Database-related changes do not include test updates.': '数据库相关变更没有包含对应测试更新。',
  'Authentication-related files changed.': '认证相关文件发生变更。',
  'Token value is logged in the middleware path.': '中间件路径中记录了 token 值。',
  'Configuration contains a fake secret-like value that should be environment-driven.': '配置中包含类似密钥的演示值，应改为通过环境变量配置。',
  'TODO found in the payment permission flow.': '支付权限流程中发现 TODO。',
  'No new tests cover the updated risky behavior.': '新增的高风险行为没有对应测试覆盖。',
};

export const riskTagLabels: Record<string, string> = {
  'auth-permission': '认证/权限',
  database: '数据库',
  'config-secret': '配置/密钥',
  'todo-fixme': 'TODO/FIXME',
  'debug-logging': '调试日志',
  'empty-catch': '空 catch',
  'validation-removed': '删除校验',
  'sensitive-file': '敏感文件',
  'test-file': '测试文件',
  auth: '认证',
  token: 'Token',
  'console-log': '调试日志',
  'missing-tests': '缺少测试',
  config: '配置',
  'secret-keyword': '密钥关键词',
  permission: '权限',
  todo: 'TODO',
  'bug-risk': '缺陷风险',
};

export const findingTextLabels: Record<string, string> = {
  'Exposure of sensitive configuration value': '敏感配置值暴露',
  'The file contains a hardcoded demo webhook secret with a weak value that should not be used in production.': '该文件包含硬编码的演示 webhook secret，且值较弱，不应在生产环境中使用。',
  "Replace the demoWebhookSecret with a secure, environment-specific value and ensure it's not committed to version control.": '请使用安全的、按环境配置的值替换 demoWebhookSecret，并确保不要将真实密钥提交到版本控制中。',
  'Avoid logging bearer tokens': '避免记录 Bearer Token',
  'The authentication middleware logs the incoming token, which can expose credentials in application logs.': '认证中间件会记录传入的 token，可能导致凭证暴露在应用日志中。',
  'Remove token logging and only log non-sensitive request metadata such as request id or auth result.': '移除 token 日志，只记录请求 ID、认证结果等非敏感请求元数据。',
  'TODO left in permission enforcement path': '权限校验路径中遗留 TODO',
  'A TODO remains in the payment permission flow, making the expected authorization behavior unclear.': '支付权限流程中仍有 TODO，导致预期的授权行为不够明确。',
  'Replace the TODO with explicit permission checks and add tests for denied and allowed payment scenarios.': '用明确的权限检查替换 TODO，并为拒绝和允许支付的场景补充测试。',
  'Missing tests for invalid and expired tokens': '缺少无效和过期 token 的测试',
  'The PR updates authentication behavior but does not add coverage for missing, invalid, or expired tokens.': '该 PR 修改了认证行为，但没有覆盖缺失、无效或过期 token 的测试。',
  'Add tests that verify rejected requests for missing, malformed, and expired tokens.': '补充测试，验证缺失、格式错误和过期 token 的请求会被拒绝。',
  'Debug logging in authentication logic': '认证逻辑中存在调试日志',
  'The authMiddleware.ts file contains debug logging that could expose sensitive information about authentication tokens.': 'authMiddleware.ts 文件包含调试日志，可能暴露认证 token 等敏感信息。',
  'Remove or conditionally disable debug logging in production code.': '移除调试日志，或确保生产环境中会禁用这些日志。',
  'Adds auth middleware for validating bearer tokens.': '新增用于校验 Bearer Token 的认证中间件。',
  'Updates configuration values used by authentication and payment flows.': '更新认证和支付流程使用的配置值。',
  'Changes payment service authorization checks before processing a charge.': '调整支付扣款前的权限检查逻辑。',
  'Adds token parsing and basic user attachment logic.': '新增 token 解析和基础用户挂载逻辑。',
  'Updates auth and payment configuration values.': '更新认证和支付相关配置值。',
  'Changes authorization checks before payment processing.': '调整支付处理前的授权检查逻辑。',
  'Missing tests for authentication changes': '认证变更缺少测试',
  'The PR modifies authentication logic but does not include any test updates or additions. The changes include a TODO comment indicating the need for strict validation, which is not addressed in tests.': '该 PR 修改了认证逻辑，但没有包含任何测试更新或新增测试。本次变更中还包含一处 TODO，提示需要严格校验，但测试中尚未覆盖这一点。',
  'Add unit tests for the updated authentication logic, including edge cases and the fallback behavior.': '请为更新后的认证逻辑补充单元测试，覆盖边界场景和 fallback 行为。',
};

export function labelRiskLevel(level: string, language: Language) {
  const normalized = level.toLowerCase();
  return riskLevelLabels[language][normalized] ?? level;
}

export function labelCategory(category: string, language: Language) {
  const normalized = category.toLowerCase();
  return categoryLabels[language][normalized] ?? category;
}

export function labelRiskReason(reason: string, language: Language) {
  if (language === 'en') return reason;
  return riskReasonLabels[reason] ?? reason;
}

export function labelRiskTag(tag: string, language: Language) {
  if (language === 'en') return tag;
  return riskTagLabels[tag] ?? tag;
}

export function labelFindingText(text: string, language: Language) {
  if (language === 'en') return text;
  return findingTextLabels[text] ?? text;
}
