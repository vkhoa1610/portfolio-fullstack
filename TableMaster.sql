

-- =============================================
-- 1. GROUP IDENTITY & HIERARCHY
-- =============================================

-- 1.1 Table: users
CREATE TABLE users (
    cognito_sub VARCHAR(36) NOT NULL PRIMARY KEY, -- ID gốc từ AWS Cognito
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0
);

-- 1.2 Table: roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0
);

-- 1.3 Table: user_roles
CREATE TABLE user_roles (
    user_sub VARCHAR(36) NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_sub, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- =============================================
-- 2. GROUP PROFILE & LOCALIZATION
-- =============================================

-- 2.1 Table: user_profiles
CREATE TABLE user_profiles (
    user_sub VARCHAR(36) PRIMARY KEY,
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
    CONSTRAINT fk_up_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub)
);

-- =============================================
-- 3. GROUP COMPLIANCE (GDPR/LEGAL)
-- =============================================

-- 3.1 Table: policies
CREATE TABLE policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    version VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    is_current_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0
);

-- 3.2 Table: user_consents
CREATE TABLE user_consents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(36) NOT NULL,
    policy_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_uc_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub),
    CONSTRAINT fk_uc_policy FOREIGN KEY (policy_id) REFERENCES policies(id)
);

-- =============================================
-- 4. GROUP EXPENSES
-- =============================================

-- 4.1 Table: expenses
CREATE TABLE expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(36) NOT NULL,
    type ENUM('RECEIPT', 'PER_DIEM', 'MILEAGE') NOT NULL,
    title VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',

    -- Receipt fields
    vendor_name VARCHAR(255),
    receipt_date DATE,
    vat_amount DECIMAL(10,2),
    receipt_file_url VARCHAR(500),
    ai_extracted_data JSON,
    ai_flags JSON,

    -- Per Diem fields
    trip_from DATE,
    trip_to DATE,
    country_code VARCHAR(3),
    per_diem_rate DECIMAL(8,2),
    per_diem_days INT,

    -- Mileage fields
    distance_km DECIMAL(8,2),
    rate_per_km DECIMAL(5,2) DEFAULT 0.30,

    -- Workflow
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(36) NULL,
    rejection_reason TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0,

    CONSTRAINT fk_exp_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub)
);


-- =============================================
-- SEED DATA
-- =============================================

-- 1. Roles (explicit IDs để đảm bảo nhất quán)
INSERT INTO roles (id, role_name, description) VALUES
(1, 'EMPLOYEE', 'Standard employee'),
(2, 'MANAGER', 'Team manager'),
(3, 'FINANCE', 'Finance accountant');

-- 2. Policies (id=1 → ToS, id=2 → Privacy — compliance-view gửi policyIds: [1, 2])
INSERT INTO policies (id, title, slug, version, content) VALUES
(1, 'Terms of Service', 'tos', '1.0', 'By using this platform you agree to our terms and conditions.'),
(2, 'Privacy Policy', 'privacy', '1.0', 'We collect and process your data in accordance with GDPR.');

-- 3. Users & Roles

-- DEV/TEST: Employee
INSERT INTO users (cognito_sub, username, email, status) VALUES
('47b40a38-2091-70e4-b5cb-a04aa64856f8', 'nguyenvanb', 'vanb@gmail.com', 'active');
INSERT INTO user_roles (user_sub, role_id) VALUES
('47b40a38-2091-70e4-b5cb-a04aa64856f8', 1); -- EMPLOYEE

-- Manager test user
INSERT INTO users (cognito_sub, username, email, status) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 'vkhoajap1610', 'vkhoajap1610@gmail.com', 'active');
INSERT INTO user_roles (user_sub, role_id) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 2); -- MANAGER

-- Finance test user
INSERT INTO users (cognito_sub, username, email, status) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 'sample-finance', 'sample-fin@gmail.com', 'active');
INSERT INTO user_roles (user_sub, role_id) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 3); -- FINANCE
