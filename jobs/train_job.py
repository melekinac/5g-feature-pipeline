from utils.training import train_classification, train_regression
import json
import os
PARAM_FILE = "models/best_params.json"
def load_best_params(defaults):
    if os.path.exists(PARAM_FILE):
        with open(PARAM_FILE, "r") as f:
            best = json.load(f)
        print("Using tuned params:", best)
        return {**defaults, **best}  
    return defaults
def main():
    print("Training pipeline started...")


    try:
        train_classification()
    except Exception as e:
        print(f"Classification training failed: {e}")


    try:
        train_regression()
    except Exception as e:
        print(f"Regression training failed: {e}")

    print("Training pipeline finished.")

if __name__ == "__main__":
    main()

