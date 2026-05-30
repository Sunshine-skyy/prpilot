# PRPilot Demo App

This directory contains a small controlled demo application used to create reviewable pull request scenarios for PRPilot.

The code in this folder is not part of the PRPilot product runtime. It exists only so the project can demonstrate how PRPilot analyzes authentication, configuration, payment authorization, and testing changes in a realistic but contained sample.

## Current Baseline

This PR adds a safe baseline version of the demo app. The baseline intentionally avoids risky behavior so future demo branches can introduce controlled changes and show how PRPilot detects them.

Included files:

```text
examples/demo-app/
├── README.md
├── src/
│   ├── authMiddleware.ts
│   ├── config.ts
│   └── paymentService.ts
└── tests/
    └── authMiddleware.test.ts
```

## Demo Scope

The baseline demonstrates:

- Bearer token extraction and validation.
- Role-based permission checks.
- Environment-driven configuration defaults.
- Payment processing guarded by explicit permissions.
- Focused tests for valid, missing, and invalid tokens.

## Future Demo PR

A later branch named `demo/risky-auth-change` can modify this sample app to intentionally introduce controlled review risks, such as weak token validation, sensitive logging, missing tests, or unsafe configuration values.

Those future changes should stay clearly marked as demo-only and must not contain real secrets.
