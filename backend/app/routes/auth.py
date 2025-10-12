from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import random
import string
from datetime import datetime, timedelta
from jose import JWTError, jwt
import logging

from app.core.config import settings
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Pydantic models
class PhoneVerificationRequest(BaseModel):
    phone: str

class OTPVerificationRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None

class OTPResponse(BaseModel):
    success: bool
    message: str
    otp: Optional[str] = None  # Only for demo/testing

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# In-memory OTP storage (use Redis in production)
otp_storage = {}

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user_result = await supabase_service.get_user_by_phone(phone)
    if not user_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user_result["user"]

@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(request: PhoneVerificationRequest):
    """Send OTP to phone number"""
    try:
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP with expiration (10 minutes for demo)
        otp_storage[request.phone] = {
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "attempts": 0
        }
        
        # In production, send actual SMS here
        # For demo, we'll return the OTP
        logger.info(f"Generated OTP {otp} for phone {request.phone}")
        
        return OTPResponse(
            success=True,
            message="OTP sent successfully",
            otp=otp  # Remove this in production
        )
        
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerificationRequest):
    """Verify OTP and authenticate user"""
    try:
        # Check if OTP exists and is valid
        if request.phone not in otp_storage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP not found or expired"
            )
        
        stored_otp = otp_storage[request.phone]
        
        # Check expiration
        if datetime.utcnow() > stored_otp["expires_at"]:
            del otp_storage[request.phone]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP expired"
            )
        
        # Check attempts
        if stored_otp["attempts"] >= 3:
            del otp_storage[request.phone]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts"
            )
        
        # Verify OTP
        if request.otp != stored_otp["otp"]:
            stored_otp["attempts"] += 1
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Clean up OTP
        del otp_storage[request.phone]
        
        # Get or create user (fallback for demo)
        try:
            user_result = await supabase_service.get_user_by_phone(request.phone)
            
            if not user_result["success"]:
                # Create new user
                create_result = await supabase_service.create_user(
                    phone=request.phone,
                    name=request.name
                )
                if not create_result["success"]:
                    # Fallback to demo user for development/demo purposes
                    logger.warning(f"Database failed, using demo user for {request.phone}")
                    user = {
                        "id": f"demo-user-{request.phone}",
                        "phone": request.phone,
                        "name": request.name or "Demo User",
                        "created_at": "2024-01-01T00:00:00Z"
                    }
                else:
                    user = create_result["user"]
            else:
                user = user_result["user"]
        except Exception as e:
            # Fallback to demo user if database is unavailable
            logger.warning(f"Database connection failed, using demo user for {request.phone}: {e}")
            user = {
                "id": f"demo-user-{request.phone}",
                "phone": request.phone,
                "name": request.name or "Demo User",
                "created_at": "2024-01-01T00:00:00Z"
            }
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["phone"]}, expires_delta=access_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {"user": current_user}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "otp_storage_count": len(otp_storage)
    }