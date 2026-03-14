// Stripe webhook temporarily disabled
// Will be replaced with local payment integration later (Flutterwave / M-Pesa / Paystack)

{/*import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";
import Stripe from "stripe";

type StripeEvent = Stripe.Event;
type StripeCheckoutSession = Stripe.Checkout.Session;
type StripeCustomer = Stripe.Customer;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: StripeEvent;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as StripeCheckoutSession;

    if (!session.customer) return NextResponse.json({ error: "No customer" }, { status: 400 });

    const customer = await stripe.customers.retrieve(session.customer.toString());
    const email = (customer as StripeCustomer).email;

    if (!email) return NextResponse.json({ error: "Customer has no email" }, { status: 400 });

    await prisma.user.update({
      where: { email },
      data: {
        stripeCustomerId: session.customer.toString(),
        subscriptionTier: session.metadata?.tier === "CLINIC" ? "CLINIC" : "PRO",
      },
    });
  }

  return NextResponse.json({ received: true });
}
*/}