import os
import joblib

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def save_model(model, feature_list, model_name):
    """Modeli ve feature listesini kaydet."""
    joblib.dump(model, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(feature_list, f"{MODEL_DIR}/feature_list_{model_name}.pkl")
    print(f"Model saved: {model_name}")

def load_model(model_name):
    """Model ve feature listesini yükle."""
    model = joblib.load(f"{MODEL_DIR}/{model_name}.pkl")
    features = joblib.load(f"{MODEL_DIR}/feature_list_{model_name}.pkl")
    return model, features
