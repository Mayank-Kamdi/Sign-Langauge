import sqlite3
import json
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix
import os

# Helper: Calculate distance in 3D
def get_distance(a, b):
    return np.sqrt((a['x'] - b['x'])**2 + (a['y'] - b['y'])**2 + (a['z'] - b['z'])**2)

# Helper: Calculate joint angle between 3 points: A -> B -> C (angle at B)
def calculate_joint_angle(a, b, c):
    v1 = np.array([a['x'] - b['x'], a['y'] - b['y'], a['z'] - b['z']])
    v2 = np.array([c['x'] - b['x'], c['y'] - b['y'], c['z'] - b['z']])
    
    dot_product = np.dot(v1, v2)
    mag1 = np.linalg.norm(v1)
    mag2 = np.linalg.norm(v2)
    
    if mag1 * mag2 == 0:
        return 180.0
        
    cos_theta = dotProduct = dot_product / (mag1 * mag2)
    cos_theta = np.clip(cos_theta, -1.0, 1.0)
    return np.degrees(np.arccos(cos_theta))

def load_data_from_db():
    db_path = os.path.join("backend", "signverse.db")
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}.")
        return None, None

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT sign_name, landmarks FROM dataset_samples")
        rows = cursor.fetchall()
    except Exception as e:
        print("Error fetching records: Make sure dataset collection table exists.", e)
        return None, None
    finally:
        conn.close()

    if not rows:
        print("No training samples found in the database. Please collect landmark dataset samples first.")
        return None, None

    X = []
    y = []
    
    for label, landmarks_json in rows:
        try:
            landmarks = json.loads(landmarks_json)
            if len(landmarks) != 21:
                continue
                
            # 1. Raw features (63 dimensions)
            features = []
            for lm in landmarks:
                features.extend([lm['x'], lm['y'], lm['z']])
                
            # 2. Engineered features: flex angles (5 dimensions)
            t_angle = calculate_joint_angle(landmarks[1], landmarks[2], landmarks[4])
            i_angle = calculate_joint_angle(landmarks[5], landmarks[6], landmarks[8])
            m_angle = calculate_joint_angle(landmarks[9], landmarks[10], landmarks[12])
            r_angle = calculate_joint_angle(landmarks[13], landmarks[14], landmarks[16])
            p_angle = calculate_joint_angle(landmarks[17], landmarks[18], landmarks[20])
            features.extend([t_angle, i_angle, m_angle, r_angle, p_angle])
            
            # 3. Distance features: Hand spread
            spread = get_distance(landmarks[4], landmarks[20])
            features.append(spread)
            
            X.append(features)
            y.append(label)
        except Exception as ex:
            continue

    return np.array(X), np.array(y)

def main():
    print("Initializing Landmark-Based Machine Learning training pipeline...")
    X, y = load_data_from_db()
    
    if X is None or len(X) < 10:
        print("\nNote: Insufficient dataset size to fit models. Generating artificial calibration profile...")
        # Synthesize calibration dataset for demonstration if DB is empty
        signs = ["Hello", "Thank You", "Yes", "No", "Please", "Sorry"]
        X = np.random.randn(120, 69) # 63 coordinates + 5 angles + 1 spread
        y = np.random.choice(signs, 120)
    
    print(f"Loaded {len(X)} samples with {X.shape[1]} features.")

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # Configure models
    models = {
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "Support Vector Machine": SVC(kernel='rbf', probability=True, random_state=42),
        "Multi-Layer Perceptron (MLP)": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    }

    # Evaluate each model
    for name, clf in models.items():
        print(f"\n==========================================")
        print(f"Training: {name} Classifier")
        print(f"==========================================")
        
        # Train
        clf.fit(X_train, y_train)
        
        # Test predictions
        predictions = clf.predict(X_test)
        
        # Accuracies
        cv_scores = cross_val_score(clf, X, y, cv=3)
        
        print(f"Mean Cross-Validation Accuracy (3-fold): {cv_scores.mean() * 100:.2f}%")
        print("\nClassification Metrics:")
        print(classification_report(y_test, predictions, zero_division=0))
        
        print("Confusion Matrix:")
        print(confusion_matrix(y_test, predictions))

if __name__ == "__main__":
    main()
