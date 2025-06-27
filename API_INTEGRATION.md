# API Integration Documentation

This document describes the integration between the React frontend and FastAPI backend for the Padel Analysis System.

## Backend Setup

### CORS Configuration
The FastAPI backend has been configured with CORS middleware to allow requests from the React frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Available Endpoints

#### Authentication Endpoints
- `POST /auth/register` - Register a new user
- `POST /auth/verify-otp` - Verify OTP for user registration
- `POST /auth/login` - Login user and get access token

#### Match Analysis Endpoints
- `GET /analysis/get-upload` - Get upload URL for video (requires auth)
- `POST /analysis/update-status` - Update match status (internal use)
- `POST /analysis/analyse_video` - Start video analysis (requires auth)
- `GET /analysis/match_history` - Get user's match history (requires auth)
- `GET /analysis/match/{match_id}` - Get specific match details (requires auth)

## Frontend Integration

### API Client
The frontend uses a centralized API client (`src/lib/api.ts`) that handles all communication with the backend:

- **Base URL**: `http://localhost:8000`
- **Authentication**: JWT tokens stored in localStorage
- **Error Handling**: Basic error handling with try-catch blocks
- **File Upload**: Progress tracking for video uploads

### Authentication Flow
1. User registers with email, password, and name
2. Backend sends OTP to user's email
3. User verifies OTP on frontend
4. User can then login with email and password
5. JWT token is stored in localStorage for subsequent requests

### Components Updated

#### AuthContext (`src/contexts/AuthContext.tsx`)
- Updated to use real API endpoints
- Manages JWT token storage
- Handles login, signup, and OTP verification

#### LoginPage (`src/screens/LoginPage/LoginPage.tsx`)
- Uses real login API
- Stores JWT token on successful login

#### SignupPage (`src/screens/SignupPage/SignupPage.tsx`)
- Uses real registration API
- Stores email for OTP verification

#### OTPVerification (`src/screens/OTPVerification/OTPVerification.tsx`)
- Uses real OTP verification API
- Redirects to dashboard on success

#### VideoUpload (`src/screens/VideoUpload/VideoUpload.tsx`)
- Gets upload URL from backend
- Uploads video with progress tracking
- Handles upload errors

#### VideoHistory (`src/screens/VideoHistory/VideoHistory.tsx`)
- Fetches match history from backend
- Displays real match data
- Handles loading and error states

#### MatchAnalytics (`src/screens/MatchAnalytics/MatchAnalytics.tsx`)
- Fetches specific match data from backend
- Displays match analytics (currently using mock data for detailed analytics)

## Environment Configuration

The API base URL is configured in `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

For production, this should be moved to environment variables.

## Running the Application

### Backend
```bash
cd Back/back-end
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd Front/Frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5174` and communicate with the backend on `http://localhost:8000`.

## Notes

1. **File Upload Progress**: The video upload feature includes progress indicators that update in real-time during upload.

2. **Error Handling**: Basic error handling is implemented. For production, consider adding toast notifications and more detailed error messages.

3. **Authentication**: JWT tokens are stored in localStorage. For enhanced security, consider using httpOnly cookies.

4. **Mock Data**: Some components still use mock data for detailed analytics since the backend doesn't provide this data yet. These can be updated once the backend provides the full analytics data.

5. **CORS**: The backend is configured to allow requests from the frontend development server on ports 5173 and 5174. Update the origins for production deployment. 