// =============================================================
// Sample data for the RACING WORDS template (Đợt 527) — same shape as Quiz / Star loot:
// each item is a question with 2–4 answers, exactly one correct. A right answer charges the BOOST pedal,
// a streak earns a missile; the race is 2 teams on split screen.
// =============================================================
export const activity = {
  id: "sample-racing-words",
  type: "racing_words",
  title: "Space words",
  instruction: "Answer to charge your BOOST — race the other team to the finish!",
  theme: "classic",
  options: { srSameQ: true, srMsMax: 3, srSteps: 12, srLaps: 0, srRamps: true },
  content: {
    questions: [
      {
        "question": "Which planet is closest to the Sun?",
        "answers": [
          {
            "text": "Mercury",
            "correct": true
          },
          {
            "text": "Venus",
            "correct": false
          },
          {
            "text": "Earth",
            "correct": false
          },
          {
            "text": "Mars",
            "correct": false
          }
        ]
      },
      {
        "question": "The red planet is …",
        "answers": [
          {
            "text": "Mars",
            "correct": true
          },
          {
            "text": "Jupiter",
            "correct": false
          },
          {
            "text": "Venus",
            "correct": false
          },
          {
            "text": "Saturn",
            "correct": false
          }
        ]
      },
      {
        "question": "Which planet has beautiful rings?",
        "answers": [
          {
            "text": "Saturn",
            "correct": true
          },
          {
            "text": "Mars",
            "correct": false
          },
          {
            "text": "Mercury",
            "correct": false
          },
          {
            "text": "Earth",
            "correct": false
          }
        ]
      },
      {
        "question": "Who was the first person on the Moon?",
        "answers": [
          {
            "text": "Neil Armstrong",
            "correct": true
          },
          {
            "text": "Yuri Gagarin",
            "correct": false
          },
          {
            "text": "Isaac Newton",
            "correct": false
          }
        ]
      },
      {
        "question": "A shooting star is a …",
        "answers": [
          {
            "text": "meteor",
            "correct": true
          },
          {
            "text": "comet",
            "correct": false
          },
          {
            "text": "planet",
            "correct": false
          },
          {
            "text": "moon",
            "correct": false
          }
        ]
      },
      {
        "question": "Our galaxy is called the …",
        "answers": [
          {
            "text": "Milky Way",
            "correct": true
          },
          {
            "text": "Andromeda",
            "correct": false
          },
          {
            "text": "Big Dipper",
            "correct": false
          }
        ]
      },
      {
        "question": "The Sun is a …",
        "answers": [
          {
            "text": "star",
            "correct": true
          },
          {
            "text": "planet",
            "correct": false
          },
          {
            "text": "moon",
            "correct": false
          },
          {
            "text": "comet",
            "correct": false
          }
        ]
      },
      {
        "question": "A vehicle that travels in space is a …",
        "answers": [
          {
            "text": "rocket",
            "correct": true
          },
          {
            "text": "truck",
            "correct": false
          },
          {
            "text": "boat",
            "correct": false
          }
        ]
      }
    ]
  }
};
