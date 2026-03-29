from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(BASE_DIR / "resource_recommender_model.joblib")
PREPROCESSOR = joblib.load(BASE_DIR / "resource_recommender_preprocessor.joblib")
RESOURCE_CATALOG = pd.read_csv(BASE_DIR / "resource_catalog.csv")
FEATURE_COLUMNS = json.loads((BASE_DIR / "resource_recommender_feature_columns.json").read_text(encoding="utf-8"))
LABELS = json.loads((BASE_DIR / "resource_recommender_label_map.json").read_text(encoding="utf-8"))


def get_target_difficulty(weak_probability: float) -> int:
    if weak_probability > 0.8:
        return 2
    if weak_probability > 0.6:
        return 3
    return 4


def get_relevance_label(score: float) -> str:
    if score >= 0.85:
        return LABELS["relevance_labels"]["very_high"]
    if score >= 0.7:
        return LABELS["relevance_labels"]["high"]
    if score >= 0.5:
        return LABELS["relevance_labels"]["medium"]
    return LABELS["relevance_labels"]["low"]


def validate_context(context: dict) -> dict:
    required = [
        "student_id",
        "grade_level",
        "preferred_language",
        "preferred_content_type",
        "subject_name",
        "weak_topic_name",
        "weak_topic_probability",
        "topic_mastery_score",
        "exam_proximity_days",
        "engagement_score",
        "available_study_minutes",
    ]
    for field in required:
        if field not in context:
            raise ValueError(f"Missing required context field: {field}")
    return context


def build_feature_frame(context: dict) -> pd.DataFrame:
    target_difficulty = get_target_difficulty(float(context["weak_topic_probability"]))
    catalog = RESOURCE_CATALOG.copy()

    catalog["subject_match"] = (catalog["subject_name"] == context["subject_name"]).astype(int)
    catalog["topic_match"] = (catalog["topic_name"] == context["weak_topic_name"]).astype(int)
    catalog["language_match"] = (catalog["language"] == context["preferred_language"]).astype(int)
    catalog["content_type_match"] = (catalog["content_type"] == context["preferred_content_type"]).astype(int)
    catalog["difficulty_gap"] = (catalog["difficulty_level"] - target_difficulty).abs()
    catalog["time_fit_score"] = (catalog["estimated_minutes"] <= int(context["available_study_minutes"])).astype(int)
    catalog["grade_match"] = (
        (catalog["grade_min"] <= int(context["grade_level"])) &
        (catalog["grade_max"] >= int(context["grade_level"]))
    ).astype(int)

    catalog["weak_topic_probability"] = float(context["weak_topic_probability"])
    catalog["topic_mastery_score"] = float(context["topic_mastery_score"])
    catalog["exam_proximity_days"] = int(context["exam_proximity_days"])
    catalog["engagement_score"] = float(context["engagement_score"])
    catalog["available_study_minutes"] = int(context["available_study_minutes"])
    catalog["grade_level"] = int(context["grade_level"])
    catalog["preferred_language"] = context["preferred_language"]
    catalog["preferred_content_type"] = context["preferred_content_type"]
    catalog["resource_difficulty_level"] = catalog["difficulty_level"]
    catalog["resource_content_type"] = catalog["content_type"]
    catalog["resource_estimated_minutes"] = catalog["estimated_minutes"]
    catalog["resource_language"] = catalog["language"]
    catalog["resource_quality_score"] = catalog["quality_score"]
    catalog["resource_popularity_score"] = catalog["popularity_score"]
    catalog["resource_exam_focus"] = catalog["exam_focus"]
    catalog["resource_interactivity_score"] = catalog["interactivity_score"]

    filtered_catalog = catalog[catalog["grade_match"] == 1].copy()
    if filtered_catalog.empty:
        filtered_catalog = catalog

    feature_names = FEATURE_COLUMNS["numerical_cols"] + FEATURE_COLUMNS["categorical_cols"]
    return filtered_catalog, filtered_catalog[feature_names]


def recommend(context: dict, top_n: int = 5) -> list[dict]:
    context = validate_context(context)
    ranked_catalog, features = build_feature_frame(context)
    transformed = PREPROCESSOR.transform(features)
    scores = MODEL.predict(transformed)

    ranked_catalog = ranked_catalog.copy()
    ranked_catalog["predicted_relevance_score"] = scores.clip(0, 1)
    ranked_catalog["relevance_label_ru"] = ranked_catalog["predicted_relevance_score"].apply(get_relevance_label)

    ranked_catalog = ranked_catalog.sort_values(
        by=["predicted_relevance_score", "topic_match", "subject_match", "language_match", "time_fit_score", "resource_quality_score"],
        ascending=[False, False, False, False, False, False],
    )

    top_rows = ranked_catalog.head(int(top_n))
    return [
        {
            "resource_id": row["resource_id"],
            "title_ru": row["title_ru"],
            "subject_name": row["subject_name"],
            "topic_name": row["topic_name"],
            "content_type": row["content_type"],
            "language": row["language"],
            "estimated_minutes": int(row["estimated_minutes"]),
            "predicted_relevance_score": round(float(row["predicted_relevance_score"]), 4),
            "relevance_label_ru": row["relevance_label_ru"],
        }
        for _, row in top_rows.iterrows()
    ]


def main() -> int:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        print(json.dumps({"error": "Expected JSON payload on stdin"}, ensure_ascii=False))
        return 1

    try:
        payload = json.loads(raw_input)
        context = payload.get("context", payload)
        top_n = payload.get("top_n", 5)
        result = recommend(context, top_n=top_n)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
