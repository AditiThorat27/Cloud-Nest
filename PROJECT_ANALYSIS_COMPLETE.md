# CLOUDNEST: COMPREHENSIVE PROJECT ANALYSIS
## Complete Reverse-Engineering Report

---

## PART A: EXTRACTED PROJECT UNDERSTANDING

### 1. PROJECT IDENTIFICATION

**Project Title**: **CloudNest - Multi-Tenant SaaS E-Commerce Platform with Integrated Cloud Workspace Analytics**

**Professional Domain**: 
- Web Development (Full-Stack)
- Multi-Tenancy Architecture
- SaaS (Software-as-a-Service) Platform
- E-Commerce System
- Business Intelligence & Analytics

**Project Version**: 0.0.1-SNAPSHOT

**Primary Language**: Java (Backend), TypeScript/React (Frontend), SQL (Database)

---

### 2. PROBLEM STATEMENT & OBJECTIVES

**Problem Statement**:
The traditional single-tenant e-commerce solutions require separate infrastructure and databases for each business, leading to high operational costs, inefficient resource utilization, and difficulty in scaling. Businesses require:
- A unified multi-tenant platform where multiple companies can operate independently
- Secure data isolation at the database level
- Real-time analytics and business intelligence
- Scalable billing infrastructure
- Audit compliance and data integrity tracking

**Objectives**:
1. Build a production-grade multi-tenant SaaS platform
2. Implement strict data isolation using PostgreSQL RLS + Hibernate @TenantId
3. Provide real-time analytics, forecasting, and anomaly detection
4. Enable secure API access with JWT authentication
5. Implement comprehensive audit logging and compliance tracking
6. Create a premium SaaS dashboard with responsive UI

---

### 3. REAL-WORLD USE CASE

**Target Business Scenario**:
- **SME e-commerce store owners** who need to manage products, orders, and customers
- **Multi-tenant marketplace platforms** supporting independent sellers
- **Enterprise SaaS providers** requiring strict data isolation
- **Billing and usage tracking** for subscription-based models

**Key Stakeholders**:
1. **Store Owners/Tenant Admins**: Manage their own inventory, orders, customers
2. **Super Admin/Platform Owner**: Monitor all tenants, billing, system health
3. **Customers**: Browse products and place orders
4. **System Administrators**: Monitor analytics, infrastructure health

---

### 4. TECHNOLOGY STACK

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 19.2.5 | UI Framework |
| **Frontend Language** | TypeScript | 6.0.2 | Type-safe development |
| **Frontend Build Tool** | Vite | 8.0.10 | Fast build & dev server |
| **CSS Framework** | Tailwind CSS | 4.2.4 | Utility-first styling |
| **Backend Framework** | Spring Boot | 3.2.4 | REST API framework |
| **Backend Language** | Java | 17 | Core language |
| **ORM** | Hibernate | 6 | Object-relational mapping |
| **Database** | PostgreSQL | 15 | Primary relational DB |
| **DB Migrations** | Flyway | Latest | Schema versioning |
| **Authentication** | JWT (JJWT) | 0.11.5 | Token-based auth |
| **Password Encoding** | BCrypt | Spring Security | Secure hashing |
| **Caching** | Redis | 7-Alpine | Session/data cache |
| **Object Storage** | MinIO | Latest | S3-compatible storage |
| **Security** | Spring Security | Latest | Authorization/filtering |
| **Build Tool** | Maven | Latest | Java dependency management |
| **Containerization** | Docker & Docker Compose | Latest | Containerized deployment |

---

### 5. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  React + TypeScript + Tailwind CSS (Single Page App)        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Login │ Dashboard │ Products │ Orders │ Customers    │  │
│  │ Billing │ Intelligence │ AuditLogs │ OwnerDashboard │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP/REST + JWT)
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│         Spring Security Filter Chain (Stateless)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ TenantFilter → JwtAuthFilter → Routes to Controllers │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND SERVICE LAYER                       │
│         Spring Boot 3.2.4 with Spring Data JPA             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ AuthService │ ProductService │ OrderService         │  │
│  │ CustomerService │ BillingService │ AuditLogService  │  │
│  │ SuperAdminService │ StatsController                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓ (Hibernate with @TenantId Partitioning)
┌─────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (Repositories)               │
│         JPA Repositories with Tenant Context               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ProductRepository │ OrderRepository │ CustomerRepo   │  │
│  │ TenantRepository │ UserRepository │ RoleRepository  │  │
│  │ AuditLogRepository │ etc.                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        ↓ (SQL with PostgreSQL RLS Context Variables)
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER                                  │
│         PostgreSQL 15 with Row-Level Security              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Shared Database / Shared Schema (Multi-Tenancy)     │  │
│  │ All tenant data with tenant_id column isolation     │  │
│  │ RLS Policies enforcing tenant_id = current_setting  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Multi-Tenancy Implementation**:
- **Strategy**: Shared Database, Shared Schema
- **Tenant Isolation Levels**:
  1. **Application Level**: `@TenantId` annotation via Hibernate
  2. **Database Level**: PostgreSQL Row-Level Security (RLS) policies
  3. **JWT Level**: Tenant context embedded in JWT token
  4. **Header Level**: `X-Tenant-ID` header extraction as fallback

