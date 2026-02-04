import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button } from './button';

// Configuración de Stripe
const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  amount: number;
  currency?: string;
}

// Componente interno del formulario de pago
const PaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  onSuccess,
  onError,
  amount,
  currency = 'mxn'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('¡Pago exitoso!');
          onSuccess(paymentIntent);
          break;
        case 'processing':
          setMessage('Tu pago está siendo procesado.');
          break;
        case 'requires_payment_method':
          setMessage('Tu pago no fue procesado, por favor intenta de nuevo.');
          break;
        default:
          setMessage('Algo salió mal.');
          break;
      }
    });
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/purchase-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Error en el pago');
        } else {
          setMessage('Ocurrió un error inesperado.');
        }
        onError(error.message || 'Error en el pago');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          setMessage('¡Pago exitoso!');
          onSuccess(paymentIntent);
        } else if (paymentIntent.status === 'processing') {
          setMessage('Tu pago está siendo procesado. Recibirás una confirmación cuando se complete la transferencia.');
          onSuccess(paymentIntent);
        }
      }
    } catch (err) {
      setMessage('Ocurrió un error inesperado.');
      onError('Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Método de pago
          </label>
          <div className="p-4 border border-border rounded-md bg-background">
            <PaymentElement
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    name: '',
                    email: '',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('exitoso') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total a pagar:</span>
          <span className="font-semibold text-foreground">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(amount)}
          </span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="w-full"
        >
          {isLoading ? 'Procesando...' : `Pagar ${new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount)}`}
        </Button>
      </div>
    </form>
  );
};

// Componente principal que envuelve con Elements
const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const options = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: 'transparent',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '16px',
        },
        '.Input:focus': {
          border: '1px solid #3b82f6',
          boxShadow: '0 0 0 1px #3b82f6',
        },
        '.Label': {
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px',
        },
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
