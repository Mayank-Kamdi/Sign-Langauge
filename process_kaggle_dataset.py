import os
import sqlite3
import json
import kagglehub
import cv2
import urllib.request
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import sys

def main():
    print("Step 1: Downloading dataset from Kaggle...", flush=True)
    # Download dataset
    dataset_path = kagglehub.dataset_download("ahmedkhanak1995/sign-language-gesture-images-dataset")
    print(f"Dataset downloaded to: {dataset_path}", flush=True)

    # Inspect dataset folders
    print("Scanning dataset directories...", flush=True)
    image_paths = []
    
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                # The label is typically the folder name containing the image
                label = os.path.basename(root).upper().strip()
                # Ensure the label is a valid sign (A-Z, etc.)
                if len(label) == 1 and label.isalpha():
                    image_paths.append((os.path.join(root, file), label))

    print(f"Found {len(image_paths)} image files matching alphabets A-Z.", flush=True)
    if not image_paths:
        print("No valid A-Z directory structure found.", flush=True)
        return

    # Download MediaPipe task model if not present
    model_url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    model_path = "hand_landmarker.task"
    if not os.path.exists(model_path):
        print("Downloading hand_landmarker.task model...", flush=True)
        urllib.request.urlretrieve(model_url, model_path)
    
    # Initialize modern MediaPipe HandLandmarker
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=1)
    detector = vision.HandLandmarker.create_from_options(options)

    # Connect to database
    db_path = os.path.join("backend", "signverse.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dataset_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sign_name TEXT NOT NULL,
            user_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            handedness TEXT NOT NULL,
            landmarks TEXT NOT NULL,
            session_number INTEGER DEFAULT 1
        )
    """)
    conn.commit()

    print("Step 2: Processing images and extracting landmarks...", flush=True)
    processed_count = 0
    extracted_count = 0

    # Limit to maximum 80 samples per letter to keep it fast but extremely accurate
    max_samples_per_letter = 80
    letter_counts = {chr(i): 0 for i in range(65, 91)}

    # Shuffle to get diverse samples
    np.random.seed(42)
    np.random.shuffle(image_paths)

    for img_path, label in image_paths:
        # Check if we have collected enough samples for all letters
        if all(count >= max_samples_per_letter for count in letter_counts.values()):
            print("Collected target samples for all letters A-Z. Stopping early!", flush=True)
            break

        if letter_counts.get(label, 0) >= max_samples_per_letter:
            continue

        processed_count += 1
        if processed_count % 50 == 0:
            print(f"Processed {processed_count} images... Extracted {extracted_count} landmarks.", flush=True)

        # Read image using OpenCV
        image_bgr = cv2.imread(img_path)
        if image_bgr is None:
            continue

        # Convert to 3-channel RGB
        if len(image_bgr.shape) == 2:
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_GRAY2RGB)
        else:
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        # Wrap in MediaPipe Image format
        try:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        except Exception as e:
            continue

        # Run Hand Landmarker
        result = detector.detect(mp_image)

        if result.hand_landmarks:
            for hand_landmarks, handedness in zip(result.hand_landmarks, result.handedness):
                # Extract landmarks list
                landmarks_list = []
                for lm in hand_landmarks:
                    landmarks_list.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z
                    })
                
                # Handedness label
                hand_label = handedness[0].category_name if (handedness and len(handedness) > 0) else "Right"
                
                # Serialize landmarks
                serialized_landmarks = json.dumps(landmarks_list)
                
                # Insert into DB
                cursor.execute("""
                    INSERT INTO dataset_samples (sign_name, user_id, handedness, landmarks, session_number)
                    VALUES (?, ?, ?, ?, ?)
                """, (label, "kaggle_dataset", hand_label, serialized_landmarks, 1))
                
                extracted_count += 1
                letter_counts[label] += 1
                
                # Commit every 20 insertions
                if extracted_count % 20 == 0:
                    conn.commit()
                break # Only process one hand per image

    conn.commit()
    conn.close()

    print("==================================================", flush=True)
    print(f"Processing Complete! Extracted {extracted_count} hand landmark samples.", flush=True)
    print(f"Data successfully saved to database: {db_path}", flush=True)
    print("==================================================", flush=True)

if __name__ == "__main__":
    main()