**Data Flow**:
1. Request arrives with JWT token
2. `TenantFilter` extracts tenant from token or header
3. `TenantContext.setCurrentTenant()` stores in ThreadLocal
4. `CurrentTenantIdentifierResolverImpl` injects tenant into Hibernate queries
5. Repositories execute filtered queries
6. All queries are scoped to current tenant automatically

---

### 6. DATABASE SCHEMA & ENTITIES

#### 6.1 Core Multi-Tenancy Tables

**Tenants Table** (Root entity for multi-tenancy)
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Users Table** (Tenant-scoped users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL (FOREIGN KEY),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(email, tenant_id)
);
```

**Roles & Permissions** (RBAC implementation)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE(name, tenant_id)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID PRIMARY KEY,
    permission_id UUID PRIMARY KEY
);

CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY,
    role_id UUID PRIMARY KEY
);
```

#### 6.2 E-Commerce Tables

**Categories Table**
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    UNIQUE(name, tenant_id)
);
```

**Products Table**
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    stock_quantity INTEGER NOT NULL,
    image_url VARCHAR(255),
    category_id UUID FOREIGN KEY
);
```

**Customers Table**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50)
);
```

**Orders Table**
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL (FOREIGN KEY),
    total_amount DECIMAL NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP
);
```

**OrderItems Table**
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    order_id UUID NOT NULL (FOREIGN KEY),
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL NOT NULL,
    line_total DECIMAL NOT NULL
);
```

#### 6.3 Analytics & Intelligence Tables

**API Metrics Table** (API usage tracking)
```sql
CREATE TABLE api_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(50) NOT NULL,
    response_time_ms BIGINT,
    status_code INTEGER,
    timestamp TIMESTAMP
);
```

**Tenant Forecasts Table** (Predictive analytics)
```sql
CREATE TABLE tenant_forecasts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    risk_level VARCHAR(20) CHECK (low/medium/high/critical),
    health_score NUMERIC(5,2),
    forecast_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP
);
```

**Anomalies Table** (Anomaly detection)
```sql
CREATE TABLE anomalies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    signal_type VARCHAR(100),
    detected_at TIMESTAMP,
    severity VARCHAR(20) CHECK (low/medium/high),
    description TEXT,
    resolved BOOLEAN DEFAULT FALSE
);
```

**Interventions Table** (Anomaly resolutions)
```sql
CREATE TABLE interventions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    anomaly_id UUID FOREIGN KEY,
    action_taken TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP,
    resolved_at TIMESTAMP
);
```

#### 6.4 Billing Tables

**Billing Plans Table**
```sql
CREATE TABLE billing_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly NUMERIC(10,2),
    api_call_limit INT,
    storage_limit_gb INT,
    created_at TIMESTAMP
);
```

**Invoices Table**
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_id UUID FOREIGN KEY,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    issued_at TIMESTAMP,
    paid_at TIMESTAMP,
    due_date DATE NOT NULL
);
```

**Usage Snapshots Table**
```sql
CREATE TABLE usage_snapshots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    api_calls_count INT DEFAULT 0,
    storage_used_gb NUMERIC(8,2) DEFAULT 0,
    active_users INT DEFAULT 0,
    created_at TIMESTAMP,
    UNIQUE(tenant_id, snapshot_date)
);
```

#### 6.5 Audit & Compliance Tables

**Audit Logs Table** (Complete audit trail)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    table_name VARCHAR(100),
    operation VARCHAR(10) CHECK (INSERT/UPDATE/DELETE),
    old_data JSONB,
    new_data JSONB,
    performed_at TIMESTAMP,
    performed_by TEXT
);
```

**API Keys & Webhooks Tables**
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_hint VARCHAR(10) NOT NULL,
    created_at TIMESTAMP,
    last_used_at TIMESTAMP
);

CREATE TABLE webhooks (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    url VARCHAR(500) NOT NULL,
    events VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);
```

