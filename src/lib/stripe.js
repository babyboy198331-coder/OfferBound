// Stripe configuration
// publishable key is safe to commit — it's a public identifier
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51TdZmqKjwkTLVSfjpCzAx5j3wYqr4fgxTM245Iq3OsNahtkyuxVigKEi2sWLimyX6QeyQXt84TELQ9VBVoch1gRc00x3JkcKgi'
export const STRIPE_PRICE_ID = 'price_1TiiKjKjwkTLVSfjFYoJ0dHu'

// Stripe Payment Link
// IMPORTANT: In your Stripe dashboard, set the payment link's "After payment" redirect to:
// https://offerbound.vercel.app?pro=success
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/7sY8wQd9NduVa8q5cXebu00'

export const FREE_TIER_LIMIT = 25
export const PRO_PRICE = '$14.99'
