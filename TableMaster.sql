

-- =============================================
-- 1. GROUP IDENTITY & HIERARCHY
-- =============================================

-- 1.1 Table: users
CREATE TABLE users (
    cognito_sub VARCHAR(36) NOT NULL PRIMARY KEY, -- ID gốc từ AWS Cognito
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    
    -- Audit Columns (created_by cũng là UUID)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0
);

-- 1.2 Table: roles (Giữ nguyên ID số vì roles là tĩnh)
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0
);

-- 1.3 Table: user_roles
CREATE TABLE user_roles (
    user_sub VARCHAR(36) NOT NULL, -- Tham chiếu tới users.cognito_sub
    role_id INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    
    PRIMARY KEY (user_sub, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- =============================================
-- 2. GROUP PROFILE & LOCALIZATION
-- =============================================

-- 2.1 Table: user_profiles
CREATE TABLE user_profiles (
    user_sub VARCHAR(36) PRIMARY KEY, -- Quan hệ 1-1, dùng luôn user_sub làm PK
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20),
    avatar_url VARCHAR(255),
    address TEXT,
    language_code VARCHAR(5) DEFAULT 'vi-VN',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    
    CONSTRAINT fk_up_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub) ON DELETE CASCADE
);

-- =============================================
-- 3. GROUP COMPLIANCE (GDPR/LEGAL)
-- =============================================

-- 3.1 Table: policies (Giữ ID số vì policies do hệ thống tạo)
CREATE TABLE policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    is_current_active TINYINT(1) DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0
);

-- 3.2 Table: user_consents
CREATE TABLE user_consents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(36) NOT NULL, -- Update kiểu dữ liệu
    policy_id INT NOT NULL,
    
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    
    CONSTRAINT fk_uc_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub),
    CONSTRAINT fk_uc_policy FOREIGN KEY (policy_id) REFERENCES policies(id)
);

-- =============================================
-- 4. GROUP AUDIT TRAIL
-- =============================================

-- 4.1 Table: audit_logs
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    
    -- QUAN TRỌNG: record_id giờ phải là VARCHAR để chứa được cả UUID (User) lẫn INT (Policy)
    record_id VARCHAR(50) NOT NULL, 
    
    action_type ENUM('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'REVOKE') NOT NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    
    created_by VARCHAR(36) NULL, -- Người thực hiện là UUID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    user_ip VARCHAR(45),
    user_agent VARCHAR(255)
);


-- 1. Tạo Users (Admin & Member) với UUID giả
-- Giả sử '00000000-0000-0000-0000-000000000001' là SYSTEM/ROOT ADMIN
INSERT INTO users (cognito_sub, username, email, status, created_by) VALUES
('a1b2c3d4-0000-0000-0000-111111111111', 'superadmin', 'admin@sys.com', 'active', 'a1b2c3d4-0000-0000-0000-111111111111'),
('b2c3d4e5-0000-0000-0000-222222222222', 'nguyenvana', 'vana@gmail.com', 'active', 'a1b2c3d4-0000-0000-0000-111111111111'),
-- DEV/TEST: Real Cognito user for local onboarding testing
('47b40a38-2091-70e4-b5cb-a04aa64856f8', 'testuser_dev', 'testuser@dev.local', 'active', 'a1b2c3d4-0000-0000-0000-111111111111');

-- 2. Tạo Roles
INSERT INTO roles (role_name, description, created_by) VALUES
('EMPLOYEE', 'Standard employee', 'a1b2c3d4-0000-0000-0000-111111111111'),
('MANAGER', 'Team manager', 'a1b2c3d4-0000-0000-0000-111111111111'),
('FINANCE', 'Finance accountant', 'a1b2c3d4-0000-0000-0000-111111111111');

-- 3. Gán quyền (Dùng UUID user)
INSERT INTO user_roles (user_sub, role_id, created_by) VALUES
('a1b2c3d4-0000-0000-0000-111111111111', 2, 'a1b2c3d4-0000-0000-0000-111111111111'), -- Manager
('b2c3d4e5-0000-0000-0000-222222222222', 1, 'a1b2c3d4-0000-0000-0000-111111111111'); -- Employee

-- 4. Tạo Profile
INSERT INTO user_profiles (user_sub, first_name, last_name, created_by) VALUES 
('b2c3d4e5-0000-0000-0000-222222222222', 'An', 'Nguyen Van', 'b2c3d4e5-0000-0000-0000-222222222222');

-- 5. Tạo Policies
INSERT INTO policies (title, slug, version, content, created_by) VALUES 
('Terms of Service', 'tos', '1.0', 'Legal content...', 'a1b2c3d4-0000-0000-0000-111111111111'),
('Privacy Policy', 'privacy', '1.0', 'Privacy content...', 'a1b2c3d4-0000-0000-0000-111111111111');

-- 6. User Consent (Dùng UUID)
INSERT INTO user_consents (user_sub, policy_id, ip_address, created_at) VALUES 
('b2c3d4e5-0000-0000-0000-222222222222', 2, '192.168.1.50', NOW());

-- 7. Audit Log (Lưu ý record_id là String)
INSERT INTO audit_logs (table_name, record_id, action_type, new_value, created_by) VALUES 
('user_profiles', 'b2c3d4e5-0000-0000-0000-222222222222', 'INSERT', '{"name":"An"}', 'b2c3d4e5-0000-0000-0000-222222222222');