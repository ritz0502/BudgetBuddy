from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'models/classifier.joblib'
model = None


def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully")
    else:
        print("WARNING: No model found. Run train.py first.")


load_model()


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})


@app.route('/classify', methods=['POST'])
def classify():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    description = data.get('description', '').strip()

    if not description:
        return jsonify({'error': 'Description required'}), 400

    probabilities = model.predict_proba([description])[0]
    classes = model.classes_
    top_idx = probabilities.argmax()
    category = classes[top_idx]
    confidence = round(float(probabilities[top_idx]), 3)

    return jsonify({'category': category, 'confidence': confidence})


@app.route('/retrain', methods=['POST'])
def retrain():
    """Receives corrections, appends to CSV, retrains the model."""
    corrections = request.get_json().get('corrections', [])
    if not corrections:
        return jsonify({'message': 'No corrections provided'}), 400

    import pandas as pd
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.pipeline import Pipeline

    df_existing = pd.read_csv('data/training_data.csv')
    df_new = pd.DataFrame(corrections)  # [{description, category}]
    df_combined = pd.concat([df_existing, df_new], ignore_index=True).drop_duplicates()
    df_combined.to_csv('data/training_data.csv', index=False)

    # Retrain
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4), lowercase=True)),
        ('clf', MultinomialNB(alpha=0.1))
    ])
    pipeline.fit(df_combined['description'], df_combined['category'])
    joblib.dump(pipeline, MODEL_PATH)

    global model
    model = pipeline

    return jsonify({
        'message': f'Retrained on {len(df_combined)} samples',
        'newSamples': len(corrections)
    })

from predictor.predictor import predictor_bp
app.register_blueprint(predictor_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
