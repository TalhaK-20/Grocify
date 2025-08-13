import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, MapPin, CreditCard, Truck } from 'lucide-react';

const CheckoutPage = () => {
    const [checkoutData, setCheckoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form states
    const [customerInfo, setCustomerInfo] = useState({
        email: '',
        firstname: '',
        lastname: '',
        phone: ''
    });

    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan'
    });

    const [billingAddress, setBillingAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan',
        sameAsShipping: true
    });

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [notes, setNotes] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    // Mock customer ID - replace with your auth system
    const customerId = localStorage.getItem('customerId') || null;
    const sessionId = localStorage.getItem('sessionId') || 'session_' + Date.now();

    useEffect(() => {
        fetchCheckoutInfo();
    }, []);

    const fetchCheckoutInfo = async () => {
        try {
            const response = await fetch('/api/checkout/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId, sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                setCheckoutData(data);

                // Pre-fill customer data if available
                if (data.customer) {
                    setCustomerInfo({
                        email: data.customer.email,
                        firstname: data.customer.firstname,
                        lastname: data.customer.lastname,
                        phone: data.customer.phone
                    });

                    // Parse address if available
                    if (data.customer.address) {
                        const addressParts = data.customer.address.split(',').map(part => part.trim());
                        setShippingAddress({
                            street: addressParts[0] || '',
                            city: addressParts[1] || '',
                            state: addressParts[2] || '',
                            zipCode: addressParts[3] || '',
                            country: 'Pakistan'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching checkout info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessOrder = async () => {
        setProcessing(true);

        try {
            const orderData = {
                customerId,
                sessionId,
                customerInfo,
                shippingAddress,
                billingAddress: billingAddress.sameAsShipping ? shippingAddress : billingAddress,
                paymentMethod,
                notes
            };

            const response = await fetch('/api/checkout/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok) {
                setOrderSuccess(true);
                setOrderDetails(result.order);
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Order processing error:', error);
            alert('Failed to process order. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading checkout...</p>
                </div>
            </div>
        );
    }

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
                        <p className="text-gray-600 mb-6">
                            Your order #{orderDetails?.orderNumber} has been placed successfully.
                            You will receive a confirmation email shortly.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Order Total:</span>
                                <span className="font-bold text-lg">Rs. {orderDetails?.totalAmount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Payment Method:</span>
                                <span className="text-sm">{orderDetails?.paymentMethod}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!checkoutData || !checkoutData.cart || checkoutData.cart.items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-4">Add some items to your cart before checkout</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Checkout Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Customer Information */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-4">
                                <User className="w-5 h-5 text-blue-600 mr-2" />
                                <h2 className="text-xl font-semibold">Customer Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={customerInfo.firstname}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, firstname: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={customerInfo.lastname}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, lastname: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={customerInfo.email}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-4">
                                <Truck className="w-5 h-5 text-blue-600 mr-2" />
                                <h2 className="text-xl font-semibold">Shipping Address</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                                    <input
                                        type="text"
                                        value={shippingAddress.street}
                                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.state}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={shippingAddress.zipCode}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-4">
                                <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                                <h2 className="text-xl font-semibold">Payment Method</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        id="cod"
                                        type="radio"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="cod" className="ml-2 text-sm font-medium text-gray-900">
                                        Cash on Delivery (COD)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="online"
                                        type="radio"
                                        value="Online"
                                        checked={paymentMethod === 'Online'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="online" className="ml-2 text-sm font-medium text-gray-900">
                                        Online Payment / Smart Wallet
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Order Notes (Optional)</h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special instructions for your order..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                            {/* Cart Items */}
                            <div className="space-y-3 mb-4">
                                {checkoutData.cart.items.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        {item.imageUrl && (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-medium text-sm">{item.name}</h3>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>Rs. {checkoutData.orderSummary.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span>
                                        {checkoutData.orderSummary.shippingCost === 0 ?
                                            'Free' :
                                            `Rs. ${checkoutData.orderSummary.shippingCost.toFixed(2)}`
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>Rs. {checkoutData.orderSummary.tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span>Rs. {checkoutData.orderSummary.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleProcessOrder}
                                disabled={processing}
                                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                            >
                                {processing ? 'Processing...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
