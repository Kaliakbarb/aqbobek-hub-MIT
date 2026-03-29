from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(BASE_DIR / "topic_weakness_model.joblib")
PREPROCESSOR = joblib.load(BASE_DIR / "topic_weakness_preprocessor.joblib")
FEATURE_COLUMNS = json.loads((BASE_DIR / "topic_weakness_feature_columns.json").read_text(encoding="utf-8"))
LABEL_MAP = json.loads((BASE_DIR / "topic_weakness_label_map.json").read_text(encoding="utf-8"))


def build_record(payload: dict) -> dict:
    record = {}
    for feature_name in FEATURE_COLUMNS["all_features"]:
        if feature_name not in payload:
            raise ValueError(f"Missing required feature: {feature_name}")
        record[feature_name] = payload[feature_name]
    return record


def map_risk_level(probability: float) -> tuple[str, str]:
    if probability >= 0.7:
        return "weak", "слабая тема"
    if probability >= 0.4:
        return "medium", "тема требует внимания"
    return "strong", "сильная тема"


def predict_single(payload: dict) -> dict:
    record = build_record(payload)
    frame = pd.DataFrame([record], columns=FEATURE_COLUMNS["all_features"])
    transformed = PREPROCESSOR.transform(frame)
    weak_probability = float(MODEL.predict_proba(transformed)[0][1])
    risk_level, risk_level_ru = map_risk_level(weak_probability)
    model_label = "1" if weak_probability >= 0.5 else "0"

    return {
        "weak_topic_probability": round(weak_probability, 4),
        "risk_level": risk_level,
        "risk_level_ru": risk_level_ru,
        "model_label": LABEL_MAP.get(model_label, model_label),
    }


def main() -> int:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        print(json.dumps({"error": "Expected JSON payload on stdin"}, ensure_ascii=False))
        return 1

    try:
        payload = json.loads(raw_input)
        if isinstance(payload, list):
            result = [predict_single(item) for item in payload]
        else:
            result = predict_single(payload)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
