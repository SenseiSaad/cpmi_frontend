# CPMI Certification Academy LMS

Production-grade, enterprise-friendly frontend for a multi-tenant learning management system for US government agencies.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000`


## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form with Zod validation
- **Animation:** Framer Motion
- **API Client:** Axios with HttpOnly cookies & CSRF
- **Icons:** Lucide React

### Folder Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Landing page
│   ├── auth/         # Authentication flows
│   ├── admin/        # Super admin & training manager portal
│   ├── agency/       # Agency admin portal  
│   └── learner/      # Learner portal
├── components/
│   ├── ui/           # Reusable UI components
│   ├── shared/       # Shared components (Logo, Avatar)
│   ├── layout/       # Layout components (DashboardShell)
│   └── features/     # Feature-specific components
├── lib/
│   ├── api-client.ts # Axios client with CSRF & cookies
│   ├── utils.ts      # Shared utilities
│   └── mock-auth.ts  # Temporary mock authentication
├── services/         # API service layer
├── hooks/            # Custom React hooks
├── types/            # TypeScript definitions
└── config/           # Application configuration
```

## 🎨 Design System

### Brand Colors
- **Primary:** `#2A5025` (Dark Green) - Main brand color
- **Secondary:** `#CFB112` (Gold) - Accents and CTAs
- **Tertiary:** `#738A70` (Sage) - Supporting elements
- **Highlight:** `#47D64C` (Bright Green) - Success states

### Typography
- **Headings:** Inter (Black weight)
- **Body:** Inter (Regular/Medium)
- **Accents:** Georgia (Serif)

### Key Features
- ✅ WCAG 2.2 AA accessibility compliance
- ✅ Full keyboard navigation
- ✅ Visible focus states
- ✅ Reduced motion support
- ✅ Skip navigation link
- ✅ Semantic HTML
- ✅ Enterprise-friendly visual language

## 🔒 Authentication & Security

### Current Implementation (Development)
- Mock authentication layer in `src/lib/mock-auth.ts`
- Session stored in `sessionStorage` (temporary)
- Role-based routing

### Production Requirements
The application is architected for enterprise-grade authentication:

- **HttpOnly Cookies:** Primary authentication mechanism
- **CSRF Protection:** Tokens from `GET /api/auth/csrf`
- **No Client-side Tokens:** Never uses localStorage/sessionStorage for real auth
- **401 Handling:** Auto-redirect to session expired
- **403 Handling:** Access denied screen

### Backend Integration Checklist

Replace `src/lib/mock-auth.ts` with real API calls:

1. **Auth Endpoints Required:**
   - `GET /api/auth/csrf` → `{ token: string }`
   - `POST /api/auth/login` → HttpOnly session cookie
   - `POST /api/auth/logout`
   - `GET /api/auth/me` → User object with public UUIDs
   - `POST /api/auth/password-reset/request`
   - `POST /api/auth/password-reset/confirm`
   - `POST /api/invitations/accept`

2. **User Object Structure:**
```typescript
{
  id: string;                    // Public UUID, NOT internal numeric ID
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'training_manager' | 'agency_admin' | 'learner';
  agencies?: Array<{
    agencyId: string;            // Public UUID
    agencySlug: string;          // URL-safe identifier
    agencyName: string;
    role: string;
  }>;
  activeAgencyId?: string;
}
```

3. **Replace mock in components:**
   - Remove all imports from `@/lib/mock-auth`
   - Update to use `authService` from `@/services/auth.service`
   - Remove `sessionStorage` calls

## 🎭 User Roles & Access

### Role Hierarchy

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| **super_admin** | `/admin` | Platform overview, all agencies, catalog management, users |
| **training_manager** | `/admin` | Catalog, courses, modules, products, pricing |
| **agency_admin** | `/agency` | Agency members, invitations, seats, orders, billing |
| **learner** | `/learner` | My courses, progress, assessments, certificates |

### Route Guards

Routes automatically enforce role-based access:
- `/admin/*` - Super admin & training manager only
- `/agency/*` - Agency admin only
- `/learner/*` - Learner only

## 🚧 Feature Flags

Control incomplete features via environment variables:

```env
NEXT_PUBLIC_FEATURE_LEARNING_PROGRESS=false  # Course progress tracking
NEXT_PUBLIC_FEATURE_ASSESSMENTS=false        # Assessment engine
NEXT_PUBLIC_FEATURE_CERTIFICATES=false       # Certificate generation
NEXT_PUBLIC_FEATURE_BILLING=true             # Billing & payments
```

Features behind flags show "Coming Soon" placeholders.

## 📝 Environment Variables

Create `.env.local`:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_FEATURE_LEARNING_PROGRESS=false
NEXT_PUBLIC_FEATURE_ASSESSMENTS=false
NEXT_PUBLIC_FEATURE_CERTIFICATES=false
NEXT_PUBLIC_FEATURE_BILLING=true
```

## 🎯 What's Implemented

### ✅ Complete
- Landing page with updated hero layout
- Login page with demo credentials
- Role-based dashboard routing
- Admin dashboard shell
- Agency dashboard shell
- Learner dashboard shell
- API client architecture (CSRF, cookies, error handling)
- Type-safe service layer
- Responsive layouts
- Accessible components
- Brand design system

### 🚧 In Progress
- Forgot/reset password flow
- Invitation acceptance
- Session expired handling
- Access denied screen

### 📋 Planned
- Agency member management
- Bulk CSV invitation
- Seat assignment
- Product catalog
- Checkout flow
- Course player
- Assessment engine
- Certificate generation
- Full test suite (Vitest + Playwright)

## 🧪 Testing

```bash
# Unit tests (when configured)
npm run test

# E2E tests (when configured)
npm run test:e2e
```

## 🚀 Deployment

### Build
```bash
npm run build
```

### Environment-Specific Builds
```bash
# Staging
NEXT_PUBLIC_API_URL=https://api-staging.cpmi.gov npm run build

# Production
NEXT_PUBLIC_API_URL=https://api.cpmi.gov npm run build
```

## 📚 Additional Documentation

- [Architecture](./docs/ARCHITECTURE.md) (coming soon)
- [API Integration Guide](./docs/API_INTEGRATION.md) (coming soon)
- [Testing Strategy](./docs/TESTING.md) (coming soon)

## 🔗 Key Routes

- `/` - Public landing page
- `/auth/login` - Sign in
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset confirmation
- `/auth/invitation` - Accept agency invitation
- `/admin` - Platform administration
- `/agency` - Agency management
- `/learner` - Learner portal

## 🤝 Contributing

This is an enterprise application. All contributions must maintain:
- TypeScript strict mode
- WCAG 2.2 AA accessibility
- Comprehensive test coverage
- Government-appropriate visual language

## 📄 License

Proprietary - CPMI Certification Academy

---

**Note:** This frontend is ready for backend integration. The mock authentication layer (`src/lib/mock-auth.ts`) should be removed once real API endpoints are available.
