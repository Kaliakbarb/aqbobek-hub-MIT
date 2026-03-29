from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(BASE_DIR / "schedule_quality_model.joblib")
PREPROCESSOR = joblib.load(BASE_DIR / "schedule_quality_preprocessor.joblib")
FEATURE_COLUMNS = json.loads((BASE_DIR / "schedule_quality_feature_columns.json").read_text(encoding="utf-8"))
LABEL_MAP = json.loads((BASE_DIR / "schedule_quality_label_map.json").read_text(encoding="utf-8"))


def build_record(payload: dict) -> dict:
    record = {}
    for feature_name in FEATURE_COLUMNS["all_features"]:
        if feature_name not in payload:
            raise ValueError(f"Missing required feature: {feature_name}")
        record[feature_name] = payload[feature_name]
    return record


def get_quality_band(score: float) -> str:
    if score < 50:
        return "low"
    if score < 75:
        return "medium"
    return "high"


def predict_single(payload: dict) -> dict:
    record = build_record(payload)
    frame = pd.DataFrame([record], columns=FEATURE_COLUMNS["all_features"])
    transformed = PREPROCESSOR.transform(frame)
    score = float(MODEL.predict(transformed)[0])
    score = max(0.0, min(100.0, score))
    band = get_quality_band(score)
    band_meta = LABEL_MAP["quality_bands"][band]

    return {
        "overall_quality_score": round(score, 2),
        "quality_band_label": band,
        "quality_band_label_ru": band_meta["name_ru"],
        "interpretation_ru": band_meta["interpretation_ru"],
    }


def main() -> int:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        print(json.dumps({"error": "Expected JSON payload on stdin"}, ensure_ascii=False))
        return 1

    try:
        payload = json.loads(raw_input)
        result = predict_single(payload)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
