const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Bring in Models & Helpers
const User = require('../../models/user');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// Import Google Drive utilities
const {
  uploadFileToDrive,
  cleanupLocalFiles
} = require('../../utils/googleDrive');

// Configure multer for profile image uploads
const uploadFolder = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const safeName = `profile-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|gif|webp)$/i.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpeg, png, gif, webp).'), false);
};

const uploadDisk = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter
});

// search users api
router.get('/search', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { search } = req.query;

    const regex = new RegExp(search, 'i');

    const users = await User.find(
      {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } }
        ]
      },
      { password: 0, _id: 0 }
    ).populate('merchant', 'name');

    res.status(200).json({
      users
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch users api
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find({}, { password: 0, _id: 0, googleId: 0 })
      .sort('-created')
      .populate('merchant', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments();

    res.status(200).json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      count
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user._id;
    const userDoc = await User.findById(user, { password: 0 }).populate({
      path: 'merchant',
      model: 'Merchant',
      populate: {
        path: 'brand',
        model: 'Brand'
      }
    });

    res.status(200).json({
      user: userDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Enhanced profile update with profile image support
router.put('/', auth, uploadDisk.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user._id;
    const update = req.body.profile || req.body;
    const file = req.file;
    const query = { _id: userId };

    // Handle profile image upload
    if (file) {
      try {
        // Upload to Google Drive
        const driveResult = await uploadFileToDrive(file.path, file.originalname);
        
        // Add profile image URL to update
        update.profileImageUrl = driveResult.url;

        // Clean up local file
        cleanupLocalFiles([file]);

      } catch (uploadError) {
        console.error('Profile image upload error:', uploadError);
        // Clean up local file even if upload fails
        cleanupLocalFiles([file]);
        return res.status(400).json({ 
          error: 'Profile image upload failed. Please try again.' 
        });
      }
    }

    // Parse structured addresses if provided
    if (update.shippingAddress && typeof update.shippingAddress === 'string') {
      try {
        update.shippingAddress = JSON.parse(update.shippingAddress);
      } catch (e) {
        // If parsing fails, leave as string
      }
    }

    if (update.billingAddress && typeof update.billingAddress === 'string') {
      try {
        update.billingAddress = JSON.parse(update.billingAddress);
      } catch (e) {
        // If parsing fails, leave as string
      }
    }

    const userDoc = await User.findOneAndUpdate(query, update, {
      new: true,
      select: { password: 0 } // Exclude password from response
    });

    if (!userDoc) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Your profile is successfully updated!',
      user: userDoc
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Update profile image separately
router.put('/profile-image', auth, uploadDisk.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'No image file provided.'
      });
    }

    try {
      // Upload to Google Drive
      const driveResult = await uploadFileToDrive(file.path, file.originalname);
      
      // Update user profile image
      const userDoc = await User.findOneAndUpdate(
        { _id: userId },
        { profileImageUrl: driveResult.url },
        { new: true, select: { password: 0 } }
      );

      // Clean up local file
      cleanupLocalFiles([file]);

      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully!',
        user: userDoc,
        imageUrl: driveResult.url
      });

    } catch (uploadError) {
      console.error('Profile image upload error:', uploadError);
      // Clean up local file even if upload fails
      cleanupLocalFiles([file]);
      return res.status(400).json({ 
        error: 'Profile image upload failed. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Get user profile with full address information
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const userDoc = await User.findById(userId, { password: 0 }).populate({
      path: 'merchant',
      model: 'Merchant',
      populate: {
        path: 'brand',
        model: 'Brand'
      }
    });

    if (!userDoc) {
      return res.status(404).json({
        error: 'User not found.'
      });
    }

    // If user has old address format, parse it for display
    let parsedAddress = null;
    if (userDoc.address && (!userDoc.shippingAddress || !userDoc.billingAddress)) {
      parsedAddress = userDoc.parseAddress(userDoc.address);
    }

    res.status(200).json({
      user: userDoc,
      parsedAddress
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});
module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * /api/user/search:
 *   get:
 *     summary: Search users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Keyword to search users by first name, last name, or email
 *     responses:
 *       200:
 *         description: List of matching users
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get paginated list of users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       400:
 *         description: Bad request
 *   put:
 *     summary: Update current user profile (with optional image upload)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               profile:
 *                 type: string
 *                 description: JSON string with profile fields
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               shippingAddress:
 *                 type: string
 *                 description: JSON string of shipping address
 *               billingAddress:
 *                 type: string
 *                 description: JSON string of billing address
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/user/profile-image:
 *   put:
 *     summary: Update current user's profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: Upload error or bad request
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get current user profile with address information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Bad request
 */