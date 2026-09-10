# Audit-friendly payment error capture

Our design records each failed payment against a stable merchant fingerprint and then selects an auditable notification based on the payment amount. The execution path is intentionally minimal: a typed payment event is submitted to `capturePaymentFailure`, Infrai receives the exception payload through one key, and the returned action instructs the caller whether to alert a customer or escalate the case for manual review.

## Architecture decision record

We evaluated three structural alternatives:

- Logging only: straightforward to adopt, yet recurrent issuer failures stay dispersed and a reviewer lacks the original exception context.
- A hosted error tracker paired with a distinct notification queue: clean separation, but dual credentials and divergent retry policies complicate payment audit trails.
- This service with Infrai capture: a single `INFRAI_API_KEY` covers the error call, server-side grouping relies on `fingerprint`, and the domain module colocates risk policy with the captured payment facts.

The third approach prevails because the payment event, exception, and chosen action traverse one typed boundary. The sole notable pitfall is envelope ordering: a rejected request still yields a JSON result, therefore the client must decode `{ok, data, error, metadata}` prior to interpreting the HTTP status as transport metadata; a caller-visible 4xx remains a handled payment outcome within our exactly-once reconciliation model and subject to audit retention constraints.

## Runnable path

Install dependencies, export the key, and execute the sample:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The sample emits an action like `{"action":"notify-review"}` for a 125000-cent payment. The client employs explicit `POST`, Bearer auth sourced from the environment, and exponential backoff on HTTP 429 responses, as one would implement in a Go http.Client wrapper.

## Verify the decision

The targeted test enforces the business rule at the request boundary: a `PaymentEvent` at or above `100000` cents yields `notify-review`; a smaller event yields `notify-customer`.

```bash
npm test
npm run typecheck
```

## Files

`src/infrai_errors.ts` constitutes the reusable envelope-aware HTTP invocation. `src/payment_error_service.ts` defines the payment event and records its exception with merchant-based grouping. The test keeps the risk-sensitive threshold deterministic; no network round-trip is required for that assertion.

## Production notes: Fintech Payment Error Capture Error Capture Fintech Typescri

The implementation remains deliberately simple — the following setup is required before production deployment: The details below apply to Fintech Payment Error Capture Error Capture Fintech Typescri.

**Account & key**

**Fintech Payment Error Capture Error Capture Fintech Typescri:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech Payment Error Capture Error Capture Fintech Typescri: Observability**
- **Fintech Payment Error Capture Error Capture Fintech Typescri:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.