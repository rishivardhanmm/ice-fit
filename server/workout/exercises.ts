import type { Exercise } from "./types.js";

export const exerciseLibrary: Exercise[] = [
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    movementPattern: "squat",
    category: "Knee dominant",
    muscles: ["Quads", "Glutes", "Core"],
    equipment: ["dumbbells", "kettlebells"],
    avoidWhen: ["knee_pain"],
    cue: "Brace first, sit between your hips, keep the reps smooth."
  },
  {
    id: "box-squat",
    name: "Box Squat",
    movementPattern: "squat",
    category: "Knee dominant",
    muscles: ["Quads", "Glutes"],
    equipment: ["bodyweight", "dumbbells", "barbell"],
    avoidWhen: [],
    cue: "Use the box as a depth guide, not a place to relax."
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    movementPattern: "hinge",
    category: "Hip dominant",
    muscles: ["Hamstrings", "Glutes", "Back"],
    equipment: ["dumbbells", "barbell"],
    avoidWhen: ["back_pain"],
    cue: "Hips back, ribs down, stop when hamstrings are loaded."
  },
  {
    id: "hip-thrust",
    name: "Hip Thrust",
    movementPattern: "hinge",
    category: "Hip dominant",
    muscles: ["Glutes", "Hamstrings"],
    equipment: ["bodyweight", "dumbbells", "barbell"],
    avoidWhen: [],
    cue: "Pause at the top and keep the lower back quiet."
  },
  {
    id: "push-up",
    name: "Push-Up",
    movementPattern: "horizontal_push",
    category: "Horizontal push",
    muscles: ["Chest", "Triceps", "Shoulders"],
    equipment: ["bodyweight"],
    avoidWhen: ["shoulder_pain", "wrist_pain"],
    cue: "Hands press the floor away, body moves as one line."
  },
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    movementPattern: "horizontal_push",
    category: "Horizontal push",
    muscles: ["Chest", "Triceps", "Shoulders"],
    equipment: ["dumbbells", "bench"],
    avoidWhen: ["shoulder_pain"],
    cue: "Lower with control, press slightly in toward the midline."
  },
  {
    id: "landmine-press",
    name: "Landmine Press",
    movementPattern: "vertical_push",
    category: "Vertical push",
    muscles: ["Shoulders", "Triceps", "Core"],
    equipment: ["barbell"],
    avoidWhen: [],
    cue: "Reach forward and up without shrugging hard."
  },
  {
    id: "half-kneeling-press",
    name: "Half-Kneeling Dumbbell Press",
    movementPattern: "vertical_push",
    category: "Vertical push",
    muscles: ["Shoulders", "Triceps", "Core"],
    equipment: ["dumbbells"],
    avoidWhen: ["shoulder_pain"],
    cue: "Glute tight, ribs stacked, press without leaning back."
  },
  {
    id: "one-arm-row",
    name: "One-Arm Dumbbell Row",
    movementPattern: "horizontal_pull",
    category: "Horizontal pull",
    muscles: ["Back", "Biceps"],
    equipment: ["dumbbells", "bench"],
    avoidWhen: [],
    cue: "Pull elbow toward the back pocket and pause briefly."
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    movementPattern: "horizontal_pull",
    category: "Horizontal pull",
    muscles: ["Back", "Biceps"],
    equipment: ["cable"],
    avoidWhen: [],
    cue: "Stay tall, move shoulder blades before bending elbows."
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    movementPattern: "vertical_pull",
    category: "Vertical pull",
    muscles: ["Back", "Biceps"],
    equipment: ["cable"],
    avoidWhen: ["shoulder_pain"],
    cue: "Pull elbows down, stop before the shoulders roll forward."
  },
  {
    id: "assisted-pull-up",
    name: "Assisted Pull-Up",
    movementPattern: "vertical_pull",
    category: "Vertical pull",
    muscles: ["Back", "Biceps", "Core"],
    equipment: ["machine", "bands"],
    avoidWhen: ["shoulder_pain"],
    cue: "Start from active shoulders and keep the ribs tucked."
  },
  {
    id: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    movementPattern: "vertical_pull",
    category: "Vertical pull",
    muscles: ["Back", "Chest", "Core"],
    equipment: ["dumbbells", "bench"],
    avoidWhen: ["shoulder_pain"],
    cue: "Keep ribs down and move only through a comfortable shoulder range."
  },
  {
    id: "band-pulldown",
    name: "Band Pulldown",
    movementPattern: "vertical_pull",
    category: "Vertical pull",
    muscles: ["Back", "Biceps"],
    equipment: ["bands"],
    avoidWhen: ["shoulder_pain"],
    cue: "Pull elbows down and pause before the band pulls you back up."
  },
  {
    id: "dead-bug",
    name: "Dead Bug",
    movementPattern: "core",
    category: "Core control",
    muscles: ["Core"],
    equipment: ["bodyweight"],
    avoidWhen: [],
    cue: "Exhale, pin ribs down, move slowly."
  },
  {
    id: "side-plank",
    name: "Side Plank",
    movementPattern: "core",
    category: "Core stability",
    muscles: ["Core", "Obliques"],
    equipment: ["bodyweight"],
    avoidWhen: ["shoulder_pain"],
    cue: "Push the floor away and keep hips stacked."
  },
  {
    id: "split-squat",
    name: "Split Squat",
    movementPattern: "squat",
    category: "Single-leg",
    muscles: ["Quads", "Glutes"],
    equipment: ["bodyweight", "dumbbells"],
    avoidWhen: ["knee_pain"],
    cue: "Drop straight down and keep the front foot planted."
  },
  {
    id: "step-up",
    name: "Step-Up",
    movementPattern: "squat",
    category: "Single-leg",
    muscles: ["Quads", "Glutes"],
    equipment: ["bodyweight", "dumbbells", "box"],
    avoidWhen: [],
    cue: "Drive through the full foot and control the descent."
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    movementPattern: "arms",
    category: "Arms",
    muscles: ["Biceps", "Forearms"],
    equipment: ["dumbbells"],
    avoidWhen: ["elbow_pain"],
    cue: "Keep upper arms quiet and finish without swinging."
  },
  {
    id: "rope-pressdown",
    name: "Rope Pressdown",
    movementPattern: "arms",
    category: "Arms",
    muscles: ["Triceps"],
    equipment: ["cable"],
    avoidWhen: ["elbow_pain"],
    cue: "Lock ribs down and spread the rope at the bottom."
  },
  {
    id: "incline-walk",
    name: "Incline Walk",
    movementPattern: "conditioning",
    category: "Conditioning",
    muscles: ["Heart", "Calves", "Glutes"],
    equipment: ["treadmill"],
    avoidWhen: [],
    cue: "Nasal breathing pace if possible, relaxed shoulders."
  },
  {
    id: "bike-interval",
    name: "Bike Interval",
    movementPattern: "conditioning",
    category: "Conditioning",
    muscles: ["Heart", "Quads"],
    equipment: ["bike"],
    avoidWhen: [],
    cue: "Push the work interval, recover fully between rounds."
  }
];

export function findExercise(id: string): Exercise | undefined {
  return exerciseLibrary.find((exercise) => exercise.id === id);
}

export function alternativesFor(exercise: Exercise, equipment: string[], injuryFlags: string[]): Exercise[] {
  return exerciseLibrary
    .filter((candidate) => candidate.id !== exercise.id)
    .filter((candidate) => candidate.movementPattern === exercise.movementPattern)
    .filter((candidate) => candidate.equipment.some((item) => equipment.includes(item) || item === "bodyweight"))
    .filter((candidate) => !candidate.avoidWhen.some((flag) => injuryFlags.includes(flag)))
    .slice(0, 3);
}
