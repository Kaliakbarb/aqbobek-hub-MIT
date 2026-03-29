import pandas as pd
import numpy as np
import joblib
import json
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# --- ЭТАП 1. Сгенерировать realistic synthetic dataset ---

def generate_substitute_data(n_samples=30000, random_seed=42):
    np.random.seed(random_seed)
    
    subjects = ['Математика', 'Физика', 'Химия', 'Биология', 'История', 'Русский язык', 'Литература', 'Английский язык', 'Информатика', 'География']
    grade_levels = [5, 6, 7, 8, 9, 10, 11]
    class_groups = ["regular", "group", "stream", "lab", "exam_prep"]
    room_types = ["standard", "lab", "computer", "lecture"]
    days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    
    data = []
    
    for i in range(n_samples):
        # Контекст урока (заменяемого)
        subj = np.random.choice(subjects)
        grade = np.random.choice(grade_levels)
        c_group = np.random.choice(class_groups)
        slot_idx = np.random.randint(1, 8)
        day = np.random.choice(days_of_week)
        
        # Room requirement logic (simple)
        if subj in ['Информатика']: room_req = 'computer'
        elif subj in ['Химия', 'Физика', 'Биология']: room_req = np.random.choice(['standard', 'lab'], p=[0.7, 0.3])
        else: room_req = np.random.choice(['standard', 'lecture'], p=[0.9, 0.1])
        
        stream_comp = np.random.uniform(0.1, 1.0)
        orig_exper = np.random.randint(1, 30)
        
        # Контекст кандидата
        # Дадим 60% шанс на то, что это профильный учитель, 30% на смежный, 10% на случайный
        rand_draw = np.random.random()
        if rand_draw < 0.6:
            cand_subj = subj
        elif rand_draw < 0.9:
            # Смежный (упрощенно возьмем рандом, но посчитаем partial match позже)
            cand_subj = np.random.choice(subjects)
        else:
            cand_subj = np.random.choice(subjects)
            
        cand_sec_subj = np.random.choice(subjects) if np.random.random() < 0.3 else "None"
        cand_exper = np.random.randint(1, 40)
        
        cand_taught_grade = 1 if np.random.random() < 0.7 else 0
        cand_taught_class = 1 if cand_taught_grade and np.random.random() < 0.4 else 0
        
        cand_avail = np.random.choice([0, 1], p=[0.15, 0.85]) # Чаще доступен в датасете, иначе нет смысла рассматривать
        
        cand_daily_load = np.random.randint(1, 8)
        cand_weekly_load = np.random.randint(10, 35)
        cand_consec = np.random.randint(0, 5)
        cand_gap_before = np.random.randint(0, 3)
        cand_gap_after = np.random.randint(0, 3)
        cand_room_dist = np.random.uniform(0.1, 1.0) # 0.1 - близко, 1.0 - другой конец школы
        cand_recent_subs = np.random.randint(0, 6)
        cand_burnout = np.random.uniform(0.1, 0.9)
        cand_disruption = np.random.uniform(0.0, 1.0)
        
        cand_pref_band = "middle" if grade in [5,6,7,8,9] else "high"
        
        # Derived features
        qual_match = 1.0 if cand_exper >= orig_exper - 3 else 0.5
        
        spec_match = 0.0
        if cand_subj == subj: spec_match = 1.0
        elif cand_sec_subj == subj: spec_match = 0.8
        
        workload_fit_score = max(0, 1.0 - (cand_daily_load / 8.0) - (cand_consec / 5.0)*0.5)
        
        continuity_score = 0.0
        if cand_taught_class: continuity_score = 1.0
        elif cand_taught_grade: continuity_score = 0.5
        
        avail_match = float(cand_avail)
        
        # ЛОГИКА КАЧЕСТВА (substitute_fit_score от 0 до 1)
        score = 0.0
        
        if avail_match == 0:
            score = np.random.uniform(0, 0.1) # Сразу почти 0
        else:
            # База для доступного
            score = 0.2
            
            # Предмет
            score += spec_match * 0.4
            
            # Опыт и классы
            score += qual_match * 0.1
            score += continuity_score * 0.15
            
            # Нагрузка и расстояние
            score += workload_fit_score * 0.1
            score += (1.0 - cand_room_dist) * 0.05
            
            # Пенальти
            if cand_burnout > 0.7: score -= 0.15
            if cand_disruption > 0.6: score -= 0.1
            if cand_recent_subs > 3: score -= 0.05
            if cand_consec > 3: score -= 0.1
            
            # Бонусы
            pref_match = 1 if (cand_pref_band == "high" and grade >= 10) or (cand_pref_band == "middle" and grade <= 9) else 0
            if pref_match: score += 0.05
            
        # Ограничение и шум
        score += np.random.normal(0, 0.05)
        score = float(np.clip(score, 0, 1))
        
        # --- ЭТАП 2. Логика fit_label ---
        if score < 0.40: fit_label = "low"
        elif score < 0.70: fit_label = "medium"
        else: fit_label = "high"
        
        data.append({
            'replacement_case_id': f"RC_{i}",
            'subject_name': subj,
            'grade_level': grade,
            'class_group_type': c_group,
            'lesson_slot_index': slot_idx,
            'day_of_week': day,
            'room_type_required': room_req,
            'stream_complexity_level': stream_comp,
            'original_teacher_experience_years': orig_exper,
            
            'candidate_teacher_id': f"T_{np.random.randint(100, 999)}",
            'candidate_subject_specialization': cand_subj,
            'candidate_secondary_specialization': cand_sec_subj,
            'candidate_experience_years': cand_exper,
            'candidate_has_taught_this_grade': cand_taught_grade,
            'candidate_has_taught_this_class_before': cand_taught_class,
            'candidate_is_available': cand_avail,
            'candidate_current_daily_load': cand_daily_load,
            'candidate_current_weekly_load': cand_weekly_load,
            'candidate_consecutive_lessons_today': cand_consec,
            'candidate_gap_before_lesson': cand_gap_before,
            'candidate_gap_after_lesson': cand_gap_after,
            'candidate_room_distance_score': cand_room_dist,
            'candidate_recent_substitutions_count': cand_recent_subs,
            'candidate_burnout_risk_score': cand_burnout,
            'candidate_schedule_disruption_score': cand_disruption,
            'candidate_prefers_grade_band': cand_pref_band,
            
            'qualification_match': qual_match,
            'specialization_match': spec_match,
            'workload_fit_score': workload_fit_score,
            'continuity_score': continuity_score,
            'availability_match': avail_match,
            
            'substitute_fit_score': score,
            'fit_label': fit_label
        })
        
    return pd.DataFrame(data)

