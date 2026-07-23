import os
import joblib
import warnings
import inspect
from constants import crop_encoding

warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(BASE, 'models')

def patch_xgb(model):
    try:
        from xgboost import XGBModel
        if isinstance(model, XGBModel):
            for cls in (XGBModel, model.__class__):
                sig = inspect.signature(cls.__init__)
                for p in sig.parameters.keys():
                    if not hasattr(model, p):
                        setattr(model, p, None)
            if hasattr(model, "get_booster"):
                model.get_booster().feature_names = None
    except Exception:
        pass

spoilage_regressor  = joblib.load(os.path.join(MODELS, 'spoilage_regressor.pkl'))
patch_xgb(spoilage_regressor)
spoilage_classifier = joblib.load(os.path.join(MODELS, 'spoilage_classifier.pkl'))
patch_xgb(spoilage_classifier)
price_model         = joblib.load(os.path.join(MODELS, 'price_model_v2.pkl'))
patch_xgb(price_model)
le_crop_v2          = joblib.load(os.path.join(MODELS, 'le_crop_v2.pkl'))
le_state_v2         = joblib.load(os.path.join(MODELS, 'le_state_v2.pkl'))

def predict_price_safe(crop, state, current_price, month, week, target_days):
    crop_enc  = int(le_crop_v2.transform([crop])[0]) if crop in le_crop_v2.classes_ else 0
    state_enc = int(le_state_v2.transform([state])[0]) if state in le_state_v2.classes_ else 0
    X = [[crop_enc, state_enc, current_price, month, week, target_days]]
    return round(float(price_model.predict(X)[0]), 2)
