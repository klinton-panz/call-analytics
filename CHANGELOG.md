# Changelog

All notable changes to the Call Analytics project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-08-31

### Added
- Railway deployment configuration with `railway.json`
- Full-stack hosting on Railway (frontend + backend)
- Automatic deployments from GitHub to Railway
- Node.js server configuration for Railway deployment
- Environment variables setup for Railway production

### Changed
- Migrated from Vercel to Railway for complete hosting solution
- Updated server.js to serve React app from `dist` directory
- Configured Express.js to handle both API routes and static files
- Improved API routing with proper static file serving order

### Fixed
- Input text visibility issue in login forms (white text on white background)
- Railway deployment serving static files instead of Node.js server
- API endpoints now properly return JSON responses
- Client-side routing now works correctly on Railway

## [1.1.0] - 2025-08-30

### Added
- Split-screen login design with modern layout
- Sales Engine branding with orange-to-blue gradient
- Chart visualization on login page right side
- Mobile-responsive login (hides split layout on small screens)
- Professional "Track Your Call Progress" messaging

### Changed
- Redesigned login portal from violet background to Sales Engine branding
- Implemented CSS Grid layout for 50/50 split screen
- Updated color scheme to match Sales Engine brand colors
- Enhanced mobile user experience with simplified login form

### Fixed
- CSS specificity issues with `!important` declarations
- Mobile layout squeezing on small screens
- Login form responsiveness across devices

## [1.0.0] - 2025-08-29

### Added
- Complete React frontend with Vite build system
- User authentication system with Supabase
- Protected routes and user session management
- Modern dashboard with call analytics
- API key management system
- Responsive design with dark/light theme support
- Real-time call data visualization

### Backend Features
- Node.js/Express server with comprehensive API
- PostgreSQL database integration via Supabase
- API key authentication system
- Row Level Security (RLS) for data isolation
- CORS and security headers with Helmet
- Compression and performance optimizations

### Database Schema
- Users table with authentication
- API keys table for secure access
- Calls table with user association
- Proper indexing and foreign key relationships

### API Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/calls` - Retrieve user's call data
- `POST /api/calls` - Create/update call records
- Authentication via `x-api-key` header

### Security Features
- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure API key authentication
- Protected frontend routes
- HTTPS enforcement

### Development Tools
- Database setup scripts
- Authentication testing utilities
- Debug server with detailed logging
- Comprehensive error handling

### Documentation
- Complete README.md with setup instructions
- Frontend setup guide (FRONTEND_SETUP.md)
- API documentation with examples
- Troubleshooting guides
- Development workflow documentation

## [0.1.0] - Initial Development

### Added
- Basic project structure
- Initial server setup
- Database schema design
- Core API functionality
- Basic frontend components

---

## Version History Summary

- **v1.2.0**: Railway deployment and hosting migration
- **v1.1.0**: UI/UX improvements and Sales Engine branding
- **v1.0.0**: Complete full-stack application with authentication
- **v0.1.0**: Initial development and core features

## Deployment History

### Production Deployments
- **Railway**: https://call-analytics-10-production.up.railway.app
- **GitHub**: https://github.com/KlintonPanz/Call-analytics-10

### Environment Setup
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth with JWT
- **Hosting**: Railway (full-stack Node.js + React)
- **CI/CD**: Automatic deployment from GitHub main branch

## Contributors
- Claude Code AI Assistant
- Klinton Panz (Product Owner)

---

*This changelog is automatically updated with each release.*