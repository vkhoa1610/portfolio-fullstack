SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs, user_consents, policies, user_profiles, user_roles, roles, users;
SET FOREIGN_KEY_CHECKS = 1;

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
    PRIMARY KEY (user_sub, role_id)
);

CREATE TABLE user_profiles (
    user_sub VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone_number VARCHAR(20),
    avatar_url VARCHAR(255),
    address TEXT,
    language_code VARCHAR(5) DEFAULT 'vi-VN',
    is_deleted TINYINT(1) DEFAULT 0,
    CONSTRAINT fk_up_user FOREIGN KEY (user_sub) REFERENCES users(cognito_sub)
);

INSERT INTO roles (id, role_name, description) VALUES (1, 'ADMIN', 'Admin'), (2, 'MEMBER', 'Member');
INSERT INTO users (cognito_sub, username, email, status) VALUES ('47b40a38-2091-70e4-b5cb-a04aa64856f8', 'nguyenvanb', 'vanb@gmail.com', 'active');
INSERT INTO user_roles (user_sub, role_id) VALUES ('47b40a38-2091-70e4-b5cb-a04aa64856f8', 2);
