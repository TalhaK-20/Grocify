const express = require('express');
const router = express.Router();
const Mongoose = require('mongoose');

// Bring in Models & Utils
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const store = require('../../utils/store');

// GET USER'S CURRENT CART (Main API you were missing)
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'products.product',
        populate: {
          path: 'brand'
        }
      })
      .sort({ created: -1 }); // Get most recent cart

    if (!cart) {
      // Create empty cart if none exists
      cart = new Cart({
        user: userId,
        products: []
      });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      cart,
      cartItems: cart.products,
      cartTotal: cart.products.reduce((total, item) => total + item.totalPrice, 0)
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// ADD ITEM TO CART
router.post('/add-item', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        products: []
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.products.findIndex(
      item => item.product.toString() === productId
    );

    const purchasePrice = product.price;
    const totalPrice = purchasePrice * quantity;
    const totalTax = product.taxable ? totalPrice * 0.1 : 0; // 10% tax if taxable
    const priceWithTax = totalPrice + totalTax;

    if (existingItemIndex > -1) {
      // Update existing item
      cart.products[existingItemIndex].quantity += quantity;
      cart.products[existingItemIndex].totalPrice = 
        cart.products[existingItemIndex].purchasePrice * cart.products[existingItemIndex].quantity;
      cart.products[existingItemIndex].totalTax = 
        product.taxable ? cart.products[existingItemIndex].totalPrice * 0.1 : 0;
      cart.products[existingItemIndex].priceWithTax = 
        cart.products[existingItemIndex].totalPrice + cart.products[existingItemIndex].totalTax;
    } else {
      // Add new item
      cart.products.push({
        product: productId,
        quantity,
        purchasePrice,
        totalPrice,
        totalTax,
        priceWithTax
      });
    }

    cart.updated = new Date();
    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'products.product',
      populate: {
        path: 'brand'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully!',
      cart,
      cartItems: cart.products,
      cartTotal: cart.products.reduce((total, item) => total + item.totalPrice, 0)
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// REMOVE ITEM FROM CART
router.delete('/remove-item/:productId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    // Remove item from cart
    cart.products = cart.products.filter(
      item => item.product.toString() !== productId
    );

    cart.updated = new Date();
    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'products.product',
      populate: {
        path: 'brand'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully!',
      cart,
      cartItems: cart.products,
      cartTotal: cart.products.reduce((total, item) => total + item.totalPrice, 0)
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// UPDATE ITEM QUANTITY IN CART
router.put('/update-item/:productId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity.' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    // Find item in cart
    const itemIndex = cart.products.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }

    // Get product to check stock and calculate prices
    const product = await Product.findById(productId);
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    // Update item
    cart.products[itemIndex].quantity = quantity;
    cart.products[itemIndex].totalPrice = cart.products[itemIndex].purchasePrice * quantity;
    cart.products[itemIndex].totalTax = product.taxable ? cart.products[itemIndex].totalPrice * 0.1 : 0;
    cart.products[itemIndex].priceWithTax = cart.products[itemIndex].totalPrice + cart.products[itemIndex].totalTax;

    cart.updated = new Date();
    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'products.product',
      populate: {
        path: 'brand'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully!',
      cart,
      cartItems: cart.products,
      cartTotal: cart.products.reduce((total, item) => total + item.totalPrice, 0)
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// CLEAR ENTIRE CART
router.delete('/clear', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    cart.products = [];
    cart.updated = new Date();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully!',
      cart,
      cartItems: [],
      cartTotal: 0
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
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /cart/me:
 *   get:
 *     summary: Get user's current cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *                 cartItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 cartTotal:
 *                   type: number
 */

/**
 * @swagger
 * /cart/add-item:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 default: 1
 *             required:
 *               - productId
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */

/**
 * @swagger
 * /cart/remove-item/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 */

/**
 * @swagger
 * /cart/update-item/{productId}:
 *   put:
 *     summary: Update item quantity in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *             required:
 *               - quantity
 *     responses:
 *       200:
 *         description: Cart updated successfully
 */

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
