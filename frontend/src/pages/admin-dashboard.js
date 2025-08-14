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

  async updateItem(id, itemData, files = []) {
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

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Item Form Component
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
        reader.onload = (e) => resolve({ name: file.name, url: e.target.result });
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
    onSubmit(cleanedData, selectedFiles);
  };

  return (
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
            Upload images (JPEG, PNG, GIF, WebP - Max 5MB each)
          </div>
        </div>

        {filePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={12} />
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{preview.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
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
  );
};

// Item Card Component
const ItemCard = ({ item, onEdit, onDelete, onView }) => {
  const displayPrice = item.salePrice || item.regularPrice;
  const hasDiscount = item.salePrice && item.salePrice < item.regularPrice;
  const hasImages = item.images && item.images.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {hasImages && (
        <div className="mb-4">
          <img
            src={item.images[0].url}
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
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

// Item Details Modal
const ItemDetailsModal = ({ item, isOpen, onClose }) => {
  if (!item) return null;

  const hasImages = item.images && item.images.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name}>
      <div className="space-y-4">
        {hasImages && (
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Images</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`${item.name} - ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.style.display = 'block';
                    }}
                  />
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-white bg-opacity-75 p-1 rounded"
                  >
                    <ImageIcon size={16} />
                  </a>
                </div>
              ))}
            </div>
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

export default function AdminDashboard() {
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

  const handleUpdateItem = async (itemData, files) => {
    try {
      setIsSubmitting(true);
      const updatedItem = await api.updateItem(editingItem._id, itemData, files);
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
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add New Item
            </button>
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

        {/* Filters */}
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

        {/* Items Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onView={handleViewItem}
              />
            ))}
          </div>
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