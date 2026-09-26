---
title: "NEER SaaS billing"
description: "BYOK subscription principles and the planned provider-neutral billing interface."
---

# NEER SaaS billing

> **Status:** No SaaS billing provider, subscription database, checkout flow, or webhook handler is implemented in the repository.

## BYOK billing rule

The NEER subscription pays for NEER platform features. In the first BYOK product, the user pays their selected AI provider directly. NEER must not charge token fees or claim to pay for inference in this release.

## Planned billing boundary

Use a provider-neutral billing interface for checkout creation, subscription lookup, cancellation, and verified webhook handling. Keep plan definitions and feature entitlements separate from billing-vendor status strings. Apply subscription changes only after signature verification and idempotency checks; a successful browser redirect is not proof of payment.

Represent plan, status, start and renewal dates, and external customer/subscription identifiers as data. The entitlement service should evaluate account capabilities centrally instead of spreading plan-name conditionals through the application.

## Vendor selection

The product's target countries, seller legal entity, settlement options, tax obligations, and customer payment methods were not established by this source audit. Choose a payment vendor after those requirements are known and researched. The application contract should allow that choice to change without rewriting account or entitlement services.
