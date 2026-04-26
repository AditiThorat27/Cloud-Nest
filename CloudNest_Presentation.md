# CloudNest - Multi-Tenant SaaS E-Commerce Platform

## Slide 1: Title Slide
- **CloudNest**
- A Multi-Tenant SaaS E-Commerce Platform with Integrated Cloud Workspace Analytics
- Built with Modern Technologies

---

## Slide 2: Overview
- **What is CloudNest?**
- A production-ready full-stack multi-tenant application
- Allows multiple businesses to register and create their own online stores
- Manage products, orders, and customers independently
- All while sharing the same underlying infrastructure securely

---

## Slide 3: Architecture
- **Shared Database, Shared Schema** architecture
- Strict data isolation using:
  1. PostgreSQL Row-Level Security (RLS)
  2. Hibernate Partitioning (@TenantId)
  3. JWT Context Extraction
- Tenant context determined via JWT token or X-Tenant-ID header

---

## Slide 4: Tech Stack - Frontend
- **React 19** - UI Framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool & dev server
- **Tailwind CSS 4** - Styling framework
- **PostCSS** - CSS processing

---

## Slide 5: Tech Stack - Backend
- **Java 17** - Programming language
- **Spring Boot 3.2.4** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Database access
- **Hibernate 6** - ORM

---

## Slide 6: Tech Stack - Database & Storage
- **PostgreSQL 15** - Primary database
- **Redis** - Caching
- **MinIO** - S3-compatible object storage
- **Flyway** - Database migrations

---

## Slide 7: Multi-Tenancy Implementation
- **Tenant Entity** - Core entity storing tenant information
- **@TenantId Annotation** - Used in all tenant-specific entities
- **CurrentTenantIdentifierResolver** - Resolves tenant from request
- **Tenant Filter** - Applies tenant context to every request

---

## Slide 8: Database Schema - Core Tables
- **tenants** - Stores tenant information (id, name, subdomain, status)
- **users** - User accounts with tenant_id foreign key
- **roles** - Role definitions per tenant
- **permissions** - Global permission definitions

---

## Slide 9: Database Schema - Business Tables
- **products** - Product catalog with tenant isolation
- **categories** - Product categories per tenant
- **customers** - Customer data with tenant_id
- **orders** - Order records linked to customers

---

## Slide 10: Database Schema - Join Tables
- **user_roles** - Links users to roles (Many-to-Many)
- **role_permissions** - Links roles to permissions (Many-to-Many)
- **api_metrics** - API usage tracking per tenant

---

## Slide 11: DBMS Concepts - Primary Keys & UUIDs
- All entities use UUID as primary key
- Generated using Hibernate's UUID generator
- Example: `gen_random_uuid()` in PostgreSQL
- Ensures globally unique identifiers across tenants

---

## Slide 12: DBMS Concepts - Foreign Keys & Relationships
- **tenant_id** in all tenant-specific tables references tenants(id)
- **customer_id** in orders references customers(id)
- **category_id** in products references categories(id)
- Referential integrity enforced at database level

---

## Slide 13: DBMS Concepts - Unique Constraints
- Email must be unique per tenant: `UNIQUE (email, tenant_id)`
- Role names unique per tenant: `UNIQUE (name, tenant_id)`
- Subdomain globally unique: `UNIQUE` on tenants table
- Prevents data conflicts between tenants

---

## Slide 14: DBMS Concepts - Timestamps & Auditing
- All entities have `created_at` and `updated_at` fields
- Managed via JPA lifecycle hooks (@PrePersist, @PreUpdate)
- Automatic timestamp tracking for audit purposes

---

## Slide 15: Security - JWT Authentication
- Spring Security with JWT tokens
- Token contains tenant context
- X-Tenant-ID header support for API clients
- Role-based access control (RBAC)

---

## Slide 16: API Endpoints
- **Auth**: /api/v1/auth/register, /api/v1/auth/login
- **Products**: /api/v1/products (CRUD)
- **Customers**: /api/v1/customers (CRUD)
- **Orders**: /api/v1/orders (CRUD)
- **Actuator**: /actuator/health

---

## Slide 17: Running the Application
- **Docker Compose**: `docker-compose up -d --build`
- **Manual Setup**:
  - Frontend: `npm run dev` (port 5173)
  - Backend: `mvn spring-boot:run` (port 8080)
- Requires PostgreSQL, Redis, and MinIO

---

## Slide 18: Development Configuration
- Currently configured with H2 in-memory database for testing
- For production: Switch to PostgreSQL
- Update application.yml with PostgreSQL connection details
- Enable Flyway migrations

---

## Slide 19: Key Features
- ✅ Multi-tenant data isolation
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ RESTful API design
- ✅ Real-time analytics (api_metrics)
- ✅ Product & order management

---

## Slide 20: Summary & Next Steps
- CloudNest provides a solid foundation for SaaS applications
- Easy to extend with new features
- Production-ready with proper security
- Next: Add payment integration, email notifications, more analytics

---

## Questions?
- GitHub Repository
- Documentation in README.md
- Backend API documentation at /actuator