**Entity Relationship Diagram**:
```
┌─────────────┐
│   Tenants   │◄─────────────────────────────────────┐
│  (PK: id)   │                                       │
└──────┬──────┘                                       │
       │ 1:M                                          │
       ├─→ Users (tenant_id FK)                      │
       ├─→ Roles (tenant_id FK)                      │
       ├─→ Products (tenant_id FK)                   │
       ├─→ Categories (tenant_id FK)                 │
       ├─→ Customers (tenant_id FK)                  │
       ├─→ Orders (tenant_id FK)                     │
       ├─→ ApiMetrics (tenant_id FK)                 │
       ├─→ Invoices (tenant_id FK)                   │
       ├─→ TenantForecasts (tenant_id FK)            │
       ├─→ Anomalies (tenant_id FK)                  │
       ├─→ Interventions (tenant_id FK)              │
       └─→ AuditLogs (tenant_id FK)                  │
                                                      │
┌─────────────────┐       ┌─────────────┐           │
│    Customers    │◄──────┤   Orders    │           │
│  (PK: id)       │   M:1 │  (PK: id)   │           │
│ (tenant_id FK)  │       │(tenant_id FK)─────┐    │
└─────────────────┘       └─────────────────┬─┘    │
                                            │       │
                          1:M               │       │
                    ┌─────────────────────┐ │       │
                    │   OrderItems        │ │       │
                    │  (PK: id)           │ │       │
                    │ (order_id FK) ──────┘ │       │
                    │ (tenant_id FK) ───────┘       │
                    │ (product_id)                  │
                    └────┬────────────────┘         │
                         │ M:1                      │
                    ┌────▼────────────────┐         │
                    │    Products         │         │
                    │  (PK: id)           │         │
                    │ (category_id FK)    │         │
                    │ (tenant_id FK)──────┼─────────┘
                    └─────────────────────┘
                         │
                         │ M:1
                    ┌────▼────────────────┐
                    │   Categories        │
                    │  (PK: id)           │
                    │ (tenant_id FK)      │
                    └─────────────────────┘
```

---

### 7. API ENDPOINTS & ROUTES

#### 7.1 Authentication APIs

**POST** `/api/v1/auth/register` - Register new tenant
```json
REQUEST:
{
  "companyName": "Acme Corp",
  "subdomain": "acme",
  "email": "admin@acme.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}

RESPONSE:
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "message": "Tenant registered successfully"
}
```

**POST** `/api/v1/auth/login` - Tenant login
```json
REQUEST:
{
  "email": "admin@acme.com",
  "password": "securepassword123",
  "subdomain": "acme"
}

RESPONSE:
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "message": "Login successful"
}
```

#### 7.2 Product Management APIs

**GET** `/api/v1/products` - List all products (tenant-scoped)
**POST** `/api/v1/products` - Create product
**PUT** `/api/v1/products/{id}` - Update product
**DELETE** `/api/v1/products/{id}` - Delete product

#### 7.3 Order Management APIs

**GET** `/api/v1/orders` - List all orders
**POST** `/api/v1/orders` - Create order (with OrderItems)
**DELETE** `/api/v1/orders/{id}` - Delete order

#### 7.4 Customer Management APIs

**GET** `/api/v1/customers` - List all customers
**POST** `/api/v1/customers` - Create customer
**PUT** `/api/v1/customers/{id}` - Update customer
**DELETE** `/api/v1/customers/{id}` - Delete customer

#### 7.5 Billing APIs

**GET** `/api/v1/billing/invoices` - List invoices
**POST** `/api/v1/billing/invoices/generate` - Generate new invoice
**GET** `/api/v1/billing/plan` - Get current plan
**PUT** `/api/v1/billing/plan` - Update plan

#### 7.6 Intelligence/Analytics APIs

**GET** `/api/v1/intelligence/forecasts` - Get forecasts
**GET** `/api/v1/intelligence/anomalies` - Get detected anomalies
**GET** `/api/v1/intelligence/interventions/pending` - Get pending interventions
**PUT** `/api/v1/intelligence/interventions/{id}/resolve` - Mark intervention as resolved

#### 7.7 Audit APIs

**GET** `/api/v1/audit-logs` - Get audit log history

#### 7.8 Stats APIs

**GET** `/api/v1/stats` - Get aggregated statistics

#### 7.9 Super Admin APIs

**GET** `/api/v1/super-admin/dashboard` - Get platform-wide dashboard
**PUT** `/api/v1/super-admin/tenants/{id}/suspend` - Suspend tenant
**PUT** `/api/v1/super-admin/tenants/{id}/activate` - Activate tenant
**DELETE** `/api/v1/super-admin/tenants/{id}` - Delete tenant

---

### 8. AUTHENTICATION & SECURITY ARCHITECTURE

#### 8.1 Authentication Flow

```
┌─────────────────────────────────────┐
│   1. User Submits Credentials       │
│      (email, password, subdomain)   │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   2. AuthService.login() or          │
│       AuthService.registerTenant()   │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   3. TenantRepository.findBySubdomain│
│       (Load Tenant Entity)           │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   4. TenantContext.setCurrentTenant()│
│       (Store in ThreadLocal)         │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   5. AuthenticationManager           │
│       .authenticate()                │
│       (Password validation)          │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   6. JwtUtils.generateToken()        │
│       (Create signed JWT with:       │
│        - username (email)            │
│        - tenantId                    │
│        - firstName, lastName         │
│        - subdomain)                  │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   7. AuthResponse { token, message } │
│       (Return to client)             │
└─────────────────────────────────────┘
```

