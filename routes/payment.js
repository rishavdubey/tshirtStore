const express = require('express');
const router = express.Router();

const {
    sendStripeKey,
    captureStripePayment,
} = require('../controllers/paymentController');

const {isLoggedIn,customRole} = require('../middlewares/user')

router.route("/stripekey").get(isLoggedIn, sendStripeKey);

router.route("/capturestripe").post(isLoggedIn, captureStripePayment);



module.exports = router;
