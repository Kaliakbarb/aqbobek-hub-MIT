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
import os

# --- ЭТАП 1. Генерация каталога ресурсов (Resource Catalog) ---

def generate_resource_catalog(n_resources=600, random_seed=42):
    np.random.seed(random_seed)
    
    subjects_topics = {
        'Математика': ['Квадратные уравнения', 'Тригонометрия', 'Логарифмы', 'Геометрия', 'Производные'],
        'Физика': ['Законы Ньютона', 'Термодинамика', 'Оптика', 'Электричество', 'Кинематика'],
        'Химия': ['Органическая химия', 'Таблица Менделеева', 'Кислоты и основания', 'Химические связи'],
        'Биология': ['Клеточное деление', 'Генетика', 'Зоология', 'Анатомия человека'],
        'История': ['История Казахстана', 'Вторая мировая война', 'Древний мир', 'Средние века'],
        'Информатика': ['Алгоритмы', 'Python основы', 'Базы данных', 'Сетевые технологии'],
        'Английский язык': ['Tenses', 'Vocabulary', 'Listening Practice', 'Grammar Rules']
    }
    
    content_types = ["video", "quiz", "article", "practice", "summary", "flashcards"]
    languages = ["ru", "en", "kz"]
    
    data = []
    
    for i in range(n_resources):
        subject = np.random.choice(list(subjects_topics.keys()))
        topic = np.random.choice(subjects_topics[subject])
        
        # Названия на русском зависят от типа
        titles = {
            "video": [f"Видео-урок: {topic}", f"Разбор темы {topic}", f"Интенсив по {topic}"],
            "quiz": [f"Тест: {topic}", f"Проверь себя: {topic}", f"Квиз по теме {topic}"],
            "article": [f"Статья: Все о {topic}", f"Теория: {topic}", f"Шпаргалка по {topic}"],
            "practice": [f"Практические задачи: {topic}", f"Упражнения по {topic}", f"Сборник задач {topic}"],
            "summary": [f"Конспект: {topic}", f"Краткий обзор {topic}"],
            "flashcards": [f"Флэш-карточки: {topic}", f"Запоминаем {topic}"]
        }
        
        c_type = np.random.choice(content_types)
        title = np.random.choice(titles[c_type])
        
        diff = np.random.randint(1, 6)
        grade_min = np.random.randint(7, 10)
        grade_max = grade_min + np.random.randint(1, 4)
        
        data.append({
            'resource_id': f"RES_{1000 + i}",
            'title_ru': title,
            'subject_name': subject,
            'topic_name': topic,
            'difficulty_level': diff,
            'content_type': c_type,
            'estimated_minutes': np.random.randint(5, 45) if c_type != "article" else np.random.randint(3, 15),
            'language': np.random.choice(languages, p=[0.7, 0.2, 0.1]),
            'grade_min': grade_min,
            'grade_max': grade_max,
            'quality_score': round(np.random.uniform(3.5, 5.0), 1),
            'popularity_score': round(np.random.uniform(1, 10), 1),
            'exam_focus': np.random.choice([0, 1], p=[0.6, 0.4]),
            'interactivity_score': round(np.random.uniform(0.2, 1.0), 2)
        })
        
    return pd.DataFrame(data)

print("Генерация каталога ресурсов...")
resource_catalog = generate_resource_catalog(650)
resource_catalog.to_csv('resource_catalog.csv', index=False, encoding='utf-8')
print(f"Каталог создан: {len(resource_catalog)} ресурсов.")

# --- ЭТАП 2. Генерация датасета взаимодействий (Interaction Dataset) ---

