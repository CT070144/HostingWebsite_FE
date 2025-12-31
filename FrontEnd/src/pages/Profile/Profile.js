import React, { useMemo, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { useNotify } from '../../contexts/NotificationContext';
import './Profile.css';

const Profile = () => {
  useAuth();
  const { notifyError, notifySuccess } = useNotify();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    identity_number: '',
    address: '',
    country: '',
    city: '',
    ward: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userService.getProfile();
        const userData = response.data?.user || response.data;
        setProfile(userData);
        setFormData({
          first_name: userData?.FirstName || '',
          last_name: userData?.LastName || '',
          phone_number: userData?.PhoneNumber || '',
          identity_number: userData?.IdentityNumber || '',
          address: userData?.Address || '',
          country: userData?.Country || '',
          city: userData?.City || '',
          ward: userData?.Ward || '',
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Không thể tải thông tin tài khoản');
        notifyError('Không thể tải thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [notifyError]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getAccountTypeLabel = (type) => {
    const typeMap = {
      PERSONAL: 'Cá nhân',
      ORGANIZATION: 'Tổ chức',
    };
    return typeMap[type] || type || 'N/A';
  };

  const getRoleLabel = (role) => {
    if (!role) return 'N/A';
    const roleLower = role.toLowerCase();
    const roleMap = {
      admin: 'Quản trị viên',
      user: 'Người dùng',
      customer: 'Khách hàng',
    };
    return roleMap[roleLower] || role || 'N/A';
  };

  const getRoleBadgeVariant = (role) => {
    if (!role) return 'secondary';
    const roleLower = role.toLowerCase();
    const variantMap = {
      admin: 'danger',
      user: 'primary',
      customer: 'success',
    };
    return variantMap[roleLower] || 'secondary';
  };

  const missingFields = useMemo(() => {
    const missing = [];
    if (!formData.first_name.trim()) missing.push('Họ');
    if (!formData.last_name.trim()) missing.push('Tên');
    if (!formData.phone_number.trim()) missing.push('Số điện thoại');
    if (!formData.identity_number.trim()) missing.push('Số CCCD/Passport');
    if (!formData.address.trim()) missing.push('Địa chỉ');
    if (!formData.country.trim()) missing.push('Quốc gia');
    if (!formData.city.trim()) missing.push('Thành phố/Tỉnh');
    if (!formData.ward.trim()) missing.push('Phường/Xã');
    return missing;
  }, [formData]);

  const handleSave = async () => {
    if (missingFields.length > 0) {
      notifyError(`Vui lòng nhập đầy đủ: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setSaving(true);
      await userService.updateProfile({
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        first_name: formData.first_name.trim(),
        identity_number: formData.identity_number.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number.trim(),
        ward: formData.ward.trim(),
      });
      notifySuccess('Cập nhật thông tin thành công');
      setIsEditing(false);

      // Refresh profile view
      const response = await userService.getProfile();
      const userData = response.data?.user || response.data;
      setProfile(userData);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Cập nhật thông tin thất bại';
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Container className="py-5">
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p>Đang tải thông tin tài khoản...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Không thể tải thông tin</Alert.Heading>
            <p>{error || 'Không tìm thấy thông tin tài khoản'}</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Container className="py-5">
        <div className="profile-header mb-4">
          <h1 className="profile-title">Thông tin tài khoản</h1>
          <div className="mt-3">
            {isEditing ? (
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="primary"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button
                  variant="outline-secondary"
                  disabled={saving}
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      first_name: profile?.FirstName || '',
                      last_name: profile?.LastName || '',
                      phone_number: profile?.PhoneNumber || '',
                      identity_number: profile?.IdentityNumber || '',
                      address: profile?.Address || '',
                      country: profile?.Country || '',
                      city: profile?.City || '',
                      ward: profile?.Ward || '',
                    });
                  }}
                >
                  Hủy
                </Button>
              </div>
            ) : (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                Cập nhật thông tin
              </Button>
            )}
          </div>
        </div>

        <Row>
          {/* Thông tin cá nhân và địa chỉ */}
          <Col lg={8}>
            <Card className="profile-card mb-4">
              <Card.Header className="profile-card-header">
                <h3 className="mb-0">
                  <i className="fas fa-user me-2"></i>
                  Thông tin cá nhân và địa chỉ
                </h3>
              </Card.Header>
              <Card.Body>
                {isEditing && missingFields.length > 0 && (
                  <Alert variant="warning">
                    Vui lòng nhập đầy đủ: {missingFields.join(', ')}
                  </Alert>
                )}

                {isEditing ? (
                  <Form>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Họ</Form.Label>
                          <Form.Control
                            value={formData.first_name}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, first_name: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Tên</Form.Label>
                          <Form.Control
                            value={formData.last_name}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, last_name: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Số điện thoại</Form.Label>
                          <Form.Control
                            value={formData.phone_number}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, phone_number: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Số CCCD/Passport</Form.Label>
                          <Form.Control
                            value={formData.identity_number}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, identity_number: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Địa chỉ</Form.Label>
                          <Form.Control
                            value={formData.address}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, address: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Quốc gia</Form.Label>
                          <Form.Control
                            value={formData.country}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, country: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Thành phố/Tỉnh</Form.Label>
                          <Form.Control
                            value={formData.city}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, city: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Phường/Xã</Form.Label>
                          <Form.Control
                            value={formData.ward}
                            onChange={(e) =>
                              setFormData((p) => ({ ...p, ward: e.target.value }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                ) : (
                  <Row className="g-3">
                  {/* Thông tin cá nhân */}
                  <Col md={6}>
                    <div className="profile-field">
                      <label className="profile-label">Họ</label>
                      <div className="profile-value">
                        {profile.FirstName || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="profile-field">
                      <label className="profile-label">Tên</label>
                      <div className="profile-value">
                        {profile.LastName || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="profile-field">
                      <label className="profile-label">Email</label>
                      <div className="profile-value">
                        {profile.Email}
                        {profile.EmailVerified && (
                          <Badge bg="success" className="ms-2">
                            <i className="fas fa-check-circle me-1"></i>
                            Đã xác thực
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="profile-field">
                      <label className="profile-label">Số điện thoại</label>
                      <div className="profile-value">
                        {profile.PhoneNumber || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="profile-field">
                      <label className="profile-label">Số CCCD/Passport</label>
                      <div className="profile-value">
                        {profile.IdentityNumber || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="profile-field">
                      <label className="profile-label">Loại tài khoản</label>
                      <div className="profile-value">
                        <Badge bg="info">{getAccountTypeLabel(profile.AccountType)}</Badge>
                      </div>
                    </div>
                  </Col>
                  
                  {/* Divider */}
                  <Col md={12}>
                    <hr className="profile-divider" />
                  </Col>
                  
                  {/* Địa chỉ */}
                  <Col md={12}>
                    <div className="profile-field">
                      <label className="profile-label">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Địa chỉ
                      </label>
                      <div className="profile-value">
                        {profile.Address || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="profile-field">
                      <label className="profile-label">Quốc gia</label>
                      <div className="profile-value">
                        {profile.Country || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="profile-field">
                      <label className="profile-label">Thành phố/Tỉnh</label>
                      <div className="profile-value">
                        {profile.City || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="profile-field">
                      <label className="profile-label">Phường/Xã</label>
                      <div className="profile-value">
                        {profile.Ward || <span className="text-muted">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </Col>
                </Row>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar - Thông tin tài khoản */}
          <Col lg={4}>
            <Card className="profile-card mb-4">
              <Card.Header className="profile-card-header">
                <h3 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Thông tin tài khoản
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="profile-avatar-info">
                  <div className="avatar-circle">
                    <i className="fas fa-user fa-3x"></i>
                  </div>
                  <div className="text-center mt-3">
                    <h4 className="mb-2">
                      {profile.FirstName && profile.LastName
                        ? `${profile.FirstName} ${profile.LastName}`
                        : profile.Email}
                    </h4>
                    {profile.Role && (
                      <Badge bg={getRoleBadgeVariant(profile.Role)} className="mt-2">
                        {getRoleLabel(profile.Role)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="profile-field mb-3">
                  <label className="profile-label">Mã người dùng</label>
                  <div className="profile-value small text-muted font-monospace">
                    {profile.UserID || 'N/A'}
                  </div>
                </div>

                <div className="profile-field mb-3">
                  <label className="profile-label">Số dư tài khoản</label>
                  <div className="profile-value">
                    <strong className="text-primary">
                      {new Intl.NumberFormat('vi-VN').format(profile.CreditBalance || 0)} {profile.Currency || 'VND'}
                    </strong>
                  </div>
                </div>

                <div className="profile-field mb-3">
                  <label className="profile-label">Xác thực 2 yếu tố</label>
                  <div className="profile-value">
                    {profile.TwoFactorEnabled ? (
                      <Badge bg="success">
                        <i className="fas fa-check-circle me-1"></i>
                        Đã bật
                      </Badge>
                    ) : (
                      <Badge bg="secondary">
                        <i className="fas fa-times-circle me-1"></i>
                        Chưa bật
                      </Badge>
                    )}
                  </div>
                </div>

                <hr />

                <div className="profile-field mb-2">
                  <label className="profile-label small text-muted">Ngày tạo</label>
                  <div className="profile-value small">
                    {formatDate(profile.CreatedAt)}
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label small text-muted">Cập nhật lần cuối</label>
                  <div className="profile-value small">
                    {formatDate(profile.UpdatedAt)}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;

