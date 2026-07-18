from fastapi import HTTPException, status
from .otp_service import OTPService
from .jwt_service import JWTService
from .schemas import SendOTPResponse, VerifyOTPResponse

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
    def verify_otp(phone_number: str, otp_code: str) -> VerifyOTPResponse:
        is_valid = OTPService.verify_otp(phone_number, otp_code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP."
            )
            
        # Create JWT token
        # In a real app, you'd check if user exists in the database and create if not.
        # For this prototype, we'll just encode the phone number in the JWT.
        token = JWTService.create_access_token({"sub": phone_number})
        
        return VerifyOTPResponse(
            access_token=token,
            user={
                "phone_number": phone_number,
                "role": "farmer", # default role
                "name": f"User {phone_number[-4:]}" # Generate a dummy name
            }
        )
