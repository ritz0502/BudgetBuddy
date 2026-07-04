import pandas as pd
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

df = pd.read_csv('data/training_data.csv')
# CSV columns: description, category

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4), lowercase=True)),
    ('clf', MultinomialNB(alpha=0.1))
])

X_train, X_test, y_train, y_test = train_test_split(
    df['description'], df['category'], test_size=0.2, random_state=42
)
pipeline.fit(X_train, y_train)
print(f"Accuracy: {accuracy_score(y_test, pipeline.predict(X_test)):.2%}")

os.makedirs('models', exist_ok=True)
joblib.dump(pipeline, 'models/classifier.joblib')
print("Model saved to models/classifier.joblib")
