from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(BASE_DIR / "substitute_matcher_model.joblib")
PREPROCESSOR = joblib.load(BASE_DIR / "substitute_matcher_preprocessor.joblib")
FEATURE_COLUMNS = json.loads((BASE_DIR / "substitute_matcher_feature_columns.json").read_text(encoding="utf-8"))
LABEL_MAP = json.loads((BASE_DIR / "substitute_matcher_label_map.json").read_text(encoding="utf-8"))

RELATED_SUBJECT_MATCHES = {
    "Математика": {"Физика", "Информатика"},
    "Физика": {"Математика", "Информатика"},
    "Информатика": {"Математика", "Физика"},
    "Химия": {"Биология", "Физика"},
    "Биология": {"Химия"},
    "История": {"История Казахстана"},
    "Английский язык": {"Русский язык", "Литература"},
}


def normalize_secondary(value: str | None) -> str:
    if value is None or str(value).strip() == "":
        return "None"
    return str(value)


def get_specialization_match(subject_name: str, primary: str, secondary: str) -> float:
    if primary == subject_name:
        return 1.0
    if secondary == subject_name:
        return 0.8
    if primary in RELATED_SUBJECT_MATCHES.get(subject_name, set()) or secondary in RELATED_SUBJECT_MATCHES.get(subject_name, set()):
        return 0.5
    return 0.0


def get_qualification_match(original_experience: float, candidate_experience: float) -> float:
    return 1.0 if candidate_experience >= original_experience - 3 else 0.5


def get_workload_fit_score(candidate_daily_load: float, candidate_consecutive: float) -> float:
    return max(0.0, 1.0 - (candidate_daily_load / 8.0) - (candidate_consecutive / 5.0) * 0.5)


def get_continuity_score(taught_class: float, taught_grade: float) -> float:
    if taught_class >= 1:
        return 1.0
    if taught_grade >= 1:
        return 0.5
    return 0.0


def get_availability_match(is_available: float) -> float:
    return float(is_available)


def get_fit_label(score: float) -> str:
    if score < 0.40:
        return "low"
    if score < 0.70:
        return "medium"
    return "high"


def build_records(lesson_context: dict, candidates: list[dict]) -> pd.DataFrame:
    rows: list[dict] = []
    for candidate in candidates:
        primary = candidate["candidate_subject_specialization"]
        secondary = normalize_secondary(candidate.get("candidate_secondary_specialization"))

        row = {
            "subject_name": lesson_context["subject_name"],
            "grade_level": lesson_context["grade_level"],
            "class_group_type": lesson_context["class_group_type"],
            "lesson_slot_index": lesson_context["lesson_slot_index"],
            "day_of_week": lesson_context["day_of_week"],
            "room_type_required": lesson_context["room_type_required"],
            "stream_complexity_level": lesson_context["stream_complexity_level"],
            "original_teacher_experience_years": lesson_context["original_teacher_experience_years"],
            "candidate_teacher_id": candidate["candidate_teacher_id"],
            "candidate_subject_specialization": primary,
            "candidate_secondary_specialization": secondary,
            "candidate_experience_years": candidate["candidate_experience_years"],
            "candidate_has_taught_this_grade": candidate["candidate_has_taught_this_grade"],
            "candidate_has_taught_this_class_before": candidate["candidate_has_taught_this_class_before"],
            "candidate_is_available": candidate["candidate_is_available"],
            "candidate_current_daily_load": candidate["candidate_current_daily_load"],
            "candidate_current_weekly_load": candidate["candidate_current_weekly_load"],
            "candidate_consecutive_lessons_today": candidate["candidate_consecutive_lessons_today"],
            "candidate_gap_before_lesson": candidate["candidate_gap_before_lesson"],
            "candidate_gap_after_lesson": candidate["candidate_gap_after_lesson"],
            "candidate_room_distance_score": candidate["candidate_room_distance_score"],
            "candidate_recent_substitutions_count": candidate["candidate_recent_substitutions_count"],
            "candidate_burnout_risk_score": candidate["candidate_burnout_risk_score"],
            "candidate_schedule_disruption_score": candidate["candidate_schedule_disruption_score"],
            "candidate_prefers_grade_band": candidate["candidate_prefers_grade_band"],
        }

        row["qualification_match"] = get_qualification_match(
            float(lesson_context["original_teacher_experience_years"]),
            float(candidate["candidate_experience_years"]),
        )
        row["specialization_match"] = get_specialization_match(lesson_context["subject_name"], primary, secondary)
        row["workload_fit_score"] = get_workload_fit_score(
            float(candidate["candidate_current_daily_load"]),
            float(candidate["candidate_consecutive_lessons_today"]),
        )
        row["continuity_score"] = get_continuity_score(
            float(candidate["candidate_has_taught_this_class_before"]),
            float(candidate["candidate_has_taught_this_grade"]),
        )
        row["availability_match"] = get_availability_match(float(candidate["candidate_is_available"]))
        rows.append(row)

    return pd.DataFrame(rows)


def rank_candidates(lesson_context: dict, candidates: list[dict], top_n: int = 5) -> list[dict]:
    frame = build_records(lesson_context, candidates)
    features = frame[FEATURE_COLUMNS["all_features"]]
    transformed = PREPROCESSOR.transform(features)
    scores = MODEL.predict(transformed).clip(0, 1)

    frame = frame.copy()
    frame["predicted_substitute_fit_score"] = scores
    frame["fit_label"] = frame["predicted_substitute_fit_score"].apply(get_fit_label)
    frame["fit_label_ru"] = frame["fit_label"].apply(lambda label: LABEL_MAP["fit_labels"][label]["name_ru"])
    frame["explanation_ru"] = frame["fit_label"].apply(lambda label: LABEL_MAP["fit_labels"][label]["interpretation_ru"])

    ranked = frame.sort_values(
        by=[
            "predicted_substitute_fit_score",
            "availability_match",
            "specialization_match",
            "continuity_score",
            "workload_fit_score",
        ],
        ascending=[False, False, False, False, False],
    ).head(int(top_n))

    return [
        {
            "candidate_teacher_id": row["candidate_teacher_id"],
            "candidate_subject_specialization": row["candidate_subject_specialization"],
            "candidate_secondary_specialization": row["candidate_secondary_specialization"],
            "predicted_substitute_fit_score": round(float(row["predicted_substitute_fit_score"]), 4),
            "fit_label": row["fit_label"],
            "fit_label_ru": row["fit_label_ru"],
            "explanation_ru": row["explanation_ru"],
        }
        for _, row in ranked.iterrows()
    ]


def main() -> int:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        print(json.dumps({"error": "Expected JSON payload on stdin"}, ensure_ascii=False))
        return 1

    try:
        payload = json.loads(raw_input)
        lesson_context = payload["lesson_context"]
        candidates = payload["candidates"]
        top_n = payload.get("top_n", 5)
        result = rank_candidates(lesson_context, candidates, top_n=top_n)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
