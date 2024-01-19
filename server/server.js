require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const jwt = require('jsonwebtoken');

const app = express();
const port = 5001;

//Environment vaiables
const secretKey_v3 = process.env.ReCAPTCHA_SECRET_KEY_V3;
const secretKey_v2 = process.env.ReCAPTCHA_SECRET_KEY_V2;
const jwtSecret = process.env.JWT_SECRET;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Utility function to verify reCAPTCHA tokens
async function verifyRecaptchaToken(token, secretKey) {
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  return axios.post(url).then(response => response.data);
}

app.get("/verify-jwt", (req, res) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    jwt.verify(token, jwtSecret);
    res.json({ success: true, message: "Token is valid" });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
});

// reCAPTCHA v3 verification route
app.post("/verify-recaptcha", async (req, res) => {
  console.log("Request Body v3 token:", req.body.token ? 'Token has been set': 'No token set');

  const { token } = req.body;
  try {
    const recaptchaResponse = await verifyRecaptchaToken(token, secretKey_v3);
    if(recaptchaResponse.success && recaptchaResponse.score > 0.5) {
      const jwtToken = jwt.sign({ token }, jwtSecret, { expiresIn: '5mins'});
      res.cookie('authToken', jwtToken, { httpOnly: true, secure: true });
      res.send({ success: true, message: "reCAPTCHA v3 verified", score: recaptchaResponse.score,
    });
    } else {
      res.status(401).send({ success: false, message: "reCAPTCHA v3 verification failed" });
    }
    } catch (error) {
      res.status(500).send({ success: false, message: "Server error" });
    }
  });

// reCAPTCHA v2 verification route
app.post("/verify-recaptcha-v2", async (req, res) => {
  const { token } = req.body;
  try {
    const recaptchaResponse = await verifyRecaptchaToken(token, secretKey_v2);
    if(recaptchaResponse.success) {
      res.send({ success: true, message: "reCAPTCHA v2 verified"});
    } else {
        res.status(401).send({ success: false, message: "reCAPTCHA v2 token invalid or expired. Please try again" });
      }
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error verifying recaptcha v2"});
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
