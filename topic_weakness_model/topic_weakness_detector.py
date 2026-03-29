import pandas as pd
import numpy as np
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
import os

# --- ЭТАП 1. Генерация синтетического датасета ---

def generate_synthetic_data(n_samples=20000, random_seed=42):
    np.random.seed(random_seed)
    
    # Списки для генерации
    grade_levels = [7, 8, 9, 10, 11, 12]
    subjects = ['Математика', 'Физика', 'Химия', 'История', 'Биология', 'Английский язык']
    topics = {
        'Математика': ['Квадратные уравнения', 'Тригонометрия', 'Логарифмы', 'Производные', 'Геометрия'],
        'Физика': ['Механика', 'Термодинамика', 'Оптика', 'Электричество', 'Квантовая физика'],
        'Химия': ['Органическая химия', 'Неорганическая химия', 'Таблица Менделеева', 'Реакции', 'Кислоты и основания'],
        'История': ['Средние века', 'Древний мир', 'Новое время', 'Вторая мировая война', 'История Казахстана'],
        'Биология': ['Клетка', 'Генетика', 'Зоология', 'Ботаника', 'Анатомия'],
        'Английский язык': ['Present Simple', 'Passive Voice', 'Conditionals', 'Vocabulary', 'Listening']
    }
    
    data = []
    
    for i in range(n_samples):
        student_id = f"STU_{np.random.randint(1000, 9999)}"
        grade_level = np.random.choice(grade_levels)
        subject_name = np.random.choice(subjects)
        topic_name = np.random.choice(topics[subject_name])
        
        topic_difficulty = np.random.randint(1, 6)
        recent_avg_score_topic = np.random.uniform(2, 5)
        historical_avg_score_topic = np.random.uniform(2, 5)
        recent_avg_score_subject = (recent_avg_score_topic + np.random.uniform(2, 5)) / 2
        
        missed_classes_topic = np.random.randint(0, 10)
        assignment_completion_rate = np.random.uniform(0.3, 1.0)
        quiz_attempts_topic = np.random.randint(1, 5)
        improvement_trend = np.random.uniform(-1, 1) # отрицательный = регресс
        days_since_last_topic_assessment = np.random.randint(1, 30)
        related_topic_mastery = np.random.uniform(0.2, 1.0)
        exam_proximity_days = np.random.randint(5, 60)
        engagement_score = np.random.uniform(0.1, 1.0)
        
        # ЛОГИКА ТАРГЕТА: weak_topic_label
        # Базовая вероятность
        prob = 0.3
        
        # Влияние факторов
        if recent_avg_score_topic < 3.0: prob += 0.25
        if assignment_completion_rate < 0.6: prob += 0.15
        if missed_classes_topic > 4: prob += 0.1
        if improvement_trend < 0: prob += 0.1
        if topic_difficulty > 4: prob += 0.05
        if engagement_score < 0.4: prob += 0.1
        if related_topic_mastery < 0.5: prob += 0.1
        if days_since_last_topic_assessment > 20: prob += 0.05
        
        # Бонусы (уменьшают вероятность слабой темы)
        if recent_avg_score_topic > 4.5: prob -= 0.3
        if assignment_completion_rate > 0.9: prob -= 0.1
        
        # Ограничение вероятности
        prob = np.clip(prob, 0, 1)
        
        # Генерация метки
        weak_topic_label = 1 if np.random.random() < prob else 0
        
        data.append({
            'student_id': student_id,
            'grade_level': grade_level,
            'subject_name': subject_name,
            'topic_name': topic_name,
            'topic_difficulty': topic_difficulty,
            'recent_avg_score_topic': recent_avg_score_topic,
            'historical_avg_score_topic': historical_avg_score_topic,
            'recent_avg_score_subject': recent_avg_score_subject,
            'missed_classes_topic': missed_classes_topic,
            'assignment_completion_rate': assignment_completion_rate,
            'quiz_attempts_topic': quiz_attempts_topic,
            'improvement_trend': improvement_trend,
            'days_since_last_topic_assessment': days_since_last_topic_assessment,
            'related_topic_mastery': related_topic_mastery,
            'exam_proximity_days': exam_proximity_days,
            'engagement_score': engagement_score,
            'weak_topic_label': weak_topic_label
        })
        
    return pd.DataFrame(data)

print("Генерация данных...")
df = generate_synthetic_data(25000)
print(f"Датасет создан: {df.shape[0]} строк, {df.shape[1]} колонок")

# --- ЭТАП 2. Предобработка ---

