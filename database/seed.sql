-- ProcureFlow Mock Data Seed Script (HP World Centric Platform)
-- All user accounts have the password: Password123
-- Bcrypt Hash of "Password123": $2a$10$0TTUqD9.wZVy6v8BKb96guMhFoV9jpRDlzNtUwZ5slaiXOVltkrMm

USE procureflow;

-- Disable foreign key constraints to allow clean truncation
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Notifications;
TRUNCATE TABLE AuditLogs;
TRUNCATE TABLE Approvals;
TRUNCATE TABLE InventoryTransactions;
TRUNCATE TABLE PurchaseOrderItems;
TRUNCATE TABLE PurchaseOrders;
TRUNCATE TABLE PurchaseRequestItems;
TRUNCATE TABLE PurchaseRequests;
TRUNCATE TABLE Inventory;
TRUNCATE TABLE Products;
TRUNCATE TABLE Categories;
TRUNCATE TABLE Vendors;
TRUNCATE TABLE Users;
TRUNCATE TABLE Roles;

-- Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Roles
INSERT INTO Roles (id, name, description) VALUES
(1, 'Admin', 'Full system access, user management, system configuration, and vendor management.'),
(2, 'Procurement Officer', 'Manages vendors, product catalog, inventory adjustments, creates and receives purchase orders.'),
(3, 'Manager', 'Reviews purchase requests, approves/rejects requests, tracks budgets, and monitors vendor ratings.'),
(4, 'Employee', 'Creates purchase requests, views personal request history, and tracks status.');

-- 2. Insert Users
INSERT INTO Users (id, role_id, username, email, password_hash, first_name, last_name, status) VALUES
(1, 1, 'admin', 'admin@procureflow.com', '$2a$10$0TTUqD9.wZVy6v8BKb96guMhFoV9jpRDlzNtUwZ5slaiXOVltkrMm', 'Raghav', 'Computers', 'active'),
(2, 2, 'officer', 'officer@procureflow.com', '$2a$10$0TTUqD9.wZVy6v8BKb96guMhFoV9jpRDlzNtUwZ5slaiXOVltkrMm', 'Rajesh', 'Verma', 'active'),
(3, 3, 'manager', 'manager@procureflow.com', '$2a$10$0TTUqD9.wZVy6v8BKb96guMhFoV9jpRDlzNtUwZ5slaiXOVltkrMm', 'Priyanka', 'Joshi', 'active'),
(4, 4, 'employee', 'employee@procureflow.com', '$2a$10$0TTUqD9.wZVy6v8BKb96guMhFoV9jpRDlzNtUwZ5slaiXOVltkrMm', 'Amit', 'Patil', 'active');

-- 3. Insert Vendors (HP Offices & Distributors)
INSERT INTO Vendors (id, name, company, gst_number, email, phone, address, rating, status) VALUES
(1, 'HP India Sales Pvt Ltd - Bengaluru (HQ)', 'HP India Sales Pvt Ltd', '29AAAAH1209K1Z2', 'orders.blr@hp.com', '+91-80-261199', 'Tower D, 5th Floor, HP Campus, Bengaluru, KA 560030', 4.90, 'active'),
(2, 'HP India Sales Pvt Ltd - Mumbai Office', 'HP India Sales Pvt Ltd', '27AAAAH1209K1Z3', 'orders.bom@hp.com', '+91-22-683100', 'Level 2, BKC Plaza, Bandra East, Mumbai, MH 400051', 4.80, 'active'),
(3, 'Sysnet Enterprise Partners', 'Sysnet Enterprise Partners', '27CCCCC3333C1Z3', 'hardware.support@sysnet.com', '+91-11-257891', '89 Nehru Place IT Tower, New Delhi, DL 110019', 4.20, 'active'),
(4, 'Savex Technologies Pvt Ltd', 'Savex Technologies Pvt Ltd', '27AAACS1812E1Z8', 'sales@savex.in', '+91-22-228291', '124, Maker Chambers III, Nariman Point, Mumbai, MH 400021', 4.60, 'active'),
(5, 'HP India Sales Pvt Ltd - Gurugram Office', 'HP India Sales Pvt Ltd', '06AAAAH1209K1Z4', 'orders.del@hp.com', '+91-124-482000', 'Building 10A, Cyber City Phase II, Gurugram, HR 122002', 4.70, 'active');

