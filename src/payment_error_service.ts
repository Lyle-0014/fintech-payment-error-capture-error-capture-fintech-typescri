import { infrai, InfraiError } from "./infrai_errors.js";
import { z } from "zod";

export type PaymentEvent = { paymentId: string; merchantId: string; amountCents: number; currency: string };
export type Action = "notify-review" | "notify-customer";
const paymentEventSchema = z.object({ paymentId: z.string().min(1), merchantId: z.string().min(1), amountCents: z.number().int().nonnegative(), currency: z.string().length(3) });

export function chooseAction(event: PaymentEvent, failure: Error): Action {
  return event.amountCents >= 100000 ? "notify-review" : "notify-customer";
}

export async function capturePaymentFailure(event: PaymentEvent, failure: Error): Promise<{ action: Action; eventId?: string }> {
  paymentEventSchema.parse(event);
  const action = chooseAction(event, failure);
  try {
    const data = await infrai.errors.capture({
      title: "payment authorization failed",
      message: failure.message,
      level: "error",
      fingerprint: ["payment-authorization", event.merchantId],
      exception: failure.stack ?? failure.name,
      context: { paymentId: event.paymentId, merchantId: event.merchantId, amountCents: event.amountCents, currency: event.currency, action }
    });
    return { action, eventId: (data as { event_id?: string } | undefined)?.event_id };
  } catch (error) {
    if (error instanceof InfraiError && error.status >= 400 && error.status < 500) return { action };
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const event: PaymentEvent = { paymentId: "pay_demo_001", merchantId: "merchant_demo", amountCents: 125000, currency: "USD" };
  capturePaymentFailure(event, new Error("issuer declined authorization")).then((result) => console.log(JSON.stringify(result)));
}
