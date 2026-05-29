# PRPilot Demo App

This directory is reserved for controlled demo pull request scenarios used by PRPilot.

The demo app will contain intentionally reviewable changes such as authentication, configuration, and payment-related code so PRPilot can demonstrate risk detection and structured review suggestions without relying on an external repository.

Planned structure:

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

The actual demo scenario will be added in a dedicated PR to keep this scaffold PR focused on repository structure.