print("Генерация датасета замен...")
df = generate_substitute_data(35000)
print(f"Датасет создан: {df.shape[0]} строк")

# --- ЭТАП 3. Подготовка признаков ---

ignored_cols = ['replacement_case_id', 'candidate_teacher_id', 'substitute_fit_score', 'fit_label']

categorical_cols = [
    'subject_name', 'class_group_type', 'day_of_week', 'room_type_required', 
    'candidate_subject_specialization', 'candidate_secondary_specialization', 
    'candidate_prefers_grade_band'
]

# Все остальные - числовые
all_features = [c for c in df.columns if c not in ignored_cols]
numerical_cols = [c for c in all_features if c not in categorical_cols]

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), numerical_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
])

# Сохраняем схему фичей
feature_columns_info = {
    'numerical_cols': numerical_cols,
    'categorical_cols': categorical_cols,
    'all_features': all_features
}

with open('substitute_matcher_feature_columns.json', 'w', encoding='utf-8') as f:
    json.dump(feature_columns_info, f, ensure_ascii=False, indent=4)

X = df[all_features]
y = df['substitute_fit_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)

joblib.dump(preprocessor, 'substitute_matcher_preprocessor.joblib')

# --- ЭТАП 4. Обучение моделей ---

print("\nОбучение моделей регрессии...")

lr = LinearRegression()
lr.fit(X_train_processed, y_train)
lr_preds = lr.predict(X_test_processed)

rf = RandomForestRegressor(n_estimators=50, max_depth=15, random_state=42, n_jobs=-1)
rf.fit(X_train_processed, y_train)
rf_preds = rf.predict(X_test_processed)

def get_metrics(y_true, y_pred, name):
    return {
        'name': name,
        'mae': mean_absolute_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'r2': r2_score(y_true, y_pred)
    }

m_lr = get_metrics(y_test, lr_preds, 'LinearRegression')
m_rf = get_metrics(y_test, rf_preds, 'RandomForestRegressor')

print(f"LinearRegression: R2={m_lr['r2']:.4f}, RMSE={m_lr['rmse']:.4f}")
print(f"RandomForestRegressor: R2={m_rf['r2']:.4f}, RMSE={m_rf['rmse']:.4f}")

if m_rf['r2'] > m_lr['r2'] + 0.01:
    best_model = rf
    best_name = "RandomForestRegressor"
    best_metrics = m_rf
else:
    best_model = lr
    best_name = "LinearRegression"
    best_metrics = m_lr

joblib.dump(best_model, 'substitute_matcher_model.joblib')
print(f"Выбрана модель: {best_name}")


# --- ЭТАП 5. Интерпретация ---

plt.figure(figsize=(15, 5))

plt.subplot(1, 3, 1)
plt.hist(df['substitute_fit_score'], bins=30, color='lightgreen', edgecolor='black')
plt.title("Распределение substitute_fit_score")

plt.subplot(1, 3, 2)
df['fit_label'].value_counts().plot(kind='bar', color=['red', 'orange', 'green'])
plt.title("Распределение fit_label")

plt.subplot(1, 3, 3)
cat_feats = list(preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_cols))
all_feat_names = numerical_cols + cat_feats

