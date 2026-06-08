from fastapi import APIRouter
from pydantic import BaseModel
from services.sms_service import send_sms
import os

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    phone: str
    contacts: list = []
    travel_mode: str = "solo"

@router.post("/register")
def register_user(req: RegisterRequest):
    """
    Register a new user and send a welcome SMS.
    Stores nothing sensitive — just fires the welcome text.
    """
    welcome_msg = (
        f"🛡️ Welcome to Bachao Pakistan, {req.name}!\n"
        f"You're now protected. Your trusted contacts will be alerted "
        f"if you don't check in safely. Stay safe — Bachao Team."
    )
    sms_sent = False
    sms_error = None
    try:
        send_sms(req.phone, welcome_msg)
        sms_sent = True
    except Exception as e:
        sms_error = str(e)

    return {
        "status": "registered",
        "sms_sent": sms_sent,
        "sms_error": sms_error,
        "message": f"Welcome {req.name}! You're now protected by Bachao."
    }
