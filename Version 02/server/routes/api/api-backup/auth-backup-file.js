const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const nodemailer = require('nodemailer');

const auth = require('../../../middleware/auth');

// Bring in Models & Helpers
const User = require('../../../models/user');
const mailchimp = require('../../../services/mailchimp');
const keys = require('../../../config/keys');
const { EMAIL_PROVIDER, JWT_COOKIE } = require('../../../constants');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email functions
const sendResetEmail = async (email, resetToken, host) => {
  const resetUrl = `https://${host}/api/auth/reset/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, user) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Our Platform!',
    html: `
      <h2>Welcome ${user.firstName}!</h2>
      <p>Thank you for registering with us. Your account has been successfully created.</p>
      <p>You can now login with your email and password.</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

const sendPasswordResetConfirmation = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Confirmation',
    html: `
      <h2>Password Reset Successful</h2>
      <p>Your password has been successfully reset.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

const { secret, tokenLife } = keys.jwt;

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: 'You must enter an email address.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ error: 'No user found for this email address.' });
    }

    if (user && user.provider !== EMAIL_PROVIDER.Email) {
      return res.status(400).send({
        error: `That email address is already in use using ${user.provider} provider.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Password Incorrect'
      });
    }

    const payload = {
      id: user.id
    };

    const token = jwt.sign(payload, secret, { expiresIn: tokenLife });

    if (!token) {
      throw new Error();
    }

    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, firstName, lastName, password, isSubscribed } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: 'You must enter an email address.' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'You must enter your full name.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'That email address is already in use.' });
    }

    let subscribed = false;
    if (isSubscribed) {
      const result = await mailchimp.subscribeToNewsletter(email);

      if (result.status === 'subscribed') {
        subscribed = true;
      }
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    user.password = hash;
    const registeredUser = await user.save();

    const payload = {
      id: registeredUser.id
    };

    await sendWelcomeEmail(
      registeredUser.email,
      registeredUser
    );

    const token = jwt.sign(payload, secret, { expiresIn: tokenLife });

    res.status(200).json({
      success: true,
      subscribed,
      token: `Bearer ${token}`,
      user: {
        id: registeredUser.id,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        email: registeredUser.email,
        role: registeredUser.role
      }
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: 'You must enter an email address.' });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res
        .status(400)
        .send({ error: 'No user found for this email address.' });
    }

    const buffer = crypto.randomBytes(48);
    const resetToken = buffer.toString('hex');

    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 3600000;

    existingUser.save();

    await sendResetEmail(
      existingUser.email,
      resetToken,
      req.headers.host
    );

    res.status(200).json({
      success: true,
      message: 'Please check your email for the link to reset your password.'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// GET route to display the reset password form (COMPLETELY backend-controlled page)
router.get('/reset/:token', async (req, res) => {
  try {
    const resetUser = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!resetUser) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - Invalid Token</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              max-width: 500px; 
              margin: 50px auto; 
              padding: 20px; 
              background-color: #f5f5f5; 
              line-height: 1.6;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
              text-align: center; 
            }
            .error { 
              color: #d32f2f; 
              background: #ffebee;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .btn { 
              background-color: #1976d2; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              display: inline-block; 
              margin-top: 20px; 
              transition: background-color 0.3s;
            }
            .btn:hover {
              background-color: #1565c0;
            }
            h2 { color: #333; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset</h2>
            <div class="error">
              <strong>Invalid or Expired Token</strong><br>
              Your reset link has expired or is invalid. Please request a new password reset :) ....
            </div>
            <a href="https://ba-admin.onrender.com/forgot-password" class="btn">Request New Password Reset</a>
          </div>
        </body>
        </html>
      `);
    }

    // Display the reset password form - COMPLETELY BACKEND CONTROLLED
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 500px; 
            margin: 50px auto; 
            padding: 20px; 
            background-color: #f5f5f5; 
            line-height: 1.6;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
          }
          .form-group { 
            margin-bottom: 20px; 
          }
          label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: #333;
          }
          input[type="password"] { 
            width: 100%; 
            padding: 12px; 
            border: 2px solid #ddd; 
            border-radius: 6px; 
            font-size: 16px; 
            box-sizing: border-box; 
            transition: border-color 0.3s;
          }
          input[type="password"]:focus {
            outline: none;
            border-color: #1976d2;
          }
          .btn { 
            background-color: #1976d2; 
            color: white; 
            padding: 14px 24px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px; 
            width: 100%; 
            transition: background-color 0.3s;
            font-weight: 600;
          }
          .btn:hover { 
            background-color: #1565c0; 
          }
          .btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
          .error { 
            color: #d32f2f; 
            margin-bottom: 20px; 
            padding: 12px; 
            background-color: #ffebee; 
            border-radius: 6px; 
            display: none;
            border-left: 4px solid #d32f2f;
          }
          .success { 
            color: #2e7d32; 
            margin-bottom: 20px; 
            padding: 12px; 
            background-color: #e8f5e8; 
            border-radius: 6px; 
            display: none; 
            border-left: 4px solid #2e7d32;
          }
          h2 { 
            color: #333; 
            margin-bottom: 30px; 
            text-align: center;
          }
          .loading {
            display: none;
            text-align: center;
            margin-top: 10px;
            color: #666;
          }
          .redirect-message {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Reset Your Password</h2>
          <div id="error-message" class="error"></div>
          <div id="success-message" class="success"></div>
          
          <form id="resetForm">
            <div class="form-group">
              <label for="password">New Password:</label>
              <input type="password" id="password" name="password" required minlength="6" placeholder="Enter your new password">
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirm New Password:</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Confirm your new password">
            </div>
            
            <button type="submit" class="btn" id="submitBtn">Reset Password</button>
            <div class="loading" id="loading">Resetting your password...</div>
          </form>
          
          <div id="redirect-message" class="redirect-message" style="display: none;">
            Redirecting to login page in <span id="countdown">3</span> seconds...
          </div>
        </div>

        <script>
          document.getElementById('resetForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorDiv = document.getElementById('error-message');
            const successDiv = document.getElementById('success-message');
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            
            // Hide previous messages
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Resetting...';
            loading.style.display = 'block';
            
            // Validate passwords match
            if (password !== confirmPassword) {
              errorDiv.textContent = 'Passwords do not match.';
              errorDiv.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
              loading.style.display = 'none';
              return;
            }
            
            if (password.length < 6) {
              errorDiv.textContent = 'Password must be at least 6 characters long.';
              errorDiv.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
              loading.style.display = 'none';
              return;
            }
            
            try {
              const response = await fetch('/api/auth/reset/${req.params.token}', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                successDiv.innerHTML = '<strong>Success!</strong><br>' + data.message;
                successDiv.style.display = 'block';
                document.getElementById('resetForm').style.display = 'none';
                
                // Show countdown and redirect
                const redirectDiv = document.getElementById('redirect-message');
                redirectDiv.style.display = 'block';
                
                let countdown = 3;
                const countdownElement = document.getElementById('countdown');
                
                const timer = setInterval(() => {
                  countdown--;
                  countdownElement.textContent = countdown;
                  
                  if (countdown <= 0) {
                    clearInterval(timer);
                    window.location.href = 'https://ba-admin.onrender.com/login';
                  }
                }, 1000);
                
              } else {
                errorDiv.textContent = data.error || 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
                loading.style.display = 'none';
              }
            } catch (error) {
              errorDiv.textContent = 'Network error. Please try again.';
              errorDiv.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
              loading.style.display = 'none';
            }
          });
          
          // Real-time password confirmation validation
          document.getElementById('confirmPassword').addEventListener('input', function() {
            const password = document.getElementById('password').value;
            const confirmPassword = this.value;
            const errorDiv = document.getElementById('error-message');
            
            if (confirmPassword && password !== confirmPassword) {
              this.style.borderColor = '#d32f2f';
            } else {
              this.style.borderColor = '#ddd';
              if (errorDiv.textContent === 'Passwords do not match.') {
                errorDiv.style.display = 'none';
              }
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - Error</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 500px; 
            margin: 50px auto; 
            padding: 20px; 
            background-color: #f5f5f5; 
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            text-align: center; 
          }
          .error { 
            color: #d32f2f; 
            background: #ffebee;
            padding: 15px;
            border-radius: 8px;
          }
          h2 { color: #333; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset</h2>
          <div class="error">
            <strong>System Error</strong><br>
            An error occurred while processing your request. Please try again later.
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

router.post('/reset/:token', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const resetUser = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!resetUser) {
      return res.status(400).json({
        error:
          'Your token has expired. Please attempt to reset your password again.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    resetUser.password = hash;
    resetUser.resetPasswordToken = undefined;
    resetUser.resetPasswordExpires = undefined;

    await resetUser.save();

    await sendPasswordResetConfirmation(resetUser.email);

    res.status(200).json({
      success: true,
      message:
        'Password changed successfully. Please login with your new password.'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.post('/reset', auth, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const email = req.user.email;

    if (!email) {
      return res.status(401).send('Unauthenticated');
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ error: 'That email address is already in use.' });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ error: 'Please enter your correct old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(confirmPassword, salt);
    existingUser.password = hash;
    existingUser.save();

    await sendPasswordResetConfirmation(existingUser.email);

    res.status(200).json({
      success: true,
      message:
        'Password changed successfully. Please login with your new password.'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.get(
  '/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    accessType: 'offline',
    approvalPrompt: 'force'
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${keys.app.clientURL}/login`,
    session: false
  }),
  (req, res) => {
    const payload = {
      id: req.user.id
    };

    // TODO find another way to send the token to frontend
    const token = jwt.sign(payload, secret, { expiresIn: tokenLife });
    const jwtToken = `Bearer ${token}`;
    res.redirect(`${keys.app.clientURL}/auth/success?token=${jwtToken}`);
  }
);

router.get(
  '/facebook',
  passport.authenticate('facebook', {
    session: false,
    scope: ['public_profile', 'email']
  })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: `${keys.app.clientURL}/login`,
    session: false
  }),
  (req, res) => {
    const payload = {
      id: req.user.id
    };
    const token = jwt.sign(payload, secret, { expiresIn: tokenLife });
    const jwtToken = `Bearer ${token}`;
    res.redirect(`${keys.app.clientURL}/auth/success?token=${jwtToken}`);
  }
);

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               password:
 *                 type: string
 *               isSubscribed:
 *                 type: boolean
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - password
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscribed:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Registration failed
 */

/**
 * @swagger
 * /auth/forgot:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       400:
 *         description: Email not found
 */

/**
 * @swagger
 * /auth/reset/{token}:
 *   get:
 *     summary: Display password reset form
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Reset token
 *     responses:
 *       200:
 *         description: Password reset form displayed
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid or expired token
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 */
