import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 8;

function useToasts() {
  const [toasts, setToasts] = useState([]);
  function push(message, type = "info", ttl = 4000) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }
  return { toasts, push, setToasts };
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sameAsShipping, setSameAsShipping] = useState(false);

  const [removeImage, setRemoveImage] = useState(false);

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: "firstname", dir: "asc" });
  const [page, setPage] = useState(1);

  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showView, setShowView] = useState(false);
  const [viewing, setViewing] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const { toasts, push } = useToasts();

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/customers`);
      setCustomers(res.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to load customers");
      push("Failed to load customers", "error");
    }
  }

  // Filtering / sorting / paging derived state
  const filtered = customers.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (c.firstname || "").toLowerCase().includes(q) ||
      (c.lastname || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.address || "").toLowerCase().includes(q)
    );
  });

  const sorted = filtered.sort((a, b) => {
    let ka, kb;

    if (sortBy.key === "name") {
      ka = `${a.firstname || ""} ${a.lastname || ""}`.toLowerCase();
      kb = `${b.firstname || ""} ${b.lastname || ""}`.toLowerCase();
    } else {
      ka = (a[sortBy.key] || "").toString().toLowerCase();
      kb = (b[sortBy.key] || "").toString().toLowerCase();
    }

    if (ka < kb) return sortBy.dir === "asc" ? -1 : 1;
    if (ka > kb) return sortBy.dir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  function changeSort(key) {
    setSortBy((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  // Add / Edit form state
  const initialForm = {
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    phone: "",
    address: "",
    billingAddress: "",
    profileImageFile: null, // File object (new selection)
    profilePreview: null    // DataURL for preview OR existing URL when editing
  };
  const [form, setForm] = useState(initialForm);
  const fileInputRef = useRef();

  function openAdd() {
    setEditing(null);
    setForm(initialForm);
    setUploadProgress(0);
    setShowAddEdit(true);
    setShowPassword(false);
    setSameAsShipping(false);
    setRemoveImage(false); // reset
  }

  function openEdit(customer) {
    setEditing(customer);
    setForm({
      email: customer.email || "",
      password: "", // Don't pre-fill password
      firstname: customer.firstname || "",
      lastname: customer.lastname || "",
      phone: customer.phone || "",
      address: customer.address || "",
      billingAddress: customer.billingAddress || "",
      profileImageFile: null,
      // show the existing URL in preview
      profilePreview: customer.profileImageUrl || null,
    });
    setUploadProgress(0);
    setShowAddEdit(true);
    setShowPassword(false);
    setSameAsShipping(false);
    setRemoveImage(false); // reset
  }

  function openView(customer) {
    setViewing(customer);
    setShowView(true);
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleFile(f) {
    // simple validation
    if (!f.type.startsWith("image/")) {
      push("Only image uploads are allowed", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((s) => ({ ...s, profileImageFile: f, profilePreview: ev.target.result }));
      setRemoveImage(false); // user picked a file, so don't remove
    };
    reader.readAsDataURL(f);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function validateForm() {
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return "Provide a valid email";
    if (!editing && (!form.password || form.password.length < 6)) return "Password must be at least 6 characters";
    if (editing && form.password && form.password.length < 6) return "Password must be at least 6 characters";
    if (!form.firstname || form.firstname.trim().length < 2) return "First name must be at least 2 characters";
    if (!form.lastname || form.lastname.trim().length < 2) return "Last name must be at least 2 characters";
    if (!form.phone || form.phone.trim().length < 7) return "Provide a valid phone number";
    if (!form.address || form.address.trim().length < 5) return "Provide a valid address";
    if (!form.billingAddress || form.billingAddress.trim().length < 5) return "Provide a valid billing address";
    return null;
  }

  async function submitForm(e) {
    e && e.preventDefault();
    const errMsg = validateForm();
    if (errMsg) return push(errMsg, "error");

    const data = new FormData();
    data.append("email", form.email);
    if (form.password) data.append("password", form.password);
    data.append("firstname", form.firstname);
    data.append("lastname", form.lastname);
    data.append("phone", form.phone);
    data.append("address", form.address);
    data.append("billingAddress", form.billingAddress);

    // If user selected a new image, send it
    if (form.profileImageFile) {
      data.append("profileImage", form.profileImageFile);
    }

    // If user removed the image and didn't pick a new one, send remove flag
    if (removeImage && !form.profileImageFile) {
      data.append("removeImage", "true");
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      let res;

      if (editing) {
        res = await axios.put(`${API_BASE}/api/customers/${editing._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (p) =>
            setUploadProgress(Math.round((p.loaded / p.total) * 100)),
        });

        setCustomers((prev) =>
          prev.map((c) => (c._id === res.data._id ? res.data : c))
        );
        push("Customer updated", "success");
      } else {
        res = await axios.post(`${API_BASE}/api/customers`, data, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (p) =>
            setUploadProgress(Math.round((p.loaded / p.total) * 100)),
        });

        setCustomers((prev) => [res.data, ...prev]);
        push("Customer added", "success");
      }

      setShowAddEdit(false);
      setEditing(null);
      setForm(initialForm);
      setUploadProgress(0);
      setLoading(false);
      setRemoveImage(false); // reset
    } catch (err) {
      setLoading(false);
      push(
        (err.response && err.response.data && err.response.data.error) ||
        err.message ||
        "Save failed",
        "error"
      );
    }
  }

  async function removeCustomer(customer) {
    const customerName = `${customer.firstname || ""} ${customer.lastname || ""}`.trim() || "this customer";
    if (!window.confirm(`Delete ${customerName}? This is permanent.`)) return;
    const old = customers;
    setCustomers((c) => c.filter((x) => x._id !== customer._id));
    try {
      await axios.delete(`${API_BASE}/api/customers/${customer._id}`);
      push("Customer deleted", "success");
    } catch (err) {
      setCustomers(old);
      push("Delete failed", "error");
    }
  }

  // Small presentational helpers
  function Avatar({ src, firstname, lastname, size = 10 }) {
    const initials = `${(firstname || "").slice(0, 1)}${(lastname || "").slice(0, 1)}`.toUpperCase();
    return (
      <div className={`inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 ${"w-" + size + " h-" + size}`}>
        {src ? (
          <img src={src} alt={`${firstname} ${lastname}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-indigo-700">{initials || "?"}</span>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="border border-gray-200 rounded-md py-2 px-3 w-80 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-1 top-1 text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
            >
              + Add Customer
            </button>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy.key}
                onChange={(e) => changeSort(e.target.value)}
                className="border border-gray-200 rounded-md py-1 px-2"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="createdAt">Date Created</option>
              </select>
              <button
                onClick={() => setSortBy((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))}
                className="px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                {sortBy.dir === "asc" ? "▲" : "▼"}
              </button>
            </div>

            <div className="text-sm text-gray-500">Total: {customers.length}</div>
          </div>

          {/* Table / Grid */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="text-sm text-gray-500 border-b">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Addresses</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition">
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-3">
                          <Avatar src={c.profileImageUrl} firstname={c.firstname} lastname={c.lastname} size={12} />
                          <div>
                            <div className="font-medium text-gray-800">{`${c.firstname || ""} ${c.lastname || ""}`.trim()}</div>
                            <div className="text-xs text-gray-500">ID: {c._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-sm">{c.email}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          {c.phone}
                          {c.phone && (
                            <a
                              href={`https://wa.me/${formatWhatsAppNumber(c.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Chat with ${c.firstname || ""} ${c.lastname || ""} on WhatsApp`}
                              className="text-green-600 hover:text-green-800"
                              onClick={(e) => {
                                if (!formatWhatsAppNumber(c.phone)) e.preventDefault();
                              }}
                            >
                              <WhatsAppIcon className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 align-top text-sm">
                        <div><span className="text-gray-600">Shipping:</span> {c.address || "—"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="text-gray-600">Billing:</span> {c.billingAddress || "—"}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(c)}
                            className="px-3 py-1 border rounded-md text-sm text-indigo-600 hover:bg-indigo-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="px-3 py-1 border rounded-md text-sm text-amber-600 hover:bg-amber-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeCustomer(c)}
                            className="px-3 py-1 border rounded-md text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
              >
                Prev
              </button>
              <div className="text-sm px-2">Page {page} / {totalPages}</div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Add / Edit Modal */}
        {showAddEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddEdit(false)} />
            <form
              onSubmit={submitForm}
              className="relative bg-white rounded-2xl shadow-lg max-w-4xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowAddEdit(false);
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold">{editing ? "Edit Customer" : "Add Customer"}</h2>
                <div className="flex items-center gap-2">
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="text-sm text-gray-500">Uploading: {uploadProgress}%</div>
                  )}
                  <button type="button" onClick={() => setShowAddEdit(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleInputChange}
                    className={`w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${editing ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    required
                    readOnly={!!editing}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Password {editing ? "(leave blank to keep current)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required={!editing}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-sm text-gray-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First Name *</label>
                  <input
                    name="firstname"
                    value={form.firstname}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Name *</label>
                  <input
                    name="lastname"
                    value={form.lastname}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phone *</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                {/* Shipping Address */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Shipping Address *</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (sameAsShipping) {
                        setForm(s => ({ ...s, billingAddress: e.target.value }));
                      }
                    }}
                    className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                {/* Billing Address */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-gray-600">Billing Address *</label>
                    {form.address && (
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={sameAsShipping}
                          onChange={(e) => {
                            setSameAsShipping(e.target.checked);
                            if (e.target.checked) {
                              setForm(s => ({ ...s, billingAddress: form.address }));
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        Same as shipping address
                      </label>
                    )}
                  </div>
                  <input
                    name="billingAddress"
                    value={form.billingAddress}
                    onChange={handleInputChange}
                    disabled={sameAsShipping}
                    className={`w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${sameAsShipping ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    required
                  />
                </div>

                {/* Profile Image */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-2">Profile image</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-200 rounded-md p-4 flex items-center gap-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      {form.profilePreview ? (
                        <img src={form.profilePreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm text-gray-400">Drag image here</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-gray-600">PNG, JPG up to 5MB. Drag & drop or click to choose file.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          Choose file
                        </button>
                        {form.profilePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              // Clear file & preview and mark for removal
                              setForm((s) => ({ ...s, profilePreview: null, profileImageFile: null }));
                              setRemoveImage(true);
                            }}
                            className="px-3 py-1 border border-red-200 rounded-md text-sm text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {form.profileImageFile && (
                        <div className="mt-2 text-xs text-gray-500">
                          Selected: {form.profileImageFile.name} ({Math.round(form.profileImageFile.size / 1024)} KB)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddEdit(false); setEditing(null); }}
                  className="px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? "Saving..." : (editing ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Modal */}
        {showView && viewing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowView(false)} />
            <div className="relative bg-white rounded-2xl shadow-lg max-w-3xl w-full p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">Customer Details</h3>
                <button onClick={() => setShowView(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-lg overflow-hidden bg-gray-50">
                    {viewing.profileImageUrl ? (
                      <img src={viewing.profileImageUrl} alt={`${viewing.firstname} ${viewing.lastname}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No photo</div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xl font-medium text-gray-800 mb-2">
                    {`${viewing.firstname || ""} ${viewing.lastname || ""}`.trim()}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <div className="text-gray-800">{viewing.email}</div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <div className="text-gray-800">{viewing.phone}</div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600">Shipping Address:</span>
                      <div className="text-gray-800">{viewing.address || "—"}</div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600">Billing Address:</span>
                      <div className="text-gray-800">{viewing.billingAddress || "—"}</div>
                    </div>

                    <div className="pt-2 border-t">
                      <span className="font-medium text-gray-600">Customer ID:</span>
                      <div className="text-xs text-gray-500 font-mono">{viewing._id}</div>
                    </div>

                    {viewing.createdAt && (
                      <div>
                        <span className="font-medium text-gray-600">Member Since:</span>
                        <div className="text-gray-800">{new Date(viewing.createdAt).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => { setShowView(false); openEdit(viewing); }}
                      className="px-3 py-1 border border-gray-200 rounded-md text-amber-600 hover:bg-amber-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setShowView(false); removeCustomer(viewing); }}
                      className="px-3 py-1 border border-gray-200 rounded-md text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed right-4 bottom-6 z-50 space-y-2">
          {toasts.map((t) => (
            <div key={t.id} className={`px-4 py-2 rounded-md shadow-lg transition-all ${t.type === "error" ? "bg-red-100 text-red-800 border border-red-200" : t.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-blue-100 text-blue-800 border border-blue-200"}`}>
              {t.message}
            </div>
          ))}
        </div>
      </div>

      {/* Small inline styles to handle Tailwind dynamic sizes used in Avatar. */}
      <style>{`
        .w-10{width:40px;height:40px}
        .w-12{width:48px;height:48px}
        .h-10{height:40px}
        .h-12{height:48px}
      `}</style>
    </div>
  );
}


// Whatapp icon component
const WhatsAppIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M20.52 3.48a11.57 11.57 0 00-16.37 0 11.35 11.35 0 00-3.23 8.23c.05 2.37.94 4.68 2.56 6.44l-1.3 4.77 4.91-1.35a11.36 11.36 0 0010.8-18.09zm-8.61 15.18a8.33 8.33 0 01-4.3-1.32l-.31-.19-2.91.8.78-2.84-.2-.29a8.36 8.36 0 1116 0 8.41 8.41 0 01-8 3.04zm4.66-5.63l-1.32-.41a1.47 1.47 0 00-1.52.39l-.43.44-.65-.22a5.38 5.38 0 01-1.94-1.77 1.56 1.56 0 01-.27-1.73l.13-.23a.5.5 0 00-.43-.73H8.58a.44.44 0 00-.43.43.08.08 0 00.08.08 7 7 0 005.81 5.81.13.13 0 00.12-.12V13a.53.53 0 00-.26-.37z" />
  </svg>
);

function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  let num = phone.replace(/[^\d+]/g, "");
  num = num.replace(/^\+?0+/, "");
  if (num.startsWith("+")) {
    num = num.slice(1);
  }
  return num;
}