if best_name == "RandomForestRegressor":
    imp = best_model.feature_importances_
    idx = np.argsort(imp)[-10:]
    plt.barh(range(10), imp[idx], color='magenta')
    plt.yticks(range(10), [all_feat_names[i] for i in idx])
    plt.title("Top Feature Importances (RF)")
else:
    coefs = best_model.coef_
    idx = np.argsort(np.abs(coefs))[-10:]
    plt.barh(range(10), coefs[idx], color='blue')
    plt.yticks(range(10), [all_feat_names[i] for i in idx])
    plt.title("Top Absolute Coefficients (LR)")

plt.tight_layout()
plt.show()

# --- ЭТАП 6. Функция ранжирования кандидатов ---

def rank_substitute_candidates(lesson_context: dict, candidates_df: pd.DataFrame, top_n: int = 5) -> list:
    df_eval = candidates_df.copy()
    
    # Broadcast lesson context
    for k, v in lesson_context.items():
        df_eval[k] = v
        
    # Derived features logic inline
    def calc_derived(row):
        qual = 1.0 if row['candidate_experience_years'] >= row['original_teacher_experience_years'] - 3 else 0.5
        
        spec = 0.0
        if row['candidate_subject_specialization'] == row['subject_name']: spec = 1.0
        elif row['candidate_secondary_specialization'] == row['subject_name']: spec = 0.8
        
        wl = max(0, 1.0 - (row['candidate_current_daily_load'] / 8.0) - (row['candidate_consecutive_lessons_today'] / 5.0)*0.5)
        
        cont = 0.0
        if row['candidate_has_taught_this_class_before']: cont = 1.0
        elif row['candidate_has_taught_this_grade']: cont = 0.5
        
        avail = float(row['candidate_is_available'])
        
        return pd.Series({'qualification_match': qual, 'specialization_match': spec,
                          'workload_fit_score': wl, 'continuity_score': cont,
                          'availability_match': avail})
                          
    derived = df_eval.apply(calc_derived, axis=1)
    df_eval = pd.concat([df_eval, derived], axis=1)
    
    # Order features
    X_eval = df_eval[all_features]
    X_proc = preprocessor.transform(X_eval)
    
    preds = best_model.predict(X_proc)
    df_eval['predicted_substitute_fit_score'] = preds
    
    # Сортировка
    df_eval = df_eval.sort_values(by='predicted_substitute_fit_score', ascending=False).head(top_n)
    
    results = []
    for _, row in df_eval.iterrows():
        score = float(np.clip(row['predicted_substitute_fit_score'], 0, 1))
        
        if score >= 0.70:
            label = "high"
            label_ru = "отличная замена"
            expl = "Свободен, хорошо подходит по специализации и минимально нарушает текущее расписание."
        elif score >= 0.40:
            label = "medium"
            label_ru = "допустимая замена"
            expl = "Может заменить, но есть оговорки по нагрузке или специализации."
        else:
            label = "low"
            label_ru = "нежелательная замена"
            expl = "Кандидат недоступен, перегружен или не обладает нужной квалификацией."
            
        results.append({
            "candidate_teacher_id": row['candidate_teacher_id'],
            "candidate_subject_specialization": row['candidate_subject_specialization'],
            "candidate_secondary_specialization": row['candidate_secondary_specialization'],
            "predicted_substitute_fit_score": round(score, 4),
            "fit_label": label,
            "fit_label_ru": label_ru,
            "explanation_ru": expl
        })
        
    return results

