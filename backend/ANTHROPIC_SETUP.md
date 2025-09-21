# Anthropic API Setup Guide

## 🔑 Setting up Claude API Integration

### 1. Get Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up/Login to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-ant-`)

### 2. Environment Configuration

#### For Local Development:
Create a `.env` file in the `backend/` directory:
```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

#### For Render Deployment:
1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment variables
4. Add: `ANTHROPIC_API_KEY` = `sk-ant-your-actual-api-key-here`

### 3. API Endpoints for Testing

#### Test Basic API:
```bash
GET /api/documents/test
```

#### Test Claude Connection:
```bash
GET /api/documents/test-claude
```

#### Test Document Extraction:
```bash
POST /api/documents/extract-documents
Content-Type: multipart/form-data

# Include files:
pan_file: [PAN card image]
aadhaar_file: [Aadhaar image]  
user_id: test-user-123
```

### 4. Supported Models
- **claude-3-haiku-20240307** (Fast, cost-effective)
- **claude-3-sonnet-20240229** (Balanced)
- **claude-3-opus-20240229** (Most capable)

Current setup uses **Claude 3 Haiku** for optimal cost/performance.

### 5. Error Handling
The system includes multiple fallback layers:
1. **Real Claude API** → Actual document extraction
2. **API Failure** → Structured fallback data  
3. **JSON Parse Error** → Cleaned response parsing
4. **Network Issues** → Demo data with clear indicators

### 6. Troubleshooting

#### Common Issues:
1. **"Claude client not initialized"**
   - Check if ANTHROPIC_API_KEY is set
   - Verify API key format (starts with sk-ant-)

2. **"Authentication failed"**
   - Check API key validity
   - Ensure you have Claude API access

3. **"Model not found"**
   - Verify model name spelling
   - Check your API plan supports the model

4. **JSON parsing errors**
   - The system now handles markdown formatting
   - Automatic fallback to demo data

### 7. Cost Optimization
- Uses Claude 3 Haiku (most cost-effective)
- 2000 token limit for responses
- Fallback to demo data prevents excessive API calls
- Smart caching could be added for repeated documents

### 8. Security Notes
- Never commit API keys to git
- Use environment variables only
- Rotate keys regularly
- Monitor usage in Anthropic console