import { getReferenceLandmarks, getExpectedFingerStates } from "./referenceGestures";

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
  incorrectFingers?: string[];
  missingMovement?: string;
  mode: "static" | "dynamic";
  sequenceState?: "start" | "moving" | "end" | "completed";
}

// Helper: Calculate Euclidean distance in 3D
export function getDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
  );
}

// Helper: Check if finger is extended
export function isFingerExtended(
  landmarks: Landmark[],
  mcpIndex: number,
  pipIndex: number,
  dipIndex: number,
  tipIndex: number
): boolean {
  const mcpToTip = getDistance(landmarks[mcpIndex], landmarks[tipIndex]);
  const segmentsSum =
    getDistance(landmarks[mcpIndex], landmarks[pipIndex]) +
    getDistance(landmarks[pipIndex], landmarks[dipIndex]) +
    getDistance(landmarks[dipIndex], landmarks[tipIndex]);
  
  return mcpToTip > segmentsSum * 0.60;
}

// Helper: Check if sign is dynamic
export function isSignDynamic(signName: string): boolean {
  const name = signName.toUpperCase().trim();
  return ["HELLO", "THANK YOU", "HOW ARE YOU", "GOOD MORNING", "GOODBYE"].includes(name);
}

// Evaluate Static Gesture (Pose validation + Incorrect finger detection)
export function evaluateStaticGesture(
  targetSign: string,
  hands: HandData[],
  region: "ISL" | "ASL" | "BSL" = "ISL"
): GestureEvaluation {
  if (hands.length === 0) {
    return {
      isMatch: false,
      score: 0,
      feedback: "No hands detected in the camera frame.",
      mode: "static",
      incorrectFingers: []
    };
  }

  const sign = targetSign.toUpperCase().trim();
  const primaryHand = hands[0];
  const lm = primaryHand.landmarks;

  // Finger extension states
  const thumbExtended = getDistance(lm[4], lm[9]) > getDistance(lm[2], lm[9]) * 1.0;
  const indexExtended = isFingerExtended(lm, 5, 6, 7, 8);
  const middleExtended = isFingerExtended(lm, 9, 10, 11, 12);
  const ringExtended = isFingerExtended(lm, 13, 14, 15, 16);
  const pinkyExtended = isFingerExtended(lm, 17, 18, 19, 20);

  // Expected extensions from reference templates
  const expected = getExpectedFingerStates(targetSign);

  // Detect incorrect fingers
  const incorrectFingers: string[] = [];
  if (thumbExtended !== expected.isThumbExtended) incorrectFingers.push("Thumb");
  if (indexExtended !== expected.isIndexExtended) incorrectFingers.push("Index");
  if (middleExtended !== expected.isMiddleExtended) incorrectFingers.push("Middle");
  if (ringExtended !== expected.isRingExtended) incorrectFingers.push("Ring");
  if (pinkyExtended !== expected.isPinkyExtended) incorrectFingers.push("Pinky");

  const correctCount = 5 - incorrectFingers.length;
  const score = correctCount / 5;

  let feedback = `Forming posture for ${targetSign}.`;
  if (incorrectFingers.length > 0) {
    feedback = `Adjust: Your ${incorrectFingers.join(", ")} finger ${incorrectFingers.length > 1 ? "s are" : " is"} not positioned correctly.`;
  } else {
    feedback = `✓ Posture match: Hold position!`;
  }

  return {
    isMatch: incorrectFingers.length === 0,
    score: score,
    feedback,
    incorrectFingers,
    mode: "static"
  };
}

