#!/bin/bash

echo "🚀 Setting up Call Analytics Project..."

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your Supabase DATABASE_URL"
    echo "   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
    echo ""
    echo "Press Enter when you've updated .env file..."
    read
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env has DATABASE_URL
if grep -q "DATABASE_URL=" .env; then
    if grep -q "\[YOUR-PASSWORD\]" .env; then
        echo "⚠️  Please update DATABASE_URL in .env file first"
        echo "   Then run: npm run setup-db"
    else
        echo "🔧 Setting up database..."
        npm run setup-db
    fi
else
    echo "⚠️  DATABASE_URL not found in .env file"
    echo "   Please add your Supabase connection string"
fi

echo ""
echo "🎯 Setup complete! Next steps:"
echo "1. Update .env with your Supabase DATABASE_URL"
echo "2. Run: npm run setup-db"
echo "3. Start server: npm start"
echo "4. Test with Postman using the collection file"
echo ""
echo "🔑 Test API Key: test-key-123"
echo "📚 See README.md for detailed instructions" 