-- 4. Insert Categories (HP Product lines)
INSERT INTO Categories (id, name, description) VALUES
(1, 'HP Laptops & Convertibles', 'Enterprise executive laptops, EliteBooks, ProBooks, and Spectre convertibles.'),
(2, 'HP Desktops & Workstations', 'Mini desktops, ProDesk systems, and professional-grade Z-Workstations.'),
(3, 'HP LaserJet & InkTank Printers', 'Office printers, multi-function laser jets, and high-volume Smart Tanks.'),
(4, 'HP Monitors & Displays', 'E-series USB-C docking displays, curved monitors, and professional Z-Displays.'),
(5, 'HP Original Toner & Ink Supplies', 'Genuine HP toner cartridges and ink refills to guarantee printing quality.'),
(6, 'HP Docks & Input Accessories', 'Thunderbolt docks, wireless keyboards, mice, headsets, and active stylus pens.');

-- 5. Insert Products (18 Commercial Products with Realistic INR Pricing)
INSERT INTO Products (id, name, sku, category_id, vendor_id, price, quantity, reorder_level) VALUES
-- HP Laptops (Category 1)
(1, 'HP EliteBook 840 G10 Notebook', 'HP-EB-840-G10', 1, 1, 115000.00, 25, 5),
(2, 'HP ProBook 450 G10 Laptop', 'HP-PB-450-G10', 1, 1, 78000.00, 15, 4),
(3, 'HP Spectre x360 14 convertible', 'HP-SP-X360-14', 1, 1, 145000.00, 10, 2),
(4, 'HP OMEN 16 Gaming Laptop', 'HP-OMEN-16', 1, 1, 125000.00, 8, 2),
-- HP Desktops (Category 2)
(5, 'HP EliteMini 800 G9 Desktop', 'HP-EM-800-G9', 2, 2, 82000.00, 10, 3),
(6, 'HP Z2 Tower G9 Workstation', 'HP-Z2W-T-G9', 2, 2, 165000.00, 6, 2),
(7, 'HP ProTower 290 G9 Desktop', 'HP-PT-290-G9', 2, 2, 45000.00, 12, 3),
-- HP Printers (Category 3)
(8, 'HP LaserJet Pro MFP 4101fdw', 'HP-PRN-LJ4101', 3, 3, 39500.00, 8, 3),
(9, 'HP Smart Tank 580 All-in-One', 'HP-PRN-ST580', 3, 3, 14800.00, 12, 5),
(10, 'HP LaserJet Enterprise M507dn', 'HP-PRN-E507DN', 3, 3, 58000.00, 5, 2),
-- HP Monitors (Category 4)
(11, 'HP E27u G5 QHD USB-C Monitor', 'HP-MON-E27U-G5', 4, 1, 32000.00, 18, 5),
(12, 'HP Series 7 Pro 31.5\" 4K Display', 'HP-MON-S7PRO-31', 4, 1, 72000.00, 6, 2),
-- HP Supplies (Category 5)
(13, 'HP 151A Black Toner Cartridge', 'HP-SUP-151ATONER', 5, 2, 9200.00, 14, 15), -- Low stock alert
(14, 'HP GT53 90ml Black Original Ink', 'HP-SUP-GT53INK', 5, 4, 650.00, 80, 20),
-- HP Accessories (Category 6)
(15, 'HP Thunderbolt Dock 120W G4', 'HP-ACC-TBDOCKG4', 6, 1, 18500.00, 30, 8),
(16, 'HP 935 Creator Wireless Mouse', 'HP-ACC-935MOUSE', 6, 4, 7200.00, 45, 10),
(17, 'HP 975 Dual-Mode Wireless Keyboard', 'HP-ACC-975KEY', 6, 4, 11500.00, 20, 5),
(18, 'HP Stereo USB Headset G2', 'HP-ACC-USBHEADG2', 6, 4, 2800.00, 40, 10);

-- 6. Insert Inventory (1-to-1 matching Products quantity)
INSERT INTO Inventory (product_id, current_stock, incoming_stock, outgoing_stock) VALUES
(1, 25, 0, 0),
(2, 15, 0, 0),
(3, 10, 0, 0),
(4, 8, 0, 0),
(5, 10, 0, 0),
(6, 6, 0, 0),
(7, 12, 0, 0),
(8, 8, 0, 0),
(9, 12, 0, 0),
(10, 5, 0, 0),
(11, 18, 0, 0),
(12, 6, 0, 0),
(13, 14, 0, 0),
(14, 80, 0, 0),
(15, 30, 0, 0),
(16, 45, 0, 0),
(17, 20, 0, 0),
(18, 40, 0, 0);

