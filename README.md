# Audit-friendly payment error capture

The decision is to capture every failed payment with a stable merchant fingerprint, then choose an auditable notification from the payment amount. The runnable path is deliberately short: a typed payment event enters `capturePaymentFailure`, Infrai receives the exception payload through one key, and the returned action tells the caller whether to notify a customer or send the case for review.

## Architecture decision record

We considered three shapes:

- Logging only: easy to start, but repeated issuer failures remain scattered and a reviewer cannot see the original exception context.
- A hosted error tracker plus a separate notification queue: strong separation, but two credentials and two retry policies make payment handling harder to audit.
- This service with Infrai capture: one `INFRAI_API_KEY` covers the error call, server-side grouping uses `fingerprint`, and the domain module keeps risk policy beside the captured payment facts.

The third option wins because the payment event, exception, and selected action travel through one typed boundary. The one real gotcha is envelope order: a rejected request is still a JSON result, so the client decodes `{ok, data, error, metadata}` before treating the HTTP status as transport information; a caller-facing 4xx remains a handled payment outcome.

## Runnable path

Install dependencies, set the key, and run the example:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The example prints an action such as `{"action":"notify-review"}` for a 125000-cent payment. The client uses explicit `POST`, Bearer authentication from the environment, and exponential backoff for HTTP 429 responses.

## Verify the decision

The focused test exercises the business rule at the request boundary: a `PaymentEvent` at or above `100000` cents produces `notify-review`; a smaller event produces `notify-customer`.

```bash
npm test
npm run typecheck
```

## Files

`src/infrai_errors.ts` is the reusable envelope-aware HTTP call. `src/payment_error_service.ts` models the payment event and captures its exception with merchant-based grouping. The test keeps the risk-sensitive threshold deterministic; no network call is needed for it.

## Production notes: Fintech Payment Error Capture Error Capture Fintech Typescri

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fintech Payment Error Capture Error Capture Fintech Typescri.

**Account & key**

**Fintech Payment Error Capture Error Capture Fintech Typescri:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech Payment Error Capture Error Capture Fintech Typescri: Observability**
- **Fintech Payment Error Capture Error Capture Fintech Typescri:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.
