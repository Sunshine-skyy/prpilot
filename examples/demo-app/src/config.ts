export interface DemoAppConfig {
  environment: "development" | "test" | "production";
  tokenIssuer: string;
  paymentCurrency: "USD" | "EUR" | "CNY";
  maxPaymentAmount: number;
  auditLogEnabled: boolean;
  demoWebhookSecret: string;
}

export const demoAppConfig: DemoAppConfig = {
  environment: "development",
  tokenIssuer: "prpilot-demo-app",
  paymentCurrency: "USD",
  maxPaymentAmount: 1000000,
  auditLogEnabled: false,
  demoWebhookSecret: "FAKE_DEMO_SECRET_DO_NOT_USE_IN_REAL_SYSTEMS",
};

export function getDemoAppConfig(overrides: Partial<DemoAppConfig> = {}): DemoAppConfig {
  return {
    ...demoAppConfig,
    ...overrides,
  };
}
