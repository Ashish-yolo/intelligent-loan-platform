from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.routes import auth, applications, underwriting, policy, document_processing
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
        await supabase_service.initialize()
        await claude_service.initialize()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Service initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Intelligent Loan Platform API",
    description="AI-powered loan origination platform with intelligent underwriting",
    version="1.0.0",
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

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(underwriting.router, prefix="/api/underwriting", tags=["underwriting"])
app.include_router(policy.router, prefix="/api/policy", tags=["policy"])
app.include_router(document_processing.router, prefix="/api/documents", tags=["document-processing"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)