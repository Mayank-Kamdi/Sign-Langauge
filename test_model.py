import os
import cv2
import numpy as np
import random
from tensorflow.keras.models import load_model

def find_dataset_root():
    possible_roots = [
        os.path.join("input", "leapGestRecog"),
        os.path.join("input", "leapgestrecog", "leapGestRecog"),
    ]
    for r in possible_roots:
        if os.path.exists(r):
            if os.path.exists(os.path.join(r, "00")):
                return r
    if os.path.exists("input"):
        for root, dirs, files in os.walk("input"):
            if "leapGestRecog" in dirs:
                candidate = os.path.join(root, "leapGestRecog")
                if os.path.exists(os.path.join(candidate, "00")):
                    return candidate
    return None

def main():
    model_path = "./hand_gesture_model.keras"
    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found. Please train the model first.")
        return

    print("Loading model...")
    model = load_model(model_path)
    print("Model loaded successfully.")

    dataset_root = find_dataset_root()
    if not dataset_root:
        print("Error: Could not locate dataset folder.")
        return

    # Categories based on folder names in 00
    subdirs = sorted(os.listdir(os.path.join(dataset_root, '00')))
    categories = [d for d in subdirs if not d.startswith('.')]
    print(f"Model Categories: {categories}")

    # Gather all image paths grouped by category
    all_images = []
    for i in range(10):
        folder_name = f"0{i}"
        folder_path = os.path.join(dataset_root, folder_name)
        if not os.path.exists(folder_path):
            continue
        for category_name in categories:
            gesture_path = os.path.join(folder_path, category_name)
            if not os.path.exists(gesture_path):
                continue
            for img_name in os.listdir(gesture_path):
                if img_name.startswith('.'):
                    continue
                all_images.append((os.path.join(gesture_path, img_name), category_name))

    if not all_images:
        print("No images found for testing.")
        return

    print(f"Found {len(all_images)} total images. Selecting 5 random samples to test prediction...")
    samples = random.sample(all_images, 5)

    IMG_SIZE = 150
    correct = 0

    print("\n--- Running Predictions ---")
    for idx, (img_path, true_label) in enumerate(samples):
        # Load and preprocess image
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            print(f"Failed to read image: {img_path}")
            continue

        img_resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        img_normalized = img_resized.astype('float32') / 255.0
        img_input = img_normalized.reshape(1, IMG_SIZE, IMG_SIZE, 1)

        # Predict
        prediction = model.predict(img_input, verbose=0)
        predicted_idx = np.argmax(prediction[0])
        predicted_label = categories[predicted_idx]
        confidence = prediction[0][predicted_idx] * 100

        status = "CORRECT" if predicted_label == true_label else "INCORRECT"
        if predicted_label == true_label:
            correct += 1

        print(f"Sample {idx+1}:")
        print(f"  Image: {os.path.basename(img_path)}")
        print(f"  True Label:      {true_label}")
        print(f"  Predicted Label: {predicted_label} ({confidence:.2f}% confidence)")
        print(f"  Status:          {status}")
        print("-" * 30)

    print(f"\nResult: {correct}/5 samples predicted correctly ({correct/5 * 100:.1f}% accuracy on random test).")

if __name__ == "__main__":
    main()
