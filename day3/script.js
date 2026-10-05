// ===== Starting data =====
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const CATEGORIES = ["personal", "work", "study"];

// ===== Helper: lower-case, trim and collapse extra spaces =====
function normalise(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

// ===== 1. searchNotes(word) =====
// Returns every note whose text contains the word, ignoring case.
function searchNotes(word) {
  const target = word.toLowerCase();
  return notes.filter(function (note) {
    return note.text.toLowerCase().includes(target);
  });
}

// ===== 2. longestNote() =====
// Returns the note object with the most characters, or null if there are none.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// ===== 3. countByCategory() =====
// Returns an object such as { personal: 2, study: 2, work: 1 }.
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category] === undefined) {
      counts[note.category] = 1;
    } else {
      counts[note.category]++;
    }
  }
  return counts;
}

// ===== 4. getSummary() =====
// Returns a sentence such as "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";

  if (total === 0) {
    return `0 ${word}.`;
  }

  const counts = countByCategory();
  const parts = [];
  for (const category of CATEGORIES) {
    if (counts[category]) {
      parts.push(`${counts[category]} ${category}`);
    }
  }
  return `${total} ${word}: ${parts.join(", ")}.`;
}

// ===== 5. isDuplicate(text) =====
// True if a note with the same text exists (ignoring case and extra spaces).
function isDuplicate(text) {
  const target = normalise(text);
  return notes.some(function (note) {
    return normalise(note.text) === target;
  });
}

// ===== 6. addNote(text, category) =====
// Adds a note if valid. Returns true when added, false otherwise (and logs why).
function addNote(text, category) {
  const cleaned = typeof text === "string" ? text.trim() : "";

  if (cleaned.length < 1 || cleaned.length > 200) {
    console.log("Not added: text must be 1-200 characters.");
    return false;
  }

  if (!CATEGORIES.includes(category)) {
    console.log("Not added: category must be personal, work or study.");
    return false;
  }

  if (isDuplicate(cleaned)) {
    console.log("Not added: a note with this text already exists.");
    return false;
  }

  let maxId = 0;
  for (const note of notes) {
    if (note.id > maxId) {
      maxId = note.id;
    }
  }

  notes.push({ id: maxId + 1, text: cleaned, category: category });
  console.log(`Note added with id ${maxId + 1}.`);
  return true;
}

// ===================== TESTS =====================

// --- searchNotes ---
console.log("--- searchNotes ---");
console.log(searchNotes("milk"));
// [ { id: 1, text: "Buy milk and bread", category: "personal" } ]
console.log(searchNotes("REVISE"));
// [ { id: 4, text: "Revise JavaScript arrays", category: "study" } ]  (case ignored)
console.log(searchNotes("the"));
// [ note 2 "Finish the Day 3 assignment", note 3 "Email the project report to Grace" ]
console.log(searchNotes("banana"));
// [] (no results)

// --- longestNote ---
console.log("--- longestNote ---");
console.log(longestNote());
// { id: 3, text: "Email the project report to Grace", category: "work" }  (33 characters)

const savedNotes = notes; // keep the real array safe for the edge case
notes = [];
console.log(longestNote());
// null (no notes)
notes = savedNotes;

// --- countByCategory ---
console.log("--- countByCategory ---");
console.log(countByCategory());
// { personal: 2, study: 2, work: 1 }

notes = [];
console.log(countByCategory());
// {} (no notes)
notes = savedNotes;

// --- getSummary ---
console.log("--- getSummary ---");
console.log(getSummary());
// "5 notes: 2 personal, 1 work, 2 study."

notes = [{ id: 1, text: "Only note", category: "work" }];
console.log(getSummary());
// "1 note: 1 work."  (singular "note")

notes = [];
console.log(getSummary());
// "0 notes."
notes = savedNotes;

// --- isDuplicate ---
console.log("--- isDuplicate ---");
console.log(isDuplicate("buy milk and bread"));
// true (different case)
console.log(isDuplicate("  Buy   MILK  and bread  "));
// true (extra spaces and case ignored)
console.log(isDuplicate("Buy eggs"));
// false

// --- addNote ---
console.log("--- addNote ---");
console.log(addNote("Pay electricity bill", "personal"));
// logs "Note added with id 6." then true
console.log(addNote("  buy milk AND bread ", "personal"));
// logs "Not added: a note with this text already exists." then false
console.log(addNote("   ", "work"));
// logs "Not added: text must be 1-200 characters." then false (empty after trimming)
console.log(addNote("x".repeat(201), "work"));
// logs "Not added: text must be 1-200 characters." then false (201 characters)
console.log(addNote("Plan weekend trip", "holiday"));
// logs "Not added: category must be personal, work or study." then false

// --- final check after the successful add ---
console.log(getSummary());
// "6 notes: 3 personal, 1 work, 2 study."
