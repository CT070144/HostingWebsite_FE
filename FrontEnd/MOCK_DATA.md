# Hướng dẫn sử dụng Mock Data

Tài liệu này mô tả cách sử dụng mock data để mô phỏng API responses trong dự án.

## Cấu hình

Mock data được bật mặc định trong development mode. Để bật/tắt mock data, sử dụng biến môi trường:

```bash
# Bật mock data (mặc định)
REACT_APP_USE_MOCK_DATA=true

# Tắt mock data để sử dụng API thật
REACT_APP_USE_MOCK_DATA=false
```

## Cấu trúc Mock Data

Mock data được lưu trong thư mục `src/mockData/` với các file JSON:

### 1. `auth.json`
Chứa dữ liệu authentication:
- `users`: Danh sách users mẫu
- `tokens`: Mapping email -> token

**Users mẫu:**
- Email: `user@example.com`, Password: `password123`
- Email: `admin@example.com`, Password: `admin123`

### 2. `services.json`
Chứa danh sách các dịch vụ hosting:
- Shared Hosting
- Cloud Hosting
- VPS Hosting
- Dedicated Server
- Domain Registration
- SSL Certificate

### 3. `pricing.json`
Chứa các gói pricing:
- Basic: 99,000 VNĐ/tháng
- Professional: 199,000 VNĐ/tháng (phổ biến)
- Enterprise: 399,000 VNĐ/tháng

### 4. `dashboard.json`
Chứa dữ liệu dashboard:
- Stats: hosting count, domain count, unpaid invoices
- Hostings: Danh sách hosting đang sử dụng
- Domains: Danh sách domains đã đăng ký
- Invoices: Hóa đơn chưa thanh toán
- Recent Activities: Hoạt động gần đây

### 5. `contact.json`
Chứa response mẫu cho contact form

## Cách hoạt động

1. **Mock Service** (`src/utils/mockService.js`):
   - Intercept các API calls
   - Trả về mock data từ JSON files
   - Simulate network delay (mặc định 500ms)

2. **API Interceptor** (`src/utils/api.js`):
   - Kiểm tra flag `USE_MOCK_DATA`
   - Nếu bật, redirect request đến mock service
   - Nếu tắt, gửi request đến API thật

## Sử dụng

### Test Authentication

```javascript
// Login với user mẫu
Email: user@example.com
Password: password123

// Hoặc admin
Email: admin@example.com
Password: admin123
```

### Test các trang

- **Services**: Tự động load từ `services.json`
- **Pricing**: Tự động load từ `pricing.json`
- **Dashboard**: Tự động load từ `dashboard.json` (cần đăng nhập)
- **Contact**: Submit form sẽ trả về success message

## Tùy chỉnh Mock Data

### Thêm user mới

Sửa file `src/mockData/auth.json`:

```json
{
  "users": [
    {
      "id": 3,
      "name": "Tên mới",
      "email": "newuser@example.com",
      "password": "password123",
      "phone": "0987654321",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "role": "user"
    }
  ],
  "tokens": {
    "newuser@example.com": "mock_token_new_12345"
  }
}
```

### Thêm service mới

Sửa file `src/mockData/services.json`:

```json
{
  "services": [
    {
      "id": 7,
      "icon": "fas fa-icon",
      "title": "Service Name",
      "description": "Description here",
      "features": ["Feature 1", "Feature 2"],
      "price": {
        "min": 100000,
        "max": 500000
      }
    }
  ]
}
```

### Thay đổi delay

Sửa biến môi trường:

```bash
REACT_APP_MOCK_DELAY=1000  # 1 giây
```

Hoặc sửa trong `src/utils/constants.js`:

```javascript
export const MOCK_DELAY = 1000; // milliseconds
```

## Chuyển sang API thật

Khi backend đã sẵn sàng:

1. Tắt mock data:
```bash
REACT_APP_USE_MOCK_DATA=false
```

2. Cấu hình API URL:
```bash
REACT_APP_API_BASE_URL=http://your-api-url.com/api
```

3. Đảm bảo backend cung cấp các endpoints tương ứng:
   - `POST /api/auth/login`
   - `POST /api/auth/register`
   - `GET /api/auth/me`
   - `GET /api/services`
   - `GET /api/pricing`
   - `GET /api/dashboard`
   - `POST /api/contact`

## Lưu ý

- Mock data chỉ dùng cho development
- Không commit sensitive data vào mock files
- Mock delay giúp test loading states
- Tất cả mock responses có format giống API thật