-- 7. Insert Purchase Requests (Historical logs spread over Jun, Jul, Aug with Realistic INR totals)
INSERT INTO PurchaseRequests (id, requester_id, title, justification, status, total_estimated_cost, created_at) VALUES
-- June 2026 Requests
(4, 4, 'June Office Tech Refresh', 'Replacing aged desktop units on HR and Admin floor.', 'approved', 328000.00, '2026-06-10 10:00:00'),
(5, 4, 'Executive Client Presentation Displays', 'High resolution E27u displays needed for client lounge conference hubs.', 'approved', 160000.00, '2026-06-18 14:00:00'),
-- July 2026 Requests
(6, 4, 'July Printer Fleet Setup', 'Multi-function office printers for logistics and dispatch centers.', 'approved', 158000.00, '2026-07-05 10:15:00'),
(7, 4, 'EliteBook G10 Fleet Procurement', 'Standard hardware provision for incoming Q3 executive interns and staff.', 'approved', 1380000.00, '2026-07-12 11:00:00'),
(8, 4, 'Savex Accessories Bulk Purchase', 'HP 935 Creator Mice for UX/UI designers.', 'approved', 108000.00, '2026-07-20 15:45:00'),
-- August 2026 Requests
(1, 4, 'Executive Workstation Upgrade', 'Need executive laptops, displays, and hubs for senior development team leads.', 'approved', 280500.00, '2026-08-14 09:30:00'),
(2, 4, 'Q3 Printing Toner Stock Replenishment', 'Need high capacity 151A LaserJet toner refills for HR and Finance desk hubs.', 'pending', 46000.00, '2026-08-16 11:00:00'),
(3, 4, 'Benchmarks Testing Z-Workstations', 'High performance Z2 towers required for heavy graphics benchmarking tests.', 'rejected', 330000.00, '2026-08-17 15:00:00'),
(9, 4, 'Gurugram Z2 Tower Purchase', 'CAD workstations for mechanical engineering designers.', 'approved', 495000.00, '2026-08-08 14:00:00');

-- 8. Insert Purchase Request Items
INSERT INTO PurchaseRequestItems (purchase_request_id, product_id, quantity, estimated_unit_price) VALUES
-- June Items (PR 4, 5)
(4, 5, 4, 82000.00),
(5, 11, 5, 32000.00),
-- July Items (PR 6, 7, 8)
(6, 8, 4, 39500.00),
(7, 1, 12, 115000.00),
(8, 16, 15, 7200.00),
-- August Items (PR 1, 2, 3, 9)
(1, 1, 2, 115000.00),
(1, 11, 1, 32000.00),
(1, 15, 1, 18500.00),
(2, 13, 5, 9200.00),
(3, 6, 2, 165000.00),
(9, 6, 3, 165000.00);

-- 9. Insert Purchase Orders (Historical logs with Realistic INR totals)
INSERT INTO PurchaseOrders (id, purchase_request_id, vendor_id, creator_id, po_number, status, total_amount, expected_delivery_date, actual_delivery_date, created_at) VALUES
-- June POs (Delivered)
(2, 4, 2, 2, 'PO-2026-0002', 'delivered', 328000.00, '2026-06-14', '2026-06-15', '2026-06-11 11:30:00'),
(3, 5, 1, 2, 'PO-2026-0003', 'delivered', 160000.00, '2026-06-22', '2026-06-24', '2026-06-19 09:00:00'),
-- July POs (Delivered)
(4, 6, 3, 2, 'PO-2026-0004', 'delivered', 158000.00, '2026-07-09', '2026-07-10', '2026-07-06 14:00:00'),
(5, 7, 1, 2, 'PO-2026-0005', 'delivered', 1380000.00, '2026-07-16', '2026-07-18', '2026-07-13 16:30:00'),
(6, 8, 4, 2, 'PO-2026-0006', 'delivered', 108000.00, '2026-07-24', '2026-07-25', '2026-07-21 10:00:00'),
-- August POs (Delivered & Pending)
(1, 1, 1, 2, 'PO-2026-0001', 'delivered', 280500.00, '2026-08-15', '2026-08-14', '2026-08-14 10:00:00'),
(7, 9, 5, 2, 'PO-2026-0007', 'ordered', 495000.00, '2026-08-22', NULL, '2026-08-10 11:00:00');

