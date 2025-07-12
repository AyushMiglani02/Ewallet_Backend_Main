const authMiddleware = require("../middlewares/authMiddleware");
const Transaction = require("../models/transactionModel");
const router = require("express").Router();
const User = require("../models/userModel");
const stripe = require("stripe")(process.env.stripe_key);
const { v4: uuidv4 } = require("uuid");

router.post("/transfer-funds", authMiddleware, async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();

    await User.findByIdAndUpdate(req.body.sender, {
      $inc: { balance: -req.body.amount },
    });

    await User.findByIdAndUpdate(req.body.receiver, {
      $inc: { balance: req.body.amount },
    });

    res.send({
      message: "Transaction successful",
      data: newTransaction,
      success: true,
    });
  } catch (error) {
    res.send({
      message: "Transaction failed",
      data: error.message,
      success: false,
    });
  }
});

router.post("/verify-account", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.body.receiver,
    });

    if (user) {
      res.send({
        message: "Account verified",
        data: user,
        success: true,
      });
    } else {
      res.send({
        message: "Account not found",
        data: null,
        success: false,
      });
    }
  } catch (error) {
    res.send({
      message: "Account verification failed",
      data: error.message,
      success: false,
    });
  }
});

router.post(
  "/get-all-transactions-by-user",
  authMiddleware,
  async (req, res) => {
    try {
      const transactions = await Transaction.find({
        $or: [{ sender: req.body.userId }, { receiver: req.body.userId }],
      })
        .sort({ createdAt: -1 })
        .populate("sender")
        .populate("receiver");

      res.send({
        message: "Transactions retrieved successfully",
        data: transactions,
        success: true,
      });
    } catch (error) {
      res.send({
        message: "Transactions retrieval failed",
        data: error.message,
        success: false,
      });
    }
  }
);

router.post("/deposit-funds", authMiddleware, async (req, res) => {
  console.log("Request body:", req.body);
  try {
    const { token, amount } = req.body;

    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const charge = await stripe.charges.create(
      {
        amount: amount, // Stripe expects amount in cents
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        description: `Deposited to AMAL E-WALLET`,
      },
      {
        idempotencyKey: uuidv4(),
      }
    );

    if (charge.status === "succeeded") {
      const newTransaction = new Transaction({
        sender: req.body.userId,
        receiver: req.body.userId,
        amount: amount,
        type: "deposit",
        reference: "stripe deposit",
        status: "success",
      });
      await newTransaction.save();

      await User.findByIdAndUpdate(req.body.userId, {
        $inc: { balance: amount },
      });

      res.send({
        message: "Deposit successful",
        data: newTransaction,
        success: true,
      });
    } else {
      res.send({
        message: "Transaction failed",
        data: charge,
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.send({
      message: "Transaction failed",
      data: error.message,
      success: false,
    });
  }
});

module.exports = router;
