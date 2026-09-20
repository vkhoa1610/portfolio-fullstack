SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS finance_reports, report_templates, expense_reports, gdpr_audit_log, policy_evaluation_history, expenses, audit_logs, user_consents, policies, user_profiles,
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
    policy_type ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'AI_DATA_PROCESSING') NOT NULL DEFAULT 'TERMS_OF_SERVICE',
    version VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    is_current_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0
);

-- NOTE: user_consents has no FK to users(cognito_sub) — intentional, to allow
-- post-erasure anonymization (user_sub → 'DELETED-<sha256>') without losing consent evidence.
-- user_sub widened to VARCHAR(80) to fit 'DELETED-' + 64-char SHA-256 hex digest.
CREATE TABLE user_consents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(80) NULL,
    policy_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    consent_method ENUM('explicit_checkbox', 'demo_login', 'api_import') NOT NULL DEFAULT 'explicit_checkbox',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_uc_policy FOREIGN KEY (policy_id) REFERENCES policies(id),
    INDEX idx_uc_user_policy (user_sub, policy_id)
);

-- NOTE: expenses.user_sub has no FK to users — intentional, to allow
-- GDPR pseudonymization (user_sub → 'DELETED-<sha256>') while keeping the
-- financial record intact (GoBD §14, 10-year retention).
CREATE TABLE expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(80) NOT NULL,
    type ENUM('RECEIPT', 'PER_DIEM', 'MILEAGE') NOT NULL,
    title VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'DRAFT',

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
    paid_at TIMESTAMP NULL,

    -- GoBD retention. Populated atomically by ExpenseService.pay() / batchPay()
    -- at the same moment paid_at is set: retention_expires_at = paid_date + 10 years.
    -- Computed in SQL (DATE_ADD) so there's no Java/DB clock drift and no backfill needed.
    retention_expires_at DATE NULL,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0,

    INDEX idx_exp_user_status (user_sub, status),
    INDEX idx_exp_retention (retention_expires_at),
    -- Speeds up the manager approval queue's duplicate-detection subquery,
    -- which matches on (user_sub, receipt_date, amount) before comparing
    -- vendor_name.
    INDEX idx_exp_dup_lookup (user_sub, receipt_date, amount)
);

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

-- GDPR audit log: tracks erasure & export events for compliance evidence.
-- No FK to users — subject may already be hard-deleted; subject_token (SHA-256 of original
-- cognito_sub) links related events across the erasure workflow lifecycle.
-- This table is append-only and must NEVER be deleted.
CREATE TABLE gdpr_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM(
        'ERASURE_REQUESTED',
        'ERASURE_PII_DELETED',
        'ERASURE_FINANCIAL_PSEUDONYMIZED',
        'ERASURE_COMPLETED',
        'DATA_EXPORTED',
        'FINANCE_GOBD_CONFIRMED'
    ) NOT NULL,
    subject_sub   VARCHAR(36) NULL,
    subject_token VARCHAR(64) NOT NULL,
    actor_sub     VARCHAR(36) NULL,
    actor_role    VARCHAR(32),
    details_json  JSON,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_gdpr_subject_token (subject_token, created_at DESC),
    INDEX idx_gdpr_event_created (event_type, created_at DESC)
);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO roles (id, role_name, description) VALUES
(1, 'EMPLOYEE', 'Standard employee'),
(2, 'MANAGER', 'Team manager'),
(3, 'FINANCE', 'Finance accountant');

-- id=1 → Terms of Service, id=2 → Privacy Policy (compliance-view sends policyIds: [1, 2])
INSERT INTO policies (id, title, slug, policy_type, version, content) VALUES
(1, 'Terms of Service', 'tos', 'TERMS_OF_SERVICE', '1.0', 'By using this platform you agree to our terms and conditions.'),
(2, 'Privacy Policy', 'privacy', 'PRIVACY_POLICY', '1.0', 'We collect and process your data in accordance with GDPR.'),
(3, 'AI Data Processing', 'ai-data', 'AI_DATA_PROCESSING', '1.0', 'You consent to OCR processing of uploaded receipt images via Groq Vision API.');

