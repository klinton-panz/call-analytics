# Call Analytics

A Node.js + Supabase call tracking and analytics dashboard with API key authentication.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `env.example` to `.env` and fill in your Supabase database URL:
```bash
cp env.example .env
```

Edit `.env` with your actual Supabase credentials:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
PORT=8080
```

### 3. Database Setup
Run the database setup script to create tables and insert test data:
```bash
npm run setup-db
```

This will:
- Create `users`, `api_keys`, and `calls` tables
- Insert a test user and API key
- Show you the test API key to use

### 4. Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## 🔑 API Authentication

The API uses API key authentication via headers:

- **Header**: `x-api-key` or `x-secret`
- **Value**: Your API key from the `api_keys` table

### Test API Key
After running setup, you'll get a test API key: `test-key-123`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Get Calls
```
GET /api/calls?limit=500
```

### Create/Update Call
```
POST /api/calls
Headers: x-api-key: your-api-key
Body: {
  "contactName": "John Doe",
  "phone": "(555) 123-4567",
  "direction": "inbound",
  "status": "Qualified",
  "summary": "Called about pool installation"
}
```

## 🧪 Testing

### Test Authentication
```bash
node test-auth.js
```

### Debug Mode
Run the debug server for detailed logging:
```bash
node server-debug.js
```

## 🔍 Troubleshooting

### 401 Unauthorized Error

If you're getting 401 errors in Postman:

1. **Check your .env file** - Make sure DATABASE_URL is correct
2. **Run database setup** - `npm run setup-db`
3. **Verify API key** - Use the test key: `test-key-123`
4. **Check headers** - Set `x-api-key: test-key-123` in Postman
5. **Run debug server** - `node server-debug.js` for detailed logs

### Common Issues

- **Table not found**: Run `npm run setup-db` first
- **Connection failed**: Check your Supabase DATABASE_URL
- **API key not working**: Verify the key exists in the `api_keys` table

## 🗄️ Database Schema

### Tables

- **users**: User accounts
- **api_keys**: API key authentication
- **calls**: Call records with user association

### Row Level Security (RLS)
All tables have RLS enabled for data isolation between users.

## 🛠️ Development

### Project Structure
```
call-analytics/
├── server.js          # Main server (production)
├── server-debug.js    # Debug server with logging
├── schema.sql         # Database schema
├── scripts/
│   └── setup-db.js   # Database setup script
├── test-auth.js       # Authentication test script
├── public/
│   └── index.html     # Dashboard frontend
└── package.json
```

### Adding New API Keys
```sql
INSERT INTO api_keys (user_id, key, name) 
VALUES (1, 'your-new-key', 'Key Description');
```

## 📊 Dashboard Features

- Real-time call analytics
- Filter by date, status, and search
- Responsive design with dark/light themes
- Call detail modal view
- Automatic data refresh

## 🔒 Security

- API key authentication
- Row Level Security (RLS)
- Input validation and sanitization
- CORS enabled
- Helmet security headers

## 📝 License

MIT License 