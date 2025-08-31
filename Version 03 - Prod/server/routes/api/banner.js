const express = require('express');
const router = express.Router();

// Bring in Models & Utils
const Banner = require('../../models/banner');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// Add new banner (Admin only)
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { title, description, imageUrl, linkUrl, displayOrder, startDate, endDate } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ 
        error: 'Title and image URL are required.' 
      });
    }

    // Validate URL format (basic validation)
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(imageUrl)) {
      return res.status(400).json({ 
        error: 'Please provide a valid image URL.' 
      });
    }

    if (linkUrl && !urlRegex.test(linkUrl)) {
      return res.status(400).json({ 
        error: 'Please provide a valid link URL.' 
      });
    }

    const banner = new Banner({
      title,
      description,
      imageUrl,
      linkUrl,
      displayOrder: displayOrder || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user._id
    });

    const savedBanner = await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner has been added successfully!',
      banner: savedBanner
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Get all banners (Admin only)
router.get('/admin', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const banners = await Banner.find({})
      .populate('createdBy', 'firstName lastName email')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      banners
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Get active banners for frontend (Public)
router.get('/active', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const banners = await Banner.find({
      isActive: true,
      startDate: { $lte: currentDate },
      $or: [
        { endDate: null },
        { endDate: { $gte: currentDate } }
      ]
    })
    .select('title description imageUrl linkUrl displayOrder')
    .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      banners
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Get single banner by ID
router.get('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!banner) {
      return res.status(404).json({
        message: 'Banner not found.'
      });
    }

    res.status(200).json({
      success: true,
      banner
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Update banner (Admin only)
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const bannerId = req.params.id;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData.createdBy;
    delete updateData.createdAt;
    
    updateData.updated = new Date();

    // Validate URLs if provided
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    
    if (updateData.imageUrl && !urlRegex.test(updateData.imageUrl)) {
      return res.status(400).json({ 
        error: 'Please provide a valid image URL.' 
      });
    }

    if (updateData.linkUrl && updateData.linkUrl !== '' && !urlRegex.test(updateData.linkUrl)) {
      return res.status(400).json({ 
        error: 'Please provide a valid link URL.' 
      });
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({
        message: 'Banner not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner has been updated successfully!',
      banner: updatedBanner
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Toggle banner active status (Admin only)
router.put('/:id/toggle-status', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        message: 'Banner not found.'
      });
    }

    banner.isActive = !banner.isActive;
    banner.updated = new Date();
    
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner has been ${banner.isActive ? 'activated' : 'deactivated'} successfully!`,
      banner
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Delete banner (Admin only)
router.delete('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const deletedBanner = await Banner.findByIdAndDelete(req.params.id);

    if (!deletedBanner) {
      return res.status(404).json({
        message: 'Banner not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner has been deleted successfully!',
      banner: deletedBanner
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Bulk update banner orders (Admin only)
router.put('/bulk/update-order', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { banners } = req.body; // Array of {id, displayOrder}

    if (!Array.isArray(banners)) {
      return res.status(400).json({
        error: 'Please provide a valid banners array.'
      });
    }

    const bulkOps = banners.map(banner => ({
      updateOne: {
        filter: { _id: banner.id },
        update: { displayOrder: banner.displayOrder, updated: new Date() }
      }
    }));

    await Banner.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Banner order has been updated successfully!'
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
 *   name: Banner
 *   description: Banner management for home page display
 */

/**
 * @swagger
 * /banner/add:
 *   post:
 *     summary: Add a new banner (Admin only)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerInput'
 *     responses:
 *       201:
 *         description: Banner added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /banner/active:
 *   get:
 *     summary: Get active banners for frontend display (Public)
 *     tags: [Banner]
 *     responses:
 *       200:
 *         description: List of active banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 banners:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BannerPublic'
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /banner/admin:
 *   get:
 *     summary: Get all banners (Admin only)
 *     tags: [Banner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 banners:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BannerInput:
 *       type: object
 *       required:
 *         - title
 *         - imageUrl
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         imageUrl:
 *           type: string
 *           format: uri
 *         linkUrl:
 *           type: string
 *           format: uri
 *         displayOrder:
 *           type: number
 *           default: 0
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *     
 *     Banner:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *         linkUrl:
 *           type: string
 *         isActive:
 *           type: boolean
 *         displayOrder:
 *           type: number
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     BannerPublic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *         linkUrl:
 *           type: string
 *         displayOrder:
 *           type: number
 */