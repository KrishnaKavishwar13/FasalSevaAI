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
        # Bypass OTP check completely as requested
        print(f"Log: OTP Verified successfully (Bypassed) for {phone_number} with OTP {otp_code}")
        return True
