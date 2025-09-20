# Intelligent Loan Platform

AI-powered loan origination platform with intelligent underwriting and real-time decision making.

## 🚀 Features

- **AI-Powered Underwriting**: Claude AI integration for intelligent risk assessment
- **Real-time Decisions**: Instant loan approvals with comprehensive policy engine
- **Complete Loan Journey**: 8-screen user experience from application to approval
- **Mock Bureau Integration**: Realistic credit bureau data simulation
- **Policy Engine**: Exact implementation of credit policies with hard reject and waterfall rules
- **Document Processing**: AI-powered document analysis and verification
- **Responsive Design**: Modern UI with Tailwind CSS

## 🏗️ Architecture

### Backend (FastAPI + Supabase)
- **FastAPI**: High-performance Python web framework
- **Supabase**: PostgreSQL database with real-time capabilities
- **Claude AI**: Anthropic's AI for intelligent decision making
- **JWT Authentication**: Secure token-based authentication
- **Policy Engine**: Comprehensive credit policy implementation

### Frontend (Next.js + TypeScript)
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Performant form handling
- **Zustand**: Lightweight state management

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account
- Anthropic API key

## 🛠️ Local Development

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Run the development server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema:**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the content from `backend/database_schema.sql`
   - Execute the SQL

3. **Get your credentials:**
   - Go to Settings → API
   - Copy Project URL and anon public key
   - Update your environment variables

## 🚀 Deployment

### Backend Deployment (Render)

1. **Connect to GitHub:**
   - Create account at [render.com](https://render.com)
   - Connect your GitHub repository

2. **Create Web Service:**
   - Select your repository
   - Choose "Web Service"
   - Use these settings:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   ```
   ENVIRONMENT=production
   SECRET_KEY=your-secret-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   ANTHROPIC_API_KEY=your-claude-api-key
   ```

### Frontend Deployment (Netlify)

1. **Connect to GitHub:**
   - Create account at [netlify.com](https://netlify.com)
   - Connect your GitHub repository

2. **Build Settings:**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user

### Applications
- `POST /api/applications/create` - Create loan application
- `GET /api/applications/{id}` - Get application details
- `PUT /api/applications/{id}` - Update application
- `POST /api/applications/{id}/submit` - Submit for underwriting
- `POST /api/applications/{id}/documents` - Upload documents

### Underwriting
- `POST /api/underwriting/process/{id}` - Process underwriting
- `GET /api/underwriting/status/{id}` - Get underwriting status

### Policy Testing
- `POST /api/policy/test` - Test policy with custom data
- `GET /api/policy/templates` - Get bureau data templates
- `GET /api/policy/rules` - Get current policy rules

## 🧪 Testing

### Policy Engine Testing

The platform includes comprehensive policy testing capabilities:

1. **Hard Reject Rules:**
   - Minimum income: ₹25,000
   - Minimum credit score: 650
   - Age range: 21-65 years
   - Employment stability requirements

2. **Waterfall Policy:**
   - FOIR calculation (max 55%)
   - Risk-based pricing
   - Income prioritization
   - Employment type multipliers

3. **Bureau Data Templates:**
   - Excellent Profile (750+ credit score)
   - Good Profile (700-749)
   - Fair Profile (650-699)
   - Poor Profile (600-649)
   - Reject Profile (<600 with defaults)

## 🔒 Security Features

- JWT-based authentication
- Row Level Security (RLS) in database
- Input validation and sanitization
- CORS protection
- Rate limiting
- Secure file upload handling

## 📱 User Journey

1. **Phone Verification**: OTP-based authentication
2. **Loan Details**: Amount, purpose, tenure selection
3. **Personal Information**: Age, income details
4. **Employment**: Job type, experience
5. **Review**: Application summary
6. **Documents**: Upload income/identity proofs
7. **Underwriting**: AI-powered risk assessment
8. **Decision**: Instant approval/rejection with terms

## 🤖 AI Integration

### Claude AI Features:
- **Risk Assessment**: Comprehensive analysis of application and bureau data
- **Document Analysis**: Intelligent extraction of income information
- **Final Decision**: AI-powered underwriting decisions
- **Explanation Generation**: Human-readable decision explanations

## 📈 Monitoring

- Health check endpoints
- Comprehensive audit logging
- Application metrics and analytics
- Error tracking and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

---

**Built with ❤️ using FastAPI, Next.js, and Claude AI**