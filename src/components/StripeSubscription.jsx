import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '../lib/supabase'

// Validate Stripe publishable key before initializing
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey || stripePublishableKey.trim() === '') {
  console.error(
    'Stripe Publishable Key is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.'
  );
  // Create a rejected promise to prevent silent failures
  throw new Error(
    'Stripe configuration error: VITE_STRIPE_PUBLISHABLE_KEY must be set in environment variables.'
  );
}

const stripePromise = loadStripe(stripePublishableKey)

export default function StripeSubscription({ householdId }) {
  const [subscription, setSubscription] = useState(null)
  const [relationshipScore, setRelationshipScore] = useState(null)

  useEffect(() => {
    if (householdId) {
      loadSubscriptionData()
      checkRelationshipScore()
    }
  }, [householdId])

  const loadSubscriptionData = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('household_id', householdId)
      .single()

    setSubscription(data)
  }

  const checkRelationshipScore = async () => {
    // Get this week's relationship score
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const { data } = await supabase
      .from('relationship_scores')
      .select('*')
      .eq('household_id', householdId)
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setRelationshipScore(data.score)
      
      // Check if score improved (Wife-Proof Guarantee logic)
      if (subscription && data.score < 50) {
        // Trigger refund via backend API
        triggerRefund(householdId)
      }
    }
  }

  const triggerRefund = async (householdId) => {
    // This would call a backend API to process Stripe refund
    try {
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId })
      })
      const result = await response.json()
      console.log('Refund processed:', result)
    } catch (error) {
      console.error('Refund error:', error)
    }
  }

  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm 
        householdId={householdId} 
        subscription={subscription}
        relationshipScore={relationshipScore}
      />
    </Elements>
  )
}

function SubscriptionForm({ householdId, subscription, relationshipScore }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    try {
      // Create subscription via backend
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId })
      })

      const { clientSecret } = await response.json()

      // Use confirmPayment for Stripe.js v2 (replaces deprecated confirmCardPayment)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`
        },
        redirect: 'if_required' // Don't redirect if payment doesn't require it
      })

      if (error) {
        console.error('Payment error:', error)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Subscription created successfully
        window.location.reload()
      }
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (subscription) {
    return (
      <div className="p-4 border border-terminal-border bg-terminal-surface">
        <h3 className="text-sm font-bold mb-2">SUBSCRIPTION ACTIVE</h3>
        <div className="text-xs space-y-1">
          <div>Status: {subscription.status}</div>
          {relationshipScore !== null && (
            <div className={`mt-2 ${relationshipScore < 50 ? 'text-terminal-error' : 'text-terminal-accent'}`}>
              Relationship Score: {relationshipScore}/100
              {relationshipScore < 50 && (
                <div className="text-xs mt-1">⚠️ Refund eligible</div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-terminal-border bg-terminal-surface">
      <h3 className="text-sm font-bold mb-2">SUBSCRIPTION</h3>
      <div className="mb-4">
        <PaymentElement
          options={{
            style: {
              base: {
                fontSize: '12px',
                color: '#e0e0e0',
                '::placeholder': {
                  color: '#666',
                },
              },
              invalid: {
                color: '#ff0000',
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-2 bg-terminal-accent text-terminal-bg font-bold hover:opacity-80 disabled:opacity-50"
      >
        {loading ? 'PROCESSING...' : 'SUBSCRIBE'}
      </button>
      <div className="text-xs mt-2 opacity-70">
        Wife-Proof Guarantee: Auto-refund if relationship score doesn't improve
      </div>
    </form>
  )
}