# Design System - Hệ thống Thiết kế

Tài liệu này mô tả hệ thống thiết kế tập trung của website, sử dụng CSS Variables để dễ dàng bảo trì và cập nhật.

## Màu sắc chủ đạo

**Primary Color:** `#1d4ed8` (Blue)

### Primary Color Palette

```css
--primary-color: #1d4ed8;        /* Màu chính */
--primary-dark: #1e40af;         /* Màu tối hơn */
--primary-darker: #1e3a8a;       /* Màu tối nhất */
--primary-light: #3b82f6;        /* Màu sáng hơn */
--primary-lighter: #60a5fa;      /* Màu sáng hơn nữa */
--primary-ultra-light: #dbeafe;  /* Màu rất sáng */
```

## Cấu trúc CSS Variables

Tất cả CSS variables được khai báo trong `src/index.css` trong `:root` selector.

### 1. Primary Colors
- Màu chủ đạo và các biến thể

### 2. Secondary Colors
- Success, Danger, Warning, Info colors

### 3. Background Colors
- `--bg-primary`: Nền chính (trắng)
- `--bg-secondary`: Nền phụ (#f8f9fa)
- `--bg-tertiary`: Nền bậc 3 (#f3f4f6)
- `--bg-dark`: Nền tối (#1f2937)

### 4. Text Colors
- `--text-primary`: Chữ chính (#1f2937)
- `--text-secondary`: Chữ phụ (#4b5563)
- `--text-muted`: Chữ mờ (#6b7280)
- `--text-light`: Chữ nhạt (#9ca3af)
- `--text-white`: Chữ trắng

### 5. Border Colors
- `--border-color`: Viền chính (#e5e7eb)
- `--border-light`: Viền nhạt (#f3f4f6)
- `--border-dark`: Viền đậm (#d1d5db)

### 6. Gradients
- `--gradient-primary`: Gradient chính (primary-color → primary-dark)
- `--gradient-overlay`: Gradient overlay cho carousel

### 7. Shadows
- `--shadow-sm`: Shadow nhỏ
- `--shadow-md`: Shadow trung bình
- `--shadow-lg`: Shadow lớn
- `--shadow-xl`: Shadow rất lớn
- `--shadow-primary`: Shadow với màu primary
- `--shadow-primary-lg`: Shadow primary lớn

### 8. Border Radius
- `--radius-sm` đến `--radius-full`: Các kích thước bo góc

### 9. Spacing
- `--spacing-xs` đến `--spacing-3xl`: Các khoảng cách chuẩn

### 10. Transitions
- `--transition-base`: 0.3s ease
- `--transition-fast`: 0.15s ease
- `--transition-slow`: 0.5s ease

### 11. Z-index
- Các lớp z-index chuẩn cho dropdown, modal, tooltip, etc.

## Cách sử dụng

### Trong CSS Files

```css
/* Thay vì hardcode */
.my-button {
  background-color: #1d4ed8;
  color: white;
  padding: 1rem;
  border-radius: 8px;
}

/* Sử dụng variables */
.my-button {
  background-color: var(--primary-color);
  color: var(--text-white);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### Trong React Components

```jsx
// Sử dụng inline style với CSS variables
<div style={{ 
  backgroundColor: 'var(--primary-color)',
  color: 'var(--text-white)'
}}>
  Content
</div>
```

## Lợi ích

1. **Dễ bảo trì**: Chỉ cần thay đổi ở một nơi (index.css)
2. **Nhất quán**: Tất cả components sử dụng cùng màu sắc
3. **Linh hoạt**: Dễ dàng thay đổi theme
4. **Tối ưu**: Giảm code lặp lại

## Cập nhật màu chủ đạo

Để thay đổi màu chủ đạo của toàn bộ website:

1. Mở file `src/index.css`
2. Tìm section `/* Primary Color Palette */`
3. Cập nhật các giá trị:
   ```css
   --primary-color: #YOUR_COLOR;
   --primary-dark: #YOUR_DARK_COLOR;
   --primary-light: #YOUR_LIGHT_COLOR;
   ```
4. Tất cả components sẽ tự động cập nhật

## Best Practices

1. **Luôn sử dụng variables** thay vì hardcode màu sắc
2. **Sử dụng semantic names** (--text-primary thay vì --gray-900)
3. **Không override** variables trong component CSS
4. **Thêm variables mới** vào index.css nếu cần

## Ví dụ

### Button Component

```css
.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-white);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  box-shadow: var(--shadow-md);
}
```

### Card Component

```css
.card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}
```

