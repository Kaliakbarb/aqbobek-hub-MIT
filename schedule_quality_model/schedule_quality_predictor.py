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

# --- ЭТАП 1. Сгенерировать realistic synthetic dataset расписаний ---

def generate_schedule_data(n_samples=25000, random_seed=42):
    np.random.seed(random_seed)
    
    data = []
    
    for i in range(n_samples):
        # Базовые параметры
        total_classes = np.random.randint(10, 50)
        total_teachers = np.random.randint(15, 80)
        total_rooms = int(total_classes * np.random.uniform(0.8, 1.2))
        total_subject_blocks = np.random.randint(5, 20)
        total_group_lessons = np.random.randint(0, total_classes * 5)
        total_parallel_streams = np.random.randint(1, 10)
        total_events = np.random.randint(0, 5)
        
        # Окна у учителей
        avg_teacher_gaps = np.random.uniform(0, 10)
        max_teacher_gaps = int(avg_teacher_gaps + np.random.uniform(1, 8))
        
        # Подряд уроки учителей
        avg_teach_consec = np.random.uniform(2, 6)
        max_teach_consec = int(avg_teach_consec + np.random.uniform(1, 5))
        
        # Ученики
        avg_stud_consec_hard = np.random.uniform(0, 4)
        max_stud_consec_hard = int(avg_stud_consec_hard + np.random.uniform(0, 3))
        avg_student_daily_load = np.random.uniform(4, 8)
        max_student_daily_load = int(avg_student_daily_load + np.random.uniform(0, 3))
        
        # Помещения и конфликты
        room_util_rate = np.random.uniform(0.4, 0.98)
        room_conflicts = np.random.randint(0, 15)
        teacher_conflicts = np.random.randint(0, 10)
        class_conflicts = np.random.randint(0, 5)
        
        # Баланс и сложность
        subst_resilience = np.random.uniform(0.1, 1.0)
        sched_balance = np.random.uniform(0.3, 1.0)
        hard_subj_clustering = np.random.uniform(0.1, 0.9)
        teach_workload_std = np.random.uniform(1.0, 10.0)
        class_workload_std = np.random.uniform(0.5, 4.0)
        friday_overload = np.random.uniform(0, 1.0)
        monday_underload = np.random.uniform(0, 1.0)
        lunch_break_violations = np.random.randint(0, 20)
        late_slot_usage = np.random.uniform(0, 0.5)
        early_slot_usage = np.random.uniform(0, 0.8)
        stream_complexity = np.random.uniform(0.1, 1.0)
        event_disruption = np.random.uniform(0, 1.0)
        reoptimization_needed = np.random.choice([0, 1], p=[0.8, 0.2])
        
        # ЛОГИКА КАЧЕСТВА (overall_quality_score от 0 до 100)
        # Базовый скор: 100
        score = 100.0
        
        # Снижения за конфликты (критично)
        score -= (room_conflicts * 2)
        score -= (teacher_conflicts * 3)
        score -= (class_conflicts * 4)
        
        # Снижения за окна учителей
        score -= (avg_teacher_gaps * 1.5)
        if max_teacher_gaps > 5: score -= 5
        
        # Снижения за расписание студентов
        score -= (avg_stud_consec_hard * 3)
        if max_student_daily_load > 7: score -= 5
        
        # Снижения за баланс и организацию
        score -= (teach_workload_std * 0.5)
        score -= (class_workload_std * 1.0)
        score -= (friday_overload * 10)
        score -= (lunch_break_violations * 1.5)
        score -= (late_slot_usage * 15)
        score -= (event_disruption * 10)
        
        if reoptimization_needed == 1: score -= 20
        
        # Room utilization (штраф за слишком высокую или низкую)
        if room_util_rate > 0.9: score -= (room_util_rate - 0.9) * 50
        elif room_util_rate < 0.6: score -= (0.6 - room_util_rate) * 30
        
        # Бонусы
        score += (subst_resilience * 10)
        score += (sched_balance * 15)
        
        # Ограничения
        score += np.random.normal(0, 3) # Шум
        score = max(0.0, min(100.0, score))
        
        data.append({
            'schedule_id': f"SCH_{i}",
            'total_classes': total_classes,
            'total_teachers': total_teachers,
            'total_rooms': total_rooms,
            'total_subject_blocks': total_subject_blocks,
            'total_group_lessons': total_group_lessons,
            'total_parallel_streams': total_parallel_streams,
            'total_events': total_events,
            
            'avg_teacher_gaps_per_week': avg_teacher_gaps,
            'max_teacher_gaps': max_teacher_gaps,
            'avg_teacher_consecutive_lessons': avg_teach_consec,
            'max_teacher_consecutive_lessons': max_teach_consec,
            
            'avg_student_consecutive_hard_lessons': avg_stud_consec_hard,
            'max_student_consecutive_hard_lessons': max_stud_consec_hard,
            'avg_student_daily_load': avg_student_daily_load,
            'max_student_daily_load': max_student_daily_load,
            
            'room_utilization_rate': room_util_rate,
            'room_conflict_count': room_conflicts,
            'teacher_conflict_count': teacher_conflicts,
            'class_conflict_count': class_conflicts,
            
            'substitution_resilience_score': subst_resilience,
            'schedule_balance_score': sched_balance,
            'hard_subject_clustering_score': hard_subj_clustering,
            'teacher_workload_std': teach_workload_std,
            'class_workload_std': class_workload_std,
            
            'friday_overload_score': friday_overload,
            'monday_underload_score': monday_underload,
            'lunch_break_violation_count': lunch_break_violations,
            'late_slot_usage_rate': late_slot_usage,
            'early_slot_usage_rate': early_slot_usage,
            
            'stream_complexity_score': stream_complexity,
            'event_disruption_score': event_disruption,
            'reoptimization_needed_flag': reoptimization_needed,
            
            'overall_quality_score': score
        })
        
    df = pd.DataFrame(data)
    
    # --- ЭТАП 2. Логика quality_band_label ---
    def assign_band(s):
        if s < 50: return "low"
        if s < 75: return "medium"
        return "high"
        
    df['quality_band_label'] = df['overall_quality_score'].apply(assign_band)
    return df

