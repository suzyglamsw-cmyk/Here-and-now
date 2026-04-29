"""
Photo validation module for Here & Now app.
Implements validation rules for main photo (photos[0]) and secondary photos.
"""

import asyncio
import base64
import os
import logging
from datetime import datetime, timezone, timedelta
from io import BytesIO
from PIL import Image
from PIL.ExifTags import TAGS
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Error messages
MAIN_PHOTO_ERROR = "Please choose a recent photo that clearly shows your face for your main pic."
SAFETY_ERROR = "This photo contains content that isn't allowed."

# Photo age limit (18 months)
MAX_PHOTO_AGE_DAYS = 548  # ~18 months


def extract_exif_data(image_data: bytes) -> dict:
    """Extract EXIF metadata from image bytes."""
    try:
        img = Image.open(BytesIO(image_data))
        exif_data = img._getexif()
        if not exif_data:
            return {}
        
        exif = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            exif[tag] = value
        return exif
    except Exception as e:
        logger.warning(f"Failed to extract EXIF data: {e}")
        return {}


def check_photo_recency(image_data: bytes) -> dict:
    """
    Check if photo meets recency requirements based on EXIF metadata.
    Returns: {"valid": bool, "reason": str or None}
    
    LENIENT MODE: Missing EXIF is allowed (common for Facebook/social media images).
    Only reject if EXIF exists AND proves the photo is > 18 months old.
    """
    exif = extract_exif_data(image_data)
    
    # Missing EXIF is OK - can't verify age, so allow it
    if not exif:
        return {"valid": True, "reason": "no_exif_allowed"}
    
    # Check for DateTimeOriginal
    date_original = exif.get("DateTimeOriginal") or exif.get("DateTime")
    if not date_original:
        # No date in EXIF - can't verify, allow it
        return {"valid": True, "reason": "no_date_allowed"}
    
    # Parse the date
    try:
        # EXIF date format is typically "YYYY:MM:DD HH:MM:SS"
        if isinstance(date_original, str):
            photo_date = datetime.strptime(date_original, "%Y:%m:%d %H:%M:%S")
        else:
            # Invalid format - can't verify, allow it
            return {"valid": True, "reason": "unparseable_date_allowed"}
        
        # Check if photo is older than 18 months
        age_limit = datetime.now() - timedelta(days=MAX_PHOTO_AGE_DAYS)
        if photo_date < age_limit:
            # EXIF proves photo is too old - reject
            return {"valid": False, "reason": "too_old"}
        
        return {"valid": True, "reason": None}
    except Exception as e:
        logger.warning(f"Failed to parse EXIF date: {e}")
        # Can't parse date - allow it
        return {"valid": True, "reason": "date_parse_error_allowed"}


def check_is_screenshot(image_data: bytes) -> bool:
    """
    Check if image appears to be a screenshot based on EXIF and image properties.
    Returns True if it's likely a screenshot.
    
    LENIENT MODE: Facebook and social media images often lack camera metadata,
    so we only flag as screenshot if there's positive evidence (software field).
    """
    exif = extract_exif_data(image_data)
    
    # Check software field for screenshot indicators - this is strong evidence
    software = exif.get("Software", "").lower()
    screenshot_indicators = ["screenshot", "snipping", "capture", "screen grab"]
    if any(indicator in software for indicator in screenshot_indicators):
        return True
    
    # For dimension-based detection, require BOTH matching dimensions AND
    # screenshot software indicators. Missing camera metadata alone is NOT enough
    # because Facebook/social media strips this data.
    
    # Only flag as screenshot if software field contains OS-level hints
    os_screenshot_hints = ["ios", "android", "windows", "macos", "snip"]
    if any(hint in software for hint in os_screenshot_hints):
        try:
            img = Image.open(BytesIO(image_data))
            width, height = img.size
            
            # Common iOS screenshot aspect ratios
            ios_ratios = [
                (1170, 2532), (1284, 2778), (1242, 2688),
                (1125, 2436), (828, 1792), (750, 1334),
                (1179, 2556), (1290, 2796),
            ]
            
            for w, h in ios_ratios:
                if (width == w and height == h) or (width == h and height == w):
                    return True
        except Exception:
            pass
    
    return False


