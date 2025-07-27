// routes/auth.js - Enhanced version with backend-served pages

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const nodemailer = require('nodemailer');
const path = require('path');

const auth = require('../../middleware/auth');

// Bring in Models & Helpers
const User = require('../../models/user');
const mailchimp = require('../../services/mailchimp');
const keys = require('../../config/keys');
const { EMAIL_PROVIDER, JWT_COOKIE } = require('../../constants');

const { secret, tokenLife } = keys.jwt;

// Create transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
  });
};

// Enhanced email templates with backend URLs
const getEmailTemplate = (type, data = {}) => {
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000'; // Your backend URL
  
  switch (type) {
    case 'signup':
      return {
        subject: 'Welcome! Your account has been created',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome ${data.firstName}!</h2>
            <p>Thank you for creating an account with us.</p>
            <p>You can now login and start using our services.</p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <p><strong>Need help?</strong> Contact our support team.</p>
            </div>
          </div>
        `,
        text: `Welcome ${data.firstName}!\n\nThank you for creating an account with us.\n\nYou can now login and start using our services.`
      };

    case 'reset':
      return {
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You have requested to reset your password. Please click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/auth/reset-password/${data.token}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
              ${baseUrl}/auth/reset-password/${data.token}
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Security Notice:</strong></p>
              <ul style="margin: 5px 0;">
                <li>If you did not request this reset, please ignore this email</li>
                <li>This link will expire in 1 hour</li>
                <li>For your security, never share this link with anyone</li>
              </ul>
            </div>
          </div>
        `,
        text: `Password Reset Request\n\nYou have requested to reset your password. Please visit the following link to reset your password:\n\n${baseUrl}/auth/reset-password/${data.token}\n\nIf you did not request this, please ignore this email.\n\nThis link will expire in 1 hour.`
      };

    case 'reset-confirmation':
      return {
        subject: 'Password Reset Successful',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p>You can now login with your new password.</p>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #d4edda; border-radius: 5px; border-left: 4px solid #28a745;">
              <p style="margin: 0;"><strong>Security Reminder:</strong></p>
              <p style="margin: 5px 0;">If you did not make this change, please contact support immediately.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || baseUrl}/login" 
                 style="background-color: #28a745; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login Now
              </a>
            </div>
          </div>
        `,
        text: `Password Reset Successful\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact support immediately.`
      };

    default:
      throw new Error('Invalid email template type');
  }
};

// Email sending function
const sendEmail = async (to, type, data = {}) => {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate(type, data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// HTML template for reset password page
const getResetPasswordHTML = (token, error = null, success = null) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #333;
                font-size: 28px;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #666;
                font-size: 16px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
            }
            
            input[type="password"] {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }
            
            input[type="password"]:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .password-requirements {
                margin-top: 8px;
                font-size: 12px;
                color: #666;
            }
            
            .btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .btn:active {
                transform: translateY(0);
            }
            
            .alert {
                padding: 12px 16px;
                border-radius: 6px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .alert-error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .alert-success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .back-link {
                text-align: center;
                margin-top: 20px;
            }
            
            .back-link a {
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
            }
            
            .back-link a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reset Password</h1>
                <p>Enter your new password below</p>
            </div>
            
            ${error ? `<div class="alert alert-error">${error}</div>` : ''}
            ${success ? `<div class="alert alert-success">${success}</div>` : ''}
            
            ${!success ? `
            <form method="POST" action="/auth/reset-password/${token}">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        required 
                        minlength="6"
                        placeholder="Enter your new password"
                    >
                    <div class="password-requirements">
                        Password must be at least 6 characters long
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm New Password</label>
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        required 
                        minlength="6"
                        placeholder="Confirm your new password"
                    >
                </div>
                
                <button type="submit" class="btn">Reset Password</button>
            </form>
            ` : `
            <div style="text-align: center;">
                <p>Your password has been successfully reset!</p>
                <a href="${process.env.CLIENT_URL || '/login'}" class="btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                    Continue to Login
                </a>
            </div>
            `}
            
            <div class="back-link">
                <a href="${process.env.CLIENT_URL || '/login'}">← Back to Login</a>
            </div>
        </div>
        
        <script>
            // Client-side password confirmation validation
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.querySelector('form');
                const password = document.getElementById('password');
                const confirmPassword = document.getElementById('confirmPassword');
                
                if (form && password && confirmPassword) {
                    confirmPassword.addEventListener('input', function() {
                        if (password.value !== confirmPassword.value) {
                            confirmPassword.setCustomValidity('Passwords do not match');
                        } else {
                            confirmPassword.setCustomValidity('');
                        }
                    });
                    
                    password.addEventListener('input', function() {
                        if (password.value !== confirmPassword.value) {
                            confirmPassword.setCustomValidity('Passwords do not match');
                        } else {
                            confirmPassword.setCustomValidity('');
                        }
                    });
                }
            });
        </script>
    </body>
    </html>
  `;
};

// Existing login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'You must enter an email address.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ error: 'No user found for this email address.' });
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

    const payload = { id: user.id };
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

// Existing register route
router.post('/register', async (req, res) => {
  try {
    const { email, firstName, lastName, password, isSubscribed } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'You must enter an email address.' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'You must enter your full name.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'That email address is already in use.' });
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

    const payload = { id: registeredUser.id };

    // Send welcome email
    await sendEmail(registeredUser.email, 'signup', {
      firstName: registeredUser.firstName
    });

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
    console.error('Registration error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Modified forgot password route (sends email with backend link)
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'You must enter an email address.' });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ error: 'No user found for this email address.' });
    }

    const buffer = crypto.randomBytes(48);
    const resetToken = buffer.toString('hex');

    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await existingUser.save();

    // Send email with backend reset link
    await sendEmail(existingUser.email, 'reset', {
      token: resetToken
    });

    res.status(200).json({
      success: true,
      message: 'Please check your email for the link to reset your password.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// NEW: Serve reset password page (GET request)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify token exists and is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.send(getResetPasswordHTML(token, 'This reset link has expired or is invalid. Please request a new password reset.'));
    }

    // Serve the reset password form
    res.send(getResetPasswordHTML(token));
    
  } catch (error) {
    console.error('Reset password page error:', error);
    res.send(getResetPasswordHTML(req.params.token, 'An error occurred. Please try again.'));
  }
});