print("Генерация данных расписаний...")
df_schedule = generate_schedule_data(25000)
print(f"Датасет создан: {df_schedule.shape[0]} строк")

# --- ЭТАП 3. Подготовка признаков ---

# Исключаем target и ID
ignored_cols = ['schedule_id', 'overall_quality_score', 'quality_band_label']
all_features = [c for c in df_schedule.columns if c not in ignored_cols]

# Если нужно, определим категориальные (здесь только reoptimization_needed_flag можно считать катег., но оно 0/1)
# Мы пропустим его через StandardScaler, так как оно бинарное, либо добавим в отдельный пайплайн.
categorical_cols = ['reoptimization_needed_flag']
numerical_cols = [c for c in all_features if c not in categorical_cols]

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_cols),
        ('cat', OneHotEncoder(drop='if_binary', handle_unknown='ignore'), categorical_cols)
    ]
)

# Сохранение feature columns
feature_columns_info = {
    'numerical_cols': numerical_cols,
    'categorical_cols': categorical_cols,
    'all_features': all_features
}

with open('schedule_quality_feature_columns.json', 'w', encoding='utf-8') as f:
    json.dump(feature_columns_info, f, ensure_ascii=False, indent=4)

X = df_schedule[all_features]
y = df_schedule['overall_quality_score']

# Сплит
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Обучаем препроцессор
X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)

joblib.dump(preprocessor, 'schedule_quality_preprocessor.joblib')

# --- ЭТАП 4. Обучение моделей ---

print("\nОбучение моделей...")

lr_model = LinearRegression()
lr_model.fit(X_train_processed, y_train)
lr_preds = lr_model.predict(X_test_processed)

rf_model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=12, n_jobs=-1)
rf_model.fit(X_train_processed, y_train)
rf_preds = rf_model.predict(X_test_processed)

def evaluate(y_t, y_p, name):
    return {
        'name': name,
        'mae': mean_absolute_error(y_t, y_p),
        'rmse': np.sqrt(mean_squared_error(y_t, y_p)),
        'r2': r2_score(y_t, y_p)
    }

metrics_lr = evaluate(y_test, lr_preds, 'LinearRegression')
metrics_rf = evaluate(y_test, rf_preds, 'RandomForestRegressor')

print(f"LinearRegression: R2={metrics_lr['r2']:.4f}, RMSE={metrics_lr['rmse']:.4f}")
print(f"RandomForestRegressor: R2={metrics_rf['r2']:.4f}, RMSE={metrics_rf['rmse']:.4f}")

