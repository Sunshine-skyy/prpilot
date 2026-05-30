export interface DemoAppConfig {
  environment: "development" | "test" | "production";
  tokenIssuer: string;
  paymentCurrency: "USD" | "EUR" | "CNY";
  maxPaymentAmount: number;
}

export const demoAppConfig: DemoAppConfig = {
  environment: "development",
  tokenIssuer: "prpilot-demo-app",
  paymentCurrency: "USD",
  maxPaymentAmount: 5000,
};

export function getDemoAppConfig(overrides: Partial<DemoAppConfig> = {}): DemoAppConfig {
  return {
    ...demoAppConfig,
    ...overrides,
  };
}