#### 8.2 Request Flow with Tenant Isolation

```
┌──────────────────────────────────────────────┐
│   Incoming Request with JWT Token            │
│   Authorization: Bearer eyJ...               │
└────────────────┬─────────────────────────────┘
                 ↓
        ┌────────────────────┐
        │  TenantFilter      │◄─ 1st in chain
        │  (Extracts tenant) │
        └────────┬───────────┘
                 ↓
        Extract from JWT or X-Tenant-ID header
        TenantContext.setCurrentTenant(tenantId)
                 ↓
        ┌────────────────────┐
        │ JwtAuthFilter      │◄─ 2nd in chain
        │ (Validates JWT)    │
        └────────┬───────────┘
                 ↓
        Extract claims, validate signature
        Create UserDetailsImpl
                 ↓
        ┌────────────────────────────────┐
        │ Passes to Controller            │
        │ (e.g., ProductController)      │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ ProductService.getAllProducts()│
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ ProductRepository.findAll()    │
        │ (Hibernate with @TenantId)     │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ CurrentTenantIdentifierResolver│
        │ .resolveCurrentTenantIdentifier()
        │ (Gets from TenantContext)      │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ Hibernate adds WHERE            │
        │ tenant_id = [current_tenant]   │
        │ to all queries                 │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ PostgreSQL RLS Policy:          │
        │ WHERE tenant_id = current_setting
        │       ('app.current_tenant_id') │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ Only tenant's data returned     │
        │ Double-layer isolation         │
        └────────────────────────────────┘
```

#### 8.3 Security Layers

1. **JWT Layer**: Token contains tenantId, user email, claims
2. **Header Layer**: X-Tenant-ID as fallback
3. **Application Layer**: @TenantId on entities
4. **Hiberntae Layer**: Automatic WHERE clause injection
5. **Database Layer**: PostgreSQL RLS policies
6. **Password Layer**: BCrypt encryption

#### 8.4 Key Security Classes

**JwtUtils.java**:
- `generateToken()`: Creates signed JWT with tenant context
- `extractTenantId()`: Extracts tenantId from JWT claims
- `isTokenValid()`: Validates signature and expiration

**TenantContext.java**:
- ThreadLocal storage for current tenant
- `setCurrentTenant()`: Set tenant for current request
- `getCurrentTenant()`: Get tenant for current request
- `clear()`: Remove tenant after request

**TenantFilter.java**:
- Extracts tenant from JWT or X-Tenant-ID header
- Sets TenantContext before request processing
- Clears TenantContext after request

**JwtAuthFilter.java**:
- Validates JWT signature and expiration
- Creates UserDetailsImpl for Spring Security
- Prevents access without valid token

**SecurityConfig.java**:
- Stateless session management
- CORS configuration
- Public vs authenticated endpoints
- BCrypt password encoding

---

### 9. KEY CONTROLLERS & SERVICES

#### 9.1 AuthController & AuthService

**AuthController** (`/api/v1/auth`):
- `/register` → POST - Register new tenant
- `/login` → POST - User login

**AuthService**:
- `registerTenant()` - Creates tenant, user, and TENANT_ADMIN role
- `login()` - Authenticate user and generate JWT
- `createTenant()` - Insert tenant entity
- `createTenantSetup()` - Create initial admin user and role

#### 9.2 ProductController & ProductService

**ProductController** (`/api/v1/products`):
- `GET /` - Get all products
- `POST /` - Create product
- `PUT /{id}` - Update product
- `DELETE /{id}` - Delete product

**ProductService**:
- `getAllProducts()` - Returns tenant-scoped products (via TenantId)
- `createProduct()` - Save new product with current tenant context
- `updateProduct()` - Update existing product
- `deleteProduct()` - Delete product

#### 9.3 OrderController & OrderService

**OrderController** (`/api/v1/orders`):
- `GET /` - Get all orders
- `POST /` - Create order
- `DELETE /{id}` - Delete order

**OrderService**:
- `getAllOrders()` - List orders with OrderItems
- `createOrder()` - Validate stock, deduct inventory, create OrderItems
- `deleteOrder()` - Remove order

#### 9.4 CustomerController & CustomerService

**CustomerController** (`/api/v1/customers`):
- `GET /` - List customers
- `POST /` - Create customer
- `PUT /{id}` - Update customer
- `DELETE /{id}` - Delete customer

#### 9.5 SuperAdminController & SuperAdminService

**SuperAdminController** (`/api/v1/super-admin`):
- `GET /dashboard` - Platform-wide metrics
- `PUT /tenants/{id}/suspend` - Suspend tenant
- `PUT /tenants/{id}/activate` - Activate tenant
- `DELETE /tenants/{id}` - Delete tenant

#### 9.6 StatsController

