const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const cooldown = 5 * 60 * 1000; // 5 minutes

    if (
      user.lastClaim &&
      Date.now() - user.lastClaim.getTime() < cooldown
    ) {
      const remaining =
        Math.ceil(
          (cooldown -
            (Date.now() - user.lastClaim.getTime())) / 1000
        );

      return res.status(400).json({
        message: "Cooldown active",
        secondsRemaining: remaining
      });
    }

    const reward = 0.000001;

    user.balance += reward;
    user.totalClaims += 1;
    user.lastClaim = new Date();

    await user.save();

    res.json({
      message: "Claim successful",
      reward,
      balance: user.balance,
      totalClaims: user.totalClaims
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
