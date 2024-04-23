import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPayment(paymentSessionDto: PaymentSessionDto) {
    const { currency, lineItems, orderId } = paymentSessionDto;
    const items = lineItems.map((lineItem) => ({
      price_data: {
        currency,
        product_data: {
          name: lineItem.name,
        },
        unit_amount: Math.round(lineItem.price * 100),
      },
      quantity: lineItem.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },
      line_items: items,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });
    return session;
  }

  async success() {
    return 'Payment successful';
  }

  async cancel() {
    return 'Payment cancelled';
  }

  async webhook(request: Request, response: Response) {
    const signature = request.headers['stripe-signature'];
    let event: Stripe.Event;
    const endpointSecret = envs.stripeEndpointSecret;
    try {
      event = this.stripe.webhooks.constructEvent(
        request['rawBody'],
        signature,
        endpointSecret,
      );
    } catch (error) {
      response.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }
    console.log({ event });
    switch (event.type) {
      case 'charge.succeeded':
        console.log('PaymentIntent was successful!');
        const paymentIntent = event.data.object;
        console.log({
          metadata: paymentIntent.metadata,
        });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return response.status(200).send({ signature });
  }
}
