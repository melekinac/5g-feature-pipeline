
import traceback
from jobs import simulator_job, feature_job, inference_job

def run_pipeline():
    try:
        print(" Running simulator_job")
        simulator_job.main()
        print(" simulator_job tamamlandı")

        print("Running feature_job")
        feature_job.main()
        print(" feature_job tamamlandı")

        print(" Running inference_job")
        inference_job.main()
        print("inference_job tamamlandı")

        print(" Pipeline başarıyla tamamlandı")
    except Exception as e:
        print(" Pipeline hata verdi:", e)
        traceback.print_exc()
        raise e

if __name__ == "__main__":
    run_pipeline()
