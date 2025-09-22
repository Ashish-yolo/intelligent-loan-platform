import base64
import io
import logging
from typing import Tuple, Optional
try:
    from pdf2image import convert_from_bytes
    PDF_CONVERSION_AVAILABLE = True
except ImportError:
    PDF_CONVERSION_AVAILABLE = False
    logger.warning("pdf2image not available - PDF conversion disabled")

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("PIL not available - image optimization disabled")

logger = logging.getLogger(__name__)

def process_document_file(file_content: bytes, content_type: str) -> Tuple[str, str]:
    """
    Process document file (PDF or image) and return base64 encoded image data and media type
    
    Args:
        file_content: Raw file content bytes
        content_type: MIME type of the file
        
    Returns:
        Tuple of (base64_data, media_type)
    """
    try:
        # Handle PDF files
        if 'pdf' in content_type.lower():
            if not PDF_CONVERSION_AVAILABLE:
                raise Exception("PDF processing unavailable - pdf2image library not installed. Please convert your PDF to JPG/PNG image and upload instead.")
            
            logger.info("Converting PDF to image")
            
            try:
                # Convert PDF to images (take first page)
                images = convert_from_bytes(file_content, first_page=1, last_page=1, dpi=300)
                
                if not images:
                    raise Exception("PDF page conversion failed - please convert to JPG/PNG image and upload instead.")
                
                # Convert PIL image to base64
                img = images[0]
                
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save to bytes buffer
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=95)
                buffer.seek(0)
                
                # Encode to base64
                image_base64 = base64.b64encode(buffer.getvalue()).decode()
                return image_base64, "image/jpeg"
                
            except Exception as e:
                logger.error(f"PDF conversion failed: {e}")
                # More specific error messages for production debugging
                error_str = str(e).lower()
                if "poppler" in error_str or "pdftoppm" in error_str or "unable to get page count" in error_str:
                    raise Exception("PDF processing dependencies missing - poppler not installed. Please convert PDF to JPG/PNG image and upload instead.")
                elif "permission" in error_str or "access" in error_str:
                    raise Exception("PDF file access denied - file may be password protected or corrupted. Please save as JPG/PNG image and upload instead.")
                elif "corrupt" in error_str or "invalid" in error_str:
                    raise Exception("PDF file appears corrupted or invalid. Please save as JPG/PNG image and upload instead.")
                else:
                    raise Exception(f"PDF processing failed: {str(e)[:100]}. Please convert to JPG/PNG image and upload instead.")
            
        # Handle image files
        elif any(img_type in content_type.lower() for img_type in ['image', 'jpeg', 'jpg', 'png', 'webp']):
            logger.info(f"Processing image file: {content_type}")
            
            # For images, just encode to base64
            image_base64 = base64.b64encode(file_content).decode()
            
            # Determine media type
            if 'jpeg' in content_type.lower() or 'jpg' in content_type.lower():
                media_type = "image/jpeg"
            elif 'png' in content_type.lower():
                media_type = "image/png"
            elif 'webp' in content_type.lower():
                media_type = "image/webp"
            else:
                media_type = "image/jpeg"  # Default fallback
                
            return image_base64, media_type
            
        else:
            raise Exception(f"Unsupported file type: {content_type}")
            
    except Exception as e:
        logger.error(f"Error processing document file: {e}")
        raise

def optimize_image_for_api(image_base64: str, max_size_mb: float = 4.0) -> str:
    """
    Optimize image size for API if needed
    
    Args:
        image_base64: Base64 encoded image
        max_size_mb: Maximum size in MB
        
    Returns:
        Optimized base64 image
    """
    if not PIL_AVAILABLE:
        logger.warning("PIL not available - returning original image without optimization")
        return image_base64
    
    try:
        # Calculate current size in MB
        current_size_mb = len(image_base64) * 3 / 4 / (1024 * 1024)  # base64 to bytes to MB
        
        if current_size_mb <= max_size_mb:
            return image_base64
            
        logger.info(f"Image size {current_size_mb:.2f}MB exceeds limit, optimizing...")
        
        # Decode image
        image_bytes = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(image_bytes))
        
        # Calculate resize ratio to meet size limit
        resize_ratio = (max_size_mb / current_size_mb) ** 0.5
        new_width = int(img.width * resize_ratio)
        new_height = int(img.height * resize_ratio)
        
        # Resize image
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary
        if img_resized.mode != 'RGB':
            img_resized = img_resized.convert('RGB')
        
        # Save optimized image
        buffer = io.BytesIO()
        img_resized.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        
        optimized_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        new_size_mb = len(optimized_base64) * 3 / 4 / (1024 * 1024)
        logger.info(f"Image optimized from {current_size_mb:.2f}MB to {new_size_mb:.2f}MB")
        
        return optimized_base64
        
    except Exception as e:
        logger.error(f"Error optimizing image: {e}")
        return image_base64  # Return original if optimization fails