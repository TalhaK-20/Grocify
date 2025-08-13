import React, { useState, useEffect } from 'react';
import { Package, Filter, Eye, Edit, Search, Calendar, DollarSign, ShoppingBag, Clock } from 'lucide-react';

const AdminOrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [stats, setStats] = useState({});

  const orderStatuses = [
    'Order Placed',
    'Order Confirmed',
    'Order Dispatched',
    'Order Delivered',
    'Cancelled'
  ];

  const statusColors = {
    'Order Placed': 'bg-yellow-100 text-yellow-800',
    'Order Confirmed': 'bg-blue-100 text-blue-800',
    'Order Dispatched': 'bg-purple-100 text-purple-800',
    'Order Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [selectedStatus, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(selectedStatus && { status: selectedStatus })
      });

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orders/stats/summary');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: 'Admin User' // Replace with actual admin user
        })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders list
        if (selectedOrder && selectedOrder._id === orderId) {
          fetchOrderDetails(orderId); // Refresh order details if viewing
        }
        alert('Order status updated successfully');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      setSelectedOrder(data);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${order.customerInfo.firstname} ${order.customerInfo.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header & Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Management</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders || 0}</p>
                  <p className="text-gray-600">Total Orders</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.todayOrders || 0}</p>
                  <p className="text-gray-600">Today's Orders</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">Rs. {(stats.monthlyRevenue || 0).toFixed(0)}</p>
                  <p className="text-gray-600">This Month</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.statusCounts?.['Order Placed'] || 0}</p>
                  <p className="text-gray-600">Pending Orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Orders</option>
                  {orderStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <Search className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by order number, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.items.length} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerInfo.firstname} {order.customerInfo.lastname}
                        </div>
                        <div className="text-sm text-gray-500">{order.customerInfo.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusColors[order.orderStatus]} focus:ring-2 focus:ring-blue-500`}
                      >
                        {orderStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Rs. {order.totalAmount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.paymentMethod} - {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => fetchOrderDetails(order._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                    {' '}({pagination.totalOrders} total orders)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Order Details - {selectedOrder.orderNumber}</h3>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customerInfo.firstname} {selectedOrder.customerInfo.lastname}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.customerInfo.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedOrder.customerInfo.phone}</p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Shipping Address</h4>
                    <div className="text-sm">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Order Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              <div className="flex items-center">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded mr-3" />
                                )}
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">Rs. {item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm font-medium">Rs. {item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rs. {selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>Rs. {selectedOrder.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>Rs. {selectedOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>Rs. {selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Order Status</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Current Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${statusColors[selectedOrder.orderStatus]}`}>
                          {selectedOrder.orderStatus}
                        </span>
                      </p>
                      <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                      <p><span className="font-medium">Payment Status:</span> {selectedOrder.paymentStatus}</p>
                      <p><span className="font-medium">Order Date:</span> {formatDate(selectedOrder.createdAt)}</p>
                      {selectedOrder.trackingNumber && (
                        <p><span className="font-medium">Tracking:</span> {selectedOrder.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status History */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Status History</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        {selectedOrder.statusHistory.map((history, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColors[history.status]}`}>
                              {history.status}
                            </span>
                            <span className="text-gray-600">{formatDate(history.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(selectedOrder.notes || selectedOrder.adminNotes) && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Notes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.notes && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2">Customer Notes:</h5>
                          <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                        </div>
                      )}
                      {selectedOrder.adminNotes && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2">Admin Notes:</h5>
                          <p className="text-sm text-gray-700">{selectedOrder.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 justify-end">
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {orderStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersManager;
