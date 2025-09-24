from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.routes import auth, applications, underwriting, policy, document_processing, fraud_validation, approval_letter
from app.services.supabase_service import supabase_service
from app.services.claude_service import claude_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting up Intelligent Loan Platform API...")
    
    # Initialize services
    try:
        logger.info("Initializing Supabase service...")
        await supabase_service.initialize()
        logger.info("Supabase service initialized successfully")
        
        logger.info("Initializing Claude service...")
        await claude_service.initialize()
        logger.info("Claude service initialization completed")
        
        # Log API key status
        from app.core.config import settings
        import os
        env_key = os.getenv("ANTHROPIC_API_KEY")
        logger.info(f"Environment ANTHROPIC_API_KEY present: {bool(env_key)}")
        logger.info(f"Settings ANTHROPIC_API_KEY present: {bool(settings.ANTHROPIC_API_KEY)}")
        logger.info(f"Claude client initialized: {bool(claude_service.client)}")
        
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Service initialization failed: {e}")
        # Don't raise - let the app start in demo mode
        logger.info("Continuing startup in demo mode")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Intelligent Loan Platform API",
    description="AI-powered loan origination platform with intelligent underwriting",
    version="1.1.0",  # Added PyMuPDF PDF processing support
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "intelligent-loan-platform"}

# System status endpoint
@app.get("/status")
async def system_status():
    from app.core.config import settings
    import os
    
    env_key = os.getenv("ANTHROPIC_API_KEY")
    
    return {
        "service": "intelligent-loan-platform",
        "environment": settings.ENVIRONMENT,
        "services": {
            "supabase": bool(supabase_service.client),
            "claude": bool(claude_service.client)
        },
        "api_keys": {
            "anthropic_env_set": bool(env_key),
            "anthropic_settings_set": bool(settings.ANTHROPIC_API_KEY),
            "anthropic_env_preview": env_key[:10] + "..." if env_key else None,
            "anthropic_settings_preview": settings.ANTHROPIC_API_KEY[:10] + "..." if settings.ANTHROPIC_API_KEY else None
        }
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(underwriting.router, prefix="/api/underwriting", tags=["underwriting"])
app.include_router(policy.router, prefix="/api/policy", tags=["policy"])
app.include_router(document_processing.router, prefix="/api/documents", tags=["document-processing"])
app.include_router(fraud_validation.router, prefix="/api/fraud", tags=["fraud-validation"])
app.include_router(approval_letter.router, prefix="/api/approval", tags=["approval-letter"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)