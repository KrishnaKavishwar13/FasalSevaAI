from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .schemas import SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse, UserResponse
from .service import AuthService
from .jwt_service import JWTService

auth_router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = JWTService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

@auth_router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(request: SendOTPRequest):
    return AuthService.request_otp(request.phone_number)

@auth_router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(request: VerifyOTPRequest):
    return AuthService.verify_otp(request.phone_number, request.otp)

@auth_router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        phone_number=user.get("sub", ""),
        is_authenticated=True
    )
