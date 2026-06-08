"""Africa's Talking SMS sender."""
import logging
import os
try:
    import africastalking
except ImportError:
    africastalking = None

logger = logging.getLogger(__name__)

_initialized = False

def _init():
    global _initialized
    if africastalking is None:
        logger.warning("Africa's Talking SDK unavailable; SMS is running in demo mode")
        return False
    if not _initialized:
        africastalking.initialize(
            username=os.getenv("AT_USERNAME", "sandbox"),
            api_key=os.getenv("AT_API_KEY", ""),
        )
        _initialized = True
    return True


def send_sms(to_number: str, message: str) -> str:
    """Sends SMS via Africa's Talking. Returns message ID."""
    if not _init():
        return "demo-sms-disabled"
    sms = africastalking.SMS
    response = sms.send(message, [to_number])
    recipients = response.get("SMSMessageData", {}).get("Recipients", [])
    if recipients:
        return recipients[0].get("messageId", "sent")
    return "sent"


def send_voice_call(to_number: str, message: str) -> str:
    """
    Africa's Talking voice requires a paid account.
    Falls back to SMS for sandbox/trial.
    """
    return send_sms(to_number, f"BACHAO ALERT: {message}")
