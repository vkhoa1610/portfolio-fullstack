SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS expenses, audit_logs, user_consents, policies, user_profiles,
    items, screen_configs, functions,
    user_permissions, user_roles, roles, permissions, system_admins, users;
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

-- Manager test user
INSERT INTO users (cognito_sub, username, email, status) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 'vkhoajap1610', 'vkhoajap1610@gmail.com', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 2); -- MANAGER

-- Finance test user
INSERT INTO users (cognito_sub, username, email, status) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 'sample-finance', 'sample-finance@gmail.com', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 3); -- FINANCE

-- ============================================
-- AUTHORIZATION TABLES
-- ============================================

-- ---- permissions ----
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0
);

CREATE TABLE user_permissions (
    user_sub VARCHAR(36) NOT NULL,
    permission_id INT NOT NULL,
    granted_by VARCHAR(36) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_sub, permission_id),
    CONSTRAINT fk_uperm_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub) ON DELETE CASCADE,
    CONSTRAINT fk_uperm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE system_admins (
    cognito_sub VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0
);

-- System admin seed
-- Must insert into users first (FK referenced by user_consents, user_profiles, etc.)
INSERT INTO users (cognito_sub, username, email, status) VALUES
('d704fab8-8021-7066-8f76-bc9f3f147975', 'sample-admin', 'sample-admin@gmail.com', 'active');

INSERT INTO system_admins (cognito_sub, email) VALUES
('d704fab8-8021-7066-8f76-bc9f3f147975', 'sample-admin@gmail.com');

INSERT INTO user_profiles (user_sub) VALUES
('d704fab8-8021-7066-8f76-bc9f3f147975');

-- Permissions seed
INSERT INTO permissions (id, permission_code, description) VALUES
(1, 'EXPENSE_APPROVE', 'Approve expense reports'),
(2, 'EXPENSE_REJECT',  'Reject expense reports'),
(3, 'FINANCE_VIEW',    'View finance overview'),
(4, 'FINANCE_EXPORT',  'Export finance reports');

-- Grant manager test user approve + reject
INSERT INTO user_permissions (user_sub, permission_id, granted_by) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 1, 'system'),
('37e4ca68-3051-7093-ee11-658d3aa0a191', 2, 'system');

-- Grant finance test user view + export
INSERT INTO user_permissions (user_sub, permission_id, granted_by) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 3, 'system'),
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 4, 'system');

-- ============================================
-- UI FUNCTIONS (CMS-DRIVEN)
-- ============================================

CREATE TABLE functions (
    function_id  INT AUTO_INCREMENT PRIMARY KEY,
    function_key VARCHAR(50) NOT NULL UNIQUE,
    module       VARCHAR(30) NOT NULL,
    description  VARCHAR(255),
    is_deleted   TINYINT(1) DEFAULT 0
);

CREATE TABLE items (
    cognito_sub  VARCHAR(36) NOT NULL,
    function_id  INT NOT NULL,
    granted_by   VARCHAR(36) NOT NULL,
    is_active    TINYINT(1) NOT NULL DEFAULT 1,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cognito_sub, function_id),
    CONSTRAINT fk_item_user FOREIGN KEY (cognito_sub) REFERENCES users(cognito_sub) ON DELETE CASCADE,
    CONSTRAINT fk_item_func FOREIGN KEY (function_id) REFERENCES functions(function_id) ON DELETE CASCADE
);

CREATE TABLE screen_configs (
    screen_key   VARCHAR(100) NOT NULL,
    version      INT NOT NULL DEFAULT 1,
    config_json  JSON NOT NULL,
    is_active    TINYINT(1) DEFAULT 1,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by   VARCHAR(36),
    PRIMARY KEY (screen_key, version)
);

-- Functions seed
INSERT INTO functions (function_id, function_key, module, description) VALUES
(1, 'EXPENSE_ACCEPT',        'MANAGER',  'Accept an expense report'),
(2, 'EXPENSE_REJECT',        'MANAGER',  'Reject an expense report'),
(3, 'FINANCE_VIEW_OVERVIEW', 'FINANCE',  'View finance overview page'),
(4, 'FINANCE_EXPORT',        'FINANCE',  'Export finance reports');

-- Items: manager test user
INSERT INTO items (cognito_sub, function_id, granted_by) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 1, 'system'),
('37e4ca68-3051-7093-ee11-658d3aa0a191', 2, 'system');

-- Items: finance test user
INSERT INTO items (cognito_sub, function_id, granted_by) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 3, 'system'),
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 4, 'system');

-- Screen config: manager approvals detail
INSERT INTO screen_configs (screen_key, version, config_json, updated_by) VALUES
('manager.approvals.detail', 1, '{
  "screen_key": "manager.approvals.detail",
  "root": {
    "id": "page",
    "type": "layout.page",
    "parts": [
      {
        "id": "expense-info",
        "type": "layout.card",
        "parts": [
          { "id": "field-amount",  "type": "display.field", "data_key": "amount" },
          { "id": "field-type",    "type": "display.field", "data_key": "type" },
          { "id": "field-date",    "type": "display.field", "data_key": "submitted_at" },
          { "id": "field-vendor",  "type": "display.field", "data_key": "vendor_name" }
        ]
      },
      {
        "id": "action-bar",
        "type": "layout.action-bar",
        "auto_hide_if_empty": true,
        "parts": [
          {
            "id": "btn-accept",
            "type": "input.button",
            "label_key": "manager.btn.accept",
            "variant": "primary",
            "action": "EXPENSE_ACCEPT",
            "function_id": 1
          },
          {
            "id": "btn-reject",
            "type": "input.button",
            "label_key": "manager.btn.reject",
            "variant": "danger",
            "action": "EXPENSE_REJECT",
            "function_id": 2
          }
        ]
      },
      {
        "id": "reject-form",
        "type": "layout.form",
        "function_id": 2,
        "parts": [
          {
            "id": "txt-reason",
            "type": "input.textarea",
            "label_key": "manager.rejection_reason",
            "required": true
          },
          {
            "id": "btn-confirm-reject",
            "type": "input.button",
            "label_key": "manager.btn.confirm_reject",
            "variant": "danger",
            "action": "EXPENSE_REJECT_SUBMIT"
          }
        ]
      }
    ]
  }
}', 'system');