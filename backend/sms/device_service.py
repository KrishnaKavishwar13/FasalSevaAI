import os
from dotenv import load_dotenv

load_dotenv()

class DeviceService:
    @staticmethod
    def get_gateway_device_token() -> str:
        """
        Retrieves the FCM token of the registered Android Companion App.
        In a production scenario, this could be fetched from a database where
        the Android app registers its token upon startup.
        For now, we retrieve it from the environment variable.
        """
        return os.getenv("SMS_GATEWAY_FCM_TOKEN", "")

    @staticmethod
    def register_device(token: str):
        """
        Allows the Android app to register its FCM token.
        """
        # Could save to database here.
        pass