async def analyze_photo_with_ai(image_data: bytes, is_main_photo: bool) -> dict:
    """
    Use AI to analyze photo for safety and content requirements.
    Returns: {"valid": bool, "error": str or None, "details": dict}
    
    FAIL CLOSED: If AI analysis fails, reject the photo rather than allowing potentially unsafe content.
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found - failing closed")
            print("PHOTO VALIDATION ERROR: NO API KEY")
            # Fail closed - no key means we can't verify safety
            if is_main_photo:
                return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "no_api_key"}}
            else:
                return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "no_api_key"}}
        
        # Encode image to base64
        try:
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            print(f"PHOTO VALIDATION ERROR: BASE64 ENCODING: {e}")
            if is_main_photo:
                return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "encoding_failed"}}
            else:
                return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "encoding_failed"}}
        
        # Create the chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"photo-validation-{datetime.now().timestamp()}",
            system_message="""You are a photo validation assistant. Analyze photos and respond ONLY with a JSON object.
Do not include any explanation or text outside the JSON."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Build the analysis prompt based on photo type
        if is_main_photo:
            prompt = """Analyze this photo and respond with ONLY a JSON object (no markdown, no explanation):

{
  "is_safe": true/false (false if contains nudity, explicit content, violence, or unsafe material),
  "safety_issue": "description if unsafe, null if safe",
  "has_human_face": true/false,
  "face_count": number (0 if no faces),
  "is_ai_generated": true/false,
  "is_celebrity": true/false,
  "content_type": "person" | "group" | "scenery" | "pet" | "object" | "other"
}

Be strict about face detection - the face must be clearly visible, not obscured or too small."""
        else:
            # Secondary photo - only check safety
            prompt = """Analyze this photo and respond with ONLY a JSON object (no markdown, no explanation):

{
  "is_safe": true/false (false if contains nudity, explicit content, violence, or unsafe material),
  "safety_issue": "description if unsafe, null if safe"
}"""
        
        # Create message with image
        try:
            image_content = ImageContent(image_base64=image_base64)
            user_message = UserMessage(
                text=prompt,
                file_contents=[image_content]
            )
        except Exception as e:
            print(f"PHOTO VALIDATION ERROR: MESSAGE CREATION: {e}")
            if is_main_photo:
                return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "message_creation_failed"}}
            else:
                return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "message_creation_failed"}}
        
        # Send and get response with strict timeout (10 seconds max)
        # Use thread executor because LiteLLM blocks the event loop
        AI_TIMEOUT_SECONDS = 10
        
        def run_ai_call_sync():
            """Run the async AI call in a new event loop (for thread executor)"""
            import asyncio as aio
            loop = aio.new_event_loop()
            aio.set_event_loop(loop)
            try:
                return loop.run_until_complete(chat.send_message(user_message))
            finally:
                loop.close()
        
        try:
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(None, run_ai_call_sync),
                timeout=AI_TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            logger.error(f"PHOTO VALIDATION ERROR: AI TIMEOUT after {AI_TIMEOUT_SECONDS}s")
            if is_main_photo:
                return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "ai_timeout"}}
            else:
                return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "ai_timeout"}}
        except Exception as e:
            logger.error(f"PHOTO VALIDATION ERROR: AI API CALL: {e}")
            if is_main_photo:
                return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "ai_api_failed"}}
            else:
                return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "ai_api_failed"}}
        
        # Parse JSON response
        try:
            import json
            # Clean up response - remove markdown code blocks if present
            response_text = response.strip() if response else ""
            if not response_text:
                print("PHOTO VALIDATION ERROR: EMPTY AI RESPONSE")
                if is_main_photo:
                    return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "empty_response"}}
                else:
                    return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "empty_response"}}
            
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            analysis = json.loads(response_text)
        except Exception as e:
            print(f"PHOTO VALIDATION ERROR: JSON PARSING: {e}")
            logger.error(f"Failed to parse AI response: {e}")
            if is_main_photo:
                return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": "json_parse_failed"}}
            else:
                return {"valid": False, "error": SAFETY_ERROR, "details": {"error": "json_parse_failed"}}
        
        # Check safety (applies to all photos)
        if not analysis.get("is_safe", True):
            return {
                "valid": False,
                "error": SAFETY_ERROR,
                "details": analysis
            }
        
        # Additional checks for main photo only
        if is_main_photo:
            # Check for human face
            if not analysis.get("has_human_face", False):
                return {
                    "valid": False,
                    "error": MAIN_PHOTO_ERROR,
                    "details": analysis
                }
            
            # Check for exactly one face (no group photos)
            face_count = analysis.get("face_count", 0)
            if face_count != 1:
                return {
                    "valid": False,
                    "error": MAIN_PHOTO_ERROR,
                    "details": analysis
                }
            
            # Check for AI-generated
            if analysis.get("is_ai_generated", False):
                return {
                    "valid": False,
                    "error": MAIN_PHOTO_ERROR,
                    "details": analysis
                }
            
            # Check for celebrity
            if analysis.get("is_celebrity", False):
                return {
                    "valid": False,
                    "error": MAIN_PHOTO_ERROR,
                    "details": analysis
                }
            
            # Check content type
            content_type = analysis.get("content_type", "other")
            if content_type not in ["person"]:
                return {
                    "valid": False,
                    "error": MAIN_PHOTO_ERROR,
                    "details": analysis
                }
        
        return {"valid": True, "error": None, "details": analysis}
        
    except Exception as e:
        # Catch-all for any unexpected errors - FAIL CLOSED
        print(f"PHOTO VALIDATION ERROR: UNEXPECTED IN AI ANALYSIS: {e}")
        logger.error(f"AI photo analysis failed unexpectedly: {e}")
        if is_main_photo:
            return {"valid": False, "error": MAIN_PHOTO_ERROR, "details": {"error": str(e)}}
        else:
            return {"valid": False, "error": SAFETY_ERROR, "details": {"error": str(e)}}


