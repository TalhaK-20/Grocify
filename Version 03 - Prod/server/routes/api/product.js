const express = require('express');
const router = express.Router();
const multer = require('multer');
const Mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Bring in Models & Utils
const Product = require('../../models/product');
const Brand = require('../../models/brand');
const Category = require('../../models/category');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const checkAuth = require('../../utils/auth');
const { s3Upload } = require('../../utils/storage');
const {
  getStoreProductsQuery,
  getStoreProductsWishListQuery
} = require('../../utils/queries');
const { ROLES } = require('../../constants');

// Import Google Drive utilities
const {
  uploadFileToDrive,
  uploadMultipleFilesToDrive,
  cleanupLocalFiles,
  safeJsonParse
} = require('../../utils/googleDrive');

// Configure multer for both memory and disk storage
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// Disk storage for Google Drive uploads
const uploadFolder = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
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

const MAX_FILE_COUNT = 10;

// fetch product slug api
router.get('/item/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const productDoc = await Product.findOne({ slug, isActive: true }).populate(
      {
        path: 'brand',
        select: 'name isActive slug'
      }
    );

    const hasNoBrand =
      productDoc?.brand === null || productDoc?.brand?.isActive === false;

    if (!productDoc || hasNoBrand) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      product: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch product name search api
router.get('/list/search/:name', async (req, res) => {
  try {
    const name = req.params.name;

    const productDoc = await Product.find(
      { name: { $regex: new RegExp(name), $options: 'is' }, isActive: true },
      { name: 1, slug: 1, imageUrl: 1, images: 1, price: 1, _id: 0 }
    );

    if (productDoc.length < 0) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      products: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store products by advanced filters api
router.get('/list', async (req, res) => {
  try {
    let {
      sortOrder,
      rating,
      max,
      min,
      category,
      brand,
      page = 1,
      limit = 10
    } = req.query;
    sortOrder = JSON.parse(sortOrder);

    const categoryFilter = category ? { category } : {};
    const basicQuery = getStoreProductsQuery(min, max, rating);

    const userDoc = await checkAuth(req);
    const categoryDoc = await Category.findOne({
      slug: categoryFilter.category,
      isActive: true
    });

    if (categoryDoc) {
      basicQuery.push({
        $match: {
          isActive: true,
          _id: {
            $in: Array.from(categoryDoc.products)
          }
        }
      });
    }

    const brandDoc = await Brand.findOne({
      slug: brand,
      isActive: true
    });

    if (brandDoc) {
      basicQuery.push({
        $match: {
          'brand._id': { $eq: brandDoc._id }
        }
      });
    }

    let products = null;
    const productsCount = await Product.aggregate(basicQuery);
    const count = productsCount.length;
    const size = count > limit ? page - 1 : 0;
    const currentPage = count > limit ? Number(page) : 1;

    // paginate query
    const paginateQuery = [
      { $sort: sortOrder },
      { $skip: size * limit },
      { $limit: limit * 1 }
    ];

    if (userDoc) {
      const wishListQuery = getStoreProductsWishListQuery(userDoc.id).concat(
        basicQuery
      );
      products = await Product.aggregate(wishListQuery.concat(paginateQuery));
    } else {
      products = await Product.aggregate(basicQuery.concat(paginateQuery));
    }

    res.status(200).json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage,
      count
    });
  } catch (error) {
    console.log('error', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.get('/list/select', auth, async (req, res) => {
  try {
    const products = await Product.find({}, 'name');

    res.status(200).json({
      products
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Enhanced add product api with Google Drive support
router.post(
  '/add',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  uploadDisk.array('images', MAX_FILE_COUNT), // Support multiple files
  async (req, res) => {
    try {
      const {
        sku,
        name,
        description,
        quantity,
        price,
        salePrice,
        taxable,
        isActive,
        brand,
        stockStatus,
        stockQuantity,
        weight,
        dimensions
      } = req.body;

      const files = req.files;

      // Validation
      if (!sku) {
        return res.status(400).json({ error: 'You must enter sku.' });
      }

      if (!description || !name) {
        return res
          .status(400)
          .json({ error: 'You must enter description & name.' });
      }

      if (!quantity) {
        return res.status(400).json({ error: 'You must enter a quantity.' });
      }

      if (!price) {
        return res.status(400).json({ error: 'You must enter a price.' });
      }

      const foundProduct = await Product.findOne({ sku });

      if (foundProduct) {
        return res.status(400).json({ error: 'This sku is already in use.' });
      }

      let imageUrl, imageKey, images = [], googleDriveId, fileUrl;

      // Handle file uploads
      if (files && files.length > 0) {
        try {
          // Upload to Google Drive
          const driveResults = await uploadMultipleFilesToDrive(files);
          
          // Set primary image from first uploaded file
          if (driveResults.length > 0) {
            googleDriveId = driveResults[0].id;
            fileUrl = driveResults[0].url;
            imageUrl = driveResults[0].url; // For backward compatibility
          }
          
          // Store all images in the images array
          images = driveResults.map(result => ({
            id: result.id,
            url: result.url
          }));

          // Clean up local files
          cleanupLocalFiles(files);

        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          // Clean up local files even if upload fails
          cleanupLocalFiles(files);
          return res.status(400).json({ 
            error: 'File upload failed. Please try again.' 
          });
        }
      }

      // Parse dimensions if provided
      let parsedDimensions;
      if (dimensions) {
        parsedDimensions = typeof dimensions === 'string' ? 
          safeJsonParse(dimensions) : dimensions;
      }

      const product = new Product({
        sku,
        name,
        description,
        quantity,
        price,
        salePrice: salePrice || undefined,
        taxable: taxable || false,
        isActive: isActive !== undefined ? isActive : true,
        brand: brand || null,
        stockStatus: stockStatus || 'In Stock',
        stockQuantity: stockQuantity || 0,
        weight: weight || undefined,
        dimensions: parsedDimensions || undefined,
        // Image fields
        imageUrl,
        imageKey,
        images,
        googleDriveId,
        fileUrl
      });

      const savedProduct = await product.save();

      res.status(200).json({
        success: true,
        message: `Product has been added successfully!`,
        product: savedProduct
      });
    } catch (error) {
      console.error('Add product error:', error);
      return res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// Enhanced add product api with S3 support (for backward compatibility)
router.post(
  '/add-s3',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  uploadMemory.single('image'),
  async (req, res) => {
    try {
      const sku = req.body.sku;
      const name = req.body.name;
      const description = req.body.description;
      const quantity = req.body.quantity;
      const price = req.body.price;
      const taxable = req.body.taxable;
      const isActive = req.body.isActive;
      const brand = req.body.brand;
      const image = req.file;

      if (!sku) {
        return res.status(400).json({ error: 'You must enter sku.' });
      }

      if (!description || !name) {
        return res
          .status(400)
          .json({ error: 'You must enter description & name.' });
      }

      if (!quantity) {
        return res.status(400).json({ error: 'You must enter a quantity.' });
      }

      if (!price) {
        return res.status(400).json({ error: 'You must enter a price.' });
      }

      const foundProduct = await Product.findOne({ sku });

      if (foundProduct) {
        return res.status(400).json({ error: 'This sku is already in use.' });
      }

      const { imageUrl, imageKey } = await s3Upload(image);

      const product = new Product({
        sku,
        name,
        description,
        quantity,
        price,
        taxable,
        isActive,
        brand,
        imageUrl,
        imageKey
      });

      const savedProduct = await product.save();

      res.status(200).json({
        success: true,
        message: `Product has been added successfully!`,
        product: savedProduct
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// fetch products api
router.get(
  '/',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      let products = [];

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]?.['_id'];

        products = await Product.find({})
          .populate({
            path: 'brand',
            populate: {
              path: 'merchant',
              model: 'Merchant'
            }
          })
          .where('brand', brandId);
      } else {
        products = await Product.find({}).populate({
          path: 'brand',
          populate: {
            path: 'merchant',
            model: 'Merchant'
          }
        });
      }

      res.status(200).json({
        products
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// fetch product api
router.get(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;

      let productDoc = null;

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]['_id'];

        productDoc = await Product.findOne({ _id: productId })
          .populate({
            path: 'brand',
            select: 'name'
          })
          .where('brand', brandId);
      } else {
        productDoc = await Product.findOne({ _id: productId }).populate({
          path: 'brand',
          select: 'name'
        });
      }

      if (!productDoc) {
        return res.status(404).json({
          message: 'No product found.'
        });
      }

      res.status(200).json({
        product: productDoc
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// Enhanced update product api with Google Drive support
router.put(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  uploadDisk.array('images', MAX_FILE_COUNT),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product ? req.body.product : req.body;
      const files = req.files;
      const query = { _id: productId };
      
      const { sku, slug } = update;

      const foundProduct = await Product.findOne({
        $or: [{ slug }, { sku }]
      });

      if (foundProduct && foundProduct._id != productId) {
        return res
          .status(400)
          .json({ error: 'Sku or slug is already in use.' });
      }

      // Handle new file uploads if provided
      if (files && files.length > 0) {
        try {
          // Upload new files to Google Drive
          const driveResults = await uploadMultipleFilesToDrive(files);
          
          // Update image fields
          if (driveResults.length > 0) {
            update.googleDriveId = driveResults[0].id;
            update.fileUrl = driveResults[0].url;
            update.imageUrl = driveResults[0].url; // For backward compatibility
          }
          
          // Add new images to existing ones or replace them
          update.images = driveResults.map(result => ({
            id: result.id,
            url: result.url
          }));

          // Clean up local files
          cleanupLocalFiles(files);

        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          cleanupLocalFiles(files);
          return res.status(400).json({ 
            error: 'File upload failed. Please try again.' 
          });
        }
      }

      // Parse dimensions if provided
      if (update.dimensions && typeof update.dimensions === 'string') {
        update.dimensions = safeJsonParse(update.dimensions);
      }

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

router.put(
  '/:id/active',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const product = await Product.deleteOne({ _id: req.params.id });

      res.status(200).json({
        success: true,
        message: `Product has been deleted successfully!`,
        product
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);
module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management APIs
 */

/**
 * @swagger
 * /api/product/item/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: No product found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/product/list/search/{name}:
 *   get:
 *     summary: Search products by name
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Product name or keyword
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *       404:
 *         description: No product found
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/product/list:
 *   get:
 *     summary: Get store products with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         description: Sorting order (JSON string)
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: min
 *         schema:
 *           type: number
 *       - in: query
 *         name: max
 *         schema:
 *           type: number
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Products list with pagination
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/product/add:
 *   post:
 *     summary: Add a new product (Google Drive upload)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               taxable:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               brand:
 *                 type: string
 *               stockStatus:
 *                 type: string
 *               stockQuantity:
 *                 type: integer
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *                 example: '{"length":10,"width":5,"height":3}'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product added successfully
 *       400:
 *         description: Validation or upload error
 */

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 *       400:
 *         description: Bad request
 *   put:
 *     summary: Update a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: JSON string of product fields
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/product/{id}/active:
 *   put:
 *     summary: Update product active status
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               product:
 *                 type: object
 *     responses:
 *       200:
 *         description: Product status updated
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/product/delete/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Bad request
 */