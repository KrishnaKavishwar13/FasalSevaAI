from fastapi import HTTPException, status
from .otp_service import OTPService
from .jwt_service import JWTService
from .schemas import SendOTPResponse, VerifyOTPResponse
from .repository import get_user_by_phone, create_user

class AuthService:
    @staticmethod
    def request_otp(phone_number: str) -> SendOTPResponse:
        print(f"Log: OTP Requested for {phone_number}")
        
        # In a real system, you'd add rate limiting here (e.g., max 5 per hour).
        
        success = OTPService.generate_and_send_otp(phone_number)
        
        if success:
            return SendOTPResponse(success=True, message="OTP sent successfully.")
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP."
            )

    @staticmethod
    def verify_otp(phone_number: str, otp_code: str, name: str = None, role: str = None) -> VerifyOTPResponse:
        is_valid = OTPService.verify_otp(phone_number, otp_code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP."
            )
            
        # Check if user exists
        user = get_user_by_phone(phone_number)
        if not user:
            # Create user
            if not name:
                name = f"User {phone_number[-4:]}"
            if not role:
                role = "farmer"
            user = create_user(phone_number, name, role)
            
        # Create JWT token
        token = JWTService.create_access_token({"sub": phone_number})
        
        return VerifyOTPResponse(
            access_token=token,
            user={
                "id": str(user['id']),
                "phone_number": user['phone_number'],
                "role": user['role'],
                "name": user['name']
            }
        )
