-- ProcureFlow Relational Database Schema (MySQL 3NF)
-- Design optimized with indexes and cascading rules

CREATE DATABASE IF NOT EXISTS procureflow;
USE procureflow;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Vendors Table
CREATE TABLE IF NOT EXISTS Vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    gst_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    rating DECIMAL(3,2) DEFAULT 5.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Products Table
CREATE TABLE IF NOT EXISTS Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    vendor_id INT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0.00),
    quantity INT DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INT DEFAULT 10 CHECK (reorder_level >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON UPDATE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. Inventory Table
CREATE TABLE IF NOT EXISTS Inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNIQUE NOT NULL,
    current_stock INT DEFAULT 0 CHECK (current_stock >= 0),
    incoming_stock INT DEFAULT 0 CHECK (incoming_stock >= 0),
    outgoing_stock INT DEFAULT 0 CHECK (outgoing_stock >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. PurchaseRequests Table
CREATE TABLE IF NOT EXISTS PurchaseRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    justification TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    total_estimated_cost DECIMAL(12, 2) DEFAULT 0.00 CHECK (total_estimated_cost >= 0.00),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES Users(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. PurchaseRequestItems Table
CREATE TABLE IF NOT EXISTS PurchaseRequestItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    estimated_unit_price DECIMAL(12, 2) NOT NULL CHECK (estimated_unit_price >= 0.00),
    FOREIGN KEY (purchase_request_id) REFERENCES PurchaseRequests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 9. PurchaseOrders Table
CREATE TABLE IF NOT EXISTS PurchaseOrders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id INT UNIQUE,
    vendor_id INT NOT NULL,
    creator_id INT NOT NULL,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'approved', 'ordered', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (total_amount >= 0.00),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_request_id) REFERENCES PurchaseRequests(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(id) ON UPDATE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 10. PurchaseOrderItems Table
CREATE TABLE IF NOT EXISTS PurchaseOrderItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0.00),
    FOREIGN KEY (purchase_order_id) REFERENCES PurchaseOrders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 11. InventoryTransactions Table
CREATE TABLE IF NOT EXISTS InventoryTransactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    transaction_type ENUM('inbound', 'outbound', 'adjustment') NOT NULL,
    quantity INT NOT NULL, -- positive for inbound/adjustment, negative for outbound/adjustment
    reference_id INT, -- purchase_order_id or null
    reference_type ENUM('purchase_order', 'manual_adjustment') NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 12. Approvals Table
CREATE TABLE IF NOT EXISTS Approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id INT,
    purchase_order_id INT,
    approver_id INT NOT NULL,
    status ENUM('approved', 'rejected') NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_request_id) REFERENCES PurchaseRequests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (purchase_order_id) REFERENCES PurchaseOrders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES Users(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 13. AuditLogs Table
CREATE TABLE IF NOT EXISTS AuditLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    previous_value JSON,
    updated_value JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================================
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_users_role ON Users(role_id);
CREATE INDEX idx_vendors_gst ON Vendors(gst_number);
CREATE INDEX idx_vendors_name ON Vendors(name);
CREATE INDEX idx_products_sku ON Products(sku);
CREATE INDEX idx_products_category ON Products(category_id);
CREATE INDEX idx_products_vendor ON Products(vendor_id);
CREATE INDEX idx_inventory_product ON Inventory(product_id);
CREATE INDEX idx_pr_requester ON PurchaseRequests(requester_id);
CREATE INDEX idx_pr_status ON PurchaseRequests(status);
CREATE INDEX idx_po_creator ON PurchaseOrders(creator_id);
CREATE INDEX idx_po_vendor ON PurchaseOrders(vendor_id);
CREATE INDEX idx_po_status ON PurchaseOrders(status);
CREATE INDEX idx_po_number ON PurchaseOrders(po_number);
CREATE INDEX idx_audit_user ON AuditLogs(user_id);
CREATE INDEX idx_audit_timestamp ON AuditLogs(timestamp);
CREATE INDEX idx_notifications_user_unread ON Notifications(user_id, is_read);
