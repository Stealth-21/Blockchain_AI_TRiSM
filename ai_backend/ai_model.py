import os
import logging
import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Define file paths
data_dir = os.path.join("..", "data")
os.makedirs(data_dir, exist_ok=True)
data_path = os.path.join(data_dir, "transactions.csv")
model_dir = os.path.join("models")
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, "model.pkl")
results_path = os.path.join(model_dir, "grid_results.csv")

# Load dataset if available, else generate synthetic data
if os.path.exists(data_path):
    df = pd.read_csv(data_path)
    logging.info(f"Loaded data from {data_path} with shape: {df.shape}")
else:
    # Generate synthetic dataset: 500 samples, 15% fraudulent transactions
    np.random.seed(42)
    df = pd.DataFrame({
        'amount': np.random.randint(100, 10000, size=500),
        'is_fraudulent': np.random.choice([0, 1], size=500, p=[0.85, 0.15])
    })
    logging.info("Generated synthetic dataset with 500 samples.")

# Prepare features and target
X = df[['amount']]
y = df['is_fraudulent']

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
logging.info(f"Training samples: {X_train.shape[0]}, Testing samples: {X_test.shape[0]}")

# Create a pipeline: scaling followed by RandomForest
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(random_state=42))
])

# Hyperparameter tuning using GridSearchCV
param_grid = {
    'clf__n_estimators': [50, 100, 200],
    'clf__max_depth': [None, 10, 20],
    'clf__min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_
logging.info("Best Parameters: " + str(grid_search.best_params_))

# Evaluate the model
y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
conf_matrix = confusion_matrix(y_test, y_pred)
class_report = classification_report(y_test, y_pred)
logging.info(f"Test Accuracy: {accuracy:.4f}")
logging.info("Confusion Matrix:\n" + str(conf_matrix))
logging.info("Classification Report:\n" + class_report)

# Save the best model and grid search results
with open(model_path, "wb") as model_file:
    pickle.dump(best_model, model_file)
logging.info(f"Model saved at: {model_path}")

pd.DataFrame(grid_search.cv_results_).to_csv(results_path, index=False)
logging.info(f"Grid search results saved at: {results_path}")
