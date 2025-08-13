// To view an image or multiples images on the UI, then try to modify the
// URL of the image, that is uploaded on the DRIVE using Google Drive Api.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');

const Item = require('./models/items');
const Customer = require('./models/customers')
const Order = require('./models/orders');
const Cart = require('./models/carts');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ------------------ CONFIG (HARDCODED) ------------------

const MONGODB_URI = 'mongodb+srv://talha-khalid-software-engineer:asdfghjkl123456789@cluster0.n4kwwau.mongodb.net/grocery-app?retryWrites=true&w=majority';

const GOOGLE_DRIVE_FOLDER_ID = '1CbO11lCNlmam55uIUemNHWC_QuNPYxQW';

const SERVICE_ACCOUNT_CREDENTIALS = {
  type: "service_account",
  project_id: "file-upload-427811",
  private_key_id: "d391df159dae3fe4fb4d75e94079dbadf8e7f3ce",
  private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFUQtw/W0CY7AY\nEVhlecq0HFJ5v4p2CG7AZjchwrArjngOnPzX5nmMLMAendGm/wr5CRSrTQe7lP2s\nlhWx5GPMEo/87ZGPP3C93PRveilGNVPHS2S+0m4ui95UDa4SPXuuNpKsXFJ6dIOX\nKv4jFVQYvx44dFXs5L/DN7EqDHGF2TXXl3dAeJyWTMZYcSVzpRXEgtqhWu6G7Bn5\nk8cH8uuHhYE26ioOCvpbNQzL0+badMLF/yYIRyEA/eVGKlzYNmIHXRVZcHOtK4hO\n0c0t9kNncVUre1iDMsNZaTo/fYe0zgwPgRMuX2IHL6ysvAC/SgF9OzkAzKL6udF9\nofgaDqAfAgMBAAECggEAANLNQuvz1AI5fmg4H7hJ5cWGfJaVi9eOKsRib4Qh+xSN\noLX8AiSmljSrmpUbBmDjGVX13Z8lLJ27D0jTD1p+JiBftHUDWf8wR8KPzJVMbcwU\nLO0+HuO+7PfNdjlWZCIYjYoRw6FhALzSvcNCqz/QCYhmpmKp5yKvQC/Pz/acVKwp\nAI0Oh97JEAuFDuzuAdetLad1g8p050LFWBcDzRLYkdePcLW0GADRfk2rdoJkaxbn\n9N9OGQt/rgV9K03EFr8igYdeGakXnZUuNF5NoOjlYQcd/RY4Vn3ZbPe2QlKYPKFR\nfiqW/gcsIdK2OwtZAL+GW15vw09v0I6ozLSM9QFadQKBgQD2rNQv6u22RdPUnGIL\nB8xV1ayEJr+lfvWblN1Qk9rVqqhsLtI6H+VcPtRLVtqfP5ETU9jw52kUuCh5fnZ2\nnY/X87D70U+i8TO7u41F1/Uox0ivsw7bcRYqSXnGv9QvYl+g9Gd7OJjx34q8Ib+S\nUFVLtCobZJg6Al73ZDbC5gwWrQKBgQDMxo3Za7YE5MDrs6VlhALZ1PfgTqP+4eQk\nqpPupgiBy+TGJ1DAAAN0z/CnFLMldSUpzaJB564Z1ntinSy+55qaTdLS1hrw3Otc\nrQAz1M+xZTGF7EtUn74jS7YkX4GCO3KD7LCch6On2hnkIowQvgXtk+hGkFFPPD2A\nXlskxUUHewKBgFpdJb4ICdzj553TS/dOfARVqkUfDMXLpJ3CAvEpuNjdE6XN4SV5\n2cPZIFwZDS2ZU8QIy0g0/cGhVPJs6Wi6f59UnlkhbFL8mT8EjdQwMJcnqfDzX1X0\nL3J+SCYOz+Qr3WxRHDd/nEe+5EvW8R7gXt7EuUgfqcRWagOmqojrTTJhAoGBAJoo\nS7dHMBMFBvsqFbSTqfXFLwotCaai9bZot88sLTFRhptqE49HM1LoC9osaiUjyGNt\nC96jhFytK9v0STA6eRf6yGCykDuNhJ4TGxjp96UrchnI5nkBfQljQO6m+39IM5B/\nSgG81wZQ2bb2Dw23kAznkTA2CxAkYIRYBDNtUucrAoGAYI0kxCs4CRW0foZUlYCJ\nKR0uIChuSQwjwF8shFq117+ndO1D8B7XTPybm3t+iey9ww95vw1Uh2qjqvygAZYV\n1WzPR2CK4uccsGiREUaldtbSPDZ1QKKFEFLWV5OXTK0fAKBv05AIteuyM3dVvgWD\nYM0sH2Zhw8exKwPQQSAdSo0=\n-----END PRIVATE KEY-----\n`,
  client_email: "talha-khalid@file-upload-427811.iam.gserviceaccount.com",
  client_id: "103160677148251988136",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/talha-khalid%40file-upload-427811.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const PORT = 5000;

const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ------------------ MONGOOSE CONNECT ------------------

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
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

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter
});

function mimeTypeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return map[ext] || 'application/octet-stream';
}

async function uploadFileToDrive(localPath, originalName) {
  const fileMetadata = {
    name: originalName,
    parents: [GOOGLE_DRIVE_FOLDER_ID]
  };
  const media = {
    mimeType: mimeTypeFromFilename(originalName),
    body: fs.createReadStream(localPath)
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name'
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
  return { id: fileId, url: publicUrl };
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch (e) { return undefined; }
}


// ------------------ ROUTES ------------------


// Items routes starts from here


app.post('/api/items', upload.array('files', MAX_FILE_COUNT), async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.regularPrice) payload.regularPrice = Number(payload.regularPrice);
    if (payload.salePrice) payload.salePrice = Number(payload.salePrice);
    if (payload.stockQuantity) payload.stockQuantity = Number(payload.stockQuantity);

    if (payload.dimensions && typeof payload.dimensions === 'string') {
      const parsed = safeJsonParse(payload.dimensions);
      if (parsed) payload.dimensions = parsed;
    }

    const files = req.files || [];
    const uploadedImages = [];

    for (const f of files) {
      const info = await uploadFileToDrive(f.path, f.originalname);
      uploadedImages.push({
        id: info.id,
        url: info.url,
        originalName: f.originalname,
        isCover: false
      });
      try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
    }

    if (payload.coverImageId) {
      uploadedImages.forEach(img => {
        img.isCover = (img.id === payload.coverImageId);
      });
    } else if (uploadedImages.length > 0) {
      uploadedImages[0].isCover = true;
    }

    const newItem = new Item({
      name: payload.name,
      description: payload.description,
      images: uploadedImages,
      googleDriveId: uploadedImages.find(img => img.isCover)?.id,
      fileUrl: uploadedImages.find(img => img.isCover)?.url,
      regularPrice: payload.regularPrice,
      salePrice: payload.salePrice,
      stockStatus: payload.stockStatus || 'In Stock',
      stockQuantity: payload.stockQuantity || 0,
      weight: payload.weight,
      dimensions: payload.dimensions
    });

    const saved = await newItem.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /api/items error:', err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});


// ------------------ UPDATE ITEM ------------------
app.put('/api/items/:id', upload.array('files', MAX_FILE_COUNT), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (req.body.imagesToDelete) {
      const imagesToDelete = JSON.parse(req.body.imagesToDelete);

      for (const imageId of imagesToDelete) {
        const imageToDelete = item.images.find(img => img.id === imageId);
        if (imageToDelete) {
          await deleteFileFromDrive(imageId);
          item.images = item.images.filter(img => img.id !== imageId);
        }
      }
    }

    const files = req.files || [];
    for (const f of files) {
      const info = await uploadFileToDrive(f.path, f.originalname);
      const newImage = {
        id: info.id,
        url: info.url,
        originalName: f.originalname,
        isCover: false
      };
      item.images.push(newImage);
      try { fs.unlinkSync(f.path); } catch (e) { }
    }

    if (req.body.coverImageId) {
      const coverImageId = req.body.coverImageId;
      item.images.forEach(img => {
        img.isCover = (img.id === coverImageId);
      });
    } else if (item.images.length > 0 && !item.images.some(img => img.isCover)) {
      item.images[0].isCover = true;
    }

    const updates = req.body || {};
    if (updates.regularPrice) item.regularPrice = Number(updates.regularPrice);
    if (updates.salePrice) item.salePrice = Number(updates.salePrice);
    if (updates.stockQuantity) item.stockQuantity = Number(updates.stockQuantity);
    if (updates.name) item.name = updates.name;
    if (updates.description) item.description = updates.description;
    if (updates.stockStatus) item.stockStatus = updates.stockStatus;
    if (updates.weight) item.weight = updates.weight;

    if (updates.dimensions && typeof updates.dimensions === 'string') {
      const parsed = safeJsonParse(updates.dimensions);
      if (parsed) item.dimensions = parsed;
    } else if (updates.dimensions) {
      item.dimensions = updates.dimensions;
    }

    const coverImage = item.images.find(img => img.isCover);
    if (coverImage) {
      item.googleDriveId = coverImage.id;
      item.fileUrl = coverImage.url;
    }

    const saved = await item.save();
    res.json(saved);
  } catch (err) {
    console.error('PUT /api/items/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// Function to delete file from Google Drive
async function deleteFileFromDrive(fileId) {
  try {
    const auth = new google.auth.GoogleAuth({
      yscopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
    console.log(`File ${fileId} deleted from Google Drive`);
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
  }
}


// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ timestamp: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Enhanced DELETE route to also clean up Google Drive files
app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.images && item.images.length > 0) {
      for (const image of item.images) {
        await deleteFileFromDrive(image.id);
      }
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item and associated files deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/items/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// **********************************************


// ------------- Customer routes starts from here
app.post('/api/customers', upload.single('profileImage'), async (req, res) => {
  try {
    let imageUrl = null;
    if (req.file) {
      const uploaded = await uploadFileToDrive(req.file.path, req.file.filename);
      imageUrl = uploaded.url;
    }
    const newCustomer = new Customer({ ...req.body, profileImageUrl: imageUrl });
    const saved = await newCustomer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/customers', async (req, res) => {
  try {
    res.json(await Customer.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/customers/:id', async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/customers/:id', upload.single('profileImage'), async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      const uploaded = await uploadFileToDrive(req.file.path, req.file.filename);
      imageUrl = uploaded.url;
    }

    if (req.body.removeImage === 'true') {
      imageUrl = '';
    }

    const updateData = { ...req.body };

    if (imageUrl !== undefined) {
      updateData.profileImageUrl = imageUrl;
    }

    const updated = await Customer.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updated) return res.status(404).json({ error: 'Not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/customers/:id', async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// **********************************************


// ================= CART ROUTES =================


// Get cart by customer ID or session ID
app.get('/api/cart/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { type } = req.query;

    let cart;
    if (type === 'customer') {
      cart = await Cart.findOne({ customerId: identifier }).populate('items.itemId');
    } else {
      cart = await Cart.findOne({ sessionId: identifier }).populate('items.itemId');
    }

    if (!cart) {
      return res.json({ items: [], totalItems: 0, totalAmount: 0 });
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Add item to cart
app.post('/api/cart/add', async (req, res) => {
  try {
    const { customerId, sessionId, itemId, quantity = 1 } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.stockQuantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    let cart;
    if (customerId) {
      cart = await Cart.findOne({ customerId }) || new Cart({ customerId });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId }) || new Cart({ sessionId });
    } else {
      return res.status(400).json({ error: 'Customer ID or Session ID required' });
    }

    const price = item.salePrice || item.regularPrice;
    const coverImage = item.images.find(img => img.isCover) || item.images[0];

    const cartItem = {
      itemId: item._id,
      name: item.name,
      price: price,
      quantity: quantity,
      imageUrl: coverImage?.url || item.fileUrl
    };

    cart.addItem(cartItem);
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update item quantity in cart
app.put('/api/cart/update', async (req, res) => {
  try {
    const { customerId, sessionId, itemId, quantity } = req.body;

    let cart;
    if (customerId) {
      cart = await Cart.findOne({ customerId });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.updateQuantity(itemId, quantity);
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Remove item from cart
app.delete('/api/cart/remove', async (req, res) => {
  try {
    const { customerId, sessionId, itemId } = req.body;

    let cart;
    if (customerId) {
      cart = await Cart.findOne({ customerId });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId });
    }

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.removeItem(itemId);
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Clear entire cart
app.delete('/api/cart/clear/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { type } = req.query;

    let result;
    if (type === 'customer') {
      result = await Cart.findOneAndDelete({ customerId: identifier });
    } else {
      result = await Cart.findOneAndDelete({ sessionId: identifier });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// **********************************************


// ================= CHECKOUT ROUTES =================


// Get checkout information (customer details + cart)
app.post('/api/checkout/info', async (req, res) => {
  try {
    const { customerId, sessionId } = req.body;

    let cart;
    if (customerId) {
      cart = await Cart.findOne({ customerId }).populate('items.itemId');
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId }).populate('items.itemId');
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }

    const subtotal = cart.totalAmount;
    const shippingCost = subtotal > 2000 ? 0 : 150;
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + shippingCost + tax;

    const checkoutInfo = {
      cart,
      customer,
      orderSummary: {
        subtotal,
        shippingCost,
        tax,
        totalAmount
      }
    };

    res.json(checkoutInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Process checkout and create order
app.post('/api/checkout/process', async (req, res) => {
  try {
    const {
      customerId,
      sessionId,
      customerInfo,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes
    } = req.body;

    let cart;
    if (customerId) {
      cart = await Cart.findOne({ customerId }).populate('items.itemId');
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId }).populate('items.itemId');
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const cartItem of cart.items) {
      const currentItem = await Item.findById(cartItem.itemId);
      if (!currentItem || currentItem.stockQuantity < cartItem.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${cartItem.name}`
        });
      }
    }

    const subtotal = cart.totalAmount;
    const shippingCost = subtotal > 2000 ? 0 : 150;
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + shippingCost + tax;

    const orderItems = cart.items.map(item => ({
      itemId: item.itemId._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      subtotal: item.price * item.quantity
    }));

    const newOrder = new Order({
      customerId: customerId || null,
      customerInfo,
      shippingAddress,
      billingAddress,
      items: orderItems,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      paymentMethod,
      notes,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending'
    });

    await newOrder.save();

    for (const cartItem of cart.items) {
      await Item.findByIdAndUpdate(
        cartItem.itemId,
        { $inc: { stockQuantity: -cartItem.quantity } }
      );
    }

    if (customerId) {
      await Cart.findOneAndDelete({ customerId });
    } else if (sessionId) {
      await Cart.findOneAndDelete({ sessionId });
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});


