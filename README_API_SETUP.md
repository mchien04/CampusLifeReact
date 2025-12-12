# Hướng dẫn cấu hình Frontend gọi Backend

## Các trường hợp sử dụng

### 1. FE localhost:3000 → BE localhost:8080 (Development Local)

**Khi nào dùng:** Khi bạn chạy cả FE và BE ở local

**Cách setup:**
1. Tạo file `.env.local` trong thư mục root:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8080
   ```

2. Chạy backend ở port 8080:
   ```bash
   # Terminal 1: Chạy backend
   # Backend chạy ở http://localhost:8080
   ```

3. Chạy frontend:
   ```bash
   # Terminal 2: Chạy frontend
   npm start
   # Frontend chạy ở http://localhost:3000
   ```

4. Frontend sẽ tự động gọi: `http://localhost:8080/api/...`

---

### 2. FE localhost:3000 → BE Railway (Test với BE trên server)

**Khi nào dùng:** Khi bạn muốn test FE local với BE đã deploy lên Railway

**Cách setup:**
1. Deploy backend lên Railway và lấy URL: `https://campuslife-production.up.railway.app`

2. Tạo file `.env.local` với URL Railway:
   ```
   REACT_APP_API_BASE_URL=https://campuslife-production.up.railway.app
   ```

3. Chạy frontend:
   ```bash
   npm start
   # Frontend chạy ở http://localhost:3000
   ```

4. Frontend sẽ gọi: `https://campuslife-production.up.railway.app/api/...`

**Lưu ý:** Cần cấu hình CORS ở backend để cho phép `http://localhost:3000` gọi API

---

### 3. FE Railway → BE Railway (Production)

**Khi nào dùng:** Khi deploy cả FE và BE lên Railway

**Cách setup:**
1. Deploy backend lên Railway, lấy URL: `https://campuslife-production.up.railway.app`

2. Cập nhật file `.env.production`:
   ```
   REACT_APP_API_BASE_URL=https://campuslife-production.up.railway.app
   ```

3. Commit và push:
   ```bash
   git add .env.production
   git commit -m "Update production API URL"
   git push
   ```

4. Deploy frontend lên Railway, Railway sẽ tự động:
   - Chạy `npm run build` (production build)
   - Build sẽ dùng `.env.production`
   - Frontend sẽ gọi: `https://campuslife-production.up.railway.app/api/...`

---

## Cách hoạt động

### Code hiện tại:
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
```

### Khi chạy `npm start` (development):
- React sẽ tìm file `.env.local` trước
- Nếu không có, dùng giá trị mặc định: `http://localhost:8080`

### Khi chạy `npm run build` (production):
- React sẽ tìm file `.env.production`
- Dùng URL trong file đó

---

## Ví dụ cụ thể

### Scenario 1: Development hoàn toàn local
```bash
# .env.local
REACT_APP_API_BASE_URL=http://localhost:8080

# Terminal 1: Backend
java -jar backend.jar  # Chạy ở port 8080

# Terminal 2: Frontend
npm start  # Chạy ở port 3000
# → Gọi http://localhost:8080/api/...
```

### Scenario 2: FE local test với BE Railway
```bash
# .env.local
REACT_APP_API_BASE_URL=https://campuslife-production.up.railway.app

# Terminal: Frontend
npm start  # Chạy ở port 3000
# → Gọi https://campuslife-production.up.railway.app/api/...
```

### Scenario 3: Production trên Railway
```bash
# .env.production (commit vào git)
REACT_APP_API_BASE_URL=https://campuslife-production.up.railway.app

# Railway tự động build
npm run build
# → Frontend deploy sẽ gọi https://campuslife-production.up.railway.app/api/...
```

---

## Lưu ý về CORS

Khi FE localhost:3000 gọi BE Railway, backend cần cấu hình CORS:

```java
// Backend Spring Boot
@CrossOrigin(origins = {
    "http://localhost:3000",  // Cho phép FE local
    "https://campuslife-production.up.railway.app"  // Cho phép FE production
})
```

Hoặc cấu hình global:
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins(
                        "http://localhost:3000",
                        "https://campuslife-production.up.railway.app"
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

---

## Checklist

- [ ] Tạo `.env.local` cho development
- [ ] Tạo `.env.production` cho production
- [ ] Cấu hình CORS ở backend nếu cần
- [ ] Test FE local → BE local
- [ ] Test FE local → BE Railway (nếu cần)
- [ ] Deploy và test FE Railway → BE Railway

