from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import sqlite3
import pickle
import datetime
import os
import asyncio

app = FastAPI(title="AI Backend for Financial Transaction DApp")

DATABASE = os.path.join("..", "database", "transactions.db")
MODEL_PATH = os.path.join("models", "model.pkl")

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            prediction TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
except Exception as e:
    raise Exception(f"Error loading model: {e}")

class TransactionInput(BaseModel):
    amount: float

@app.post("/predict")
async def predict_transaction(tx: TransactionInput):
    if tx.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    prediction = model.predict([[tx.amount]])
    result = "fraudulent" if prediction[0] == 1 else "legitimate"
    timestamp = datetime.datetime.now().isoformat()
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO transactions (amount, prediction, timestamp) VALUES (?, ?, ?)",
                   (tx.amount, result, timestamp))
    conn.commit()
    conn.close()
    return {"amount": tx.amount, "prediction": result, "timestamp": timestamp}

@app.get("/transactions")
async def get_transactions():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    transactions = [{"id": row[0], "amount": row[1], "prediction": row[2], "timestamp": row[3]} for row in rows]
    return {"transactions": transactions}

async def monitor_blockchain():
    while True:
        # In a real implementation, integrate with web3.py to listen for events.
        # Here, we simulate a dummy transaction every 30 seconds.
        dummy_amount = 100.0
        dummy_prediction = model.predict([[dummy_amount]])[0]
        result = "fraudulent" if dummy_prediction == 1 else "legitimate"
        timestamp = datetime.datetime.now().isoformat()
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO transactions (amount, prediction, timestamp) VALUES (?, ?, ?)",
                       (dummy_amount, result, timestamp))
        conn.commit()
        conn.close()
        print(f"Background: Logged dummy transaction at {timestamp}")
        await asyncio.sleep(30)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_blockchain())