# Выбор модели
if metrics_rf['r2'] > metrics_lr['r2'] + 0.01:
    best_model = rf_model
    best_name = "RandomForestRegressor"
    best_metrics = metrics_rf
else:
    # Если данные сгенерированы почти линейно, LR может быть отличным (и быстрее)
    best_model = lr_model
    best_name = "LinearRegression"
    best_metrics = metrics_lr

joblib.dump(best_model, 'schedule_quality_model.joblib')
print(f"Выбрана модель: {best_name}")

# --- ЭТАП 5. Интерпретация ---

plt.figure(figsize=(15, 5))

# Распределение score
plt.subplot(1, 3, 1)
plt.hist(df_schedule['overall_quality_score'], bins=30, color='teal', edgecolor='black')
plt.title("Распределение overall_quality_score")

# Распределение меток
plt.subplot(1, 3, 2)
df_schedule['quality_band_label'].value_counts().plot(kind='bar', color=['red', 'orange', 'green'])
plt.title("Распределение quality_band_label")

# Фичи
plt.subplot(1, 3, 3)
cat_feats = list(preprocessor.named_transformers_['cat'].get_feature_names_out())
all_feat_names = numerical_cols + cat_feats

if best_name == "RandomForestRegressor":
    imp = best_model.feature_importances_
    idx = np.argsort(imp)[-10:]
    plt.barh(range(10), imp[idx], color='purple')
    plt.yticks(range(10), [all_feat_names[i] for i in idx])
    plt.title("Top Feature Importances (RF)")
else:
    coefs = best_model.coef_
    idx = np.argsort(np.abs(coefs))[-10:]
    plt.barh(range(10), coefs[idx], color='blue')
    plt.yticks(range(10), [all_feat_names[i] for i in idx])
    plt.title("Top Absolute Coefficients (LinearRegression)")

plt.tight_layout()
plt.show()

# --- ЭТАП 6. Функция инференса ---

def predict_schedule_quality(input_dict: dict) -> dict:
    # Преобразуем в DF 
    df_raw = pd.DataFrame([input_dict])
    
    # Регуляция порядка признаков
    df_in = df_raw[all_features]
    
    # Препроцессинг
    X_proc = preprocessor.transform(df_in)
    
    # Предсказание
    score = best_model.predict(X_proc)[0]
    score = float(np.clip(score, 0, 100))
    
    if score < 50:
        band = "low"
        band_ru = "низкое качество"
        desc = "Расписание перегружено конфликтами и требует серьезной переработки."
    elif score < 75:
        band = "medium"
        band_ru = "среднее качество"
        desc = "Расписание работоспособно, но есть заметные точки для оптимизации."
    else:
        band = "high"
        band_ru = "высокое качество"
        desc = "Расписание хорошо сбалансировано и устойчиво к изменениям."
        
    return {
        "overall_quality_score": round(score, 2),
        "quality_band_label": band,
        "quality_band_label_ru": band_ru,
        "interpretation_ru": desc
    }

# --- ЭТАП 7. Демонстрация ---

print("\n--- Демонстрация работы ---")