-- 10. Insert Purchase Order Items
INSERT INTO PurchaseOrderItems (purchase_order_id, product_id, quantity, unit_price) VALUES
-- June PO Items
(2, 5, 4, 82000.00),
(3, 11, 5, 32000.00),
-- July PO Items
(4, 8, 4, 39500.00),
(5, 1, 12, 115000.00),
(6, 16, 15, 7200.00),
-- August PO Items
(1, 1, 2, 115000.00),
(1, 11, 1, 32000.00),
(1, 15, 1, 18500.00),
(7, 6, 3, 165000.00);

-- 11. Insert Inventory Transactions (History)
INSERT INTO InventoryTransactions (product_id, user_id, transaction_type, quantity, reference_id, reference_type, notes, timestamp) VALUES
-- June Transactions
(5, 2, 'inbound', 4, 2, 'purchase_order', 'Delivered via PO-2026-0002', '2026-06-15 14:00:00'),
(11, 2, 'inbound', 5, 3, 'purchase_order', 'Delivered via PO-2026-0003', '2026-06-24 16:30:00'),
-- July Transactions
(8, 2, 'inbound', 4, 4, 'purchase_order', 'Delivered via PO-2026-0004', '2026-07-10 11:00:00'),
(1, 2, 'inbound', 12, 5, 'purchase_order', 'Delivered via PO-2026-0005', '2026-07-18 10:15:00'),
(16, 2, 'inbound', 15, 6, 'purchase_order', 'Delivered via PO-2026-0006', '2026-07-25 15:00:00'),
-- August Transactions
(1, 2, 'inbound', 2, 1, 'purchase_order', 'Delivered via PO-2026-0001', '2026-08-14 12:00:00');

-- 12. Insert Approvals
INSERT INTO Approvals (purchase_request_id, purchase_order_id, approver_id, status, comments, timestamp) VALUES
(4, NULL, 3, 'approved', 'Prerequisite desktops approved.', '2026-06-11 09:00:00'),
(5, NULL, 3, 'approved', 'Monitors approved for client presentation lounge.', '2026-06-18 16:30:00'),
(6, NULL, 3, 'approved', 'Printers for dispatch office approved.', '2026-07-06 10:00:00'),
(7, NULL, 3, 'approved', 'Approved for intern fleet.', '2026-07-13 11:00:00'),
(8, NULL, 3, 'approved', 'Mice approved for UX crew.', '2026-07-20 17:00:00'),
(1, NULL, 3, 'approved', 'Hardware budget approved for dev team leads. Proceed with PO generation.', '2026-08-14 09:45:00'),
(3, NULL, 3, 'rejected', 'Exceeds regional budget guidelines for this quarter. Leverage existing pool of local workstations.', '2026-08-17 16:30:00'),
(9, NULL, 3, 'approved', 'Approved for Gurugram Design Studio.', '2026-08-09 11:00:00');

-- 13. Insert Audit Logs (History)
INSERT INTO AuditLogs (user_id, action, module, previous_value, updated_value, timestamp) VALUES
(1, 'USER_LOGIN', 'Authentication', NULL, JSON_OBJECT('username', 'admin', 'ip', '127.0.0.1'), '2026-08-18 09:00:00'),
(3, 'REQUEST_APPROVED', 'Purchase Requests', JSON_OBJECT('status', 'pending'), JSON_OBJECT('status', 'approved', 'pr_id', 1), '2026-08-14 09:45:00');

-- 14. Insert Notifications
INSERT INTO Notifications (user_id, message, is_read, timestamp) VALUES
(4, 'Your Purchase Request "Executive Workstation Upgrade" has been Approved.', 0, '2026-08-14 09:45:00'),
(4, 'Your Purchase Request "Benchmarks Testing Z-Workstations" has been Rejected.', 0, '2026-08-17 16:30:00'),
(2, 'Inventory Alert: HP 151A Black Toner Cartridge is below the reorder level.', 0, '2026-08-18 09:15:00');
