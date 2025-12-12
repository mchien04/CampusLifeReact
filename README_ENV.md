# Hướng dẫn cấu hình API Base URL

## Cấu trúc file môi trường

### 1. `.env.local` (Local Development - KHÔNG commit vào git)
- File này dùng cho development ở local
- Đã được gitignore, không commit vào git
- Copy từ `.env.example` và chỉnh sửa:
  ```bash
  cp .env.example .env.local
  ```
- Nội dung mặc định:
  ```
  REACT_APP_API_BASE_URL=http://localhost:8080
  ```

### 2. `.env.production` (Production - CÓ commit vào git)
- File này dùng khi build cho production
- Được commit vào git
- Chứa URL của backend server trên Railway
- Sau khi deploy backend lên Railway, cập nhật URL trong file này

## Cách sử dụng

### Development (Local)
1. Tạo file `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Chỉnh sửa `.env.local` nếu cần (mặc định đã là localhost:8080)
3. Chạy development server:
   ```bash
   npm start
   ```
4. App sẽ tự động dùng URL từ `.env.local`

### Production (Railway)
1. Deploy backend lên Railway và lấy public URL
2. Cập nhật `.env.production` với Railway URL:
   ```
   REACT_APP_API_BASE_URL=https://your-backend-app.railway.app
   ```
3. Commit và push lên git:
   ```bash
   git add .env.production
   git commit -m "Update production API URL"
   git push
   ```
4. Khi build production, React sẽ tự động dùng `.env.production`:
   ```bash
   npm run build
   ```

## Thứ tự ưu tiên của React

React sẽ load biến môi trường theo thứ tự:
1. `.env.development.local` (development, gitignored)
2. `.env.local` (gitignored)
3. `.env.development` (development)
4. `.env.production` (production build)
5. `.env` (gitignored)

## Lưu ý

- **Không commit** `.env.local` vào git (đã được gitignore)
- **Có commit** `.env.production` vào git để team cùng dùng
- Sau khi thay đổi file `.env`, cần **restart development server**
- Biến môi trường phải bắt đầu bằng `REACT_APP_` để React nhận diện

## Railway Deployment

Khi deploy frontend lên Railway (hoặc hosting khác):

1. Railway sẽ tự động chạy `npm run build` (production build)
2. Build sẽ tự động dùng `.env.production`
3. Nếu cần override, có thể set biến môi trường trong Railway dashboard:
   - Variable: `REACT_APP_API_BASE_URL`
   - Value: URL của backend Railway