def validate_image_file(image_data: bytes) -> dict:
    """
    Validate that the file is a valid image (JPEG/PNG) and readable.
    This runs BEFORE any EXIF or AI checks.
    
    Returns: {"valid": bool, "error": str or None, "format": str or None}
    """
    try:
        # Check minimum size (at least 1KB)
        if len(image_data) < 1024:
            return {"valid": False, "error": "File too small", "format": None}
        
        # Check maximum size (10MB)
        if len(image_data) > 10 * 1024 * 1024:
            return {"valid": False, "error": "File too large (max 10MB)", "format": None}
        
        # Try to open with PIL
        img = Image.open(BytesIO(image_data))
        
        # Verify it's a supported format
        img_format = img.format.upper() if img.format else None
        if img_format not in ["JPEG", "JPG", "PNG", "WEBP"]:
            return {"valid": False, "error": f"Unsupported format: {img_format}", "format": img_format}
        
        # Verify image can be fully loaded (catches truncated files)
        img.load()
        
        # Check minimum dimensions (at least 100x100)
        width, height = img.size
        if width < 100 or height < 100:
            return {"valid": False, "error": "Image too small (min 100x100)", "format": img_format}
        
        return {"valid": True, "error": None, "format": img_format}
        
    except Exception as e:
        logger.warning(f"Image file validation failed: {e}")
        return {"valid": False, "error": "Invalid or corrupted image file", "format": None}


async def validate_photo(image_data: bytes, is_main_photo: bool) -> dict:
    """
    Main validation function that applies all rules.
    
    Args:
        image_data: Raw image bytes
        is_main_photo: True if this is photos[0], False for secondary photos
        
    Returns:
        {"valid": bool, "error": str or None}
        
    Validation order:
    1. File validation (is it a valid JPEG/PNG?)
    2. EXIF recency check (lenient - only reject if provably > 18 months)
    3. Screenshot detection (lenient - only with positive evidence)
    4. AI analysis (currently disabled)
    """
    try:
        # STEP 1: Validate the file is a readable image
        file_check = validate_image_file(image_data)
        if not file_check["valid"]:
            logger.warning(f"File validation failed: {file_check['error']}")
            return {"valid": False, "error": file_check["error"]}
        
        # For main photo, apply additional checks
        if is_main_photo:
            # STEP 2: Check EXIF recency (lenient - missing EXIF is OK)
            try:
                recency = check_photo_recency(image_data)
                if not recency["valid"]:
                    # Only fails if EXIF proves photo is > 18 months old
                    logger.info(f"Photo rejected - EXIF shows too old: {recency['reason']}")
                    return {"valid": False, "error": MAIN_PHOTO_ERROR}
            except Exception as e:
                # Error in recency check - allow through (lenient)
                logger.warning(f"EXIF recency check error (allowing): {e}")
            
            # STEP 3: Check if screenshot (lenient - needs positive evidence)
            try:
                if check_is_screenshot(image_data):
                    logger.info("Photo rejected - detected as screenshot")
                    return {"valid": False, "error": MAIN_PHOTO_ERROR}
            except Exception as e:
                # Error in screenshot check - allow through (lenient)
                logger.warning(f"Screenshot check error (allowing): {e}")
        
        # STEP 4: AI validation (currently disabled)
        # ai_result = await analyze_photo_with_ai(image_data, is_main_photo)
        # if not ai_result["valid"]:
        #     return {"valid": False, "error": ai_result["error"]}
        logger.info("Photo validation passed (AI check disabled)")
        
        return {"valid": True, "error": None}
        
    except Exception as e:
        # Master catch-all - be lenient for unexpected errors
        logger.error(f"Photo validation unexpected error (allowing): {e}")
        return {"valid": True, "error": None}
