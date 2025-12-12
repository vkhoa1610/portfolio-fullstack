# 🏗️ Hướng Dẫn Migrate sang Monorepo (Option 1)

Tài liệu này hướng dẫn bạn từng bước để gộp 3 projects (React, BFF, Java Spring Boot) vào một Git Repository duy nhất (Monorepo).

## 1. Cấu trúc đích (Target Structure)

Chúng ta sẽ tạo một folder mới tên là `portfolio-fullstack` với cấu trúc sau:

```
portfolio-fullstack/           # Root Folder (New Git Repo)
├── .gitignore                 # Root gitignore
├── docker-compose.yml         # Run ALL services (1-click)
├── README.md                  # Project Documentation
│
├── frontend/                  # React App (Source code từ my-app)
│   ├── Dockerfile
│   └── ...
│
├── bff/                       # Next.js BFF (Source code từ repo BFF)
│   ├── Dockerfile
│   └── ...
│
└── backend/                   # Java Spring Boot (Source code từ repo Backend)
    ├── Dockerfile
    └── ...
```

---

## 2. Các bước thực hiện (Terminal Commands)

### Bước 1: Tạo thư mục gốc và chuẩn bị Git

Mở Terminal và chạy (giả sử bạn đang ở cùng cấp với folder `my-app`):

```bash
# 1. Ra khỏi folder my-app (nếu đang ở trong)
cd ..

# 2. Tạo folder monorepo
mkdir portfolio-fullstack
cd portfolio-fullstack

# 3. Khởi tạo Git mới
git init
```

### Bước 2: Migrate Frontend (Project React hiện tại)

```bash
# 1. Copy project my-app vào folder frontend
# Lưu ý: Sửa đường dẫn '../my-app' nếu folder my-app nằm ở chỗ khác
cp -R ../my-app ./frontend

# 2. Xóa folder .git cũ của frontend (để tránh submodule conflict)
rm -rf frontend/.git
```

### Bước 3: Migrate BFF và Backend

Làm tương tự với 2 projects kia. Ví dụ nếu bạn clone từ git về:

```bash
# Clone BFF vào folder tạm, sau đó rename thành bff
git clone <URL_REPO_BFF> bff
rm -rf bff/.git  # Xóa lịch sử git cũ

# Clone Backend
git clone <URL_REPO_JAVA> backend
rm -rf backend/.git # Xóa lịch sử git cũ
```

### Bước 4: Tạo cấu hình Docker Compose chung

Tạo file `docker-compose.yml` tại thư mục gốc `portfolio-fullstack/` (sử dụng mẫu tôi đã cung cấp, nhưng cập nhật đường dẫn `build context`).

### Bước 5: Push lên GitHub mới

1. Vào GitHub tạo một repo mới: `portfolio-fullstack`
2. Push code lên:

```bash
git add .
git commit -m "Initial commit: Monorepo structure setup"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/portfolio-fullstack.git
git push -u origin main
```

---

## 3. Cập nhật `docker-compose.yml` ở Root

Tại root `portfolio-fullstack/docker-compose.yml`, nội dung sẽ như sau:

```yaml
version: "3.8"
services:
  frontend:
    build:
      context: ./frontend  # Trỏ vào folder frontend
      dockerfile: Dockerfile
    ports: ["3000:3000"]
    # ... (config cũ)

  bff:
    build:
      context: ./bff       # Trỏ vào folder bff
      dockerfile: Dockerfile
    ports: ["4000:4000"]
    # ...

  backend:
    build:
      context: ./backend   # Trỏ vào folder backend
      dockerfile: Dockerfile
    ports: ["8080:8080"]
    # ...
```

---

## 4. Ưu điểm của cách này cho Portfolio

1.  **Dễ nhìn**: Nhà tuyển dụng vào thấy ngay quy mô Full-stack.
2.  **Dễ chạy**: Clone repo này về và `docker-compose up` là lên hết 3 services.
3.  **Tập trung**: CI/CD pipeline có thể đặt ở root `.github/workflows` hoặc từng folder con.

Bây giờ, bạn hãy thực hiện **Bước 1, 2, 3** ở trên Terminal máy bạn.
Sau khi xong, hãy mở folder `portfolio-fullstack` trong VS Code và chúng ta sẽ tiếp tục cấu hình Docker Compose chi tiết!


