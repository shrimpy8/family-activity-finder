# 🎯 Family Activity Finder

Discover personalized family-friendly activities using AI-powered web search. Built with React, TypeScript, and Claude AI.

## ✨ Features

- 🤖 **AI-Powered Recommendations** - Uses Claude Sonnet 4.5 with real-time web search
- 🗺️ **Precise Location Search** - City, state, and optional zip code for accurate results
- 📅 **Smart Date Selection** - HTML5 date picker with automatic weekend detection
- ⏰ **Flexible Time Slots** - All Day, Morning, Afternoon, Evening, or Night
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔒 **Secure Architecture** - API keys protected server-side, proper CORS configuration
- ⚡ **Fast Performance** - Sub-20 second response times with web search

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shrimpy8/family-activity-finder.git
   cd family-activity-finder
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in backend directory
   cp .env.example .env
   ```

   Edit `backend/.env` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   PORT=3001
   ```

4. **Set up Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the application**

   Open two terminal windows:

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173`

## 📖 Usage

1. **Enter Location**: City, state (required), and optional zip code for precision
2. **Specify Ages**: Enter children's ages separated by commas (e.g., "5, 8, 12")
3. **Select Date**: Choose a date using the calendar picker
4. **Choose Time**: Pick a time slot (All Day, Morning, Afternoon, Evening, or Night)
5. **Set Distance**: Use the slider to set how far you're willing to drive (1-50 miles)
6. **Add Preferences** (Optional): Enter any specific requirements (e.g., "outdoor, educational, free")
7. **Click "Find Activities"**: Wait 10-20 seconds for AI-powered recommendations

## 🏗️ Project Structure

```
family-activity-finder/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ActivityForm.tsx
│   │   │   └── RecommendationCard.tsx
│   │   ├── services/        # API integration
│   │   │   └── api.ts
│   │   ├── types/           # TypeScript definitions
│   │   │   └── index.ts
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── .env                 # Frontend config (optional)
│
├── backend/                  # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   └── recommend.ts # Main recommendation endpoint
│   │   ├── types/           # TypeScript definitions
│   │   │   └── index.ts
│   │   └── index.ts         # Express server setup
│   ├── package.json
│   ├── .env                 # Backend config (API keys)
│   └── .env.example         # Template for .env
│
├── .claude/                  # Claude Code settings
│   └── settings.local.json
├── prompt.md                 # Claude API prompt documentation
├── spec.md                   # Original project specification
├── todo.md                   # Development milestones & tasks
└── README.md                 # This file
```

## 🔧 Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Vite** - Build tool and dev server

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Anthropic SDK** - Claude AI integration
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing

## 🎨 Key Components

### ActivityForm.tsx
- Smart default date (next weekend or today if already weekend)
- Real-time input validation
- Responsive design optimized for mobile and desktop

### RecommendationCard.tsx
- Displays emoji, title, location, distance, and description
- Hover effects for better UX
- Numbered badges for easy reference

### API Service (backend/src/routes/recommend.ts)
- Builds dynamic prompts from form data
- Calls Claude API with web search enabled
- Parses AI responses into structured recommendations
- Comprehensive error handling

## 🔐 Environment Variables

### Backend (.env)
```bash
ANTHROPIC_API_KEY=sk-ant-...           # Required: Your Anthropic API key
PORT=3001                              # Optional: Server port (default: 3001)
```

### Frontend (.env) - Optional
```bash
VITE_API_URL=http://localhost:3001    # Backend URL (default: http://localhost:3001)
```

## 🛣️ API Endpoints

### `POST /api/recommend`

Generates activity recommendations using Claude AI with web search.

**Request Body:**
```json
{
  "city": "Dublin",
  "state": "CA",
  "zipCode": "94568",
  "ages": [5, 8],
  "date": "2025-11-16",
  "timeSlot": "afternoon",
  "distance": 10,
  "preferences": "outdoor activities, family-friendly"
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "emoji": "🎨",
      "title": "Children's Art Workshop - Saturday 2pm-4pm",
      "location": "Downtown Dublin",
      "distance": "2 miles",
      "description": "Interactive art workshop for kids ages 4-10..."
    }
  ]
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T15:03:54.804Z"
}
```

## 🔒 Security

Family Activity Finder implements enterprise-grade security to protect your data and prevent API abuse. **See [SECURITY.md](./SECURITY.md) for complete security documentation.**

### Security Features

✅ **CORS Protection** - API restricted to authorized frontend origin only
✅ **Rate Limiting** - 10 requests per 15 minutes per IP address
✅ **Request Size Limits** - 10KB maximum payload to prevent memory attacks
✅ **Input Validation** - Comprehensive validation on all 8 form fields
✅ **Security Headers** - Helmet.js with 8 security headers (CSP, HSTS, X-Frame-Options, etc.)
✅ **Error Sanitization** - No internal details exposed to clients
✅ **API Key Security** - Keys stored server-side only, never in frontend
✅ **npm Audit** - 0 vulnerabilities in both backend and frontend

### Rate Limits

- **Limit:** 10 requests per 15 minutes per IP
- **Response:** HTTP 429 when exceeded
- **Reset:** Automatic after 15-minute window
- **Headers:** `RateLimit-*` headers included in all responses

### CORS Configuration

- **Development:** `http://localhost:5173`
- **Production:** Set via `FRONTEND_URL` environment variable
- **Unauthorized origins:** Blocked with CORS error