demo_examples = [
    {
        # Очень плохое расписание
        "name": "Тест 1: Плохое расписание (много конфликтов)",
        "data": {
            'total_classes': 30, 'total_teachers': 40, 'total_rooms': 25, 'total_subject_blocks': 10,
            'total_group_lessons': 20, 'total_parallel_streams': 4, 'total_events': 2,
            'avg_teacher_gaps_per_week': 8.5, 'max_teacher_gaps': 10,
            'avg_teacher_consecutive_lessons': 5.5, 'max_teacher_consecutive_lessons': 7,
            'avg_student_consecutive_hard_lessons': 4.5, 'max_student_consecutive_hard_lessons': 6,
            'avg_student_daily_load': 7.5, 'max_student_daily_load': 9,
            'room_utilization_rate': 0.95, 'room_conflict_count': 12, 'teacher_conflict_count': 8, 'class_conflict_count': 4,
            'substitution_resilience_score': 0.1, 'schedule_balance_score': 0.2, 'hard_subject_clustering_score': 0.8,
            'teacher_workload_std': 8.5, 'class_workload_std': 3.5, 'friday_overload_score': 0.9, 'monday_underload_score': 0.8,
            'lunch_break_violation_count': 15, 'late_slot_usage_rate': 0.4, 'early_slot_usage_rate': 0.7,
            'stream_complexity_score': 0.9, 'event_disruption_score': 0.8, 'reoptimization_needed_flag': 1
        }
    },
    {
        # Среднее расписание
        "name": "Тест 2: Среднее расписание",
        "data": {
            'total_classes': 30, 'total_teachers': 40, 'total_rooms': 30, 'total_subject_blocks': 10,
            'total_group_lessons': 20, 'total_parallel_streams': 4, 'total_events': 2,
            'avg_teacher_gaps_per_week': 3.5, 'max_teacher_gaps': 5,
            'avg_teacher_consecutive_lessons': 3.5, 'max_teacher_consecutive_lessons': 5,
            'avg_student_consecutive_hard_lessons': 2.0, 'max_student_consecutive_hard_lessons': 3,
            'avg_student_daily_load': 6.0, 'max_student_daily_load': 7,
            'room_utilization_rate': 0.75, 'room_conflict_count': 2, 'teacher_conflict_count': 1, 'class_conflict_count': 1,
            'substitution_resilience_score': 0.5, 'schedule_balance_score': 0.6, 'hard_subject_clustering_score': 0.4,
            'teacher_workload_std': 4.0, 'class_workload_std': 1.5, 'friday_overload_score': 0.4, 'monday_underload_score': 0.3,
            'lunch_break_violation_count': 5, 'late_slot_usage_rate': 0.1, 'early_slot_usage_rate': 0.2,
            'stream_complexity_score': 0.4, 'event_disruption_score': 0.3, 'reoptimization_needed_flag': 0
        }
    },
    {
        # Хорошее расписание
        "name": "Тест 3: Хорошее расписание",
        "data": {
            'total_classes': 30, 'total_teachers': 40, 'total_rooms': 35, 'total_subject_blocks': 10,
            'total_group_lessons': 20, 'total_parallel_streams': 4, 'total_events': 2,
            'avg_teacher_gaps_per_week': 0.5, 'max_teacher_gaps': 1,
            'avg_teacher_consecutive_lessons': 2.5, 'max_teacher_consecutive_lessons': 4,
            'avg_student_consecutive_hard_lessons': 0.5, 'max_student_consecutive_hard_lessons': 1,
            'avg_student_daily_load': 5.0, 'max_student_daily_load': 6,
            'room_utilization_rate': 0.65, 'room_conflict_count': 0, 'teacher_conflict_count': 0, 'class_conflict_count': 0,
            'substitution_resilience_score': 0.9, 'schedule_balance_score': 0.9, 'hard_subject_clustering_score': 0.1,
            'teacher_workload_std': 1.5, 'class_workload_std': 0.5, 'friday_overload_score': 0.1, 'monday_underload_score': 0.1,
            'lunch_break_violation_count': 0, 'late_slot_usage_rate': 0.0, 'early_slot_usage_rate': 0.05,
            'stream_complexity_score': 0.1, 'event_disruption_score': 0.05, 'reoptimization_needed_flag': 0
        }
    }
]

for t in demo_examples:
    print(f"\n{t['name']}:")
    res = predict_schedule_quality(t['data'])
    print(json.dumps(res, ensure_ascii=False, indent=4))

# --- ЭТАП 8. Экспорт служебных файлов ---

label_map = {
    "quality_bands": {
        "low": {
            "name_ru": "низкое качество",
            "interpretation_ru": "Расписание перегружено конфликтами и требует серьезной переработки."
        },
        "medium": {
            "name_ru": "среднее качество",
            "interpretation_ru": "Расписание работоспособно, но есть заметные точки для оптимизации."
        },
        "high": {
            "name_ru": "высокое качество",
            "interpretation_ru": "Расписание хорошо сбалансировано и устойчиво к изменениям."
        }
    }
}

with open('schedule_quality_label_map.json', 'w', encoding='utf-8') as f:
    json.dump(label_map, f, ensure_ascii=False, indent=4)

print("\n--- Финализация ---")
print(f"Выбранная модель: {best_name}")
print(f"Метрики (R2): {best_metrics['r2']:.4f}")
print("Файлы сохранены:")
print("- schedule_quality_model.joblib")
print("- schedule_quality_preprocessor.joblib")
print("- schedule_quality_feature_columns.json")
print("- schedule_quality_label_map.json")
