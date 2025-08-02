# Business Management Panel

A comprehensive business management dashboard built with React, TypeScript, and Supabase.

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd business-management-panel
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your Supabase credentials
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication components
│   └── suppliers/     # Supplier management
├── services/          # API service layers
│   └── api/          # Supabase API calls
├── utils/            # Utility functions
├── constants/        # App constants & config
└── contexts/         # React contexts
```

## 🔐 Authentication & Permissions

### User Roles
- **Super Admin**: Full system access
- **Admin**: Manage staff, finances, suppliers
- **Manager**: View/manage operations
- **Staff**: Limited access
- **Viewer**: Read-only access

### Key Features
- Role-based access control
- Protected routes
- Permission-based UI rendering

## 🛠 API Services

### Supabase Integration
- **Authentication**: Email/password login
- **Database**: PostgreSQL with RLS
- **Storage**: File uploads for documents/images
- **Edge Functions**: Server-side logic

### Service Layers
- `authService`: User authentication
- `staffService`: Staff management
- `supplierService`: Supplier operations
- `payrollService`: Payroll processing
- `outgoingsService`: Expense tracking

## 🔧 Configuration

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_NAME=Business Management Panel
```

### Database Tables
- `user_profiles` - User information
- `user_roles` - Role assignments
- `staff` - Staff records
- `suppliers` - Supplier data
- `payroll_records` - Payroll history
- `outgoings` - Expense tracking

## 📱 Features

### Core Modules
- **Dashboard**: Overview & analytics
- **Staff Management**: Employee records & payroll
- **Supplier Management**: Vendor relationships
- **Financial Tracking**: Outgoings & expenses
- **User Management**: Role-based access

### Third-party Integrations
- Westpac Banking API (planned)
- Lightspeed POS integration (planned)

## 🚀 Deployment

```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## 🔒 Security

- Row Level Security (RLS) enabled
- JWT-based authentication
- Permission-based access control
- Secure file uploads

## 📝 Development

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Modular architecture
- Service layer pattern

### Adding New Features
1. Create feature folder in `src/features/`
2. Add service layer in `src/services/api/`
3. Update permissions in `src/constants/`
4. Add protected routes as needed

## 🐛 Known Issues

- File upload size limits (10MB)
- Real-time updates not implemented
- Mobile responsiveness needs improvement

## 🔄 Future Enhancements

- Real-time notifications
- Advanced reporting
- Mobile app
- API rate limiting
- Audit logging