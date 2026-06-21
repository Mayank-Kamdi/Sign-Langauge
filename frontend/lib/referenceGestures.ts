export interface ReferenceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerStates {
  isThumbExtended: boolean;
  isIndexExtended: boolean;
  isMiddleExtended: boolean;
  isRingExtended: boolean;
  isPinkyExtended: boolean;
}

export function getExpectedFingerStates(signName: string): FingerStates {
  const name = signName.toUpperCase().trim();

  // Defaults: all extended (for 5, HELLO, GOODBYE, B, PLEASE, THANK YOU, C, etc.)
  let isThumbExtended = true;
  let isIndexExtended = true;
  let isMiddleExtended = true;
  let isRingExtended = true;
  let isPinkyExtended = true;

  if (name === "1" || name === "D" || name === "GOOD MORNING" || name === "Z") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "2" || name === "U" || name === "V" || name === "R" || name === "H") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "K" || name === "P") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "3" || name === "W") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = false;
  } else if (name === "4") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  } else if (name === "F") {
    isThumbExtended = false;
    isIndexExtended = false;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  } else if (name === "B") {
    isThumbExtended = false;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  } else if (name === "0" || name === "O" || name === "E" || name === "M" || name === "N" || name === "S" || name === "T" || name === "X") {
    isThumbExtended = false;
    isIndexExtended = false;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "A" || name === "YES" || name === "NO" || name === "SORRY") {
    isThumbExtended = true;
    isIndexExtended = false;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "L" || name === "G" || name === "Q") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = false;
  } else if (name === "Y") {
    isThumbExtended = true;
    isIndexExtended = false;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = true;
  } else if (name === "I" || name === "J" || name === "FRIEND") {
    isThumbExtended = false;
    isIndexExtended = false;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = true;
  } else if (name === "I LOVE YOU" || name === "I_LOVE_YOU") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = false;
    isRingExtended = false;
    isPinkyExtended = true;
  } else if (name === "C") {
    isThumbExtended = true;
    isIndexExtended = true;
    isMiddleExtended = true;
    isRingExtended = true;
    isPinkyExtended = true;
  }

  return {
    isThumbExtended,
    isIndexExtended,
    isMiddleExtended,
    isRingExtended,
    isPinkyExtended
  };
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

  // Helper to generate a realistic finger shape in 3D
  const generateFingerPoints = (
    base: ReferenceLandmark,
    direction: { x: number; y: number; z: number },
    mode: "straight" | "curled" | "hooked" | "curved" | "crossed-left" | "crossed-right"
  ): ReferenceLandmark[] => {
    const scale = 0.075;
    
    if (mode === "curled") {
      // Finger is folded tightly into the palm
      const p1 = { x: base.x, y: base.y + 0.03, z: base.z - 0.02 };
      const p2 = { x: base.x, y: base.y + 0.055, z: base.z - 0.01 };
      const p3 = { x: base.x, y: base.y + 0.045, z: base.z + 0.015 };
      return [p1, p2, p3];
    }
    
    if (mode === "hooked") {
      // Finger is bent like a hook (for X)
      const p1 = { x: base.x + direction.x * 0.04, y: base.y + direction.y * 0.04 - 0.01, z: base.z - 0.02 };
      const p2 = { x: p1.x + direction.x * 0.02, y: p1.y + 0.025, z: p1.z - 0.03 };
      const p3 = { x: p2.x - direction.x * 0.01, y: p2.y + 0.015, z: p2.z - 0.01 };
      return [p1, p2, p3];
    }

    if (mode === "curved") {
      // Finger is bent in a smooth arc (for C, O, D, F)
      const p1 = { x: base.x + direction.x * 0.05, y: base.y + direction.y * 0.04, z: base.z - 0.03 };
      const p2 = { x: p1.x + direction.x * 0.04, y: p1.y + direction.y * 0.04, z: p1.z - 0.05 };
      const p3 = { x: p2.x + direction.x * 0.025, y: p2.y + direction.y * 0.025 + 0.02, z: p2.z - 0.03 };
      return [p1, p2, p3];
    }

    if (mode === "crossed-left") {
      // Crossed index (for R) - goes slightly to the right
      const p1 = { x: base.x + 0.025, y: base.y - 0.055, z: base.z - 0.01 };
      const p2 = { x: p1.x + 0.02, y: p1.y - 0.045, z: p1.z - 0.02 };
      const p3 = { x: p2.x + 0.015, y: p2.y - 0.035, z: p2.z - 0.03 };
      return [p1, p2, p3];
    }

    if (mode === "crossed-right") {
      // Crossed middle (for R) - goes slightly to the left
      const p1 = { x: base.x - 0.025, y: base.y - 0.06, z: base.z - 0.02 };
      const p2 = { x: p1.x - 0.02, y: p1.y - 0.05, z: p1.z - 0.03 };
      const p3 = { x: p2.x - 0.015, y: p2.y - 0.04, z: p2.z - 0.04 };
      return [p1, p2, p3];
    }

    // Straight mode (default)
    const p1 = {
      x: base.x + direction.x * scale,
      y: base.y + direction.y * scale,
      z: base.z + direction.z * scale
    };
    const p2 = {
      x: p1.x + direction.x * scale * 0.8,
      y: p1.y + direction.y * scale * 0.8,
      z: p1.z + direction.z * scale * 0.8
    };
    const p3 = {
      x: p2.x + direction.x * scale * 0.7,
      y: p2.y + direction.y * scale * 0.7,
      z: p2.z + direction.z * scale * 0.7
    };
    return [p1, p2, p3];
  };

  // Determine finger posture modes for each letter
  let indexMode: "straight" | "curled" | "hooked" | "curved" | "crossed-left" | "crossed-right" = "straight";
  let middleMode: "straight" | "curled" | "hooked" | "curved" | "crossed-left" | "crossed-right" = "straight";
  let ringMode: "straight" | "curled" | "hooked" | "curved" | "crossed-left" | "crossed-right" = "straight";
  let pinkyMode: "straight" | "curled" | "hooked" | "curved" | "crossed-left" | "crossed-right" = "straight";
  
  let thumbDirection = { x: -0.6, y: -0.6, z: -0.05 }; // pointing up/left
  let indexDirection = { x: 0, y: -1, z: 0 };
  let middleDirection = { x: 0, y: -1, z: 0 };
  let ringDirection = { x: 0, y: -1, z: 0 };
  let pinkyDirection = { x: 0, y: -1, z: 0 };

  const expected = getExpectedFingerStates(name);
  
  // Set default curled/straight states based on extensions config
  indexMode = expected.isIndexExtended ? "straight" : "curled";
  middleMode = expected.isMiddleExtended ? "straight" : "curled";
  ringMode = expected.isRingExtended ? "straight" : "curled";
  pinkyMode = expected.isPinkyExtended ? "straight" : "curled";

  // Specific modifications for distinct letter shapes:
  if (name === "C" || name === "O") {
    indexMode = "curved";
    middleMode = "curved";
    ringMode = "curved";
    pinkyMode = "curved";
  } else if (name === "D" || name === "F") {
    if (name === "D") {
      middleMode = "curved";
      ringMode = "curved";
      pinkyMode = "curved";
    } else { // F
      indexMode = "curved";
    }
  } else if (name === "G") {
    indexDirection = { x: -1, y: -0.1, z: 0 }; // pointing horizontal
    thumbDirection = { x: -0.5, y: -0.8, z: 0 };
  } else if (name === "H") {
    indexDirection = { x: -1, y: -0.1, z: 0 }; // pointing horizontal
    middleDirection = { x: -1, y: -0.1, z: 0 };
  } else if (name === "L") {
    thumbDirection = { x: -1, y: 0.1, z: 0 }; // horizontal L thumb
  } else if (name === "P") {
    indexDirection = { x: -0.2, y: 0.8, z: 0.1 }; // pointing down/forward
    middleDirection = { x: 0.2, y: 0.8, z: 0.1 };
    thumbDirection = { x: -0.6, y: 0.4, z: 0 };
  } else if (name === "Q") {
    indexDirection = { x: -0.2, y: 0.8, z: 0.1 }; // pointing down
    thumbDirection = { x: -0.6, y: 0.6, z: 0.1 };
  } else if (name === "R") {
    indexMode = "crossed-left";
    middleMode = "crossed-right";
  } else if (name === "X") {
    indexMode = "hooked";
  } else if (name === "Y") {
    thumbDirection = { x: -1, y: 0.1, z: 0 }; // horizontal Y thumb
    pinkyDirection = { x: 0.8, y: -0.6, z: 0 }; // pinky flared wide
  }

  // Thumb coordinates calculation
  const thumbJoints: ReferenceLandmark[] = [];
  if (expected.isThumbExtended) {
    thumbJoints.push(
      { x: thumbBase.x + thumbDirection.x * 0.05, y: thumbBase.y + thumbDirection.y * 0.05, z: thumbBase.z + thumbDirection.z * 0.05 },
      { x: thumbBase.x + thumbDirection.x * 0.09, y: thumbBase.y + thumbDirection.y * 0.09, z: thumbBase.z + thumbDirection.z * 0.09 },
      { x: thumbBase.x + thumbDirection.x * 0.12, y: thumbBase.y + thumbDirection.y * 0.12, z: thumbBase.z + thumbDirection.z * 0.12 }
    );
  } else {
    // Folded thumb (curves inward/across palm)
    thumbJoints.push(
      { x: thumbBase.x + 0.03, y: thumbBase.y - 0.01, z: -0.03 },
      { x: thumbBase.x + 0.055, y: thumbBase.y + 0.005, z: -0.045 },
      { x: thumbBase.x + 0.07, y: thumbBase.y + 0.02, z: -0.05 }
    );
  }

  // Generate all fingers
  const indexJoints = generateFingerPoints(indexBase, indexDirection, indexMode);
  const middleJoints = generateFingerPoints(middleBase, middleDirection, middleMode);
  const ringJoints = generateFingerPoints(ringBase, ringDirection, ringMode);
  const pinkyJoints = generateFingerPoints(pinkyBase, pinkyDirection, pinkyMode);

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
