// frontend/src/components/tracker/TransactionForm.jsx
import React, { useState } from 'react';
import { Paperclip } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Education', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Salary', 'Other',
];

const today = () => new Date().toISOString().split('T')[0];

const TransactionForm = ({ onSuccess, editingTransaction, setEditingTransaction }) => {
  const { user } = useAuth();
  const [type, setType] = useState('income');
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: today(),
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate fields when editingTransaction changes
  React.useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'income');
      setForm({
        amount: editingTransaction.amount?.toString() || '',
        category: editingTransaction.category || '',
        description: editingTransaction.description || '',
        date: editingTransaction.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : today(),
      });
      setError('');
    } else {
      setForm({ amount: '', category: '', description: '', date: today() });
      setFile(null);
      setType('income');
      setError('');
    }
  }, [editingTransaction]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.amount || !form.category) {
      setError('Amount and Category are required.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', form.amount);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('date', form.date);
    if (file) formData.append('receipt', file);

    try {
      setSubmitting(true);

      const url = editingTransaction
        ? `/api/transactions/${editingTransaction._id}`
        : '/api/transactions';

      const method = editingTransaction ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          // Do NOT set Content-Type here — axios sets it automatically
          // with the correct multipart boundary when FormData is used
        },
        withCredentials: true,
      });

      if (editingTransaction) {
        setEditingTransaction(null);
      } else {
        // Reset form (if creating)
        setForm({ amount: '', category: '', description: '', date: today() });
        setFile(null);
        setType('income');
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingTransaction ? 'update' : 'add'} transaction.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>

      <form onSubmit={handleSubmit}>
        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            type="button"
            className={type === 'income' ? 'active-income' : ''}
            onClick={() => setType('income')}
          >
            Income
          </button>
          <button
            type="button"
            className={type === 'expense' ? 'active-expense' : ''}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
        </div>

        {/* Amount */}
        <div className="tracker-field">
          <label>Amount</label>
          <div className="amount-wrapper">
            <span className="amount-prefix">₹</span>
            <input
              id="tx-amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Category */}
        <div className="tracker-field">
          <label>Category</label>
          <select
            id="tx-category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="tracker-field">
          <label>Description</label>
          <input
            id="tx-description"
            name="description"
            type="text"
            placeholder={type === 'income' ? 'e.g. May Salary' : 'e.g. Grocery Shopping'}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* Date */}
        <div className="tracker-field">
          <label>Date</label>
          <input
            id="tx-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        {/* Receipt Upload */}
        <div className="tracker-field">
          <label className="file-upload-label">
            <Paperclip size={15} />
            {file ? file.name : 'Attach receipt (optional)'}
            <input
              id="tx-receipt"
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {error && <div className="tracker-error">{error}</div>}

        <button
          id="btn-add-transaction"
          type="submit"
          className="btn-add-transaction"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : (editingTransaction ? 'Update Transaction' : 'Add Transaction')}
        </button>

        {editingTransaction && (
          <button
            type="button"
            className="btn-cancel-edit"
            onClick={() => setEditingTransaction(null)}
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;