### Security Testing

All security features comprehensively tested:
- ✅ CORS blocks unauthorized origins
- ✅ Rate limiter verified with stress test (12 requests)
- ✅ Oversized payloads rejected (15KB test)
- ✅ SQL injection attempts blocked
- ✅ XSS attempts sanitized
- ✅ All 8 security headers verified active

### Production Environment Variables

**Backend:**
```bash
ANTHROPIC_API_KEY=sk-ant-...           # Production API key
PORT=3001                              # Server port
FRONTEND_URL=https://yourdomain.com    # Production frontend URL
NODE_ENV=production                    # Environment mode
```

**Frontend:**
```bash
VITE_API_URL=https://api.yourdomain.com  # Production backend URL
```

**📖 Full documentation:** [SECURITY.md](./SECURITY.md)

---

## 🎯 Development Milestones

- ✅ **Milestone 1**: Frontend with dummy data (Complete)
- ✅ **Milestone 2**: Claude API integration with web search (Complete)
- ✅ **Milestone 3**: Production security & deployment (Complete - 11/15 core tasks)

See [todo.md](./todo.md) for detailed task breakdowns.

## 🐛 Troubleshooting

### Backend won't start
- **Solution**: Check that `ANTHROPIC_API_KEY` is set in `backend/.env`
- **Solution**: Ensure port 3001 is not already in use

### CORS errors
- **Solution**: Verify backend is running on port 3001
- **Solution**: Check that `cors()` middleware is enabled in `backend/src/index.ts`

### Frontend shows "Failed to load recommendations"
- **Solution**: Verify backend is running (`http://localhost:3001/health` should return status)
- **Solution**: Check browser console for specific error messages
- **Solution**: Ensure API key is valid and has credits

### Claude API errors
- **Solution**: Verify API key is correct and active
- **Solution**: Check you have available API credits
- **Solution**: Ensure you're using the correct model name: `claude-sonnet-4-5-20250929`

### Web search not working
- **Solution**: Verify tools configuration includes `type: 'web_search_20250305'`
- **Solution**: Check that `max_uses: 5` is set for the web search tool

### Rate Limit Errors (HTTP 429)
- **Problem**: "Too many requests from this IP, please try again after 15 minutes"
- **Solution**: Wait for the rate limit window to reset (check `RateLimit-Reset` header)
- **Solution**: Reduce request frequency (current limit: 10 requests per 15 minutes)
- **Note**: This is expected behavior to prevent API abuse

### CORS Blocked from Different Domain
- **Problem**: CORS error when accessing API from unauthorized origin
- **Solution**: Update `FRONTEND_URL` in backend `.env` to your frontend domain
- **Solution**: For development, ensure frontend is running on `http://localhost:5173`
- **Note**: This is a security feature, not a bug

### Request Too Large (HTTP 413)
- **Problem**: "Payload Too Large" error
- **Solution**: Ensure request body is under 10KB
- **Solution**: Reduce length of preferences field (max 500 characters)
- **Note**: Size limit prevents memory exhaustion attacks

### Invalid Input Errors (HTTP 400)
- **Problem**: Input validation failing with specific error messages
- **Solution**: Check field requirements in error message
- **Common issues:**
  - City: Only letters, spaces, hyphens, apostrophes, periods allowed
  - State: Must be valid 2-letter US state code (e.g., CA, NY, TX)
  - ZipCode: Must be exactly 5 digits
  - Ages: Must be integers between 0-18
  - Date: Must be YYYY-MM-DD format within 1 year from today
  - Distance: Must be between 1-50 miles

## 📝 Development Scripts

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run production build
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🤝 Contributing

This is a personal project built as part of learning AI integration. Feel free to fork and experiment!

## 📄 License

ISC

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/code)
- Powered by [Anthropic's Claude API](https://www.anthropic.com/)
- UI framework: [React](https://react.dev/)
- Styling: [Tailwind CSS](https://tailwindcss.com/)

## 📚 Additional Documentation

- [prompt.md](./prompt.md) - Claude API prompt template and implementation guide
- [spec.md](./spec.md) - Original project specification
- [todo.md](./todo.md) - Development milestones and task tracking

---

**Built with ❤️ using Claude Code**
