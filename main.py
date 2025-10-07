from jobs.feature_job import build_features_from_db
from jobs.train_job import train_model


def main():
    print(" Feature Engineering başlıyor...")
    build_features_from_db()

    print(" Model eğitimi başlıyor...")
    train_model()


if __name__ == "__main__":
    main()