# Определение признаков
categorical_cols = ['grade_level', 'subject_name', 'topic_name']
numerical_cols = [
    'topic_difficulty', 'recent_avg_score_topic', 'historical_avg_score_topic',
    'recent_avg_score_subject', 'missed_classes_topic', 'assignment_completion_rate',
    'quiz_attempts_topic', 'improvement_trend', 'days_since_last_topic_assessment',
    'related_topic_mastery', 'exam_proximity_days', 'engagement_score'
]

# Создание ColumnTransformer
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
    ])

# Сохранение списка колонок
feature_columns_info = {
    'numerical_cols': numerical_cols,
    'categorical_cols': categorical_cols,
    'all_features': numerical_cols + categorical_cols
}

with open('topic_weakness_feature_columns.json', 'w', encoding='utf-8') as f:
    json.dump(feature_columns_info, f, ensure_ascii=False, indent=4)

# Разделение на X и y
X = df.drop(['student_id', 'weak_topic_label'], axis=1)
y = df['weak_topic_label']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Обучаем препроцессор
X_train_transformed = preprocessor.fit_transform(X_train)
X_test_transformed = preprocessor.transform(X_test)

# Сохраняем препроцессор
joblib.dump(preprocessor, 'topic_weakness_preprocessor.joblib')

# --- ЭТАП 3. Обучение модели ---

print("\nОбучение моделей...")

# Baseline: Logistic Regression
lr_model = LogisticRegression(random_state=42, max_iter=1000)
lr_model.fit(X_train_transformed, y_train)

# Random Forest
rf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=12)
rf_model.fit(X_train_transformed, y_train)

# Оценка
def evaluate_model(model, X_test_ready, y_test_true, name):
    preds = model.predict(X_test_ready)
    probs = model.predict_proba(X_test_ready)[:, 1]
    
    metrics = {
        'model_name': name,
        'accuracy': accuracy_score(y_test_true, preds),
        'precision': precision_score(y_test_true, preds),
        'recall': recall_score(y_test_true, preds),
        'f1': f1_score(y_test_true, preds),
        'roc_auc': roc_auc_score(y_test_true, probs)
    }
    return metrics

lr_metrics = evaluate_model(lr_model, X_test_transformed, y_test, 'LogisticRegression')
rf_metrics = evaluate_model(rf_model, X_test_transformed, y_test, 'RandomForest')

print("\nРезультаты:")
print(f"Logistic Regression ROC-AUC: {lr_metrics['roc_auc']:.4f}, F1: {lr_metrics['f1']:.4f}")
print(f"Random Forest ROC-AUC: {rf_metrics['roc_auc']:.4f}, F1: {rf_metrics['f1']:.4f}")

# Выбор лучшей модели (по ROC-AUC)
best_model = None
best_model_name = ""
if rf_metrics['roc_auc'] > lr_metrics['roc_auc'] + 0.005:
    best_model = rf_model
    best_model_name = "RandomForest"
    best_metrics = rf_metrics
else:
    best_model = lr_model
    best_model_name = "LogisticRegression"
    best_metrics = lr_metrics

joblib.dump(best_model, 'topic_weakness_model.joblib')
print(f"\nВыбрана модель: {best_model_name}")

# --- ЭТАП 4. Интерпретация ---

# График важности признаков
plt.figure(figsize=(10, 6))

if best_model_name == "RandomForest":
    # Get feature names from OHE
    cat_feature_names = preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_cols)
    all_feature_names = numerical_cols + list(cat_feature_names)
    
    importances = best_model.feature_importances_
    indices = np.argsort(importances)[-15:]
    
    plt.barh(range(len(indices)), importances[indices], color='skyblue')
    plt.yticks(range(len(indices)), [all_feature_names[i] for i in indices])
    plt.title("Топ 15 важных признаков (Random Forest)")
else:
    coefficients = best_model.coef_[0]
    cat_feature_names = preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_cols)
    all_feature_names = numerical_cols + list(cat_feature_names)
    
    indices = np.argsort(np.abs(coefficients))[-15:]
    plt.barh(range(len(indices)), coefficients[indices], color='orange')
    plt.yticks(range(len(indices)), [all_feature_names[i] for i in indices])
    plt.title("Топ 15 весов признаков (Logistic Regression)")

plt.xlabel("Важность / Коэффициент")
plt.tight_layout()
plt.show()

