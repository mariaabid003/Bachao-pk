"""Africa's Talking SMS sender."""
import os
import africastalking

_initialized = False

def _init():
    global _initialized
    if not _initialized:
        africastalking.initialize(
            username=os.getenv("AT_USERNAME", "sandbox"),
            api_key=os.getenv("AT_API_KEY", ""),
        )
        _initialized = True


def send_sms(to_number: str, message: str) -> str:
    """Sends SMS via Africa's Talking. Returns message ID."""
    _init()
    sms = africastalking.SMS
    response = sms.send(message, [to_number])
    recipients = response.get("SMSMessageData", {}).get("Recipients", [])
    if recipients:
        return recipients[0].get("messageId", "sent")
    return "sent"


def send_voice_call(to_number: str, message: str) -> str:
    """Falls back to SMS for sandbox/trial accounts."""
    return send_sms(to_number, f"BACHAO ALERT: {message}")
