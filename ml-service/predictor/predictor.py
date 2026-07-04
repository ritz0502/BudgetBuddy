from flask import Blueprint, request, jsonify
from sklearn.linear_model import LinearRegression
import datetime

predictor_bp = Blueprint('predictor_bp', __name__)

@predictor_bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'transactions' not in data:
            return jsonify({"predictions": [], "error": "Missing transactions data"}), 400

        transactions = data['transactions']
        
        # Group incoming transactions by category
        grouped_data = {}
        for tx in transactions:
            category = tx.get('category')
            month = tx.get('month')
            year = tx.get('year')
            amount = tx.get('amount')
            
            if not all([category, month, year, amount is not None]):
                continue
                
            if category not in grouped_data:
                grouped_data[category] = []
                
            grouped_data[category].append({
                "month": month,
                "year": year,
                "amount": amount
            })
            
        predictions = []
        
        for category, txs in grouped_data.items():
            # Sort chronologically
            sorted_txs = sorted(txs, key=lambda x: (x['year'], x['month']))
            
            # Need at least 2 distinct months to train regression
            if len(sorted_txs) < 2:
                continue
                
            # X = [[1], [2], [3]], y = [amounts]
            X = [[i + 1] for i in range(len(sorted_txs))]
            y = [tx['amount'] for tx in sorted_txs]
            
            last_month_actual = y[-1]
            
            # Train regression
            model = LinearRegression()
            model.fit(X, y)
            
            # Predict next month (n+1)
            next_idx = [[len(sorted_txs) + 1]]
            predicted_amount = round(float(model.predict(next_idx)[0]))
            
            # Prevent negative predictions
            if predicted_amount < 0:
                predicted_amount = 0
                
            # Determine trend
            if predicted_amount > last_month_actual * 1.05:
                trend = "increasing"
            elif predicted_amount < last_month_actual * 0.95:
                trend = "decreasing"
            else:
                trend = "stable"
                
            predictions.append({
                "category": category,
                "predictedAmount": predicted_amount,
                "lastMonthActual": last_month_actual,
                "trend": trend,
                "dataPoints": len(sorted_txs)
            })
            
        # Log successful prediction training to console
        print(f"Spend predictor successfully trained for {len(predictions)} categories.")
        for p in predictions:
            print(f" - {p['category']} (Points: {p['dataPoints']}) -> Predicted: {p['predictedAmount']}")
            
        return jsonify({
            "predictions": predictions,
            "generatedAt": datetime.datetime.utcnow().isoformat() + "Z"
        })
        
    except Exception as e:
        print(f"Predictor error: {str(e)}")
        return jsonify({"predictions": [], "error": str(e)}), 200 # Never throw 500