# Распределение таргета
plt.figure(figsize=(6, 4))
df['weak_topic_label'].value_counts().plot(kind='bar', color=['green', 'red'])
plt.title("Распределение меток (0 - сильная, 1 - слабая)")
plt.xticks([0, 1], ['Сильные темы', 'Слабые темы'], rotation=0)
plt.show()

# --- ЭТАП 5. Инференс ---

def predict_topic_weakness(input_dict):
    """
    Принимает словарь данных, возвращает предсказание.
    """
    # Загружаем файлы, если работаем как отдельный модуль (в этом pipeline они уже в памяти)
    # model = joblib.load('topic_weakness_model.joblib')
    # prep = joblib.load('topic_weakness_preprocessor.joblib')
    
    # Превращаем в DF
    df_input = pd.DataFrame([input_dict])
    
    # Регуляция порядка колонок
    full_cols = categorical_cols + numerical_cols
    # Мы удалили student_id в X, поэтому в инпуте его тоже не должно быть для препроцессора
    
    X_processed = preprocessor.transform(df_input)
    
    prob = best_model.predict_proba(X_processed)[0][1]
    
    risk_level = "strong"
    risk_level_ru = "сильная тема"
    
    if prob >= 0.70:
        risk_level = "weak"
        risk_level_ru = "слабая тема"
    elif prob >= 0.40:
        risk_level = "medium"
        risk_level_ru = "средний риск"
        
    return {
        "weak_topic_probability": round(float(prob), 4),
        "risk_level": risk_level,
        "risk_level_ru": risk_level_ru
    }

# --- ЭТАП 6. Демонстрация ---

print("\n--- Демонстрация работы ---")

test_examples = [
    {
        # Сильная тема
        "grade_level": 9,
        "subject_name": "Математика",
        "topic_name": "Квадратные уравнения",
        "topic_difficulty": 2,
        "recent_avg_score_topic": 4.8,
        "historical_avg_score_topic": 4.5,
        "recent_avg_score_subject": 4.6,
        "missed_classes_topic": 0,
        "assignment_completion_rate": 0.95,
        "quiz_attempts_topic": 1,
        "improvement_trend": 0.2,
        "days_since_last_topic_assessment": 5,
        "related_topic_mastery": 0.9,
        "exam_proximity_days": 30,
        "engagement_score": 0.9
    },
    {
        # Средняя тема
        "grade_level": 11,
        "subject_name": "Физика",
        "topic_name": "Квантовая физика",
        "topic_difficulty": 5,
        "recent_avg_score_topic": 3.4,
        "historical_avg_score_topic": 3.6,
        "recent_avg_score_subject": 3.8,
        "missed_classes_topic": 2,
        "assignment_completion_rate": 0.7,
        "quiz_attempts_topic": 2,
        "improvement_trend": -0.1,
        "days_since_last_topic_assessment": 12,
        "related_topic_mastery": 0.6,
        "exam_proximity_days": 15,
        "engagement_score": 0.6
    },
    {
        # Слабая тема
        "grade_level": 10,
        "subject_name": "Химия",
        "topic_name": "Органическая химия",
        "topic_difficulty": 5,
        "recent_avg_score_topic": 2.1,
        "historical_avg_score_topic": 2.5,
        "recent_avg_score_subject": 3.0,
        "missed_classes_topic": 6,
        "assignment_completion_rate": 0.4,
        "quiz_attempts_topic": 4,
        "improvement_trend": -0.5,
        "days_since_last_topic_assessment": 25,
        "related_topic_mastery": 0.3,
        "exam_proximity_days": 7,
        "engagement_score": 0.3
    }
]

for i, ex in enumerate(test_examples):
    res = predict_topic_weakness(ex)
    print(f"\nТест {i+1} ({ex['subject_name']} - {ex['topic_name']}):")
    print(json.dumps(res, ensure_ascii=False, indent=4))

# --- ЭТАП 7. Экспорт служебных файлов ---

label_map = {
    "0": "strong / сильная тема",
    "1": "weak / слабая тема"
}

with open('topic_weakness_label_map.json', 'w', encoding='utf-8') as f:
    json.dump(label_map, f, ensure_ascii=False, indent=4)

print("\n--- Финализация ---")
print(f"Выбранная модель: {best_model_name}")
print(f"ROC-AUC на тесте: {best_metrics['roc_auc']:.4f}")
print("Файлы сохранены:")
print("- topic_weakness_model.joblib")
print("- topic_weakness_preprocessor.joblib")
print("- topic_weakness_label_map.json")
print("- topic_weakness_feature_columns.json")