**StatsController** (`/api/v1/stats`):
- `GET /` - Returns product count, order count, customer count

#### 9.7 ApiMetricsInterceptor

Automatically captures:
- Request endpoint
- HTTP method
- Response time (ms)
- Status code
- Timestamp

Stores in `api_metrics` table for analytics.

---

### 10. FRONTEND ARCHITECTURE

#### 10.1 Project Structure

```
frontend/
├── src/
│   ├── App.tsx (Main router & state management)
│   ├── main.tsx (Entry point)
│   ├── App.css
│   ├── index.css (Global styles)
│   ├── components/
│   │   ├── Login.tsx (Auth UI - Register & Login)
│   │   ├── Dashboard.tsx (Tenant home - KPIs & charts)
│   │   ├── Products.tsx (CRUD for products)
│   │   ├── Customers.tsx (Customer management)
│   │   ├── Orders.tsx (Order list & details)
│   │   ├── Billing.tsx (Plan selection & invoices)
│   │   ├── Intelligence.tsx (Forecasts, Anomalies, Interventions)
│   │   ├── AuditLogs.tsx (Change history)
│   │   ├── Database.tsx (Schema viewer)
│   │   ├── Settings.tsx (Tenant settings)
│   │   ├── OwnerDashboard.tsx (Super Admin view)
│   │   ├── Sidebar.tsx (Navigation)
│   │   └── TopBar.tsx (Header)
│   ├── assets/
│   └── public/
├── vite.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

#### 10.2 Frontend Pages

**Login.tsx**:
- Toggle between Sign In and Sign Up
- Form fields: email, password, subdomain
- Registration: companyName, firstName, lastName, subdomain
- Direct API calls to `/api/v1/auth/register` and `/api/v1/auth/login`
- Token stored in localStorage

**Dashboard.tsx**:
- Welcome greeting with user name
- KPI Cards: Total Revenue, Completed Orders, Pending Orders, Total Stock
- Recent Orders list (sorted by date)
- Order status distribution chart
- Top Products list
- Low Stock alerts
- Real-time data fetching

**Products.tsx**:
- Product list with edit/delete buttons
- Add Product modal form
- CRUD operations with API
- Form validation

**Customers.tsx**:
- Customer directory
- Add/Edit/Delete customers
- Search & filter capability

**Orders.tsx**:
- Order list with customer details
- Order status tracking
- Order details view

**Billing.tsx**:
- Plan selection (Free, Pro, Enterprise)
- Current plan display
- Invoice history
- Generate invoice button
- Usage tracking

**Intelligence.tsx**:
- 3-tab interface: Forecasts, Anomalies, Interventions
- Forecast cards with health scores
- Anomaly severity indicators
- Intervention resolution tracking
- Color-coded risk levels (low/medium/high/critical)

**AuditLogs.tsx**:
- Complete audit trail
- Filter by table and operation type
- Expandable old/new data JSON
- Summary counts (Inserts, Updates, Deletes)
- Operation color coding

**OwnerDashboard.tsx**:
- Super Admin platform-wide view
- Total active tenants
- Monthly recurring revenue (MRR)
- Global platform traffic
- System health status
- Tenant directory with actions (suspend/activate/delete)

**Sidebar.tsx**:
- Navigation menu
- Active page highlighting
- Conditional rendering (Owner vs Tenant admin)

**TopBar.tsx**:
- User information
- Current subdomain/company display
- Logout button

#### 10.3 Frontend Technologies

- **React 19.2.5**: UI component framework
- **TypeScript 6.0.2**: Type safety
- **Tailwind CSS 4.2.4**: Dark-mode glassmorphism styling
- **Vite 8.0.10**: Fast dev server & production bundler
- **Local Storage**: JWT persistence

#### 10.4 Styling Approach

- Dark-mode theme (slate-950 background)
- Glassmorphism effects (backdrop-blur-xl)
- Gradient overlays and animations
- Responsive grid layouts
- Color-coded status indicators
- Smooth transitions and fade-ins

---

### 11. DATABASE MIGRATIONS

**Flyway-managed schema versions**:

1. **V1__init.sql** - Core tables (Tenants, Users, Roles, Permissions, RLS setup)
2. **V2__add_products_and_metrics.sql** - Products, Categories, Api_Metrics
3. **V3__add_customers_and_orders.sql** - Customers, Orders, OrderItems
4. **V4__intelligence_tables.sql** - TenantForecasts, Anomalies, Interventions
5. **V5__billing_tables.sql** - BillingPlans, Invoices, UsageSnapshots
6. **V6__forecasting_functions.sql** - Forecasting SQL functions
7. **V7__audit_logs.sql** - AuditLogs table with triggers
8. **V8__api_keys_and_webhooks.sql** - ApiKeys, Webhooks tables
9. **V9__audit_core_tables.sql** - Additional audit configurations
10. **V10__add_tenant_plan.sql** - Plan management enhancements

---

### 12. FEATURES IMPLEMENTED

#### 12.1 Core Features (Completed)

1. ✅ **Multi-Tenant Architecture**
   - Shared database, shared schema
   - Automatic tenant context resolution
   - Data isolation at application & DB layers

2. ✅ **Authentication & Authorization**
   - JWT-based stateless authentication
   - Role-based access control (RBAC)
   - Tenant admin role provisioning
   - Password encryption (BCrypt)

3. ✅ **E-Commerce Module**
   - Product management (CRUD)
   - Category management
   - Customer management
   - Order management with OrderItems
   - Inventory tracking & stock deduction
   - Order status lifecycle (PENDING, PROCESSING, COMPLETED, CANCELLED)

4. ✅ **Analytics & Monitoring**
   - API metrics tracking (endpoint, method, response time, status code)
   - Real-time dashboard with KPIs
   - Order analytics (total revenue, completed orders, pending orders)
   - Product analytics (stock levels, top products)
   - Customer analytics

5. ✅ **Intelligence Features**
   - Tenant forecasting (risk levels, health scores)
   - Anomaly detection (signal types, severity levels)
   - Intervention tracking (anomaly resolutions)
   - Health score visualization

6. ✅ **Billing & Plans**
   - Plan management (Free, Pro, Enterprise)
   - Invoice generation & tracking
   - Usage tracking (API calls, storage, active users)
   - Plan upgrades/downgrades

7. ✅ **Audit & Compliance**
   - Complete audit trail (INSERT/UPDATE/DELETE)
   - JSONB before/after data snapshots
   - Performed by tracking
   - Tenant-scoped audit access
   - Database triggers for automatic logging

8. ✅ **Super Admin Features**
   - Platform-wide dashboard
   - Tenant suspend/activate/delete
   - MRR calculation
   - Global traffic monitoring
   - Tenant directory

9. ✅ **API Security**
   - JWT validation
   - Request rate limiting metadata
   - CORS configuration
   - Stateless session management

10. ✅ **Premium UI**
    - Dark-mode glassmorphism design
    - Responsive layouts
    - Real-time data binding
    - Smooth animations
    - Color-coded status indicators

---

### 13. DEPLOYMENT & CONTAINERIZATION

**Docker Compose Services**:

```yaml
services:
  postgres:
    - Image: postgres:15-alpine
    - Port: 5433:5432
    - Database: cloudnest
    - Credentials: root/password
    - Volume: postgres_data:/var/lib/postgresql/data

  redis:
    - Image: redis:7-alpine
    - Port: 6379:6379
    - Volume: redis_data:/data

  minio:
    - Image: minio/minio:latest
    - Ports: 9000 (API), 9001 (Console)
    - Root User: rootuser
    - Root Password: rootpassword123
    - Volume: minio_data:/data

  backend:
    - Build: ./backend (Multi-stage Maven build)
    - Port: 8080:8080
    - Dependencies: postgres
    - Environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/cloudnest
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: password

  frontend:
    - Build: ./frontend (Multi-stage Node build)
    - Port: 80:80
    - Server: Nginx
    - Dependencies: backend
