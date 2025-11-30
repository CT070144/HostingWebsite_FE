# Hướng dẫn Deploy lên Vercel

Hướng dẫn chi tiết cách build và deploy dự án React lên Vercel.

## 📋 Mục lục

1. [Chuẩn bị](#chuẩn-bị)
2. [Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)](#cách-1-deploy-qua-vercel-dashboard)
3. [Cách 2: Deploy qua Vercel CLI](#cách-2-deploy-qua-vercel-cli)
4. [Cấu hình Environment Variables](#cấu-hình-environment-variables)
5. [Cấu hình Build Settings](#cấu-hình-build-settings)
6. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
7. [Tối ưu hóa](#tối-ưu-hóa)

---

## 🚀 Chuẩn bị

### 1. Kiểm tra dự án

Đảm bảo dự án có thể build thành công:

```bash
cd FrontEnd
npm install
npm run build
```

Nếu build thành công, bạn sẽ thấy thư mục `build/` được tạo ra.

### 2. Chuẩn bị Git Repository

Vercel yêu cầu dự án phải được lưu trên Git (GitHub, GitLab, hoặc Bitbucket).

```bash
# Khởi tạo git (nếu chưa có)
git init

# Thêm tất cả files
git add .

# Commit
git commit -m "Initial commit"

# Thêm remote repository (ví dụ GitHub)
git remote add origin https://github.com/yourusername/ttcs-hosting-website.git

# Push lên GitHub
git push -u origin main
```

### 3. Tạo tài khoản Vercel

- Truy cập: https://vercel.com
- Đăng ký/Đăng nhập bằng GitHub, GitLab, hoặc Bitbucket

---

## 📦 Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

### Bước 1: Import Project

1. Đăng nhập vào Vercel Dashboard
2. Click **"Add New..."** → **"Project"**
3. Chọn repository từ GitHub/GitLab/Bitbucket
4. Click **"Import"**

### Bước 2: Cấu hình Project

#### Framework Preset
- **Framework Preset**: `Create React App` (tự động detect)

#### Root Directory
- **Root Directory**: `FrontEnd` (nếu repo ở root, để trống hoặc `./`)

#### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

#### Environment Variables
Thêm các biến môi trường (xem phần [Environment Variables](#cấu-hình-environment-variables))

### Bước 3: Deploy

1. Click **"Deploy"**
2. Chờ quá trình build hoàn tất (thường 2-5 phút)
3. Sau khi deploy thành công, bạn sẽ nhận được URL: `https://your-project.vercel.app`

### Bước 4: Custom Domain (Tùy chọn)

1. Vào **Settings** → **Domains**
2. Thêm domain của bạn
3. Cấu hình DNS theo hướng dẫn của Vercel

---

## 💻 Cách 2: Deploy qua Vercel CLI

### Bước 1: Cài đặt Vercel CLI

```bash
npm install -g vercel
```

### Bước 2: Đăng nhập

```bash
vercel login
```

### Bước 3: Deploy

```bash
# Di chuyển vào thư mục FrontEnd
cd FrontEnd

# Deploy lần đầu (sẽ hỏi một số câu hỏi)
vercel

# Deploy production
vercel --prod
```

**Các câu hỏi khi deploy lần đầu:**

1. **Set up and deploy?** → `Y`
2. **Which scope?** → Chọn tài khoản của bạn
3. **Link to existing project?** → `N` (lần đầu)
4. **What's your project's name?** → `ttcs-hosting-website` (hoặc tên bạn muốn)
5. **In which directory is your code located?** → `./` (nếu đang ở trong FrontEnd)
6. **Want to override the settings?** → `N` (hoặc `Y` nếu muốn tùy chỉnh)

### Bước 4: Cấu hình Environment Variables

```bash
# Thêm environment variable
vercel env add REACT_APP_API_BASE_URL

# Xem danh sách environment variables
vercel env ls

# Xóa environment variable
vercel env rm REACT_APP_API_BASE_URL
```

---

## 🔐 Cấu hình Environment Variables

### Các biến môi trường cần thiết

Vào **Settings** → **Environment Variables** trong Vercel Dashboard:

| Variable | Value | Mô tả |
|----------|-------|-------|
| `REACT_APP_API_BASE_URL` | `https://your-api.com/api` | URL của backend API |
| `REACT_APP_USE_MOCK_DATA` | `false` | Tắt mock data trong production |
| `REACT_APP_MOCK_DELAY` | `500` | Delay cho mock data (nếu dùng) |

### Cách thêm trong Dashboard

1. Vào project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Nhập:
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: URL API của bạn
   - **Environment**: Chọn `Production`, `Preview`, `Development` (hoặc tất cả)
4. Click **"Save"**

### Cách thêm qua CLI

```bash
# Thêm cho production
vercel env add REACT_APP_API_BASE_URL production

# Thêm cho tất cả environments
vercel env add REACT_APP_API_BASE_URL
```

**Lưu ý**: Sau khi thêm environment variables, cần **redeploy** để áp dụng thay đổi.

---

## ⚙️ Cấu hình Build Settings

### File `vercel.json` (Tùy chọn)

Tạo file `vercel.json` trong thư mục `FrontEnd/`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Cấu hình trong Dashboard

Nếu không dùng `vercel.json`, cấu hình trong Dashboard:

1. **Settings** → **General**
2. **Build & Development Settings**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `FrontEnd` (hoặc để trống nếu ở root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi 1: Build failed - Module not found

**Nguyên nhân**: Thiếu dependencies hoặc path không đúng

**Giải pháp**:
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lỗi 2: Environment variables không hoạt động

**Nguyên nhân**: Biến môi trường chưa được set hoặc chưa redeploy

**Giải pháp**:
1. Kiểm tra tên biến phải bắt đầu bằng `REACT_APP_`
2. Thêm lại trong Vercel Dashboard
3. Redeploy project

### Lỗi 3: 404 khi refresh trang

**Nguyên nhân**: React Router cần cấu hình rewrite rules

**Giải pháp**: Thêm vào `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Lỗi 4: Assets không load được

**Nguyên nhân**: Path không đúng trong production

**Giải pháp**: 
- Kiểm tra `package.json` có `"homepage": "."` hoặc để trống
- Đảm bảo assets được import đúng cách

### Lỗi 5: API calls bị CORS

**Nguyên nhân**: Backend chưa cấu hình CORS

**Giải pháp**: 
- Cấu hình CORS ở backend để cho phép domain Vercel
- Hoặc sử dụng Vercel Serverless Functions làm proxy

---

## 🚀 Tối ưu hóa

### 1. Enable Compression

Vercel tự động enable gzip compression, không cần cấu hình thêm.

### 2. Optimize Images

Sử dụng Vercel Image Optimization:
```jsx
import Image from 'next/image'; // Nếu dùng Next.js
// Hoặc sử dụng <img> với src từ CDN
```

### 3. Code Splitting

React đã tự động code splitting, đảm bảo sử dụng:
```jsx
const Component = React.lazy(() => import('./Component'));
```

### 4. Environment Variables

Chỉ thêm biến môi trường cần thiết, không commit `.env` files.

### 5. Build Optimization

Thêm vào `package.json`:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "npm run build && npx source-map-explorer 'build/static/js/*.js'"
  }
}
```

---

## 📝 Checklist trước khi deploy

- [ ] Dự án build thành công local (`npm run build`)
- [ ] Đã commit và push code lên Git
- [ ] Đã cấu hình environment variables
- [ ] Đã test tất cả routes hoạt động
- [ ] Đã kiểm tra API calls hoạt động
- [ ] Đã tắt mock data trong production
- [ ] Đã kiểm tra responsive trên mobile
- [ ] Đã test authentication flow

---

## 🔄 Continuous Deployment

Sau khi setup, mỗi khi push code lên branch `main`:
- Vercel tự động build và deploy
- Preview deployments cho các pull requests
- Automatic rollback nếu build fail

### Branch Protection

1. **Settings** → **Git**
2. Chọn branch production (thường là `main`)
3. Enable **"Production Branch"**

---

## 📞 Hỗ trợ

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions

---

## 🎉 Hoàn thành!

Sau khi deploy thành công, bạn sẽ có:
- ✅ Production URL: `https://your-project.vercel.app`
- ✅ Preview URLs cho mỗi commit
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Analytics (nếu enable)

**Chúc bạn deploy thành công!** 🚀

