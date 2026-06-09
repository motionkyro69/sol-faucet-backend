const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { faucetpayUsername, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { faucetpayUsername: faucetpayUsername }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const referralCode = nanoid(8);

    const user = new User({
      faucetpayUsername,
      email,
      password: hashedPassword,
      referralCode
    });

    await user.save();

    res.status(201).json({
      message: "Registration successful",
      referralCode
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { faucetpayUsername, password } = req.body;

    const user = await User.findOne({
      faucetpayUsername
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid username or password"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        faucetpayUsername: user.faucetpayUsername,
        balance: user.balance,
        referralCode: user.referralCode,
        totalClaims: user.totalClaims
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});
module.exports = router;
