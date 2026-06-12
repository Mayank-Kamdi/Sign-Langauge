export interface ReferenceLandmark {
  x: number;
  y: number;
  z: number;
}

// Generates reference 21 landmarks for a target gesture
export function getReferenceLandmarks(signName: string): ReferenceLandmark[] {
  const name = signName.toUpperCase().trim();

  // Baseline templates
  const wrist = { x: 0.5, y: 0.85, z: 0 };
  
  // MCP joints (bases of fingers)
  const thumbBase = { x: 0.38, y: 0.78, z: -0.02 };
  const indexBase = { x: 0.44, y: 0.58, z: -0.01 };
  const middleBase = { x: 0.5, y: 0.56, z: 0 };
  const ringBase = { x: 0.56, y: 0.58, z: 0.01 };
  const pinkyBase = { x: 0.62, y: 0.6, z: 0.02 };

  // Helper to extend or curl fingers
  // Extension: points go upwards (lower Y). Curl: points fold down towards the base/palm.
  const createFingerPoints = (
    base: ReferenceLandmark,
    angleOffset: number, // x-offset multiplier
    isExtended: boolean
  ): ReferenceLandmark[] => {
    const scale = isExtended ? 0.08 : 0.04;
    const directionY = isExtended ? -1 : 1.2; // up for extended, down/curl for folded
    
    // Joint 1 (PIP)
    const p1 = {
      x: base.x + angleOffset * 0.1,
      y: base.y + directionY * scale,
      z: base.z - 0.01
    };
    // Joint 2 (DIP)
    const p2 = {
      x: p1.x + angleOffset * 0.08,
      y: p1.y + directionY * scale * 0.8,
      z: p1.z - 0.01
    };
    // Joint 3 (Tip)
    const p3 = {
      x: p2.x + angleOffset * 0.06,
      y: p2.y + directionY * scale * 0.7,
      z: p2.z - 0.01
    };

    return [p1, p2, p3];
  };

  // Determine which fingers are extended based on signName
  let isThumbExtended = true;
  let isIndexExtended = true;
  let isMiddleExtended = true;
  let isRingExtended = true;
  let isPinkyExtended = true;

  if (name === "1") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "2" || name === "FRIEND") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "3") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "4") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  } else if (name === "5" || name === "HELLO" || name === "GOODBYE" || name === "B" || name === "PLEASE") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  } else if (name === "0") {
    // Both thumb and index curled to touch
    isThumbExtended = false;
    isIndexExtended = false;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "A" || name === "YES" || name === "NO" || name === "SORRY") {
    isThumbExtended = true; // thumb on side
    isIndexExtended = false;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "I LOVE YOU" || name === "I_LOVE_YOU") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = true;
  } else if (name === "C") {
    // Semi-curved shape for C
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  }

  // Thumb special generation
  const thumbJoints: ReferenceLandmark[] = [];
  if (isThumbExtended) {
    thumbJoints.push(
      { x: thumbBase.x - 0.05, y: thumbBase.y - 0.02, z: -0.03 },
      { x: thumbBase.x - 0.09, y: thumbBase.y - 0.04, z: -0.04 },
      { x: thumbBase.x - 0.12, y: thumbBase.y - 0.05, z: -0.05 }
    );
  } else {
    // Folded across palm
    thumbJoints.push(
      { x: thumbBase.x + 0.03, y: thumbBase.y - 0.01, z: -0.03 },
      { x: thumbBase.x + 0.06, y: thumbBase.y + 0.01, z: -0.04 },
      { x: thumbBase.x + 0.08, y: thumbBase.y + 0.03, z: -0.05 }
    );
  }

  // Special tweaks for specific gestures
  const indexJoints = createFingerPoints(indexBase, -0.05, isIndexExtended);
  const middleJoints = createFingerPoints(middleBase, 0, isMiddleExtended);
  const ringJoints = createFingerPoints(ringBase, 0.05, isRingExtended);
  const pinkyJoints = createFingerPoints(pinkyBase, 0.1, isPinkyExtended);

  // Combine into MediaPipe list of 21 landmarks
  return [
    wrist,               // 0
    thumbBase,           // 1
    thumbJoints[0],      // 2
    thumbJoints[1],      // 3
    thumbJoints[2],      // 4
    indexBase,           // 5
    indexJoints[0],      // 6
    indexJoints[1],      // 7
    indexJoints[2],      // 8
    middleBase,          // 9
    middleJoints[0],     // 10
    middleJoints[1],     // 11
    middleJoints[2],     // 12
    ringBase,            // 13
    ringJoints[0],       // 14
    ringJoints[1],       // 15
    ringJoints[2],       // 16
    pinkyBase,           // 17
    pinkyJoints[0],      // 18
    pinkyJoints[1],      // 19
    pinkyJoints[2],      // 20
  ];
}
