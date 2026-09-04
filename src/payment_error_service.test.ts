import test from "node:test";
import assert from "node:assert/strict";
import { chooseAction, type PaymentEvent } from "./payment_error_service.js";

test("high-value payment failures go to a review notification", () => {
  const event: PaymentEvent = { paymentId: "p-7", merchantId: "m-2", amountCents: 100000, currency: "USD" };
  assert.equal(chooseAction(event, new Error("declined")), "notify-review");
});

test("ordinary payment failures notify the customer", () => {
  const event: PaymentEvent = { paymentId: "p-8", merchantId: "m-2", amountCents: 9999, currency: "USD" };
  assert.equal(chooseAction(event, new Error("declined")), "notify-customer");
});
