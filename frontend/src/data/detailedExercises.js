const detailedExercises = [
  {
    id: 1,
    title: "Sun Salutation Flow",
    category: "Yoga",
    description: "A beginner-friendly yoga sequence that warms the body, improves mobility, and gently energizes the mind.",
    image: "https://images.unsplash.com/photo-1546484959-f0bf2d391d64?w=500&h=300&fit=crop",
    difficulty: "Beginner",
    target: "Full body, flexibility",
    duration: "12 minutes",
    frequency: "3-5 times per week",
    caloriesBurned: "70-90 kcal",
    equipment: "Yoga mat",
    trainer: "Certified Yoga Coach Priya Sharma",
    ageGroup: "18-55",
    avoid: "Recent injuries, severe hypertension",
    benefits: [
      "Improves flexibility",
      "Supports circulation",
      "Reduces stress",
      "Warms up the whole body"
    ],
    instructions: [
      "Begin in Mountain Pose with feet together.",
      "Inhale and raise arms overhead, then exhale into Forward Fold.",
      "Inhale to a half lift, exhale to plank position.",
      "Lower down into Cobra or Upward Dog on the next inhale.",
      "Exhale back to Downward Facing Dog and hold for 3 breaths.",
      "Walk your feet forward and rise with an inhale to Mountain Pose."
    ],
    commonMistakes: [
      "Collapsing the lower back in Forward Fold",
      "Holding breath during transitions",
      "Overextending the neck in Cobra"
    ],
    precautions: [
      "Move slowly if new to yoga",
      "Keep knees soft when folding",
      "Choose Cobra over Upward Dog if shoulders feel tight"
    ],
    youtubeVideo: "https://www.youtube.com/embed/v7AYKMP6rOE",
  },
  {
    id: 2,
    title: "Cardio Dance Warm-up",
    category: "Cardio",
    description: "A fun low-impact dance routine designed by a certified trainer to raise heart rate and increase stamina safely.",
    image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=500&h=300&fit=crop",
    difficulty: "Beginner",
    target: "Heart, legs, core",
    duration: "15 minutes",
    frequency: "4-6 times per week",
    caloriesBurned: "110-140 kcal",
    equipment: "None",
    trainer: "Certified Fitness Coach Sara Ahmed",
    ageGroup: "16-60",
    avoid: "Joint pain, recent surgery",
    benefits: [
      "Boosts heart health",
      "Burns calories",
      "Improves coordination",
      "Energizes the body"
    ],
    instructions: [
      "Start with marching in place for 2 minutes.",
      "Add side steps and gentle arm swings.",
      "Introduce light knee lifts and grapevine steps.",
      "Add alternating kicks and easy jumps.",
      "Finish with slower compound moves and cool-down stretches."
    ],
    commonMistakes: [
      "Jumping too high too soon",
      "Locking the knees during steps",
      "Holding tension in the shoulders"
    ],
    precautions: [
      "Keep movements low impact if you have knee sensitivity",
      "Stay hydrated",
      "Listen to your body and reduce intensity when needed"
    ],
    youtubeVideo: "https://www.youtube.com/embed/gC_L9qAHVJ8",
  },
  {
    id: 3,
    title: "Strength Band Glute Bridge",
    category: "Strength Training",
    description: "A targeted strength exercise for glutes and posterior chain, crafted by a certified strength coach for safe muscle activation.",
    image: "https://images.unsplash.com/photo-1558611848-73f7eb4001d5?w=500&h=300&fit=crop",
    difficulty: "Intermediate",
    target: "Glutes, hamstrings, core",
    duration: "10 minutes",
    frequency: "2-3 times per week",
    caloriesBurned: "80-120 kcal",
    equipment: "Resistance band, mat",
    trainer: "Certified Strength Coach Anita Kapoor",
    ageGroup: "18-60",
    avoid: "Lower back pain, hip injuries",
    benefits: [
      "Builds lower-body strength",
      "Improves pelvic stability",
      "Supports posture",
      "Aids functional movement"
    ],
    instructions: [
      "Lie on your back with knees bent and feet hip-width apart.",
      "Place a resistance band above your knees.",
      "Press through your heels and lift your hips.",
      "Squeeze your glutes at the top for 2 seconds.",
      "Lower slowly and repeat for 12-15 reps."
    ],
    commonMistakes: [
      "Arching the lower back too much",
      "Letting knees collapse inward",
      "Pushing through toes instead of heels"
    ],
    precautions: [
      "Keep core engaged throughout",
      "Avoid arching the spine",
      "Use a lighter band if form feels compromised"
    ],
    youtubeVideo: "https://www.youtube.com/embed/8bbE64NuDTU",
  },
  {
    id: 4,
    title: "Seated Forward Stretch",
    category: "Stretching",
    description: "A gentle stretching routine for hamstrings and lower back, recommended by a certified mobility specialist.",
    image: "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500&h=300&fit=crop",
    difficulty: "Beginner",
    target: "Hamstrings, spine",
    duration: "5 minutes",
    frequency: "Daily",
    caloriesBurned: "15-25 kcal",
    equipment: "Yoga mat",
    trainer: "Certified Mobility Specialist Rina Desai",
    ageGroup: "16-70",
    avoid: "Lower back injury",
    benefits: [
      "Improves flexibility",
      "Eases lower back tension",
      "Supports posture",
      "Calms the mind"
    ],
    instructions: [
      "Sit with legs extended and spine tall.",
      "Inhale to lengthen, exhale folding forward from the hips.",
      "Reach for shins, ankles, or toes without rounding the back.",
      "Hold for 5-8 breaths.",
      "Release slowly and sit upright."
    ],
    commonMistakes: [
      "Rounding the lower back excessively",
      "Pulling too hard on the legs",
      "Holding breath"
    ],
    precautions: [
      "Bend knees slightly if hamstrings are tight",
      "Move within your comfortable range",
      "Avoid if experiencing acute back pain"
    ],
    youtubeVideo: "https://www.youtube.com/embed/g_tea8ZNk5A",
  },
  {
    id: 5,
    title: "Guided Heart-Centered Meditation",
    category: "Meditation",
    description: "A certified meditation instructor guides this calming practice for emotional balance and mental resilience.",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=500&h=300&fit=crop",
    difficulty: "Beginner",
    target: "Mind, stress relief",
    duration: "12 minutes",
    frequency: "Daily",
    equipment: "Comfortable seat",
    trainer: "Certified Mindfulness Trainer Leela Nair",
    ageGroup: "16+",
    avoid: "None",
    benefits: [
      "Calms the nervous system",
      "Supports emotional balance",
      "Improves focus",
      "Strengthens inner resilience"
    ],
    instructions: [
      "Sit comfortably with back straight.",
      "Close your eyes and breathe gently.",
      "Bring attention to your heart area.",
      "Imagine warm, soothing light with each inhale.",
      "Hold the feeling of calm for several minutes before opening your eyes."
    ],
    commonMistakes: [
      "Chasing quiet thoughts",
      "Tensing the shoulders",
      "Rushing the practice"
    ],
    precautions: [
      "Begin with shorter sessions if new to meditation",
      "Find a quiet, comfortable space",
      "If feeling dizzy, open eyes and breathe deeply"
    ],
    youtubeVideo: "https://www.youtube.com/embed/6p_yaNFSYao",
  },
  {
    id: 6,
    title: "Deep Belly Breathing",
    category: "Breathing Exercises",
    description: "A certified breathing coach leads this restorative exercise to improve oxygen flow and lower stress.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&h=300&fit=crop",
    difficulty: "Beginner",
    target: "Respiration, stress relief",
    duration: "8 minutes",
    frequency: "Daily",
    caloriesBurned: "5-10 kcal",
    equipment: "None",
    trainer: "Certified Breathwork Coach Maya Patel",
    ageGroup: "All ages",
    avoid: "Recent abdominal surgery",
    benefits: [
      "Lowers stress hormones",
      "Improves oxygen flow",
      "Helps with relaxation",
      "Supports better sleep"
    ],
    instructions: [
      "Lie down or sit upright in a comfortable position.",
      "Place one hand on your chest and one on your belly.",
      "Inhale slowly through the nose, feeling your belly rise.",
      "Exhale gently through the mouth, allowing your belly to fall.",
      "Repeat for 8-10 breaths, staying calm and steady."
    ],
    commonMistakes: [
      "Breathing shallowly",
      "Tensing the neck and shoulders",
      "Holding breath between inhales and exhales"
    ],
    precautions: [
      "Keep your body relaxed",
      "Focus on smooth breaths",
      "Stop if you feel lightheaded"
    ],
    youtubeVideo: "https://www.youtube.com/embed/tEmt1Znux58",
  }
];

export default detailedExercises;
