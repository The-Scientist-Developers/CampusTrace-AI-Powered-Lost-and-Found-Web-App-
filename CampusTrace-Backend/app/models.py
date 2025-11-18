from pydantic import BaseModel, EmailStr
from typing import Optional

# ============= Pydantic Models =============
class UniversityRegistrationRequest(BaseModel):
    university_name: str
    full_name: str
    email: EmailStr
    password: str

class ManualSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    university_id: int
    captchaToken: str

class UserPreferences(BaseModel):
    match_notifications: bool
    claim_notifications: bool
    message_notifications: bool
    moderation_notifications: bool
    email_notifications_enabled: bool

class VerificationAction(BaseModel):
    approve: bool
    user_id: str

class DescriptionRequest(BaseModel):
    title: str
    category: str
    draft_description: str

class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    captchaToken: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    captchaToken: str

class ItemCreate(BaseModel):
    title: str
    description: str
    status: str
    category: str
    location: str
    contact_info: Optional[str] = None

class ClaimCreate(BaseModel):
    item_id: int
    verification_message: str

class ClaimRespond(BaseModel):
    approved: bool

class BanUpdate(BaseModel):
    is_banned: bool

class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    moderation_status: str