def generate_interaction_data(catalog, n_samples=30000, random_seed=42):
    np.random.seed(random_seed)
    
    content_types = ["video", "quiz", "article", "practice", "summary", "flashcards"]
    languages = ["ru", "en", "kz"]
    subjects = catalog['subject_name'].unique()
    
    data = []
    
    for i in range(n_samples):
        # Профиль студента
        grade_level = np.random.randint(7, 13)
        pref_lang = np.random.choice(languages, p=[0.8, 0.15, 0.05])
        pref_type = np.random.choice(content_types)
        
        # Контекст: слабая тема
        sub_name = np.random.choice(subjects)
        possible_topics = catalog[catalog['subject_name'] == sub_name]['topic_name'].unique()
        weak_topic = np.random.choice(possible_topics)
        
        weak_prob = np.random.uniform(0.4, 0.95)
        mastery = np.random.uniform(0.1, 0.5)
        exam_days = np.random.randint(2, 60)
        engagement = np.random.uniform(0.2, 1.0)
        available_time = np.random.randint(10, 60)
        
        # Выбираем ресурс из каталога (может быть случайным или полу-релевантным для обучения)
        if np.random.random() < 0.5:
            # Выбираем ресурс по теме/предмету
            res_row = catalog[catalog['subject_name'] == sub_name].sample(1).iloc[0]
        else:
            res_row = catalog.sample(1).iloc[0]
            
        # Считаем логический relevance_score
        rel = 0.2 # Базовый
        
        # 1. Совпадение предмета и темы
        if res_row['subject_name'] == sub_name:
            rel += 0.2
            if res_row['topic_name'] == weak_topic:
                rel += 0.3
        
        # 2. Язык
        if res_row['language'] == pref_lang:
            rel += 0.1
        
        # 3. Тип контента
        if res_row['content_type'] == pref_type:
            rel += 0.1
            
        # 4. Сложность
        # Если тема очень слабая (high weak_prob), нужны более простые ресурсы
        target_diff = 2 if weak_prob > 0.8 else 3 if weak_prob > 0.6 else 4
        diff_gap = abs(res_row['difficulty_level'] - target_diff)
        rel += max(0, 0.1 - (diff_gap * 0.03))
        
        # 5. Время
        if res_row['estimated_minutes'] <= available_time:
            rel += 0.05
        
        # 6. Качество и популярность
        rel += (res_row['quality_score'] / 5.0) * 0.1
        rel += (res_row['popularity_score'] / 10.0) * 0.05
        
        # 7. Экзамен
        if exam_days < 14 and res_row['exam_focus'] == 1:
            rel += 0.1
            
        # 8. Grade range
        if res_row['grade_min'] <= grade_level <= res_row['grade_max']:
            rel += 0.05
        
        rel = np.clip(rel, 0, 1)
        
        # Добавляем немного шума
        rel += np.random.normal(0, 0.02)
        rel = np.clip(rel, 0, 1)
        
        row = {
            'student_id': f"STU_{i}",
            'grade_level': grade_level,
            'preferred_language': pref_lang,
            'preferred_content_type': pref_type,
            'subject_name': sub_name,
            'weak_topic_name': weak_topic,
            'weak_topic_probability': weak_prob,
            'topic_mastery_score': mastery,
            'exam_proximity_days': exam_days,
            'engagement_score': engagement,
            'available_study_minutes': available_time,
            
            'resource_id': res_row['resource_id'],
            'resource_subject_name': res_row['subject_name'],
            'resource_topic_name': res_row['topic_name'],
            'resource_difficulty_level': res_row['difficulty_level'],
            'resource_content_type': res_row['content_type'],
            'resource_estimated_minutes': res_row['estimated_minutes'],
            'resource_language': res_row['language'],
            'resource_quality_score': res_row['quality_score'],
            'resource_popularity_score': res_row['popularity_score'],
            'resource_exam_focus': res_row['exam_focus'],
            'resource_interactivity_score': res_row['interactivity_score'],
            
            # Рассчитанные признаки для модели (инженерные фичи)
            'subject_match': 1 if res_row['subject_name'] == sub_name else 0,
            'topic_match': 1 if res_row['topic_name'] == weak_topic else 0,
            'language_match': 1 if res_row['language'] == pref_lang else 0,
            'content_type_match': 1 if res_row['content_type'] == pref_type else 0,
            'difficulty_gap': diff_gap,
            'time_fit_score': 1 if res_row['estimated_minutes'] <= available_time else 0,
            
            'relevance_score': rel
        }
        data.append(row)
        
    return pd.DataFrame(data)

print("Генерация датасета взаимодействий...")
df_inter = generate_interaction_data(resource_catalog, 35000)
print(f"Датасет создан: {df_inter.shape[0]} строк")

# --- ЭТАП 3. Подготовка признаков ---

# Признаки для обучения
categorical_cols = [
    'grade_level', 'preferred_language', 'preferred_content_type', 
    'resource_content_type', 'resource_language'
]
numerical_cols = [
    'weak_topic_probability', 'topic_mastery_score', 'exam_proximity_days', 
    'engagement_score', 'available_study_minutes', 'resource_difficulty_level',
    'resource_estimated_minutes', 'resource_quality_score', 'resource_popularity_score',
    'resource_exam_focus', 'resource_interactivity_score', 'subject_match',
    'topic_match', 'language_match', 'content_type_match', 'difficulty_gap', 'time_fit_score'
]

