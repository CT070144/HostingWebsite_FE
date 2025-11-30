# TTCS Hosting Website - Frontend

Website cung cấp dịch vụ hosting được xây dựng bằng React.js, Bootstrap và FontAwesome.

## Công nghệ sử dụng

- **React 18.2.0** - Thư viện JavaScript cho xây dựng giao diện người dùng
- **React Router DOM 6.20.0** - Điều hướng và routing
- **Bootstrap 5.3.2** - Framework CSS responsive
- **React Bootstrap 2.9.1** - Components Bootstrap cho React
- **FontAwesome 6.5.1** - Thư viện icon
- **Axios 1.6.2** - HTTP client cho API calls

## Cấu trúc thư mục

```
FrontEnd/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/          # Các component tái sử dụng
│   │   ├── Header/
│   │   ├── Footer/
│   │   └── Layout/
│   ├── pages/              # Các trang chính
│   │   ├── Home/
│   │   ├── About/
│   │   ├── Services/
│   │   ├── Pricing/
│   │   └── Contact/
│   ├── utils/              # Utilities và helpers
│   │   ├── api.js
│   │   └── constants.js
│   ├── assets/             # Hình ảnh, fonts, etc.
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js >= 14.0.0
- npm >= 6.0.0 hoặc yarn >= 1.22.0

### Các bước cài đặt

1. **Cài đặt dependencies:**
```bash
cd FrontEnd
npm install
```

2. **Chạy ứng dụng ở chế độ development:**
```bash
npm start
```

Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000)

3. **Build ứng dụng cho production:**
```bash
npm run build
```

4. **Chạy tests:**
```bash
npm test
```

## Các trang chính

- **Trang chủ (/)** - Giới thiệu và các tính năng nổi bật
- **Giới thiệu (/about)** - Thông tin về công ty
- **Dịch vụ (/services)** - Danh sách các dịch vụ cung cấp
- **Bảng giá (/pricing)** - Các gói hosting và giá cả
- **Liên hệ (/contact)** - Form liên hệ và thông tin

## Tính năng

- ✅ Responsive design với Bootstrap
- ✅ Navigation với React Router
- ✅ Icons với FontAwesome
- ✅ Layout component tái sử dụng
- ✅ API utilities với Axios
- ✅ Form handling
- ✅ Modern UI/UX

## Deploy lên Vercel

Xem hướng dẫn chi tiết tại: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

### Quick Start

1. **Chuẩn bị:**
   ```bash
   npm run build
   ```

2. **Deploy qua Vercel Dashboard:**
   - Đăng nhập https://vercel.com
   - Import project từ GitHub
   - Cấu hình build settings
   - Deploy!

3. **Hoặc dùng Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

## Phát triển tiếp

- [ ] Tích hợp API backend
- [x] Authentication và Authorization
- [x] Dashboard cho khách hàng
- [ ] Thanh toán online
- [ ] Quản lý đơn hàng
- [ ] Blog/Tin tức
- [ ] Multi-language support

## Tài liệu

- [Hướng dẫn Deploy Vercel](./VERCEL_DEPLOY.md)
- [Hướng dẫn Authentication](./AUTHENTICATION.md)
- [Hướng dẫn Mock Data](./MOCK_DATA.md)
- [Design System](./DESIGN_SYSTEM.md)

## License

Copyright © 2024 TTCS Hosting

