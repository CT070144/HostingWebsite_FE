# Hướng dẫn Authentication

Tài liệu này mô tả cách sử dụng hệ thống authentication trong dự án.

## Cấu trúc Authentication

### 1. AuthContext (`src/contexts/AuthContext.js`)

Context quản lý trạng thái authentication toàn cục:
- `user`: Thông tin user hiện tại
- `loading`: Trạng thái loading khi kiểm tra authentication
- `isAuthenticated`: Boolean cho biết user đã đăng nhập chưa
- `login(email, password)`: Hàm đăng nhập
- `register(userData)`: Hàm đăng ký
- `logout()`: Hàm đăng xuất
- `updateUser(userData)`: Cập nhật thông tin user

### 2. AuthService (`src/services/authService.js`)

Service xử lý các API calls liên quan đến authentication:
- `login(email, password)`: Đăng nhập
- `register(userData)`: Đăng ký
- `getCurrentUser()`: Lấy thông tin user hiện tại
- `changePassword(oldPassword, newPassword)`: Đổi mật khẩu
- `forgotPassword(email)`: Quên mật khẩu
- `resetPassword(token, newPassword)`: Reset mật khẩu
- `refreshToken()`: Refresh token
- `logout()`: Đăng xuất

### 3. ProtectedRoute (`src/components/ProtectedRoute/ProtectedRoute.js`)

Component bảo vệ các routes cần authentication:
- `requireAuth={true}`: Yêu cầu đăng nhập (mặc định)
- `requireAuth={false}`: Chỉ cho phép truy cập khi chưa đăng nhập (cho login/register pages)

## Cách sử dụng

### Sử dụng AuthContext trong Component

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated) {
    return <div>Xin chào, {user.name}!</div>;
  }

  return <div>Vui lòng đăng nhập</div>;
}
```

### Bảo vệ Routes

```javascript
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Dashboard from './pages/Dashboard/Dashboard';

// Route yêu cầu đăng nhập
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// Route chỉ cho phép khi chưa đăng nhập
<Route 
  path="/login" 
  element={
    <ProtectedRoute requireAuth={false}>
      <Login />
    </ProtectedRoute>
  } 
/>
```

### Đăng nhập

```javascript
const { login } = useAuth();

const handleLogin = async () => {
  const result = await login(email, password);
  if (result.success) {
    // Đăng nhập thành công
    navigate('/dashboard');
  } else {
    // Hiển thị lỗi
    setError(result.message);
  }
};
```

### Đăng ký

```javascript
const { register } = useAuth();

const handleRegister = async () => {
  const userData = {
    name: 'Nguyễn Văn A',
    email: 'user@example.com',
    phone: '0123456789',
    password: 'password123'
  };
  
  const result = await register(userData);
  if (result.success) {
    // Đăng ký thành công
    navigate('/dashboard');
  } else {
    // Hiển thị lỗi
    setError(result.message);
  }
};
```

### Đăng xuất

```javascript
const { logout } = useAuth();

const handleLogout = () => {
  logout();
  navigate('/');
};
```

## API Endpoints

Backend cần cung cấp các endpoints sau:

### POST `/api/auth/login`
Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0123456789",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/auth/register`
Request body:
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0123456789",
  "password": "password123"
}
```

Response: Tương tự như login

### GET `/api/auth/me`
Headers:
```
Authorization: Bearer jwt_token_here
```

Response:
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0123456789",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/auth/forgot-password`
Request body:
```json
{
  "email": "user@example.com"
}
```

### POST `/api/auth/reset-password`
Request body:
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

## Token Storage

- Token được lưu trong `localStorage` với key `token`
- User data được lưu trong `localStorage` với key `user`
- Token tự động được thêm vào header `Authorization` cho mọi API request
- Khi nhận được 401 Unauthorized, token sẽ tự động bị xóa và redirect về trang login

## Security Notes

1. Token được lưu trong localStorage (có thể bị XSS attack)
2. Nên sử dụng httpOnly cookies cho production
3. Implement refresh token mechanism cho better security
4. Validate và sanitize tất cả user inputs
5. Sử dụng HTTPS trong production

