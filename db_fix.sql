SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs, user_consents, policies, user_profiles, user_roles, roles, users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE users (
    cognito_sub VARCHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0
);

CREATE TABLE user_roles (
    user_sub VARCHAR(36) NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_sub, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

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

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO roles (id, role_name, description) VALUES
(1, 'EMPLOYEE', 'Standard employee'),
(2, 'MANAGER', 'Team manager'),
(3, 'FINANCE', 'Finance accountant');

-- id=1 → Terms of Service, id=2 → Privacy Policy (compliance-view sends policyIds: [1, 2])
INSERT INTO policies (id, title, slug, version, content) VALUES
(1, 'Terms of Service', 'tos', '1.0', 'By using this platform you agree to our terms and conditions.'),
(2, 'Privacy Policy', 'privacy', '1.0', 'We collect and process your data in accordance with GDPR.');

-- DEV test user (Cognito sub from local testing)
INSERT INTO users (cognito_sub, username, email, status) VALUES
('47b40a38-2091-70e4-b5cb-a04aa64856f8', 'nguyenvanb', 'vanb@gmail.com', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('47b40a38-2091-70e4-b5cb-a04aa64856f8', 1); -- EMPLOYEE
