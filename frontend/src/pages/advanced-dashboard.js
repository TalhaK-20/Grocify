import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  DollarSign,
  Warehouse,
  Search,
  Filter,
  Eye,
  Upload,
  Image as ImageIcon,
  ShoppingCart,
  Grid3X3,
  List,
  Circle,
  Layers,
  Zap,
  LayoutGrid,
  Check,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const api = {
  async getItems() {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) throw new Error("Failed to fetch items");
    return response.json();
  },

  async createItem(itemData, files = []) {
    const formData = new FormData();

    // Append files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Append other data
    Object.keys(itemData).forEach((key) => {
      if (key !== 'images') {
        if (typeof itemData[key] === 'object') {
          formData.append(key, JSON.stringify(itemData[key]));
        } else {
          formData.append(key, itemData[key]);
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/items`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to create item");
    return response.json();
  },

  async updateItem(id, itemData, files = [], imagesToDelete = [], coverImageId = null) {
    const formData = new FormData();

    // Append files
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Append images to delete
    if (imagesToDelete.length > 0) {
      formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
    }

    // Append cover image ID
    if (coverImageId) {
      formData.append('coverImageId', coverImageId);
    }

    // Append other data
    Object.keys(itemData).forEach((key) => {
      if (key !== 'images') {
        if (typeof itemData[key] === 'object') {
          formData.append(key, JSON.stringify(itemData[key]));
        } else {
          formData.append(key, itemData[key]);
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to update item");
    return response.json();
  },

  async deleteItem(id) {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete item");
    return response.json();
  },
};

// Toast Notification Component
const Toast = ({ message, type, onClose }) => (
  <div
    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === "success" ? "bg-green-500" : "bg-red-500"
      } text-white`}
  >
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75">
        <X size={16} />
      </button>
    </div>
  </div>
);

// Modal Component with scrollable content
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

// Image Carousel Component
const ImageCarousel = ({ images, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img
        src={images[0].url}
        alt="Product image"
        className={`w-full object-cover rounded-lg ${className}`}
      />
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      <img
        src={images[currentIndex].url}
        alt={`Product image ${currentIndex + 1}`}
        className={`w-full object-cover rounded-lg ${className}`}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
              />
            ))}
          </div>

          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

// View Selector Component
const ViewSelector = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'cards', name: 'Cards', icon: Grid3X3, color: 'blue' },
    { id: 'table', name: 'Table', icon: List, color: 'green' },
    { id: 'bubbles', name: 'Bubbles', icon: Circle, color: 'purple' },
    { id: 'masonry', name: 'Masonry', icon: Layers, color: 'orange' },
    { id: 'timeline', name: 'Timeline', icon: Zap, color: 'red' },
    { id: 'compact', name: 'Compact', icon: LayoutGrid, color: 'indigo' },
  ];

  return (
    <div className="flex items-center bg-white rounded-xl shadow-lg p-2 border-2 border-gray-100 hover:border-gray-200 transition-all">
      <span className="text-sm font-medium text-gray-600 px-3">View:</span>
      <div className="flex gap-1">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${isActive
                ? `bg-${view.color}-100 text-${view.color}-700 shadow-md transform scale-105`
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{view.name}</span>
              {isActive && (
                <div className={`absolute inset-0 bg-${view.color}-200 rounded-lg opacity-20 animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Cart Component
const CartModal = ({ isOpen, onClose, cartItems, onRemoveFromCart, onClearCart }) => {
  const totalPrice = cartItems.reduce((sum, item) =>
    sum + (item.salePrice || item.regularPrice), 0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shopping Cart">
      <div className="space-y-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.images && item.images.length > 0 && (
                      <img
                        src={item.images.find(img => img.isCover)?.url || item.images[0].url}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-green-600 font-semibold">
                        ${item.salePrice || item.regularPrice}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveFromCart(item._id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-green-600">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClearCart}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Clear Cart
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// Item Form Component with enhanced image handling
const ItemForm = ({ item, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    regularPrice: "",
    salePrice: "",
    stockStatus: "In Stock",
    stockQuantity: "",
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [coverImageId, setCoverImageId] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        regularPrice: item.regularPrice || "",
        salePrice: item.salePrice || "",
        stockStatus: item.stockStatus || "In Stock",
        stockQuantity: item.stockQuantity || "",
        weight: item.weight || "",
        dimensions: {
          length: item.dimensions?.length || "",
          width: item.dimensions?.width || "",
          height: item.dimensions?.height || "",
        },
      });

      if (item.images) {
        setExistingImages(item.images);
        const coverImg = item.images.find(img => img.isCover);
        if (coverImg) {
          setCoverImageId(coverImg.id);
        }
      }
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("dimensions.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Create previews
    const previews = files.map(file => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => resolve({
          name: file.name,
          url: e.target.result,
          isNew: true
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setFilePreviews);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const removeExistingImage = (imageId) => {
    setImagesToDelete(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));

    // If this was the cover image, reset cover
    if (coverImageId === imageId) {
      setCoverImageId(null);
    }
  };

  const setCoverImage = (imageId, isExisting = true) => {
    setCoverImageId(imageId);

    if (isExisting) {
      setExistingImages(prev => prev.map(img => ({
        ...img,
        isCover: img.id === imageId
      })));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      regularPrice: Number(formData.regularPrice),
      salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
      stockQuantity: Number(formData.stockQuantity),
      dimensions: {
        length: formData.dimensions.length
          ? Number(formData.dimensions.length)
          : undefined,
        width: formData.dimensions.width
          ? Number(formData.dimensions.width)
          : undefined,
        height: formData.dimensions.height
          ? Number(formData.dimensions.height)
          : undefined,
      },
    };

    if (item) {
      onSubmit(cleanedData, selectedFiles, imagesToDelete, coverImageId);
    } else {
      onSubmit(cleanedData, selectedFiles);
    }
  };

  const allImages = [...existingImages, ...filePreviews];

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regular Price *
            </label>
            <input
              type="number"
              name="regularPrice"
              value={formData.regularPrice}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Price
            </label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Status
            </label>
            <select
              name="stockStatus"
              value={formData.stockStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight
          </label>
          <input
            type="text"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 1.5kg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions (cm)
          </label>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              name="dimensions.length"
              value={formData.dimensions.length}
              onChange={handleChange}
              placeholder="Length"
              min="0"
              step="0.1"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="dimensions.width"
              value={formData.dimensions.width}
              onChange={handleChange}
              placeholder="Width"
              min="0"
              step="0.1"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="dimensions.height"
              value={formData.dimensions.height}
              onChange={handleChange}
              placeholder="Height"
              min="0"
              step="0.1"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images
          </label>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Current Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt="Existing"
                      className={`w-full h-24 object-cover rounded-lg border-2 ${image.isCover || coverImageId === image.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage(image.id, true)}
                      className={`absolute -top-2 -left-2 p-1 rounded-full transition-all ${image.isCover || coverImageId === image.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-500 text-white opacity-0 group-hover:opacity-100'
                        }`}
                      title={image.isCover || coverImageId === image.id ? 'Cover Image' : 'Set as Cover'}
                    >
                      {image.isCover || coverImageId === image.id ? (
                        <Star size={12} fill="currentColor" />
                      ) : (
                        <StarOff size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
            <div className="mt-2 text-sm text-gray-500">
              <Upload className="inline w-4 h-4 mr-1" />
              Upload new images (JPEG, PNG, GIF, WebP - Max 5MB each)
            </div>
          </div>

          {/* New File Previews */}
          {filePreviews.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">New Images to Upload</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute -top-2 -left-2 bg-green-500 text-white rounded-full p-1">
                      <Plus size={12} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{preview.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cover Image Info */}
          {allImages.length > 1 && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Star size={14} className="inline mr-1" fill="currentColor" />
                {coverImageId
                  ? 'Click the star icon to change the cover image'
                  : 'No cover image selected. First image will be used as cover.'
                }
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t pt-4 flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {isLoading ? "Saving..." : "Save Item"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Different View Components (updated to use cover images)
const CardView = ({ items, selectedItems, onToggleSelect, onEdit, onDelete, onView }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {items.map((item) => (
      <ItemCard
        key={item._id}
        item={item}
        isSelected={selectedItems.includes(item._id)}
        onToggleSelect={onToggleSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    ))}
  </div>
);

const TableView = ({ items, selectedItems, onToggleSelect, onEdit, onDelete, onView }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <input
              type="checkbox"
              checked={selectedItems.length === items.length && items.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  items.forEach(item => onToggleSelect(item._id, true));
                } else {
                  items.forEach(item => onToggleSelect(item._id, false));
                }
              }}
              className="rounded"
            />
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {items.map((item) => (
          <tr key={item._id} className={`hover:bg-gray-50 ${selectedItems.includes(item._id) ? 'bg-blue-50' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedItems.includes(item._id)}
                onChange={(e) => onToggleSelect(item._id, e.target.checked)}
                className="rounded"
              />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                {item.images && item.images.length > 0 && (
                  <img
                    className="h-10 w-10 rounded-full mr-4"
                    src={item.images.find(img => img.isCover)?.url || item.images[0].url}
                    alt={item.name}
                  />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  {item.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">
                ${item.salePrice || item.regularPrice}
                {item.salePrice && (
                  <span className="text-xs text-gray-500 line-through ml-1">${item.regularPrice}</span>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stockQuantity}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {item.stockStatus}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex gap-2">
                <button onClick={() => onView(item)} className="text-indigo-600 hover:text-indigo-900">
                  <Eye size={16} />
                </button>
                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(item._id)} className="text-red-600 hover:text-red-900">
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BubbleView = ({ items, selectedItems, onToggleSelect }) => (
  <div className="flex flex-wrap justify-center gap-4 p-8">
    {items.map((item, index) => {
      const price = item.salePrice || item.regularPrice;
      const size = Math.min(Math.max(price * 2, 80), 200);
      const isSelected = selectedItems.includes(item._id);

      return (
        <div
          key={item._id}
          onClick={() => onToggleSelect(item._id, !isSelected)}
          className={`relative flex items-center justify-center rounded-full cursor-pointer transform transition-all duration-300 hover:scale-110 ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-75' : ''
            }`}
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, 
              ${isSelected ? '#3B82F6' : '#6B73FF'} 0%, 
              ${isSelected ? '#1D4ED8' : '#9F7AEA'} 100%)`,
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className="text-center text-white p-2">
            <div className="font-bold text-sm mb-1 leading-tight">{item.name}</div>
            <div className="text-xs opacity-90">${price}</div>
            <div className="text-xs opacity-75 mt-1">{item.stockQuantity} units</div>
          </div>
          {isSelected && (
            <div className="absolute top-2 right-2 bg-white rounded-full p-1">
              <Check size={12} className="text-blue-600" />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const MasonryView = ({ items, selectedItems, onToggleSelect, onEdit, onDelete, onView }) => {
  const columns = [[], [], []];

  items.forEach((item, index) => {
    columns[index % 3].push(item);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="space-y-4">
          {column.map((item) => (
            <div
              key={item._id}
              className={`bg-white rounded-lg shadow-md p-4 transition-all duration-200 hover:shadow-lg ${selectedItems.includes(item._id) ? 'ring-2 ring-blue-400' : ''
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item._id)}
                  onChange={(e) => onToggleSelect(item._id, e.target.checked)}
                  className="rounded"
                />
                <div className="flex gap-1">
                  <button onClick={() => onView(item)} className="p-1 text-gray-500 hover:text-blue-600">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => onEdit(item)} className="p-1 text-gray-500 hover:text-blue-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(item._id)} className="p-1 text-gray-500 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {item.images && item.images.length > 0 && (
                <ImageCarousel
                  images={item.images}
                  className="h-32 mb-3"
                />
              )}

              <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
              {item.description && (
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
              )}

              <div className="flex justify-between items-center">
                <span className="font-bold text-green-600">${item.salePrice || item.regularPrice}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${item.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {item.stockStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const TimelineView = ({ items, selectedItems, onToggleSelect, onEdit, onDelete, onView }) => (
  <div className="space-y-6">
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-purple-400"></div>
      {items.map((item, index) => (
        <div key={item._id} className="relative flex items-center">
          <div className="absolute left-6 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-md z-10"></div>
          <div className={`ml-16 bg-white rounded-lg shadow-md p-6 w-full transition-all duration-200 hover:shadow-lg ${selectedItems.includes(item._id) ? 'ring-2 ring-blue-400 bg-blue-50' : ''
            }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item._id)}
                  onChange={(e) => onToggleSelect(item._id, e.target.checked)}
                  className="rounded"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    Added {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onView(item)} className="p-2 text-gray-500 hover:text-blue-600">
                  <Eye size={16} />
                </button>
                <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-600">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(item._id)} className="p-2 text-gray-500 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              {item.images && item.images.length > 0 && (
                <div className="w-24 h-24 flex-shrink-0">
                  <ImageCarousel
                    images={item.images}
                    className="h-24"
                  />
                </div>
              )}
              <div className="flex-1">
                {item.description && (
                  <p className="text-gray-600 mb-3">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-green-600">
                      ${item.salePrice || item.regularPrice}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {item.stockStatus}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{item.stockQuantity} units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CompactView = ({ items, selectedItems, onToggleSelect, onEdit, onDelete, onView }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="grid gap-2 p-4">
      {items.map((item) => (
        <div
          key={item._id}
          className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${selectedItems.includes(item._id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}
        >
          <input
            type="checkbox"
            checked={selectedItems.includes(item._id)}
            onChange={(e) => onToggleSelect(item._id, e.target.checked)}
            className="rounded"
          />

          {item.images && item.images.length > 0 && (
            <img
              src={item.images.find(img => img.isCover)?.url || item.images[0].url}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-md"
            />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
            <p className="text-sm text-gray-500 truncate">{item.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-green-600">
              ${item.salePrice || item.regularPrice}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {item.stockStatus}
            </span>
            <span className="text-sm text-gray-500 w-16 text-center">{item.stockQuantity} units</span>
          </div>

          <div className="flex gap-1">
            <button onClick={() => onView(item)} className="p-2 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-100">
              <Eye size={16} />
            </button>
            <button onClick={() => onEdit(item)} className="p-2 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-100">
              <Edit2 size={16} />
            </button>
            <button onClick={() => onDelete(item._id)} className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-100">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Item Card Component (updated with carousel and cover image)
const ItemCard = ({ item, isSelected, onToggleSelect, onEdit, onDelete, onView }) => {
  const displayPrice = item.salePrice || item.regularPrice;
  const hasDiscount = item.salePrice && item.salePrice < item.regularPrice;
  const hasImages = item.images && item.images.length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}>
      <div className="flex justify-between items-start mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(item._id, e.target.checked)}
          className="rounded"
        />
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => onView(item)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {hasImages && (
        <div className="mb-4">
          <ImageCarousel
            images={item.images}
            className="h-48"
          />
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <DollarSign size={16} className="text-green-600" />
            <span className="font-semibold text-gray-800">${displayPrice}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through ml-1">
                ${item.regularPrice}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              Sale
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Warehouse size={16} className="text-gray-500" />
          <span
            className={`text-sm font-medium ${item.stockStatus === "In Stock"
              ? "text-green-600"
              : "text-red-600"
              }`}
          >
            {item.stockStatus}
          </span>
          {item.stockQuantity > 0 && (
            <span className="text-sm text-gray-500 ml-1">
              ({item.stockQuantity})
            </span>
          )}
        </div>
        {item.weight && (
          <span className="text-sm text-gray-500">{item.weight}</span>
        )}
      </div>
    </div>
  );
};

// Item Details Modal with enhanced image viewing
const ItemDetailsModal = ({ item, isOpen, onClose }) => {
  if (!item) return null;

  const hasImages = item.images && item.images.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name}>
      <div className="space-y-4">
        {hasImages && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Images</h4>
            {item.images.length === 1 ? (
              <div className="relative">
                <img
                  src={item.images[0].url}
                  alt={item.name}
                  className="w-full h-64 object-cover rounded-lg border"
                />
                {item.images[0].isCover && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    Cover
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <ImageCarousel
                    images={item.images}
                    className="h-64"
                  />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {item.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={`${item.name} - ${index + 1}`}
                        className={`w-full h-20 object-cover rounded border-2 ${image.isCover ? 'border-blue-500' : 'border-gray-200'
                          }`}
                      />
                      {image.isCover && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white rounded p-1">
                          <Star size={8} fill="currentColor" />
                        </div>
                      )}
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-1 right-1 bg-white bg-opacity-75 p-1 rounded hover:bg-opacity-100"
                      >
                        <ImageIcon size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {item.description && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
            <p className="text-gray-600">{item.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Regular Price</h4>
            <p className="text-gray-600">${item.regularPrice}</p>
          </div>
          {item.salePrice && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Sale Price</h4>
              <p className="text-green-600 font-semibold">${item.salePrice}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Stock Status</h4>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${item.stockStatus === "In Stock"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {item.stockStatus}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Stock Quantity</h4>
            <p className="text-gray-600">{item.stockQuantity}</p>
          </div>
        </div>

        {item.weight && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-1">Weight</h4>
            <p className="text-gray-600">{item.weight}</p>
          </div>
        )}

        {(item.dimensions?.length ||
          item.dimensions?.width ||
          item.dimensions?.height) && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">
                Dimensions (L × W × H)
              </h4>
              <p className="text-gray-600">
                {item.dimensions.length || "-"} × {item.dimensions.width || "-"} ×{" "}
                {item.dimensions.height || "-"} cm
              </p>
            </div>
          )}

        <div>
          <h4 className="font-semibold text-gray-700 mb-1">Created</h4>
          <p className="text-gray-600">
            {new Date(item.timestamp).toLocaleDateString()} at{" "}
            {new Date(item.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default function AdvancedDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState('cards');
  const [selectedItems, setSelectedItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError("Failed to load items. Please check your server connection.");
      console.error("Error loading items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreateItem = async (itemData, files) => {
    try {
      setIsSubmitting(true);
      const newItem = await api.createItem(itemData, files);
      setItems([...items, newItem]);
      setShowForm(false);
      showToast("Item created successfully!");
    } catch (err) {
      showToast("Failed to create item", "error");
      console.error("Error creating item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemData, files, imagesToDelete, coverImageId) => {
    try {
      setIsSubmitting(true);
      const updatedItem = await api.updateItem(editingItem._id, itemData, files, imagesToDelete, coverImageId);
      setItems(
        items.map((item) => (item._id === editingItem._id ? updatedItem : item))
      );
      setEditingItem(null);
      setShowForm(false);
      showToast("Item updated successfully!");
    } catch (err) {
      showToast("Failed to update item", "error");
      console.error("Error updating item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await api.deleteItem(id);
      setItems(items.filter((item) => item._id !== id));
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setCartItems(cartItems.filter(item => item._id !== id));
      showToast("Item deleted successfully!");
    } catch (err) {
      showToast("Failed to delete item", "error");
      console.error("Error deleting item:", err);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleViewItem = (item) => {
    setViewingItem(item);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleToggleSelect = (itemId, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleAddToCart = () => {
    const itemsToAdd = items.filter(item => selectedItems.includes(item._id));
    const newCartItems = [...cartItems];

    itemsToAdd.forEach(item => {
      if (!newCartItems.find(cartItem => cartItem._id === item._id)) {
        newCartItems.push(item);
      }
    });

    setCartItems(newCartItems);
    setSelectedItems([]);
    showToast(`Added ${itemsToAdd.length} item(s) to cart!`);
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item._id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast("Cart cleared!");
  };

  // Filter items based on search and status
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" || item.stockStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalItems = items.length;
  const inStockItems = items.filter(
    (item) => item.stockStatus === "In Stock"
  ).length;
  const outOfStockItems = items.filter(
    (item) => item.stockStatus === "Out of Stock"
  ).length;
  const totalValue = items.reduce(
    (sum, item) =>
      sum + (item.salePrice || item.regularPrice) * item.stockQuantity,
    0
  );

  const renderCurrentView = () => {
    const viewProps = {
      items: filteredItems,
      selectedItems,
      onToggleSelect: handleToggleSelect,
      onEdit: handleEditItem,
      onDelete: handleDeleteItem,
      onView: handleViewItem,
    };

    switch (currentView) {
      case 'table':
        return <TableView {...viewProps} />;
      case 'bubbles':
        return <BubbleView {...viewProps} />;
      case 'masonry':
        return <MasonryView {...viewProps} />;
      case 'timeline':
        return <TimelineView {...viewProps} />;
      case 'compact':
        return <CompactView {...viewProps} />;
      default:
        return <CardView {...viewProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory Management
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <ShoppingCart size={20} />
                Cart
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {cartItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add New Item
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Warehouse className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Stock</p>
                <p className="text-2xl font-semibold text-green-600">
                  {inStockItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Warehouse className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Out of Stock
                </p>
                <p className="text-2xl font-semibold text-red-600">
                  {outOfStockItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-semibold text-purple-600">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Selector and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <ViewSelector currentView={currentView} onViewChange={setCurrentView} />

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg p-3 border-2 border-blue-100">
              <span className="text-sm font-medium text-gray-700">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors animate-bounce"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items Display */}
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={loadItems}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No items found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding a new item"}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add New Item
              </button>
            </div>
          </div>
        ) : (
          renderCurrentView()
        )}
      </div>

      {/* Item Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingItem ? "Edit Item" : "Add New Item"}
      >
        <ItemForm
          item={editingItem}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          onCancel={closeForm}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Item Details Modal */}
      <ItemDetailsModal
        item={viewingItem}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}