```

**Quick Start**:
```bash
docker-compose up -d --build
# Frontend: http://localhost
# Backend: http://localhost:8080
# PostgreSQL: localhost:5433
# MinIO: localhost:9001
# Redis: localhost:6379
```

---

### 14. REAL FLOW EXAMPLES

#### 14.1 User Registration Flow

```
1. User visits http://localhost
2. Sees Login/Register form
3. Enters: company name, subdomain, email, password, first name, last name
4. Clicks "Create Account"
5. Frontend: POST http://localhost:8080/api/v1/auth/register
   Payload: { companyName, subdomain, email, password, firstName, lastName }
6. AuthService.registerTenant():
   a) Create Tenant in DB
   b) Switch TenantContext to new tenant ID
   c) Create User with TENANT_ADMIN role
   d) Generate JWT token with tenantId, subdomain
7. Frontend: Stores token in localStorage
8. Frontend: Redirects to Dashboard
9. User now logged in to their tenant workspace
```

#### 14.2 Product Management Flow

```
1. Tenant admin clicks "Products" in sidebar
2. ProductsComponent fetches: GET /api/v1/products
   Header: Authorization: Bearer <JWT>
3. JwtAuthFilter validates JWT, extracts tenantId from claims
4. TenantContext.setCurrentTenant(tenantId)
5. ProductController.getAllProducts() called
6. ProductService.getAllProducts() called
7. ProductRepository.findAll() executes Hibernate query
8. CurrentTenantIdentifierResolver injects:
   WHERE products.tenant_id = <current_tenant>
