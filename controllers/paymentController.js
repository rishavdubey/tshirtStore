const BigPromise = require("../middlewares/bigPromise");
const stripe = require('stripe')(process.env.STRIPE_SECRET)


exports.sendStripeKey = BigPromise(async(req,res,next)=>{
    res.status(200).json({
        stripekey: process.env.STRIPE_API_KEY
    })
})

exports.captureStripePayment = BigPromise(async(req,res,next)=>{
    const paymentIntent = await stripe.paymentIntent.create({
        amount:req.body.amount,
        currency:'inr',

        // optional
        metadata:{ integration_check: 'accept_a_payment'}
    })

    res.statu(200).json({
        success:true,
        client_secret: paymentIntent.client_secret,

        // you can opttionally send id as well
    })
    
});