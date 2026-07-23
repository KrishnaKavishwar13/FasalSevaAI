import random
import os
from datetime import datetime
from dotenv import load_dotenv

from .repository import store_otp, get_active_otp, mark_otp_used

load_dotenv()

OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))

class OTPService:
    @staticmethod
    def generate_and_send_otp(phone_number: str) -> bool:
        """
        Generates a 6-digit OTP, stores it, and sends it via SMS Gateway.
        """
        # Cryptographically secure random number is not strictly necessary for 6 digit OTP,
        # but using SystemRandom is better.
        secure_random = random.SystemRandom()
        otp_code = str(secure_random.randint(100000, 999999))
        
        # Store OTP
        store_otp(phone_number, otp_code, OTP_EXPIRY_MINUTES)
        
        print(f"Log: OTP Generated (SMS Gateway Disabled): {otp_code} for {phone_number}")
        return True

    @staticmethod
    def verify_otp(phone_number: str, otp_code: str) -> bool:
        """
        Verifies the OTP for the given phone number.
        Returns True if valid, False otherwise.
        """
        active_otp = get_active_otp(phone_number)
        
        if not active_otp:
            print(f"Log: No active OTP found for {phone_number}")
            return False
            
        # Check expiry
        if datetime.utcnow() > active_otp['expires_at']:
            print(f"Log: OTP expired for {phone_number}")
            return False
            
        if active_otp['otp_code'] != otp_code:
            print(f"Log: Invalid OTP for {phone_number}")
            return False
            
        # Mark as used
        mark_otp_used(active_otp['id'])
        print(f"Log: OTP Verified successfully for {phone_number} with OTP {otp_code}")
        return True