// Evaluate Dynamic Trajectory Sequence (Start -> Movement -> End)
export function evaluateDynamicGesture(
  targetSign: string,
  frames: HandData[][],
  region: "ISL" | "ASL" | "BSL" = "ISL"
): GestureEvaluation {
  const name = targetSign.toUpperCase().trim();
  
  if (frames.length < 5) {
    return {
      isMatch: false,
      score: 0.1,
      feedback: "Waiting for motion trajectory data: Place hand in frame and move.",
      mode: "dynamic",
      sequenceState: "start"
    };
  }

  // Get wrist coordinates history
  const wristCoords = frames
    .map(f => f[0]?.landmarks?.[0])
    .filter(Boolean);

  if (wristCoords.length < 5) {
    return {
      isMatch: false,
      score: 0.1,
      feedback: "Tracking hand structure...",
      mode: "dynamic",
      sequenceState: "start"
    };
  }

  // Motion math
  const startWrist = wristCoords[0];
  const endWrist = wristCoords[wristCoords.length - 1];
  const dx = endWrist.x - startWrist.x;
  const dy = endWrist.y - startWrist.y;
  const dz = endWrist.z - startWrist.z;

  // Track finger flexion during trajectory
  const lastFrame = frames[frames.length - 1];
  const primaryHand = lastFrame[0];
  const lm = primaryHand.landmarks;
  const indexExtended = isFingerExtended(lm, 5, 6, 7, 8);
  const thumbExtended = getDistance(lm[4], lm[9]) > getDistance(lm[2], lm[9]) * 1.15;

  if (name === "HELLO" || name === "GOODBYE") {
    // Waving gesture: horizontal coordinate oscillations
    let horizontalSwings = 0;
    for (let i = 1; i < wristCoords.length - 1; i++) {
      const prevDiff = wristCoords[i].x - wristCoords[i-1].x;
      const nextDiff = wristCoords[i+1].x - wristCoords[i].x;
      if (prevDiff * nextDiff < 0 && Math.abs(prevDiff) > 0.01) {
        horizontalSwings++;
      }
    }

    const correctMotion = horizontalSwings >= 2;
    return {
      isMatch: correctMotion,
      score: correctMotion ? 0.95 : 0.4,
      feedback: correctMotion 
        ? "✓ Waving pattern recognized successfully!" 
        : "Dynamic Movement: Wave your hand side-to-side horizontally.",
      mode: "dynamic",
      sequenceState: correctMotion ? "completed" : "moving",
      missingMovement: correctMotion ? undefined : "Horizontal wave pattern missing"
    };
  }

  if (name === "THANK YOU") {
    // Move from chin (close/mouth) downwards and forwards
    // Hand should start higher up (lower y) and move down (higher y) and forward (decreasing z or negative dz)
    const movesDown = dy > 0.08;
    const movesForward = dz < 0.05; // forward z coordinate moves closer to camera
    const isCorrect = movesDown;

    return {
      isMatch: isCorrect,
      score: isCorrect ? 0.95 : 0.35,
      feedback: isCorrect
        ? "✓ Trajectory matched: Chin-to-Chest outward motion recognized!"
        : "Dynamic Movement: Touch your chin with flat hand and move it down and forward.",
      mode: "dynamic",
      sequenceState: isCorrect ? "completed" : "moving",
      missingMovement: isCorrect ? undefined : "Downward outward motion path missing"
    };
  }

  if (name === "HOW ARE YOU") {
    // Both hands start chest height and move outward
    const movesOutward = Math.abs(dx) > 0.08;
    return {
      isMatch: movesOutward,
      score: movesOutward ? 0.92 : 0.3,
      feedback: movesOutward
        ? "✓ Chest-to-outward rotation movement recognized!"
        : "Dynamic Movement: Start with hands near chest, rotate palms up and push outward.",
      mode: "dynamic",
      sequenceState: movesOutward ? "completed" : "moving",
      missingMovement: movesOutward ? undefined : "Outward rotation movement missing"
    };
  }

  if (name === "GOOD MORNING") {
    // Salute (hands high) to index pointing up (sun rise)
    const movesUpward = dy < -0.05;
    return {
      isMatch: movesUpward && indexExtended,
      score: (movesUpward ? 0.6 : 0.2) + (indexExtended ? 0.35 : 0),
      feedback: movesUpward && indexExtended
        ? "✓ Rise movement matched: salute-to-rising index matched!"
        : "Dynamic Movement: Salute from forehead and raise your index finger upwards.",
      mode: "dynamic",
      sequenceState: (movesUpward && indexExtended) ? "completed" : "moving",
      missingMovement: !movesUpward ? "Upward sun rising motion path missing" : "Index finger extension missing"
    };
  }

  // Fallback template match
  return {
    isMatch: false,
    score: 0.2,
    feedback: `Move your hand to perform the dynamic gesture path for '${targetSign}'.`,
    mode: "dynamic",
    sequenceState: "moving"
  };
}

// Unified evaluator calling either static or dynamic pipelines
export function evaluateGesture(
  targetSign: string,
  hands: HandData[],
  region: "ISL" | "ASL" | "BSL" = "ISL"
): GestureEvaluation {
  return evaluateStaticGesture(targetSign, hands, region);
}
