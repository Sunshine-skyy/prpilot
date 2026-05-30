import { DemoUser, hasRole } from "./authMiddleware";
import { DemoAppConfig, demoAppConfig } from "./config";

export interface PaymentRequest {
  amount: number;
  currency: DemoAppConfig["paymentCurrency"];
  recipientId: string;
}

export interface PaymentResult {
  approved: boolean;
  reason?: string;
  transactionId?: string;
}

export function canProcessPayment(user: DemoUser | undefined): boolean {
  return hasRole(user, ["admin"]);
}

export function processPayment(
  user: DemoUser | undefined,
  request: PaymentRequest,
  config: DemoAppConfig = demoAppConfig
): PaymentResult {
  if (!canProcessPayment(user)) {
    return { approved: false, reason: "User does not have payment permission" };
  }

  if (request.amount <= 0) {
    return { approved: false, reason: "Payment amount must be positive" };
  }

  if (request.amount > config.maxPaymentAmount) {
    return { approved: false, reason: "Payment amount exceeds the configured limit" };
  }

  if (request.currency !== config.paymentCurrency) {
    return { approved: false, reason: "Unsupported payment currency" };
  }

  return {
    approved: true,
    transactionId: `demo-tx-${request.recipientId}-${request.amount}`,
  };
}