// **********************************************


// ================= ORDER MANAGEMENT ROUTES =================


// Get all orders (Admin)
app.get('/api/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filter)
      .populate('customerId', 'firstname lastname email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page * limit < totalOrders,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get single order
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'firstname lastname email phone profileImageUrl')
      .populate('items.itemId', 'name description images');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update order status (Admin)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, adminNotes, updatedBy = 'Admin' } = req.body;

    const validStatuses = ['Order Placed', 'Order Confirmed', 'Order Dispatched', 'Order Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = status;
    order.updatedBy = updatedBy;
    if (adminNotes) order.adminNotes = adminNotes;

    if (status === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.items) {
        await Item.findByIdAndUpdate(
          item.itemId,
          { $inc: { stockQuantity: item.quantity } }
        );
      }
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get customer's orders
app.get('/api/customers/:customerId/orders', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customerId };
    if (status) filter.orderStatus = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get order statistics (Admin Dashboard)
app.get('/api/orders/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          todayOrders: [
            { $match: { createdAt: { $gte: today } } },
            { $count: "count" }
          ],
          statusCounts: [
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
          ],
          totalRevenue: [
            { $match: { orderStatus: { $ne: "Cancelled" } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ],
          monthlyRevenue: [
            {
              $match: {
                createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
                orderStatus: { $ne: "Cancelled" }
              }
            },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ]
        }
      }
    ]);

    const result = {
      totalOrders: stats[0].totalOrders[0]?.count || 0,
      todayOrders: stats[0].todayOrders[0]?.count || 0,
      statusCounts: stats[0].statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalRevenue: stats[0].totalRevenue[0]?.total || 0,
      monthlyRevenue: stats[0].monthlyRevenue[0]?.total || 0
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Add tracking number to order
app.put('/api/orders/:id/tracking', async (req, res) => {
  try {
    const { trackingNumber } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { trackingNumber },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Tracking number added successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});