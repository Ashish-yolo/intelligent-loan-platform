from supabase import create_client, Client
from app.core.config import settings
from typing import Dict, List, Optional, Any
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
    
    async def initialize(self):
        """Initialize Supabase client"""
        try:
            if not hasattr(settings, 'SUPABASE_URL') or not settings.SUPABASE_URL:
                logger.warning("Supabase URL not configured, skipping initialization")
                return
                
            self.client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_KEY
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client (demo mode): {e}")
            # Don't raise - allow the service to continue without database

    # User management
    async def create_user(self, phone: str, name: str = None) -> Dict[str, Any]:
        """Create a new user"""
        try:
            if not self.client:
                return {"success": False, "error": "Database not available"}
                
            user_data = {
                "id": str(uuid.uuid4()),
                "phone": phone,
                "name": name,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table("users").insert(user_data).execute()
            return {"success": True, "user": result.data[0]}
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return {"success": False, "error": str(e)}

    async def get_user_by_phone(self, phone: str) -> Dict[str, Any]:
        """Get user by phone number"""
        try:
            if not self.client:
                return {"success": False, "error": "Database not available"}
                
            result = self.client.table("users").select("*").eq("phone", phone).execute()
            if result.data:
                return {"success": True, "user": result.data[0]}
            return {"success": False, "error": "User not found"}
        except Exception as e:
            logger.error(f"Error getting user by phone: {e}")
            return {"success": False, "error": str(e)}

    # Loan application management
    async def create_loan_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new loan application"""
        try:
            application_data.update({
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "status": "draft"
            })
            
            result = self.client.table("loan_applications").insert(application_data).execute()
            return {"success": True, "application": result.data[0]}
        except Exception as e:
            logger.error(f"Error creating loan application: {e}")
            return {"success": False, "error": str(e)}

    async def update_loan_application(self, application_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update loan application"""
        try:
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.client.table("loan_applications").update(update_data).eq("id", application_id).execute()
            return {"success": True, "application": result.data[0] if result.data else None}
        except Exception as e:
            logger.error(f"Error updating loan application: {e}")
            return {"success": False, "error": str(e)}

    async def get_loan_application(self, application_id: str) -> Dict[str, Any]:
        """Get loan application by ID"""
        try:
            result = self.client.table("loan_applications").select("*").eq("id", application_id).execute()
            if result.data:
                return {"success": True, "application": result.data[0]}
            return {"success": False, "error": "Application not found"}
        except Exception as e:
            logger.error(f"Error getting loan application: {e}")
            return {"success": False, "error": str(e)}

    # Policy decisions
    async def save_policy_decision(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save policy decision"""
        try:
            decision_data.update({
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat()
            })
            
            result = self.client.table("policy_decisions").insert(decision_data).execute()
            return {"success": True, "decision": result.data[0]}
        except Exception as e:
            logger.error(f"Error saving policy decision: {e}")
            return {"success": False, "error": str(e)}

    # Document management
    async def save_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save document metadata"""
        try:
            document_data.update({
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat()
            })
            
            result = self.client.table("documents").insert(document_data).execute()
            return {"success": True, "document": result.data[0]}
        except Exception as e:
            logger.error(f"Error saving document: {e}")
            return {"success": False, "error": str(e)}

    # Bureau data management
    async def save_bureau_data(self, bureau_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save bureau data"""
        try:
            bureau_data.update({
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat()
            })
            
            result = self.client.table("bureau_data").insert(bureau_data).execute()
            return {"success": True, "bureau_data": result.data[0]}
        except Exception as e:
            logger.error(f"Error saving bureau data: {e}")
            return {"success": False, "error": str(e)}

    # Audit logging
    async def log_audit_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Log audit event"""
        try:
            event_data.update({
                "id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat()
            })
            
            result = self.client.table("audit_logs").insert(event_data).execute()
            return {"success": True, "log": result.data[0]}
        except Exception as e:
            logger.error(f"Error logging audit event: {e}")
            return {"success": False, "error": str(e)}

# Global instance
supabase_service = SupabaseService()