9. PostgreSQL RLS also filters by tenant_id
10. Only products for current tenant returned (double isolation)
11. Frontend displays products with edit/delete buttons
12. User clicks "Add Product" → Modal opens
13. Fills: name, description, price, stock quantity
14. POST /api/v1/products with product data
15. ProductService.createProduct() saves with current tenant context
16. Product appears in list for current tenant only
```

#### 14.3 Order Processing Flow

```
1. Customer places order with OrderItems
2. Frontend: POST /api/v1/orders
   Payload: { customer, items: [{ productId, quantity }, ...] }
3. OrderService.createOrder():
   For each OrderItem:
   a) Look up Product by ID
   b) Validate stock >= quantity
   c) Deduct stock: product.stockQuantity -= quantity
   d) Calculate line_total = unitPrice * quantity
   e) Set OrderItem.order = order reference
4. Calculate order.totalAmount = SUM(lineTotal)
5. Set order.status = "PENDING"
6. Save Order with OrderItems to DB
7. ApiMetricsInterceptor logs API call metrics
8. Frontend updates UI with new order
9. Audit trigger captures INSERT into audit_logs with JSONB snapshot
```

#### 14.4 Analytics & Intelligence Flow

```
1. Dashboard periodically calls GET /api/v1/intelligence/forecasts
2. Backend returns TenantForecasts with:
   - riskLevel: low/medium/high/critical
   - healthScore: 0-100
   - forecastDate: prediction date
   - notes: insights
3. Frontend renders forecast cards with:
   - Health score as gradient bar (red for low, green for high)
   - Risk badges (color-coded)
4. User clicks "Intelligence" tab
5. Sees three tabs: Forecasts, Anomalies, Interventions
6. Anomalies show detected issues with severity
7. Interventions show recommended actions and status
8. User can mark interventions as "resolved"
9. PUT /api/v1/intelligence/interventions/{id}/resolve
10. Intervention status changes to "resolved"
```

---

### 15. ALGORITHMS & BUSINESS LOGIC

#### 15.1 Tenant Isolation Algorithm

```
Algorithm: Tenant Isolation at Request Time
Input: HTTP Request with JWT Token
Output: Query Results filtered for current tenant

1. Extract JWT from Authorization header
2. Decode JWT payload (no verification yet, done by JwtAuthFilter)
3. Get tenantId from JWT claims
4. Store in TenantContext (ThreadLocal)
5. For each repository query:
   a) Hibernate intercepts query
   b) Calls CurrentTenantIdentifierResolver.resolveCurrentTenantIdentifier()
   c) Resolver gets tenantId from TenantContext
   d) Hibernate adds WHERE clause: entity.tenantId = currentTenantId
   e) Query executes with tenant filter
6. PostgreSQL RLS also filters using app.current_tenant_id setting
7. Double-layer isolation ensures no data leakage

Complexity: O(1) - ThreadLocal lookup
Time: < 1ms per request
```

#### 15.2 Stock Management Algorithm

```
Algorithm: Order Processing with Inventory Deduction
Input: OrderRequest { customerId, items: [{ productId, quantity }] }
Output: Saved Order with reduced inventory

1. Start transaction
2. For each OrderItem in request:
   a) Load Product by productId (with lock for concurrency)
   b) If stock < quantity:
      THROW InsufficientStockException
   c) Decrement: product.stockQuantity -= item.quantity
   d) Save updated product
3. Calculate totalAmount = SUM(item.price * item.quantity)
4. Create Order entity with status = "PENDING"
5. Create OrderItem entities and link to Order
6. Save Order (cascades to OrderItems)
7. Commit transaction
8. ApiMetricsInterceptor logs the API call
9. AuditLog trigger records INSERT event with JSONB snapshot

Error Handling:
- ConcurrentModificationException → Retry logic
- InsufficientStockException → Return 400 Bad Request
- Database constraint violation → Rollback transaction
```

#### 15.3 JWT Token Generation Algorithm

```
Algorithm: JWT Token Creation with Tenant Context
Input: UserDetails, tenantId, firstName, lastName, subdomain
Output: Signed JWT token string

1. Create extraClaims map:
   {
     "tenantId": "<UUID>",
     "firstName": "<name>",
     "lastName": "<name>",
     "subdomain": "<subdomain>"
   }
2. Set claims on JWT builder:
   - subject: userDetails.username (email)
   - issuedAt: current time
   - expiration: current time + 86400000ms (24 hours)
   - custom claims: extraClaims
3. Sign with HS256 algorithm using secret key
4. Compact to string: "<header>.<payload>.<signature>"

Key Properties:
- Secret key: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
- Expiration: 24 hours (86400000ms)
- Algorithm: HMAC-SHA256
- Cannot be modified without secret key
```

#### 15.4 Billing Calculation Algorithm

```
Algorithm: Monthly Invoice Generation
Input: tenantId, billingPlan
Output: Invoice entity persisted to DB

