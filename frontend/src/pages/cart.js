import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

const CartComponent = () => {
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Mock customer ID - replace with your auth system
  const customerId = localStorage.getItem('customerId') || null;
  const sessionId = localStorage.getItem('sessionId') || 'session_' + Date.now();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const type = customerId ? 'customer' : 'session';
      const identifier = customerId || sessionId;

      const response = await fetch(`/api/cart/${identifier}?type=${type}`);
      const data = await response.json();

      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sessionId,
          itemId,
          quantity: newQuantity
        })
      });

      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdating(true);
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sessionId,
          itemId
        })
      });

      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      setUpdating(true);
      const type = customerId ? 'customer' : 'session';
      const identifier = customerId || sessionId;

      const response = await fetch(`/api/cart/clear/${identifier}?type=${type}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCart({ items: [], totalItems: 0, totalAmount: 0 });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Navigate to checkout - replace with your routing logic
    window.location.href = '/checkout';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center mb-8">
          <ShoppingCart className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="ml-4 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {cart.totalItems} items
          </span>
        </div>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Cart Items</h2>
                    <button
                      onClick={clearCart}
                      disabled={updating}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 inline mr-1" />
                      Clear Cart
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {cart.items.map((item, index) => (
                    <div key={index} className="p-6 flex items-center space-x-4">
                      {/* Product Image */}
                      {item.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">Rs. {item.price.toFixed(2)} each</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          disabled={updating}
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="font-medium text-gray-900 w-8 text-center">{item.quantity}</span>

                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          disabled={updating}
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="flex-shrink-0">
                        <p className="text-lg font-medium text-gray-900">
                          Rs. {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.itemId)}
                        disabled={updating}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({cart.totalItems} items):</span>
                    <span className="font-medium">Rs. {cart.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">
                      {cart.totalAmount > 2000 ? 'Free' : 'Rs. 150.00'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (5%):</span>
                    <span className="font-medium">Rs. {(cart.totalAmount * 0.05).toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        Rs. {(
                          cart.totalAmount +
                          (cart.totalAmount > 2000 ? 0 : 150) +
                          (cart.totalAmount * 0.05)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {cart.totalAmount > 2000 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800 font-medium">
                      🎉 Congratulations! You qualify for free shipping
                    </p>
                  </div>
                )}

                <button
                  onClick={proceedToCheckout}
                  disabled={updating || cart.items.length === 0}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full mt-3 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartComponent;