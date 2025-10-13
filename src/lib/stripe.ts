import Stripe from 'stripe';

// Configuración de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export { stripe };

// Interfaces para los datos de pago
export interface PaymentIntentData {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  customer_email?: string;
  customer_name?: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

// Crear Payment Intent
export const createPaymentIntent = async (data: PaymentIntentData): Promise<CreatePaymentIntentResponse> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Stripe usa centavos
      currency: data.currency || 'mxn',
      metadata: data.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
      ...(data.customer_email && { receipt_email: data.customer_email }),
    });

    return {
      client_secret: paymentIntent.client_secret!,
      payment_intent_id: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Error al crear el intento de pago');
  }
};

// Obtener Payment Intent
export const getPaymentIntent = async (paymentIntentId: string): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw new Error('Error al obtener el intento de pago');
  }
};

// Confirmar Payment Intent
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw new Error('Error al confirmar el pago');
  }
};

// Crear Customer
export const createCustomer = async (email: string, name?: string): Promise<Stripe.Customer> => {
  try {
    return await stripe.customers.create({
      email,
      name,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Error al crear el cliente');
  }
};

// Obtener Customer
export const getCustomer = async (customerId: string): Promise<Stripe.Customer> => {
  try {
    return await stripe.customers.retrieve(customerId) as Stripe.Customer;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw new Error('Error al obtener el cliente');
  }
};

// Crear Setup Intent (para guardar métodos de pago)
export const createSetupIntent = async (customerId: string): Promise<Stripe.SetupIntent> => {
  try {
    return await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw new Error('Error al crear el setup intent');
  }
};

// Listar métodos de pago del cliente
export const listPaymentMethods = async (customerId: string): Promise<Stripe.PaymentMethod[]> => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw new Error('Error al listar métodos de pago');
  }
};

// Crear refund
export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> => {
  try {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    if (reason) {
      refundData.reason = reason;
    }

    return await stripe.refunds.create(refundData);
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Error al crear el reembolso');
  }
};

// Verificar webhook signature
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw new Error('Error al verificar la firma del webhook');
  }
};

// Formatear precio para Stripe (convertir a centavos)
export const formatPriceForStripe = (price: number): number => {
  return Math.round(price * 100);
};

// Formatear precio desde Stripe (convertir desde centavos)
export const formatPriceFromStripe = (price: number): number => {
  return price / 100;
};

// Constantes útiles
export const STRIPE_CONFIG = {
  currency: process.env.STRIPE_CURRENCY || 'mxn',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};
