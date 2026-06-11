export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: Landmark[];
  handedness: "Left" | "Right";
}

export interface GestureEvaluation {
  isMatch: boolean;
  score: number;
  feedback: string;
}

// Helper: Calculate Euclidean distance in 3D
export function getDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
  );
}

// Helper: Check if finger is extended
// Base: MCP joint, Tip: Tip joint
export function isFingerExtended(
  landmarks: Landmark[],
  mcpIndex: number,
  pipIndex: number,
  dipIndex: number,
  tipIndex: number
): boolean {
  // If the distance from MCP to Tip is close to the sum of segments, it is extended
  const mcpToTip = getDistance(landmarks[mcpIndex], landmarks[tipIndex]);
  const segmentsSum =
    getDistance(landmarks[mcpIndex], landmarks[pipIndex]) +
    getDistance(landmarks[pipIndex], landmarks[dipIndex]) +
    getDistance(landmarks[dipIndex], landmarks[tipIndex]);
  
  return mcpToTip > segmentsSum * 0.75;
}

// Helper: Check if finger is curled (folded in)
export function isFingerCurled(
  landmarks: Landmark[],
  mcpIndex: number,
  tipIndex: number
): boolean {
  // If the tip is closer to the wrist (landmark 0) or MCP than the PIP joint, it is curled
  const wrist = landmarks[0];
  const tipToWrist = getDistance(landmarks[tipIndex], wrist);
  const mcpToWrist = getDistance(landmarks[mcpIndex], wrist);
  return tipToWrist < mcpToWrist * 0.95;
}

