from pydantic import BaseModel, constr

class SendOTPRequest(BaseModel):
    # pyrefly: ignore [invalid-annotation]
    phone_number: constr(pattern=r'^(?:\+91|91)?[6-9]\d{9}$')

class SendOTPResponse(BaseModel):
    success: bool
    message: str

class VerifyOTPRequest(BaseModel):
    # pyrefly: ignore [invalid-annotation]
    phone_number: constr(pattern=r'^(?:\+91|91)?[6-9]\d{9}$')
    otp: str

class VerifyOTPResponse(BaseModel):
    access_token: str
    user: dict

class UserResponse(BaseModel):
    phone_number: str
    is_authenticated: bool
