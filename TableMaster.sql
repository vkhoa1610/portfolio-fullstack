

-- =============================================
-- 1. GROUP IDENTITY & HIERARCHY
-- =============================================

-- 1.1 Table: users
CREATE TABLE users (
    cognito_sub VARCHAR(36) NOT NULL PRIMARY KEY, -- Auth0 sub (format: auth0|<24hex>)
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


-- 4.2 Table: finance_reports
CREATE TABLE policy_evaluation_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    screen_key VARCHAR(100) NOT NULL,
    screen_version INT NULL,
    result_json JSON NOT NULL,
    input_json JSON NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,

    CONSTRAINT fk_peh_created_by FOREIGN KEY (created_by) REFERENCES users(cognito_sub),
    INDEX idx_peh_entity_event_created (entity_type, entity_id, event_type, created_at DESC),
    INDEX idx_peh_domain_screen_created (domain, screen_key, created_at DESC)
);

-- 4.3 Table: finance_reports
CREATE TABLE finance_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(36) NOT NULL,

    -- General info
    title VARCHAR(255) NOT NULL,
    report_type ENUM('FINANCIAL','ANALYTICS','OPERATIONS','COMPLIANCE') NOT NULL,
    fiscal_period VARCHAR(20),          -- e.g. "Q1 2026"
    due_date DATE,
    description TEXT,
    priority ENUM('LOW','NORMAL','HIGH','URGENT') DEFAULT 'NORMAL',

    -- Financial details
    total_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    line_items JSON,                    -- [{description, category, amount}]

    -- Attachments
    attachments JSON,                   -- [{fileUrl, fileName, fileSize, fileType}]

    -- Approval route
    approval_route JSON,                -- [{level, reviewerName, deadlineDays}]
    notify_cc JSON,                     -- [{name}]

    -- Workflow
    status ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED') DEFAULT 'DRAFT',
    submitted_at TIMESTAMP NULL,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,

    CONSTRAINT fk_fr_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub)
);


-- =============================================
-- 5. GROUP AUTHORIZATION (PERMISSION-BASED)
-- =============================================

-- 5.1 Table: permissions — master list of permission codes
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0
);

-- 5.2 Table: user_permissions — maps cognito_sub → permission
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

-- 5.3 Table: system_admins — separate Cognito pool, not in users table
CREATE TABLE system_admins (
    cognito_sub VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0
);

-- =============================================
-- 6. GROUP UI FUNCTIONS (CMS-DRIVEN)
-- =============================================

-- 6.1 Table: functions — master list of in-page actions
CREATE TABLE functions (
    function_id  INT AUTO_INCREMENT PRIMARY KEY,
    function_key VARCHAR(50) NOT NULL UNIQUE,   -- 'EXPENSE_ACCEPT', 'EXPENSE_REJECT'
    module       VARCHAR(30) NOT NULL,           -- 'MANAGER', 'FINANCE', 'EMPLOYEE'
    description  VARCHAR(255),
    is_deleted   TINYINT(1) DEFAULT 0
);

-- 6.2 Table: items — map cognito_sub → function_id
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

-- 6.3 Table: screen_configs — CMS JSON per screen, versioned
CREATE TABLE screen_configs (
    screen_key   VARCHAR(100) NOT NULL,
    version      INT NOT NULL DEFAULT 1,
    config_json  JSON NOT NULL,
    is_active    TINYINT(1) DEFAULT 1,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by   VARCHAR(36),
    PRIMARY KEY (screen_key, version)
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

-- 4. Permissions
INSERT INTO permissions (id, permission_code, description) VALUES
(1, 'EXPENSE_APPROVE', 'Approve expense reports'),
(2, 'EXPENSE_REJECT',  'Reject expense reports'),
(3, 'FINANCE_VIEW',    'View finance overview'),
(4, 'FINANCE_EXPORT',  'Export finance reports');

-- 5. Grant manager test user approve + reject permissions
INSERT INTO user_permissions (user_sub, permission_id, granted_by) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 1, 'system'),
('37e4ca68-3051-7093-ee11-658d3aa0a191', 2, 'system');

-- Grant finance test user view + export permissions
INSERT INTO user_permissions (user_sub, permission_id, granted_by) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 3, 'system'),
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 4, 'system');

-- 6. Functions
INSERT INTO functions (function_id, function_key, module, description) VALUES
(1, 'EXPENSE_ACCEPT',        'MANAGER',  'Accept an expense report'),
(2, 'EXPENSE_REJECT',        'MANAGER',  'Reject an expense report'),
(3, 'FINANCE_VIEW_OVERVIEW', 'FINANCE',  'View finance overview page'),
(4, 'FINANCE_EXPORT',        'FINANCE',  'Export finance reports');

-- 7. Items — grant manager test user
INSERT INTO items (cognito_sub, function_id, granted_by) VALUES
('37e4ca68-3051-7093-ee11-658d3aa0a191', 1, 'system'),
('37e4ca68-3051-7093-ee11-658d3aa0a191', 2, 'system');

-- Grant finance test user
INSERT INTO items (cognito_sub, function_id, granted_by) VALUES
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 3, 'system'),
('a7e4fa28-1051-704f-042a-f7fe9f450d8c', 4, 'system');

-- 8. Screen configs — manager approvals detail (mẫu)
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
          { "id": "field-amount",   "type": "display.field", "data_key": "amount" },
          { "id": "field-type",     "type": "display.field", "data_key": "type" },
          { "id": "field-date",     "type": "display.field", "data_key": "submitted_at" },
          { "id": "field-vendor",   "type": "display.field", "data_key": "vendor_name" }
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
