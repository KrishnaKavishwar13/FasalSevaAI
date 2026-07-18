import os
import firebase_admin
from firebase_admin import credentials, messaging
from dotenv import load_dotenv

load_dotenv()

def init_firebase():
    if not firebase_admin._apps:
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        private_key = os.getenv("FIREBASE_PRIVATE_KEY")
        
        if project_id and client_email and private_key:
            # Replace literal literal \n with actual newline if needed
            private_key = private_key.replace('\\n', '\n')
            
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key_id": "dummy_id",
                "private_key": private_key,
                "client_email": client_email,
                "client_id": "dummy_client_id",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email.replace('@', '%40')}"
            })
            firebase_admin.initialize_app(cred)
        else:
            print("WARNING: Firebase credentials not fully configured in environment variables.")

init_firebase()

def send_fcm_message(token: str, data: dict):
    """
    Send a data payload to the Android companion app via FCM.
    """
    try:
        message = messaging.Message(
            data=data,
            token=token,
        )
        response = messaging.send(message)
        print('Successfully sent message:', response)
        return True
    except Exception as e:
        print('Error sending message:', e)
        return False