# ColumnTransformer
preprocessor = ColumnTransformer([
    ('num', StandardScaler(), numerical_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
])

X = df_inter[numerical_cols + categorical_cols]
y = df_inter['relevance_score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Обучаем препроцессор
preprocessor.fit(X_train)
X_train_processed = preprocessor.transform(X_train)
X_test_processed = preprocessor.transform(X_test)

joblib.dump(preprocessor, 'resource_recommender_preprocessor.joblib')

# Информация о признаках
feature_info = {
    'numerical_cols': numerical_cols,
    'categorical_cols': categorical_cols
}
with open('resource_recommender_feature_columns.json', 'w', encoding='utf-8') as f:
    json.dump(feature_info, f, indent=4)

# --- ЭТАП 4. Обучение моделей ---

print("\nОбучение моделей регрессии...")

# 1. Линейная регрессия
lr = LinearRegression()
lr.fit(X_train_processed, y_train)
lr_preds = lr.predict(X_test_processed)

# 2. Random Forest
rf = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
rf.fit(X_train_processed, y_train)
rf_preds = rf.predict(X_test_processed)

# Метрики
def get_metrics(y_true, y_pred, name):
    return {
        'name': name,
        'mae': mean_absolute_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'r2': r2_score(y_true, y_pred)
    }

m_lr = get_metrics(y_test, lr_preds, 'LinearRegression')
m_rf = get_metrics(y_test, rf_preds, 'RandomForest')

print(f"LR Metrics: R2={m_lr['r2']:.4f}, RMSE={m_lr['rmse']:.4f}")
print(f"RF Metrics: R2={m_rf['r2']:.4f}, RMSE={m_rf['rmse']:.4f}")

# Выбор лучшей
if m_rf['r2'] > m_lr['r2'] + 0.01:
    best_model = rf
    best_name = "RandomForest"
    best_metrics = m_rf
else:
    best_model = lr
    best_name = "LinearRegression"
    best_metrics = m_lr

joblib.dump(best_model, 'resource_recommender_model.joblib')
print(f"\nВыбрана модель: {best_name}")

# --- ЭТАП 5. Интерпретация ---

plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
plt.hist(y, bins=30, color='skyblue', edgecolor='black')
plt.title("Распределение relevance_score")

plt.subplot(1, 2, 2)
if best_name == "RandomForest":
    feat_names = numerical_cols + list(preprocessor.named_transformers_['cat'].get_feature_names_out())
    importances = best_model.feature_importances_
    idx = np.argsort(importances)[-10:]
    plt.barh(range(10), importances[idx], color='green')
    plt.yticks(range(10), [feat_names[i] for i in idx])
    plt.title("Top 10 Feature Importances")
else:
    feat_names = numerical_cols + list(preprocessor.named_transformers_['cat'].get_feature_names_out())
    coefs = best_model.coef_
    idx = np.argsort(np.abs(coefs))[-10:]
    plt.barh(range(10), coefs[idx], color='orange')
    plt.yticks(range(10), [feat_names[i] for i in idx])
    plt.title("Top 10 Coefficients")

plt.tight_layout()
plt.show()

# --- ЭТАП 6. Функция рекомендаций ---

def recommend_resources(student_profile, resources_df, top_n=5):
    """
    Принимает профиль студента и каталог ресурсов, возвращает top_n рекомендаций.
    """
    # Создаем DataFrame для всех ресурсов с учетом контекста студента
    temp_df = resources_df.copy()
    
    # Добавляем данные студента к каждому ресурсу
    temp_df['grade_level'] = student_profile['grade_level']
    temp_df['preferred_language'] = student_profile['preferred_language']
    temp_df['preferred_content_type'] = student_profile['preferred_content_type']
    temp_df['weak_topic_probability'] = student_profile['weak_topic_probability']
    temp_df['topic_mastery_score'] = student_profile['topic_mastery_score']
    temp_df['exam_proximity_days'] = student_profile['exam_proximity_days']
    temp_df['engagement_score'] = student_profile['engagement_score']
    temp_df['available_study_minutes'] = student_profile['available_study_minutes']
    
    # Считаем инженерные фичи
    temp_df['subject_match'] = (temp_df['subject_name'] == student_profile['subject_name']).astype(int)
    temp_df['topic_match'] = (temp_df['topic_name'] == student_profile['weak_topic_name']).astype(int)
    temp_df['language_match'] = (temp_df['language'] == student_profile['preferred_language']).astype(int)
    temp_df['content_type_match'] = (temp_df['content_type'] == student_profile['preferred_content_type']).astype(int)
    
    # Целевой уровень сложности
    t_diff = 2 if student_profile['weak_topic_probability'] > 0.8 else 3 if student_profile['weak_topic_probability'] > 0.6 else 4
    temp_df['difficulty_gap'] = abs(temp_df['difficulty_level'] - t_diff)
    temp_df['time_fit_score'] = (temp_df['estimated_minutes'] <= student_profile['available_study_minutes']).astype(int)
    
    # Переименовываем колонки для препроцессора
    rename_dict = {
        'content_type': 'resource_content_type',
        'language': 'resource_language',
        'difficulty_level': 'resource_difficulty_level',
        'estimated_minutes': 'resource_estimated_minutes',
        'quality_score': 'resource_quality_score',
        'popularity_score': 'resource_popularity_score',
        'exam_focus': 'resource_exam_focus',
        'interactivity_score': 'resource_interactivity_score'
    }
    X_input = temp_df.rename(columns=rename_dict)
    
    # Важен порядок колонок как в обучении
    X_input = X_input[numerical_cols + categorical_cols]
    
    # Предсказание
    X_processed = preprocessor.transform(X_input)
    scores = best_model.predict(X_processed)
    
    temp_df['predicted_relevance_score'] = scores
    
    # Лейблы
    def get_label(s):
        if s >= 0.85: return "очень подходит"
        if s >= 0.70: return "подходит"
        if s >= 0.50: return "можно рекомендовать"
        return "слабое соответствие"
    
    temp_df['relevance_label_ru'] = temp_df['predicted_relevance_score'].apply(get_label)
    
    # Сортировка
    top_res = temp_df.sort_values(by='predicted_relevance_score', ascending=False).head(top_n)
    
    output = []
    for _, row in top_res.iterrows():
        output.append({
            "resource_id": row['resource_id'],
            "title_ru": row['title_ru'],
            "subject_name": row['subject_name'],
            "topic_name": row['topic_name'],
            "content_type": row['content_type'],
            "language": row['language'],
            "estimated_minutes": int(row['estimated_minutes']),
            "predicted_relevance_score": round(float(row['predicted_relevance_score']), 4),
            "relevance_label_ru": row['relevance_label_ru']
        })
        
    return output

# --- ЭТАП 7. Демонстрация ---

print("\n--- Демонстрация рекомендаций ---")

demo_profiles = [
    {
        "name": "Профиль 1: Слабость в Квадратных уравнениях",
        "profile": {
            "grade_level": 9,
            "preferred_language": "ru",
            "preferred_content_type": "video",
            "subject_name": "Математика",
            "weak_topic_name": "Квадратные уравнения",
            "weak_topic_probability": 0.85,
            "topic_mastery_score": 0.2,
            "exam_proximity_days": 30,
            "engagement_score": 0.7,
            "available_study_minutes": 25
        }
    },
    {
        "name": "Профиль 2: Проблема с Законами Ньютона (экзамен скоро)",
        "profile": {
            "grade_level": 10,
            "preferred_language": "ru",
            "preferred_content_type": "quiz",
            "subject_name": "Физика",
            "weak_topic_name": "Законы Ньютона",
            "weak_topic_probability": 0.7,
            "topic_mastery_score": 0.35,
            "exam_proximity_days": 5,
            "engagement_score": 0.9,
            "available_study_minutes": 15
        }
    },
    {
        "name": "Профиль 3: Клеточное деление (Английский приоритет)",
        "profile": {
            "grade_level": 11,
            "preferred_language": "en",
            "preferred_content_type": "article",
            "subject_name": "Биология",
            "weak_topic_name": "Клеточное деление",
            "weak_topic_probability": 0.6,
            "topic_mastery_score": 0.4,
            "exam_proximity_days": 45,
            "engagement_score": 0.5,
            "available_study_minutes": 40
        }
    }
]

for demo in demo_profiles:
    print(f"\n{demo['name']}:")
    recs = recommend_resources(demo['profile'], resource_catalog, top_n=3)
    print(json.dumps(recs, ensure_ascii=False, indent=4))

# --- ЭТАП 8. Экспорт файлов ---

label_map = {
    "relevance_labels": {
        "very_high": "очень подходит",
        "high": "подходит",
        "medium": "можно рекомендовать",
        "low": "слабое соответствие"
    },
    "content_types": ["video", "quiz", "article", "practice", "summary", "flashcards"],
    "languages": ["ru", "en", "kz"]
}

with open('resource_recommender_label_map.json', 'w', encoding='utf-8') as f:
    json.dump(label_map, f, ensure_ascii=False, indent=4)

print("\n--- Финализация ---")
print(f"Выбранная модель: {best_name}")
print(f"Метрики (R2): {best_metrics['r2']:.4f}")
print(f"Ресурсов в каталоге: {len(resource_catalog)}")
print("Файлы сохранены:")
print("- resource_catalog.csv")
print("- resource_recommender_model.joblib")
print("- resource_recommender_preprocessor.joblib")
print("- resource_recommender_feature_columns.json")
print("- resource_recommender_label_map.json")