1. Get Tenant's current plan
2. Get last UsageSnapshot for tenant
3. Calculate usage:
   - API Calls: COUNT(*) FROM api_metrics WHERE tenant_id = X
   - Storage: SUM(size) FROM storage WHERE tenant_id = X
   - Active Users: COUNT(DISTINCT user_id) FROM users WHERE tenant_id = X
4. Save UsageSnapshot(date, api_calls, storage, active_users)
5. Get BillingPlan pricing:
   - Free: $0, 1000 requests/month
   - Pro: $49, 10000 requests/month
   - Enterprise: $199, unlimited
6. If usage exceeds plan limit → Overage charges
7. Calculate invoice.amount = base_price + overage_charges
8. Set invoice.status = "pending"
9. Set invoice.dueDate = today + 30 days
10. Save Invoice to DB

Overage Logic:
- If actual_requests > plan_limit:
    overage = (actual_requests - plan_limit) * $0.01 per request
- Total_amount = base_price + overage
```

---

### 16. SYSTEM CHALLENGES & SOLUTIONS

| Challenge | Impact | Solution |
|-----------|--------|----------|
| Multi-tenant data isolation | Security risk if isolation fails | ThreadLocal + Hibernate @TenantId + PostgreSQL RLS (3-layer) |
| Concurrent order processing | Race condition on stock | Database row-level locking + transactional constraints |
| Performance with shared DB | Query slowness with many tenants | Indexing on tenant_id, partition pruning, connection pooling |
| JWT secret key exposure | Authentication bypass | Environment variable for secret key (not hardcoded in prod) |
| CORS for cross-origin API | Frontend-Backend communication | Configured allowed origins in SecurityConfig |
| Tenant context propagation | Forgetting to clear TenantContext | Finally block in filters ensures cleanup |
| Audit log volume | Storage bloat over time | Partitioning by date, archival policies |
| Password reset functionality | Missing in current version | Can be added with token-based reset flow |
| API rate limiting | DDoS attacks | ApiMetricsInterceptor can feed rate limit logic |

---

### 17. METRICS & MONITORING

**What is Tracked**:
1. API response times (in ms)
2. HTTP status codes
3. Request endpoints
4. HTTP methods (GET, POST, PUT, DELETE)
5. Timestamp of each request
6. Tenant ID for request attribution

**Where Metrics Go**:
- `api_metrics` table in PostgreSQL
- Indexed by tenant_id for fast queries
- Can be queried for analytics dashboards

**Analytics Possible**:
- Average response time per endpoint
- Error rates (5xx, 4xx responses)
- Request volume trends
- Peak traffic times
- Slow endpoints identification
- Per-tenant performance comparison

---

### 18. EXTENSIBILITY & FUTURE ENHANCEMENTS

**What Can Be Added**:
1. Email notifications (SendGrid/AWS SES)
2. Payment processing (Stripe/PayPal integration)
3. File uploads (MinIO integration for product images)
4. Real-time notifications (WebSocket)
5. Advanced analytics (ELK Stack, Grafana)
6. Machine learning forecasting (TensorFlow)
7. API key management UI
8. Webhook management
9. Custom domain mapping
10. SSO integration (OAuth2)
11. Data export (CSV, PDF)
12. Backup & restore utilities
13. Multi-region deployment
14. Caching optimization (Redis)
15. GraphQL API layer

---

### 19. TESTING STRATEGY (Inferred from Architecture)

**Test Types to Implement**:

1. **Unit Tests**:
   - ProductService.createProduct()
   - AuthService.login()
   - OrderService.createOrder()

2. **Integration Tests**:
   - Full API endpoint tests
   - Database transaction tests
   - Tenant isolation verification

3. **Security Tests**:
   - JWT validation
   - Tenant boundary violation attempts
   - Unauthorized access prevention

4. **Performance Tests**:
   - Database query optimization
   - API response time benchmarks
   - Concurrent user load testing

5. **UI Tests** (with Playwright/Cypress):
   - Login flow
   - Product CRUD
   - Navigation between pages

---

### 20. CODE QUALITY OBSERVATIONS

**Strengths**:
✅ Clean architecture (Controller → Service → Repository)
✅ Proper use of Lombok for boilerplate reduction
✅ DTOs for request/response contracts
✅ Exception handling with GlobalExceptionHandler
✅ Type-safe frontend with TypeScript
✅ Responsive UI with Tailwind CSS
✅ SQL migrations for schema versioning
✅ Multi-layer data isolation

**Areas for Improvement**:
⚠️ Limited error handling in services (should throw custom exceptions)
⚠️ No validation annotations on request DTOs (@Valid, @NotNull)
⚠️ ApiMetricsInterceptor could be optimized (async logging)
⚠️ Frontend could benefit from state management (Redux/Zustand)
⚠️ No comprehensive input validation
⚠️ Limited logging (should add SLF4J)
⚠️ No comprehensive unit test suite visible

---

## END OF PART A: PROJECT EXTRACTION