# --- ЭТАП 7. Демонстрация ---

print("\n--- Демонстрация ранжирования кандидатов ---")

# Контекст урока
lesson_ctx = {
    'subject_name': 'Физика',
    'grade_level': 10,
    'class_group_type': 'stream',
    'lesson_slot_index': 4,
    'day_of_week': 'Wed',
    'room_type_required': 'lab',
    'stream_complexity_level': 0.8,
    'original_teacher_experience_years': 15
}

# Кандидаты
demo_candidates = []
for i in range(12):
    subj = 'Физика' if i < 3 else ('Математика' if i < 6 else 'Биология')
    avail = 1 if i != 11 else 0 # Последний недоступен
    consec = 0 if i % 2 == 0 else 4 # Перегружены через одного
    
    demo_candidates.append({
        'candidate_teacher_id': f"T_DEMO_{100+i}",
        'candidate_subject_specialization': subj,
        'candidate_secondary_specialization': 'Информатика' if i%3==0 else 'None',
        'candidate_experience_years': 5 + i*2,
        'candidate_has_taught_this_grade': 1 if i%2==0 else 0,
        'candidate_has_taught_this_class_before': 1 if i==0 else 0,
        'candidate_is_available': avail,
        'candidate_current_daily_load': 2 + i%3,
        'candidate_current_weekly_load': 18,
        'candidate_consecutive_lessons_today': consec,
        'candidate_gap_before_lesson': 1,
        'candidate_gap_after_lesson': 0,
        'candidate_room_distance_score': 0.2 + (i%5)*0.1,
        'candidate_recent_substitutions_count': 0,
        'candidate_burnout_risk_score': 0.2 + (i%4)*0.1,
        'candidate_schedule_disruption_score': 0.1,
        'candidate_prefers_grade_band': 'high'
    })

df_cands = pd.DataFrame(demo_candidates)
df_cands.to_csv('substitute_candidates_demo.csv', index=False)

top_cands = rank_substitute_candidates(lesson_ctx, df_cands, top_n=5)
print("Контекст урока (Физика, 10 класс, Лаборатория):")
print(json.dumps(lesson_ctx, ensure_ascii=False, indent=4))
print("\nТоп 5 кандидатов на замену:")
print(json.dumps(top_cands, ensure_ascii=False, indent=4))

# --- ЭТАП 8. Экспорт служебных файлов ---

label_map = {
    "fit_labels": {
        "low": {
            "name_ru": "нежелательная замена",
            "interpretation_ru": "Кандидат недоступен, перегружен или не обладает нужной квалификацией."
        },
        "medium": {
            "name_ru": "допустимая замена",
            "interpretation_ru": "Может заменить, но есть оговорки по нагрузке или специализации."
        },
        "high": {
            "name_ru": "отличная замена",
            "interpretation_ru": "Свободен, хорошо подходит по специализации и минимально нарушает текущее расписание."
        }
    }
}

with open('substitute_matcher_label_map.json', 'w', encoding='utf-8') as f:
    json.dump(label_map, f, ensure_ascii=False, indent=4)

print("\n--- Финализация ---")
print(f"Выбранная модель: {best_name}")
print(f"Метрики (R2): {best_metrics['r2']:.4f}")
print("Файлы сохранены:")
print("- substitute_matcher_model.joblib")
print("- substitute_matcher_preprocessor.joblib")
print("- substitute_matcher_feature_columns.json")
print("- substitute_matcher_label_map.json")
print("- substitute_candidates_demo.csv")
