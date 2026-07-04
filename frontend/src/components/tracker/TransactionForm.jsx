// frontend/src/components/tracker/TransactionForm.jsx
import React, { useState, useRef } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ocrStatus, setOcrStatus] = useState(null);
  const [ocrFilled, setOcrFilled] = useState({});
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [suggestedBadge, setSuggestedBadge] = useState(null);

  const suggestTimerRef = useRef(null);
  const suggestedCategoryRef = useRef(null);

  // Pre-populate fields when editingTransaction changes
  React.useEffect(() => {
    if (editingTransaction) {
      if (editingTransaction._isOcr) {
        // Form is already set by handleSubmit for OCR flow
      } else {
        setType(editingTransaction.type || 'income');
        setForm({
          amount: editingTransaction.amount?.toString() || '',
          category: editingTransaction.category || '',
          description: editingTransaction.description || '',
          date: editingTransaction.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : today(),
        });
        setError('');
        setOcrStatus(null);
        setOcrFilled({});
        setRemoveReceipt(false);
        setFile(null);
        setPreviewUrl(null);
        setSuggestedBadge(null);
        suggestedCategoryRef.current = null;
        if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
      }
    } else {
      setForm({ amount: '', category: '', description: '', date: today() });
      setFile(null);
      setPreviewUrl(null);
      setType('income');
      setError('');
      setOcrStatus(null);
      setOcrFilled({});
      setRemoveReceipt(false);
      setSuggestedBadge(null);
      suggestedCategoryRef.current = null;
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    }
  }, [editingTransaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');

    if (name === 'description') {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
      
      if (value.length < 3) {
         setSuggestedBadge(null);
      } else {
        suggestTimerRef.current = setTimeout(async () => {
          try {
            const res = await axios.post('/api/classify', { description: value }, {
              headers: { Authorization: `Bearer ${user?.token}` },
              withCredentials: true,
            });
            const { category, confidence, fallback } = res.data;
            if (confidence >= 0.6 && !fallback && CATEGORIES.includes(category)) {
              setForm(prev => ({ ...prev, category }));
              setSuggestedBadge(`${category} (${Math.round(confidence * 100)}%)`);
              suggestedCategoryRef.current = category;
            }
          } catch (err) {
            console.error('Classification error:', err);
          }
        }, 500);
      }
    } else if (name === 'category') {
      setSuggestedBadge(null);
      if (suggestedCategoryRef.current && suggestedCategoryRef.current !== value && form.description.trim()) {
        axios.post('/api/classify/feedback', {
          description: form.description.trim(),
          suggestedCategory: suggestedCategoryRef.current,
          actualCategory: value
        }, {
          headers: { Authorization: `Bearer ${user?.token}` },
          withCredentials: true,
        }).catch(e => console.error('Feedback error:', e));
      }
      suggestedCategoryRef.current = null;
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setForm((prev) => ({ ...prev, amount: '' }));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if ((!form.amount && !file) || (!form.category && !file)) {
      setError('Amount and Category are required.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    const amountToSubmit = (!form.amount && file) ? '0' : form.amount;
    formData.append('amount', amountToSubmit);
    formData.append('category', form.category || 'Other');
    formData.append('description', form.description);
    formData.append('date', form.date);
    if (file) formData.append('receipt', file);
    if (removeReceipt) formData.append('removeReceipt', 'true');

    try {
      setSubmitting(true);

      const url = editingTransaction
        ? `/api/transactions/${editingTransaction._id}`
        : '/api/transactions';

      const method = editingTransaction ? 'put' : 'post';

      const res = await axios[method](url, formData, {
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
        const resData = res.data;
        const transaction = resData.transaction || resData;
        const ocrData = resData.ocrData;

        if (ocrData) {
          const { amount, date, merchant, confidence } = ocrData;
          setOcrStatus(confidence);
          
          let newAmount = form.amount;
          let newDate = form.date;
          let newDesc = form.description;
          let newCat = form.category;
          const filled = {};

          if (amount && (!form.amount || Number(form.amount) === 0)) {
            newAmount = amount.toString();
            filled.amount = true;
          }
          if (date) {
            newDate = date;
            filled.date = true;
          }
          if (merchant) {
            newDesc = merchant;
            filled.description = true;
            try {
              const catRes = await axios.post('/api/classify', { description: merchant }, {
                headers: { Authorization: `Bearer ${user?.token}` },
                withCredentials: true,
              });
              const { category, confidence, fallback } = catRes.data;
              if (confidence >= 0.6 && !fallback && CATEGORIES.includes(category)) {
                newCat = category;
                filled.category = true;
                setSuggestedBadge(`${category} (${Math.round(confidence * 100)}%)`);
                suggestedCategoryRef.current = category;
              }
            } catch (e) { /* ignore */ }
          }
          
          setForm({
            amount: newAmount,
            category: newCat,
            description: newDesc,
            date: newDate
          });
          setOcrFilled(filled);
          setFile(null);
          setPreviewUrl(null);
          setEditingTransaction({ ...transaction, _isOcr: true });
        } else {
          // Reset form (if creating)
          setForm({ amount: '', category: '', description: '', date: today() });
          setFile(null);
          setPreviewUrl(null);
          setType('income');
          setSuggestedBadge(null);
          suggestedCategoryRef.current = null;
          if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
        }
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

      {ocrStatus === 'high' || ocrStatus === 'medium' ? (
        <div className="banner banner-success" style={{ backgroundColor: '#e6fffa', color: '#2c7a7b', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
          Receipt scanned! Amount, date, merchant and category have been auto-filled — please review before saving.
        </div>
      ) : ocrStatus === 'low' ? (
        <div className="banner banner-warning" style={{ backgroundColor: '#fefcbf', color: '#975a16', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
          Receipt uploaded but we couldn't read it clearly — please fill in the details manually.
        </div>
      ) : null}

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
              placeholder={file ? 'Will extract from receipt' : '0.00'}
              value={form.amount}
              onChange={handleChange}
              disabled={!!file}
              style={file ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
            />
          </div>
          {ocrFilled.amount && <span style={{ fontSize: '0.8rem', color: '#718096' }}>from receipt</span>}
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
          {ocrFilled.category && <span style={{ fontSize: '0.8rem', color: '#718096' }}>from receipt</span>}
          {suggestedBadge && (
            <div className="suggested-badge">
              ✓ Suggested: {suggestedBadge} — change if incorrect
            </div>
          )}
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
          {ocrFilled.description && <span style={{ fontSize: '0.8rem', color: '#718096' }}>from receipt</span>}
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
          {ocrFilled.date && <span style={{ fontSize: '0.8rem', color: '#718096' }}>from receipt</span>}
        </div>

        {/* Receipt Upload */}
        <div className="tracker-field">
          {editingTransaction && editingTransaction.receiptUrl && !removeReceipt && !file ? (
            <div className="receipt-preview-container">
              <img src={editingTransaction.receiptUrl} alt="Receipt" style={{ maxWidth: '100px', borderRadius: '4px', display: 'block' }} />
              <div 
                className="receipt-overlay" 
                onClick={() => setRemoveReceipt(true)}
                title="Remove Receipt"
              >
                <Trash2 size={24} color="#fff" />
              </div>
            </div>
          ) : (
            <>
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
              {previewUrl && (
                <div className="receipt-preview-container" style={{ marginTop: '10px' }}>
                  <img src={previewUrl} alt="Receipt Preview" style={{ maxWidth: '100px', borderRadius: '4px', display: 'block' }} />
                  <div 
                    className="receipt-overlay" 
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    title="Remove selected file"
                  >
                    <Trash2 size={24} color="#fff" />
                  </div>
                </div>
              )}
            </>
          )}
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