// Modified reset password route (handles form submission)
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validation
    if (!password) {
      return res.send(getResetPasswordHTML(token, 'You must enter a password.'));
    }

    if (password.length < 6) {
      return res.send(getResetPasswordHTML(token, 'Password must be at least 6 characters long.'));
    }

    if (password !== confirmPassword) {
      return res.send(getResetPasswordHTML(token, 'Passwords do not match.'));
    }

    // Find user with valid token
    const resetUser = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!resetUser) {
      return res.send(getResetPasswordHTML(token, 'This reset link has expired or is invalid. Please request a new password reset.'));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Update user
    resetUser.password = hash;
    resetUser.resetPasswordToken = undefined;
    resetUser.resetPasswordExpires = undefined;

    await resetUser.save();

    // Send confirmation email
    await sendEmail(resetUser.email, 'reset-confirmation');

    // Show success page
    res.send(getResetPasswordHTML(token, null, 'Your password has been successfully reset!'));

  } catch (error) {
    console.error('Reset password error:', error);
    res.send(getResetPasswordHTML(req.params.token, 'An error occurred while resetting your password. Please try again.'));
  }
});

// Keep the API endpoint for authenticated users changing password
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
      return res.status(400).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Please enter your correct old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(confirmPassword, salt);
    existingUser.password = hash;
    await existingUser.save();

    await sendEmail(existingUser.email, 'reset-confirmation');

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// OAuth routes remain the same
router.get('/google', passport.authenticate('google', {
  session: false,
  scope: ['profile', 'email'],
  accessType: 'offline',
  approvalPrompt: 'force'
}));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${keys.app.clientURL}/login`,
  session: false
}), (req, res) => {
  const payload = { id: req.user.id };
  const token = jwt.sign(payload, secret, { expiresIn: tokenLife });
  const jwtToken = `Bearer ${token}`;
  res.redirect(`${keys.app.clientURL}/auth/success?token=${jwtToken}`);
});

router.get('/facebook', passport.authenticate('facebook', {
  session: false,
  scope: ['public_profile', 'email']
}));

router.get('/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: `${keys.app.clientURL}/login`,
  session: false
}), (req, res) => {
  const payload = { id: req.user.id };
  const token = jwt.sign(payload, secret, { expiresIn: tokenLife });
  const jwtToken = `Bearer ${token}`;
  res.redirect(`${keys.app.clientURL}/auth/success?token=${jwtToken}`);
});

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
