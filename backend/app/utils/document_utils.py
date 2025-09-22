import base64
import io
import logging
from typing import Tuple, Optional

# Try multiple PDF processing libraries
try:
    from pdf2image import convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

logger = logging.getLogger(__name__)

# Determine which PDF processing method to use
PDF_CONVERSION_AVAILABLE = PDF2IMAGE_AVAILABLE or PYMUPDF_AVAILABLE

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
                raise Exception("PDF processing unavailable - no PDF libraries installed. Please convert your PDF to JPG/PNG image and upload instead.")
            
            logger.info("Converting PDF to image")
            
            # Try pdf2image first (better quality), then PyMuPDF as fallback
            if PDF2IMAGE_AVAILABLE:
                try:
                    logger.info("Using pdf2image with poppler")
                    # Convert PDF to images (take first page)
                    images = convert_from_bytes(file_content, first_page=1, last_page=1, dpi=300)
                    
                    if not images:
                        raise Exception("PDF page conversion failed")
                    
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
                    logger.warning(f"pdf2image failed: {e}, trying PyMuPDF fallback")
                    # Fall through to PyMuPDF
            
            # PyMuPDF fallback (doesn't require system dependencies)
            if PYMUPDF_AVAILABLE:
                try:
                    logger.info("Using PyMuPDF for PDF processing")
                    
                    # Open PDF with PyMuPDF
                    pdf_doc = fitz.open(stream=file_content, filetype="pdf")
                    
                    if pdf_doc.page_count == 0:
                        raise Exception("PDF has no pages")
                    
                    # Get first page
                    page = pdf_doc[0]
                    
                    # Render page to image (300 DPI)
                    mat = fitz.Matrix(300/72, 300/72)  # 300 DPI scaling
                    pix = page.get_pixmap(matrix=mat)
                    
                    # Convert to PIL Image
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    
                    # Convert to RGB if necessary
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Save to bytes buffer
                    buffer = io.BytesIO()
                    img.save(buffer, format='JPEG', quality=95)
                    buffer.seek(0)
                    
                    # Encode to base64
                    image_base64 = base64.b64encode(buffer.getvalue()).decode()
                    
                    # Close PDF
                    pdf_doc.close()
                    
                    return image_base64, "image/jpeg"
                    
                except Exception as e:
                    logger.error(f"PyMuPDF conversion failed: {e}")
                    raise Exception(f"PDF processing failed with PyMuPDF: {str(e)[:100]}. Please convert to JPG/PNG image and upload instead.")
            
            # If we get here, no PDF processing method worked
            raise Exception("PDF processing failed - please convert to JPG/PNG image and upload instead.")
            
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