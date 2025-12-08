import React, { useEffect, useMemo, useState } from 'react';
import { faqService } from '../../../services/faqService';
import './AdminFaqsPage.css';

const emptyForm = { question: '', answer: '', category: '', display_order: 0 };

const AdminFaqsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [viewingFaq, setViewingFaq] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  // Fetch list from real API
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await faqService.list();
      setFaqs(res.data || []);
    } catch (err) {
      console.error('Load FAQs failed', err);
      alert('Không tải được danh sách FAQs. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const filteredFaqs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        (faq.category || '').toLowerCase().includes(term)
    );
  }, [faqs, searchTerm]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingFaq(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || '',
      display_order: faq.display_order ?? 0,
    });
    setIsEditorOpen(true);
  };

  const handleView = (faq) => {
    setViewingFaq(faq);
    setIsViewOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục FAQ này?')) {
      faqService
        .remove(id)
        .then(() => fetchFaqs())
        .catch((err) => {
          console.error('Delete FAQ failed', err);
          alert('Xóa FAQ thất bại. Vui lòng thử lại.');
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedQuestion = formData.question.trim();
    const trimmedAnswer = formData.answer.trim();
    const trimmedCategory = formData.category.trim();
    const displayOrder = Number(formData.display_order) || 0;

    if (!trimmedQuestion || !trimmedAnswer) {
      alert('Vui lòng nhập đầy đủ câu hỏi và câu trả lời.');
      return;
    }

    const payload = {
      question: trimmedQuestion,
      answer: trimmedAnswer,
      category: trimmedCategory,
      display_order: displayOrder,
    };

    try {
      if (editingFaq) {
        await faqService.update(editingFaq.id, payload);
      } else {
        await faqService.create(payload);
      }
      await fetchFaqs();
    } catch (err) {
      console.error('Save FAQ failed', err);
      alert(editingFaq ? 'Cập nhật FAQ thất bại.' : 'Thêm FAQ thất bại.');
      return;
    }

    setIsEditorOpen(false);
    resetForm();
  };

  return (
    <div className="faq-page">
      <div className="page-header">
        <div>
          <p className="page-subtitle">Dựa trên dữ liệu trang chủ (mock)</p>
          <h1 className="page-title">Quản lý FAQs</h1>
        </div>
        <div className="page-actions">
          <div className="search-box outlined">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm theo câu hỏi hoặc câu trả lời..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <i className="fas fa-plus"></i> Thêm FAQ
          </button>
        </div>
      </div>

      <div className="faq-summary">
        <div className="summary-card">
          <div className="summary-icon blue">
            <i className="fas fa-question-circle"></i>
          </div>
          <div>
            <p className="summary-label">Tổng câu hỏi</p>
            <p className="summary-value">{faqs.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon green">
            <i className="fas fa-list-ul"></i>
          </div>
          <div>
            <p className="summary-label">Đang hiển thị</p>
            <p className="summary-value">{filteredFaqs.length}</p>
          </div>
        </div>
      </div>

      <div className="faq-table-container">
        <table className="faq-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>ID</th>
              <th>Câu hỏi</th>
              <th>Câu trả lời</th>
              <th style={{ width: '120px' }}>Danh mục</th>
              <th style={{ width: '110px' }}>Thứ tự</th>
              <th style={{ width: '140px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-state">Đang tải...</td>
              </tr>
            ) : filteredFaqs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  Không có FAQ nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredFaqs.map((faq) => (
                <tr key={faq.id}>
                  <td className="id-cell">#{faq.id}</td>
                  <td>{faq.question}</td>
                  <td className="answer-cell">{faq.answer}</td>
                  <td>{faq.category || '-'}</td>
                  <td>{faq.display_order ?? 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleView(faq)}
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(faq)}
                        title="Sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(faq.id)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isEditorOpen && (
        <div className="modal-overlay" onClick={() => setIsEditorOpen(false)}>
          <div
            className="modal-content faq-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingFaq ? 'Sửa FAQ' : 'Thêm FAQ mới'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setIsEditorOpen(false);
                  resetForm();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form className="faq-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Câu hỏi *</label>
                <input
                  type="text"
                  name="question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  placeholder="Nhập câu hỏi"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Câu trả lời *</label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      answer: e.target.value,
                    }))
                  }
                  placeholder="Nhập câu trả lời"
                  className="form-input"
                  rows={5}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: general, support"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thứ tự hiển thị</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_order: e.target.value,
                    }))
                  }
                  placeholder="0"
                  className="form-input"
                  min="0"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditorOpen(false);
                    resetForm();
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFaq ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal */}
      {isViewOpen && viewingFaq && (
        <div className="modal-overlay" onClick={() => setIsViewOpen(false)}>
          <div
            className="modal-content faq-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi tiết FAQ</h2>
              <button
                className="modal-close"
                onClick={() => setIsViewOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="faq-view">
              <div className="view-row">
                <span className="view-label">ID</span>
                <span className="view-value">#{viewingFaq.id}</span>
              </div>
              <div className="view-row">
                <span className="view-label">Câu hỏi</span>
                <p className="view-value">{viewingFaq.question}</p>
              </div>
              <div className="view-row">
                <span className="view-label">Câu trả lời</span>
                <p className="view-value">{viewingFaq.answer}</p>
              </div>
              <div className="view-row">
                <span className="view-label">Danh mục</span>
                <p className="view-value">{viewingFaq.category || '-'}</p>
              </div>
              <div className="view-row">
                <span className="view-label">Thứ tự hiển thị</span>
                <p className="view-value">{viewingFaq.display_order ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaqsPage;