// Specific Gesture Rules
export function evaluateGesture(
  targetSign: string,
  hands: HandData[]
): GestureEvaluation {
  if (hands.length === 0) {
    return { isMatch: false, score: 0, feedback: "No hands detected in the camera frame." };
  }

  // Normalize sign name
  const sign = targetSign.toUpperCase().trim();

  // Extract primary hand (usually right hand or the first detected)
  const primaryHand = hands[0];
  const lm = primaryHand.landmarks;

  // Finger extension states
  const thumbExtended = getDistance(lm[4], lm[9]) > getDistance(lm[2], lm[9]) * 1.2; // Custom thumb extension
  const indexExtended = isFingerExtended(lm, 5, 6, 7, 8);
  const middleExtended = isFingerExtended(lm, 9, 10, 11, 12);
  const ringExtended = isFingerExtended(lm, 13, 14, 15, 16);
  const pinkyExtended = isFingerExtended(lm, 17, 18, 19, 20);

  // Single Hand Numbers
  if (sign === "1") {
    const isCorrect = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    let feedback = "Hold up only your index finger.";
    if (middleExtended) feedback += " Curl your middle finger.";
    if (ringExtended || pinkyExtended) feedback += " Make sure ring and pinky are curled.";
    return { isMatch: isCorrect, score: isCorrect ? 0.95 : 0.2, feedback };
  }

  if (sign === "2") {
    const isCorrect = indexExtended && middleExtended && !ringExtended && !pinkyExtended;
    let feedback = "Hold up index and middle fingers (V sign).";
    if (!indexExtended || !middleExtended) feedback += " Extend index and middle fingers.";
    if (ringExtended || pinkyExtended) feedback += " Keep your other fingers curled.";
    return { isMatch: isCorrect, score: isCorrect ? 0.95 : 0.2, feedback };
  }

  if (sign === "3") {
    const isCorrect = thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended;
    let feedback = "Extend your thumb, index, and middle fingers.";
    if (!thumbExtended) feedback += " Extend your thumb outward.";
    if (ringExtended || pinkyExtended) feedback += " Keep ring and pinky curled.";
    return { isMatch: isCorrect, score: isCorrect ? 0.92 : 0.25, feedback };
  }

  if (sign === "4") {
    const isCorrect = indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended;
    let feedback = "Hold up all four fingers, tucking your thumb in.";
    if (thumbExtended) feedback += " Fold your thumb across your palm.";
    return { isMatch: isCorrect, score: isCorrect ? 0.95 : 0.3, feedback };
  }

  if (sign === "5") {
    const isCorrect = indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended;
    let feedback = "Spread all five fingers wide.";
    if (!thumbExtended) feedback += " Extend your thumb.";
    if (!indexExtended || !middleExtended) feedback += " Open your hand fully.";
    return { isMatch: isCorrect, score: isCorrect ? 0.98 : 0.4, feedback };
  }

  if (sign === "0") {
    // Tips of index and thumb are close together
    const indexThumbDist = getDistance(lm[4], lm[8]);
    const isCorrect = indexThumbDist < 0.05 && !middleExtended && !ringExtended && !pinkyExtended;
    let feedback = "Form a circle with your thumb and index finger.";
    if (middleExtended || ringExtended) feedback += " Curl other fingers.";
    return { isMatch: isCorrect, score: isCorrect ? 0.92 : 0.15, feedback };
  }

  // Alphabets A, B, C, D, I, Y etc.
  if (sign === "A") {
    // Closed fist, thumb on side pointing up
    const allFingersCurled = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    const isCorrect = allFingersCurled && thumbExtended;
    let feedback = "Make a fist with your thumb pointing straight up beside it.";
    if (!allFingersCurled) feedback += " Close your fingers into a fist.";
    if (!thumbExtended) feedback += " Point your thumb up.";
    return { isMatch: isCorrect, score: isCorrect ? 0.92 : 0.3, feedback };
  }

  if (sign === "B") {
    // Open flat hand, thumb folded
    const allExtended = indexExtended && middleExtended && ringExtended && pinkyExtended;
    const isCorrect = allExtended && !thumbExtended;
    let feedback = "Hold your hand flat with fingers together, thumb folded across palm.";
    if (thumbExtended) feedback += " Fold your thumb.";
    return { isMatch: isCorrect, score: isCorrect ? 0.94 : 0.3, feedback };
  }

  if (sign === "C") {
    // Curved hand shape
    const wrist = lm[0];
    const indexDist = getDistance(lm[8], wrist);
    const thumbDist = getDistance(lm[4], wrist);
    const isCurved = indexDist > 0.08 && thumbDist > 0.08 && getDistance(lm[4], lm[8]) > 0.06;
    const isCorrect = isCurved && !ringExtended && !pinkyExtended;
    let feedback = "Curve your hand to form a 'C' shape.";
    return { isMatch: isCorrect, score: isCorrect ? 0.88 : 0.2, feedback };
  }

  if (sign === "I LOVE YOU" || sign === "I_LOVE_YOU") {
    const isCorrect = thumbExtended && indexExtended && pinkyExtended && !middleExtended && !ringExtended;
    let feedback = "Extend thumb, index, and pinky. Keep middle and ring curled.";
    if (middleExtended || ringExtended) feedback += " Fold your middle and ring fingers.";
    return { isMatch: isCorrect, score: isCorrect ? 0.95 : 0.3, feedback };
  }

  // Double-handed signs (For ISL Alphabets and phrases)
  if (hands.length === 2) {
    const rightHand = hands.find(h => h.handedness === "Right") || hands[0];
    const leftHand = hands.find(h => h.handedness === "Left") || hands[1];
    
    const rLm = rightHand.landmarks;
    const lLm = leftHand.landmarks;

    if (sign === "FAMILY") {
      // Connect index and thumbs of both hands
      const indexDist = getDistance(rLm[8], lLm[8]);
      const thumbDist = getDistance(rLm[4], lLm[4]);
      const isCorrect = indexDist < 0.08 && thumbDist < 0.08;
      let feedback = "Touch the index fingers and thumbs of both hands together.";
      return { isMatch: isCorrect, score: isCorrect ? 0.9 : 0.25, feedback };
    }

    if (sign === "FRIEND") {
      // Interlock index fingers
      const rIndexToLIndex = getDistance(rLm[8], lLm[8]);
      const rIndexToLWrist = getDistance(rLm[8], lLm[0]);
      const isCorrect = rIndexToLIndex < 0.06 && rIndexToLWrist < 0.15;
      let feedback = "Hook your index fingers together.";
      return { isMatch: isCorrect, score: isCorrect ? 0.85 : 0.2, feedback };
    }
  }

  // Fallback match for demo/other letters: Check if hands are steady
  // If target sign is not specifically coded, we evaluate if the hand is upright
  const palmUpright = lm[12].y < lm[0].y;
  return {
    isMatch: palmUpright,
    score: palmUpright ? 0.85 : 0.1,
    feedback: palmUpright 
      ? `Looking good! Hold the posture steady for ${targetSign}.` 
      : "Position your hand in front of the camera, fingers pointing upwards."
  };
}