-- ============================================
-- DEMO USERS (Auth0)
-- sub format: auth0|<24 hex chars>
-- Passwords set in Auth0 dashboard
-- ============================================

-- EMPLOYEE: Anna Müller
INSERT INTO users (cognito_sub, username, email, status) VALUES
('auth0|69db9135b65ad959bd52d81e', 'anna.mueller', 'employee@portfolio.app', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('auth0|69db9135b65ad959bd52d81e', 1); -- EMPLOYEE

INSERT INTO user_profiles (user_sub, first_name, last_name, phone_number, language_code) VALUES
('auth0|69db9135b65ad959bd52d81e', 'Anna', 'Müller', '+49 151 1234 5601', 'de-DE');

-- EMPLOYEE (fresh — no profile row, triggers onboarding flow on first login)
INSERT INTO users (cognito_sub, username, email, status) VALUES
('auth0|6aa6a3ab8f4c5973799d168c', 'new.employee', 'new-employee@portfolio.app', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('auth0|6aa6a3ab8f4c5973799d168c', 1); -- EMPLOYEE
-- Intentionally NO INSERT into user_profiles or user_consents:
--   UserProfileService infers onboardingStatus from user_profiles existence,
--   so the absence of a row here forces the /onboarding redirect on login.

-- MANAGER: Thomas Weber
INSERT INTO users (cognito_sub, username, email, status) VALUES
('auth0|69db914919afd97398d23e56', 'thomas.weber', 'manager@portfolio.app', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('auth0|69db914919afd97398d23e56', 2); -- MANAGER

INSERT INTO user_profiles (user_sub, first_name, last_name, phone_number, language_code) VALUES
('auth0|69db914919afd97398d23e56', 'Thomas', 'Weber', '+49 151 1234 5602', 'de-DE');

-- FINANCE: Sarah Chen
INSERT INTO users (cognito_sub, username, email, status) VALUES
('auth0|69db915cb65ad959bd52d82d', 'sarah.chen', 'finance@portfolio.app', 'active');

INSERT INTO user_roles (user_sub, role_id) VALUES
('auth0|69db915cb65ad959bd52d82d', 3); -- FINANCE

INSERT INTO user_profiles (user_sub, first_name, last_name, phone_number, language_code) VALUES
('auth0|69db915cb65ad959bd52d82d', 'Sarah', 'Chen', '+49 151 1234 5603', 'en-US');

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

-- ADMIN: David Kim
INSERT INTO users (cognito_sub, username, email, status) VALUES
('auth0|69db916e19afd97398d23e73', 'david.kim', 'admin@portfolio.app', 'active');

INSERT INTO system_admins (cognito_sub, email) VALUES
('auth0|69db916e19afd97398d23e73', 'admin@portfolio.app');

INSERT INTO user_profiles (user_sub, first_name, last_name, phone_number, language_code) VALUES
('auth0|69db916e19afd97398d23e73', 'David', 'Kim', '+49 151 1234 5604', 'en-US');

-- Permissions seed
INSERT INTO permissions (id, permission_code, description) VALUES
(1, 'EXPENSE_APPROVE', 'Approve expense reports'),
(2, 'EXPENSE_REJECT',  'Reject expense reports'),
(3, 'FINANCE_VIEW',    'View finance overview'),
(4, 'FINANCE_EXPORT',  'Export finance reports');

-- Grant manager approve + reject
INSERT INTO user_permissions (user_sub, permission_id, granted_by) VALUES
('auth0|69db914919afd97398d23e56', 1, 'system'),
('auth0|69db914919afd97398d23e56', 2, 'system');

-- Grant finance view + export
INSERT INTO user_permissions (user_sub, permission_id, granted_by) VALUES
('auth0|69db915cb65ad959bd52d82d', 3, 'system'),
('auth0|69db915cb65ad959bd52d82d', 4, 'system');

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

-- Items: manager
INSERT INTO items (cognito_sub, function_id, granted_by) VALUES
('auth0|69db914919afd97398d23e56', 1, 'system'),
('auth0|69db914919afd97398d23e56', 2, 'system');

-- Items: finance
INSERT INTO items (cognito_sub, function_id, granted_by) VALUES
('auth0|69db915cb65ad959bd52d82d', 3, 'system'),
('auth0|69db915cb65ad959bd52d82d', 4, 'system');

-- ============================================
-- AI REPORT TABLE
-- ============================================

CREATE TABLE report_templates (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    config_json JSON NOT NULL,
    created_by  VARCHAR(36),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1) DEFAULT 0
);

INSERT INTO report_templates (name, config_json, created_by) VALUES (
    'Default Template',
    '{"title":"Monthly Expense Report","company":"My Company GmbH","logoUrl":"","primaryColor":"#1E40AF","sections":[{"key":"executiveSummary","enabled":true},{"key":"breakdownByCategory","enabled":true},{"key":"byEmployee","enabled":true},{"key":"anomalies","enabled":true},{"key":"recommendations","enabled":true},{"key":"aiAnalysis","enabled":true}]}',
    'system'
);

CREATE TABLE expense_reports (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    period        VARCHAR(7)  NOT NULL,
    status        ENUM('PENDING', 'DONE', 'FAILED') DEFAULT 'PENDING',
    report_data   JSON,
    markdown      LONGTEXT,
    error_msg     VARCHAR(500),
    generated_at  DATETIME,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Screen configs: expense creation policy panels (text stored as i18n keys)
INSERT INTO screen_configs (screen_key, version, config_json, updated_by) VALUES
('expense.create.receipt', 1, '{
  "part_id": "EXP_CREATE_RECEIPT",
  "compliance": [
    {
      "id": "currency_mismatch",
      "icon": "currency_exchange",
      "title_key": "expense.policy.receipt.currency_mismatch.title",
      "pending_desc_key": "expense.policy.receipt.currency_mismatch.pending",
      "ok_desc_key": "expense.policy.receipt.currency_mismatch.ok",
      "triggered_desc_key": "expense.policy.receipt.currency_mismatch.triggered",
      "severity": "error",
      "blocks_save": true,
      "condition": "currency_mismatch"
    },
    {
      "id": "spending_limit",
      "icon": "price_check",
      "title_key": "expense.policy.receipt.spending_limit.title",
      "pending_desc_key": "expense.policy.receipt.spending_limit.pending",
      "ok_desc_key": "expense.policy.receipt.spending_limit.ok",
      "triggered_desc_key": "expense.policy.receipt.spending_limit.triggered",
      "severity": "warning",
      "blocks_save": false,
      "condition": "spending_limit_exceeded"
    },
    {
      "id": "vat_accuracy",
      "icon": "receipt_long",
      "title_key": "expense.policy.receipt.vat_accuracy.title",
      "pending_desc_key": "expense.policy.receipt.vat_accuracy.pending",
      "ok_desc_key": "expense.policy.receipt.vat_accuracy.ok",
      "triggered_desc_key": "expense.policy.receipt.vat_accuracy.triggered",
      "severity": "warning",
      "blocks_save": false,
      "condition": "vat_unusual"
    },
    {
      "id": "merchant_recognized",
      "icon": "storefront",
      "title_key": "expense.policy.receipt.merchant_recognized.title",
      "pending_desc_key": "expense.policy.receipt.merchant_recognized.pending",
      "ok_desc_key": "expense.policy.receipt.merchant_recognized.ok",
      "triggered_desc_key": "expense.policy.receipt.merchant_recognized.triggered",
      "severity": "info",
      "blocks_save": false,
      "condition": "merchant_unrecognized"
    },
    {
      "id": "ai_confidence",
      "icon": "psychology",
      "title_key": "expense.policy.receipt.ai_confidence.title",
      "pending_desc_key": "expense.policy.receipt.ai_confidence.pending",
      "ok_desc_key": "expense.policy.receipt.ai_confidence.ok",
      "triggered_desc_key": "expense.policy.receipt.ai_confidence.triggered",
      "severity": "warning",
      "blocks_save": false,
      "condition": "ai_low_confidence"
    }
  ],
  "insight": [
    {
      "id": "recurring_vendor",
      "icon": "auto_awesome",
      "severity": "info",
      "title_key": "expense.policy.receipt.insight.recurring_vendor.title",
      "text_key": "expense.policy.receipt.insight.recurring_vendor.text",
      "link_label_key": "expense.policy.receipt.insight.recurring_vendor.link",
      "condition": "has_scan_result"
    }
  ]
}', 'system');

INSERT INTO screen_configs (screen_key, version, config_json, updated_by) VALUES
('expense.create.per_diem', 1, '{
  "part_id": "EXP_CREATE_PER_DIEM",
  "compliance": [
    {
      "id": "location_tier_match",
      "icon": "location_on",
      "title_key": "expense.policy.per_diem.location_tier_match.title",
      "pending_desc_key": "expense.policy.per_diem.location_tier_match.pending",
      "ok_desc_key": "expense.policy.per_diem.location_tier_match.ok",
      "triggered_desc_key": "expense.policy.per_diem.location_tier_match.triggered",
      "severity": "success",
      "blocks_save": false,
      "condition": "location_selected"
    },
    {
      "id": "duration_match",
      "icon": "date_range",
      "title_key": "expense.policy.per_diem.duration_match.title",
      "pending_desc_key": "expense.policy.per_diem.duration_match.pending",
      "ok_desc_key": "expense.policy.per_diem.duration_match.ok",
      "triggered_desc_key": "expense.policy.per_diem.duration_match.triggered",
      "severity": "success",
      "blocks_save": false,
      "condition": "duration_valid"
    },
    {
      "id": "meal_deduction",
      "icon": "restaurant",
      "title_key": "expense.policy.per_diem.meal_deduction.title",
      "pending_desc_key": "expense.policy.per_diem.meal_deduction.pending",
      "ok_desc_key": "expense.policy.per_diem.meal_deduction.ok",
      "triggered_desc_key": "expense.policy.per_diem.meal_deduction.triggered",
      "severity": "warning",
      "blocks_save": false,
      "condition": "meal_deduction_required"
    },
    {
      "id": "proration",
      "icon": "calculate",
      "title_key": "expense.policy.per_diem.proration.title",
      "pending_desc_key": "expense.policy.per_diem.proration.pending",
      "ok_desc_key": "expense.policy.per_diem.proration.ok",
      "triggered_desc_key": "expense.policy.per_diem.proration.triggered",
      "severity": "info",
      "blocks_save": false,
      "condition": "duration_valid"
    }
  ],
  "insight": [
    {
      "id": "proration_note",
      "icon": "auto_awesome",
      "severity": "info",
      "title_key": "expense.policy.per_diem.insight.proration_note.title",
      "text_key": "expense.policy.per_diem.insight.proration_note.text",
      "link_label_key": "expense.policy.per_diem.insight.proration_note.link",
      "condition": "duration_valid"
    }
  ]
}', 'system');

INSERT INTO screen_configs (screen_key, version, config_json, updated_by) VALUES
('expense.create.mileage', 1, '{
  "part_id": "EXP_CREATE_MILEAGE",
  "compliance": [
    {
      "id": "distance_variance",
      "icon": "route",
      "title_key": "expense.policy.mileage.distance_variance.title",
      "pending_desc_key": "expense.policy.mileage.distance_variance.pending",
      "ok_desc_key": "expense.policy.mileage.distance_variance.ok",
      "triggered_desc_key": "expense.policy.mileage.distance_variance.triggered",
      "severity": "warning",
      "blocks_save": false,
      "condition": "distance_over_limit"
    },
    {
      "id": "commute_deduction",
      "icon": "directions_car",
      "title_key": "expense.policy.mileage.commute_deduction.title",
      "pending_desc_key": "expense.policy.mileage.commute_deduction.pending",
      "ok_desc_key": "expense.policy.mileage.commute_deduction.ok",
      "triggered_desc_key": "expense.policy.mileage.commute_deduction.triggered",
      "severity": "info",
      "blocks_save": false,
      "condition": "possible_commute"
    },
    {
      "id": "reimbursement_rate",
      "icon": "payments",
      "title_key": "expense.policy.mileage.reimbursement_rate.title",
      "pending_desc_key": "expense.policy.mileage.reimbursement_rate.pending",
      "ok_desc_key": "expense.policy.mileage.reimbursement_rate.ok",
      "triggered_desc_key": "expense.policy.mileage.reimbursement_rate.triggered",
      "severity": "info",
      "blocks_save": false,
      "condition": "has_distance"
    },
    {
      "id": "efficiency_suggestion",
      "icon": "eco",
      "title_key": "expense.policy.mileage.efficiency_suggestion.title",
      "pending_desc_key": "expense.policy.mileage.efficiency_suggestion.pending",
      "ok_desc_key": "expense.policy.mileage.efficiency_suggestion.ok",
      "triggered_desc_key": "expense.policy.mileage.efficiency_suggestion.triggered",
      "severity": "warning",
      "blocks_save": false,
      "condition": "distance_over_efficiency"
    }
  ],
  "insight": [
    {
      "id": "receipt_note",
      "icon": "auto_awesome",
      "severity": "info",
      "title_key": "expense.policy.mileage.insight.receipt_note.title",
      "text_key": "expense.policy.mileage.insight.receipt_note.text",
      "link_label_key": "expense.policy.mileage.insight.receipt_note.link",
      "condition": "always"
    }
  ]
}', 'system');

-- Screen config: manager approvals detail
INSERT INTO screen_configs (screen_key, version, config_json, updated_by) VALUES
('manager.approvals.detail', 1, '{
  "screen_key": "manager.approvals.detail",
  "root": {
    "id": "page",
    "type": "layout.page",
    "parts": [
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

-- ============================================
-- EXAMPLE EXPENSES (2026-03) — for AI report demo
-- average ≈ 316 EUR → anomalies: Software License (1500), Hardware Purchase (850)
-- ============================================

-- Anna Müller (EMPLOYEE) expenses
INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'Office Supplies', 45.00, 'EUR', 'APPROVED', 'Staples GmbH', '2026-03-02', 7.18, '2026-03-02 09:00:00', '2026-03-03 10:00:00', '2026-03-02 09:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'Team Lunch', 120.50, 'EUR', 'APPROVED', 'Restaurant Zur Post', '2026-03-05', 19.24, '2026-03-05 14:00:00', '2026-03-06 09:00:00', '2026-03-05 14:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, distance_km, rate_per_km, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'MILEAGE', 'Client Visit Berlin', 75.00, 'EUR', 'APPROVED', 250.00, 0.30, '2026-03-07 08:00:00', '2026-03-08 10:00:00', '2026-03-07 08:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, trip_from, trip_to, country_code, per_diem_rate, per_diem_days, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'PER_DIEM', 'Frankfurt Conference', 195.00, 'EUR', 'APPROVED', '2026-03-10', '2026-03-11', 'DEU', 97.50, 2, '2026-03-11 18:00:00', '2026-03-12 09:00:00', '2026-03-10 08:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'Software License', 1500.00, 'EUR', 'APPROVED', 'JetBrains s.r.o.', '2026-03-12', 239.50, '2026-03-12 11:00:00', '2026-03-13 10:00:00', '2026-03-12 11:00:00');

-- Duplicate-detection demo: two PENDING_REVIEW receipts, same vendor/amount/
-- receipt date, submitted 5 minutes apart. The manager approval queue's
-- duplicate-detection subquery flags the LATER one (this one, submitted at
-- 12:05) as a possible duplicate of the earlier one (12:00) — the earlier
-- row is never flagged. See ExpenseMapper.xml's findForManagerByStatus.
INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'Client Dinner', 16.90, 'EUR', 'PENDING_REVIEW', 'Bahnhof Bistro München', '2026-04-03', 2.70, '2026-04-03 12:00:00', '2026-04-03 12:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'Client Dinner', 16.90, 'EUR', 'PENDING_REVIEW', 'Bahnhof Bistro München', '2026-04-03', 2.70, '2026-04-03 12:05:00', '2026-04-03 12:05:00');

-- Per-diem subtitle demo: 1-day trip to Austria, PENDING_REVIEW — exercises
-- the "{country} · {days} Tag" singular-day formatting in buildSubtitle.ts.
INSERT INTO expenses (user_sub, type, title, amount, currency, status, trip_from, trip_to, country_code, per_diem_rate, per_diem_days, submitted_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'PER_DIEM', 'Q1 Vienna Trip', 97.50, 'EUR', 'PENDING_REVIEW', '2026-04-05', '2026-04-05', 'AT', 97.50, 1, '2026-04-05 09:00:00', '2026-04-05 09:00:00');

-- Thomas Weber (MANAGER) expenses
INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db914919afd97398d23e56', 'RECEIPT', 'Vendor Meeting Dinner', 210.00, 'EUR', 'APPROVED', 'Hotel Vier Jahreszeiten', '2026-03-06', 33.53, '2026-03-06 21:00:00', '2026-03-07 09:00:00', '2026-03-06 21:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, trip_from, trip_to, country_code, per_diem_rate, per_diem_days, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db914919afd97398d23e56', 'PER_DIEM', 'Munich Business Trip', 390.00, 'EUR', 'APPROVED', '2026-03-08', '2026-03-11', 'DEU', 97.50, 4, '2026-03-11 17:00:00', '2026-03-12 10:00:00', '2026-03-08 07:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, distance_km, rate_per_km, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db914919afd97398d23e56', 'MILEAGE', 'Site Inspection', 90.00, 'EUR', 'APPROVED', 300.00, 0.30, '2026-03-14 17:00:00', '2026-03-15 09:00:00', '2026-03-14 17:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db914919afd97398d23e56', 'RECEIPT', 'Hardware Purchase', 850.00, 'EUR', 'APPROVED', 'Dell Technologies', '2026-03-15', 135.80, '2026-03-15 14:00:00', '2026-03-16 09:00:00', '2026-03-15 14:00:00');

-- Sarah Chen (FINANCE) expenses
INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db915cb65ad959bd52d82d', 'RECEIPT', 'Accounting Tools', 89.00, 'EUR', 'APPROVED', 'DATEV eG', '2026-03-03', 14.22, '2026-03-03 10:00:00', '2026-03-04 09:00:00', '2026-03-03 10:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, trip_from, trip_to, country_code, per_diem_rate, per_diem_days, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db915cb65ad959bd52d82d', 'PER_DIEM', 'Tax Seminar Hamburg', 175.00, 'EUR', 'APPROVED', '2026-03-11', '2026-03-12', 'DEU', 87.50, 2, '2026-03-12 18:00:00', '2026-03-13 09:00:00', '2026-03-11 08:00:00');

INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, created_at) VALUES
('auth0|69db915cb65ad959bd52d82d', 'RECEIPT', 'Printer Cartridges', 55.00, 'EUR', 'APPROVED', 'Conrad Electronic', '2026-03-18', 8.79, '2026-03-18 11:00:00', '2026-03-19 09:00:00', '2026-03-18 11:00:00');

-- ============================================
-- FINANCE REPORTS TABLE
-- ============================================

CREATE TABLE finance_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_sub VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type ENUM('FINANCIAL','ANALYTICS','OPERATIONS','COMPLIANCE') NOT NULL,
    fiscal_period VARCHAR(20),
    due_date DATE,
    description TEXT,
    priority ENUM('LOW','NORMAL','HIGH','URGENT') DEFAULT 'NORMAL',
    total_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    line_items JSON,
    attachments JSON,
    approval_route JSON,
    notify_cc JSON,
    status ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED') DEFAULT 'DRAFT',
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    CONSTRAINT fk_fr_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub)
);

-- Demo finance reports (Sarah Chen — FINANCE)
INSERT INTO finance_reports (user_sub, title, report_type, fiscal_period, due_date, description, priority, total_amount, currency, line_items, approval_route, status, submitted_at, created_at) VALUES
(
  'auth0|69db915cb65ad959bd52d82d',
  'Q1 2026 Revenue Report',
  'FINANCIAL',
  'Q1 2026',
  '2026-03-31',
  'Quarterly revenue and expense summary for Finance department.',
  'HIGH',
  48200.00,
  'EUR',
  '[{"description":"Personnel costs","category":"OPEX","amount":32000},{"description":"Travel & expenses","category":"OPEX","amount":16200}]',
  '[{"level":1,"reviewerName":"Minh Tran","deadlineDays":3},{"level":2,"reviewerName":"Hoa Nguyen","deadlineDays":5},{"level":3,"reviewerName":"Long Pham","deadlineDays":7}]',
  'PENDING_REVIEW',
  '2026-03-20 09:00:00',
  '2026-03-19 14:00:00'
);

INSERT INTO finance_reports (user_sub, title, report_type, fiscal_period, due_date, description, priority, total_amount, currency, line_items, approval_route, status, created_at) VALUES
(
  'auth0|69db915cb65ad959bd52d82d',
  'March Compliance Report',
  'COMPLIANCE',
  'Q1 2026',
  '2026-04-15',
  'Monthly compliance audit summary including GDPR checks.',
  'NORMAL',
  5400.00,
  'EUR',
  '[{"description":"External audit fees","category":"OPEX","amount":4500},{"description":"Compliance tools","category":"CAPEX","amount":900}]',
  '[{"level":1,"reviewerName":"Minh Tran","deadlineDays":3},{"level":2,"reviewerName":"Hoa Nguyen","deadlineDays":5}]',
  'DRAFT',
  '2026-03-22 11:00:00'
);

-- ============================================
-- GDPR demo: PENDING erasure request for Anna Müller (employee).
--
-- INTENTIONALLY COMMENTED OUT so the demo flow starts clean:
--   1. Login as Anna → /profile/privacy → erasure form is visible → submit reason
--   2. Status banner appears ("being processed... GDPR Art. 12")
--   3. Login as David Kim (admin) → /admin/users/auth0|69db... → Privacy & GDPR tab
--      → process erasure → 3 audit events ghi liên tiếp
--
-- Uncomment if you need the admin queue pre-populated (e.g. screenshot of pending state
-- without going through the submit step first).
-- ============================================
-- INSERT INTO gdpr_audit_log (event_type, subject_sub, subject_token, actor_sub, actor_role, details_json) VALUES (
--   'ERASURE_REQUESTED',
--   'auth0|69db9135b65ad959bd52d81e',
--   SHA2('auth0|69db9135b65ad959bd52d81e', 256),
--   'auth0|69db9135b65ad959bd52d81e',
--   'EMPLOYEE',
--   JSON_OBJECT('reason', 'Left the company, please remove my personal data per GDPR Art. 17.')
-- );

-- ============================================
-- Demo: consent records for Anna Müller (employee)
-- so the Privacy Center consent history isn't empty.
-- ============================================
INSERT INTO user_consents (user_sub, policy_id, ip_address, user_agent, consent_method, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 1, '203.0.113.42', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15', 'explicit_checkbox', '2025-11-15 09:23:00'),
('auth0|69db9135b65ad959bd52d81e', 2, '203.0.113.42', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15', 'explicit_checkbox', '2025-11-15 09:23:00'),
('auth0|69db9135b65ad959bd52d81e', 3, '203.0.113.42', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15', 'explicit_checkbox', '2025-12-02 14:11:00');

-- Seeded demo accounts (Thomas / Sarah / David) never went through the real
-- onboarding checkbox flow, but the app assumes every active user has valid
-- consent on file (Privacy Center, GDPR export, AI OCR gating all depend on it).
-- Mark these rows with consent_method='demo_login' so audits can distinguish
-- portfolio-seeded consent from real user-provided consent.
INSERT INTO user_consents (user_sub, policy_id, ip_address, user_agent, consent_method, created_at) VALUES
-- Thomas Weber (MANAGER)
('auth0|69db914919afd97398d23e56', 1, '127.0.0.1', 'demo-seed', 'demo_login', '2025-11-01 09:00:00'),
('auth0|69db914919afd97398d23e56', 2, '127.0.0.1', 'demo-seed', 'demo_login', '2025-11-01 09:00:00'),
-- Sarah Chen (FINANCE)
('auth0|69db915cb65ad959bd52d82d', 1, '127.0.0.1', 'demo-seed', 'demo_login', '2025-11-01 09:00:00'),
('auth0|69db915cb65ad959bd52d82d', 2, '127.0.0.1', 'demo-seed', 'demo_login', '2025-11-01 09:00:00'),
-- David Kim (ADMIN)
('auth0|69db916e19afd97398d23e73', 1, '127.0.0.1', 'demo-seed', 'demo_login', '2025-11-01 09:00:00'),
('auth0|69db916e19afd97398d23e73', 2, '127.0.0.1', 'demo-seed', 'demo_login', '2025-11-01 09:00:00');

-- ============================================
-- Phase 4 demo seeds: PAID expenses (for retention badge) + one
-- already-pseudonymized erasure (for Finance GoBD confirmation banner)
-- ============================================

-- PAID expense, retention active (~10 years from now): Under retention badge
INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, paid_at, retention_expires_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'DB Bahn ticket Berlin → Frankfurt', 89.50, 'EUR', 'PAID', 'Deutsche Bahn AG', '2026-04-10', 5.73, '2026-04-11 09:00:00', '2026-04-12 10:00:00', '2026-04-15 08:00:00', '2036-04-15', '2026-04-10 14:00:00');

-- PAID expense, retention already expired (paid in 2014): Expired badge
INSERT INTO expenses (user_sub, type, title, amount, currency, status, vendor_name, receipt_date, vat_amount, submitted_at, reviewed_at, paid_at, retention_expires_at, created_at) VALUES
('auth0|69db9135b65ad959bd52d81e', 'RECEIPT', 'Office supplies — legacy entry', 42.00, 'EUR', 'PAID', 'Staples', '2014-03-15', 6.71, '2014-03-16 09:00:00', '2014-03-17 10:00:00', '2014-03-20 08:00:00', '2024-03-20', '2014-03-15 14:00:00');

-- Demo pre-processed erasure for Sarah Chen (FINANCE) to confirm — fictitious legacy employee.
-- Two events written in order: PSEUDONYMIZED (awaiting FINANCE_GOBD_CONFIRMED).
INSERT INTO gdpr_audit_log (event_type, subject_sub, subject_token, actor_sub, actor_role, details_json, created_at) VALUES
('ERASURE_REQUESTED',                'auth0|legacy0000000000000000legacy', SHA2('auth0|legacy0000000000000000legacy', 256), 'auth0|legacy0000000000000000legacy', 'EMPLOYEE', JSON_OBJECT('reason', 'Former employee, contract ended 2025-12.'),                                                                              '2026-05-01 09:30:00'),
('ERASURE_FINANCIAL_PSEUDONYMIZED', 'auth0|legacy0000000000000000legacy', SHA2('auth0|legacy0000000000000000legacy', 256), 'auth0|admin000000000000000000001', 'ADMIN',    JSON_OBJECT('anonymized_sub', CONCAT('DELETED-', SHA2('auth0|legacy0000000000000000legacy', 256)), 'expenses_pseudonymized', 3, 'user_consents_anonymized', 2), '2026-05-02 14:00:00');
