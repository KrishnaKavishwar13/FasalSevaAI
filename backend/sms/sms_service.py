import os
from dotenv import load_dotenv
from .firebase import send_fcm_message
from .device_service import DeviceService

load_dotenv()

class SMSService:
    @staticmethod
    def send_sms(phone_number: str, message: str) -> bool:
        """
        Sends an SMS by communicating with the Android Companion App
        via Firebase Cloud Messaging (FCM).
        """
        sms_enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"
        
        print(f"[{'REAL' if sms_enabled else 'MOCK'}] Sending SMS to {phone_number}: {message}")
        
        if not sms_enabled:
            # For development without a real device, just pretend it was sent.
            return True
            
        token = DeviceService.get_gateway_device_token()
        if not token:
            print("ERROR: No FCM token registered for the SMS Gateway.")
            return False
            
        payload = {
            "type": "send_sms",
            "phone_number": phone_number,
            "message": message
        }
        
        return send_fcm_message(token, payload)
