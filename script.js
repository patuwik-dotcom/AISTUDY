// ===========================
// CHAT SECTION
// ===========================

// This stores all messages in the current chat
var chatHistory = [];

// This runs when the user clicks Send
async function sendMessage() {
  var inputField = document.getElementById("userInput");
  var responseBox = document.getElementById("responseBox");
  var userMessage = inputField.value.trim();

  // Don't send if empty
  if (!userMessage) return;

  // Hide suggestions once user starts chatting
  var suggestions = document.getElementById("suggestions");
if (suggestions) {
  suggestions.style.display = "none";
}

  // Show the user's message
  var userDiv = document.createElement("div");
  userDiv.className = "user-msg";
  userDiv.textContent = userMessage;
  responseBox.appendChild(userDiv);

  // Clear the input field
  inputField.value = "";

  // Show "thinking" text
  var thinkingDiv = document.createElement("div");
  thinkingDiv.className = "thinking";
  thinkingDiv.textContent = "Thinking...";
  responseBox.appendChild(thinkingDiv);

  // Scroll to bottom
  responseBox.scrollTop = responseBox.scrollHeight;

  // Add user message to chat history
  chatHistory.push({ role: "user", content: userMessage });

  try {
  var res = await fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: chatHistory
    })
  });

  var data = await res.json();

  responseBox.removeChild(thinkingDiv);

  if (!res.ok || data.error) {
    var errDiv = document.createElement("div");
    errDiv.className = "ai-msg";
    errDiv.textContent = "Error: " + (data.error?.message || "Server error.");
    responseBox.appendChild(errDiv);
    return;
  }

  var reply = data.choices[0].message.content;

  chatHistory.push({ role: "assistant", content: reply });

  var aiDiv = document.createElement("div");
  aiDiv.className = "ai-msg";
  aiDiv.textContent = reply;
  responseBox.appendChild(aiDiv);

  responseBox.scrollTop = responseBox.scrollHeight;

} catch (err) {
  responseBox.removeChild(thinkingDiv);
  var errDiv = document.createElement("div");
  errDiv.className = "ai-msg";
  errDiv.textContent = "Network Error: " + err.message;
  responseBox.appendChild(errDiv);
  }
}
// Puts a suggestion text into the input box
function useSuggestion(text) {
  document.getElementById("userInput").value = text;
  document.getElementById("userInput").focus();
}

// Press Enter to send (Shift+Enter makes a new line)
document.getElementById("userInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});


// ===========================
// POMODORO TIMER (CLEAN VERSION)
// ===========================

var durations = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60
};

var mode = "focus";
var total = durations[mode];
var timeLeft = total;
var interval = null;
var running = false;
var sessions = 0;

// Switch mode
function setMode(newMode) {
  pauseTimer();

  mode = newMode;
  total = durations[mode];
  timeLeft = total;

  // update active button
  var buttons = document.querySelectorAll(".mode-btn");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }

  if (newMode === "focus") buttons[0].classList.add("active");
  if (newMode === "short") buttons[1].classList.add("active");
  if (newMode === "long") buttons[2].classList.add("active");

  updateDisplay();
}

// Start timer
function startTimer() {
  if (running) return;
  running = true;

  interval = setInterval(function () {
    timeLeft--;

    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(interval);
      running = false;

      // count session only for focus mode
      if (mode === "focus") {
        sessions++;
        document.getElementById("sessionCount").textContent = sessions;
      }

      // reset automatically
      timeLeft = total;
      updateDisplay();
    }
  }, 1000);
}

// Pause timer
function pauseTimer() {
  clearInterval(interval);
  running = false;
}

// Reset timer
function resetTimer() {
  pauseTimer();
  timeLeft = total;
  updateDisplay();
}

// Update display only (NO RING, NO COMPLEXITY)
function updateDisplay() {
  var min = Math.floor(timeLeft / 60);
  var sec = timeLeft % 60;

  if (sec < 10) sec = "0" + sec;

  document.getElementById("timerDisplay").textContent = min + ":" + sec;
}

// ===========================
// NOTEBOOK SECTION
// ===========================

var currentNoteId = null;

// Save a note
function saveNote() {
  var title = document.getElementById("noteTitle").value.trim();
  var content = document.getElementById("notesArea").value.trim();

  if (!title || !content) {
    alert("Please enter a title and some content.");
    return;
  }

  var notes = JSON.parse(localStorage.getItem("notes")) || [];

  if (currentNoteId !== null) {
    notes[currentNoteId] = { title: title, content: content };
  } else {
    notes.push({ title: title, content: content });
  }

  localStorage.setItem("notes", JSON.stringify(notes));

  currentNoteId = null;
  document.getElementById("noteTitle").value = "";
  document.getElementById("notesArea").value = "";

  loadNotes();
}

// Load and display all notes
function loadNotes() {
  var notesList = document.getElementById("notesList");
  var notes = JSON.parse(localStorage.getItem("notes")) || [];

  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.innerHTML = '<p style="font-size:13px; color:#9ca3af;">No notes saved yet.</p>';
    return;
  }

  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var item = document.createElement("div");
    item.className = "note-item";

    var titleSpan = document.createElement("span");
    titleSpan.className = "note-item-title";
    titleSpan.textContent = note.title;

    var delBtn = document.createElement("button");
    delBtn.className = "note-delete-btn";
    delBtn.textContent = "Delete";

    item.addEventListener("click", function(index) {
      return function() { openNote(index); };
    }(i));

    delBtn.addEventListener("click", function(index) {
      return function(e) {
        e.stopPropagation();
        deleteNote(index);
      };
    }(i));

    item.appendChild(titleSpan);
    item.appendChild(delBtn);
    notesList.appendChild(item);
  }
}

// Open a note into the editor
function openNote(index) {
  var notes = JSON.parse(localStorage.getItem("notes")) || [];
  var note = notes[index];
  if (!note) return;

  currentNoteId = index;
  document.getElementById("noteTitle").value = note.title;
  document.getElementById("notesArea").value = note.content;
}

// Delete a note
function deleteNote(index) {
  var notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.splice(index, 1);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

// Send notes content to the chat AI
function askFromNotes() {
  var notes = document.getElementById("notesArea").value.trim();
  if (!notes) {
    alert("Write some notes first!");
    return;
  }
  document.getElementById("userInput").value = "Explain this clearly:\n" + notes;
  document.getElementById("userInput").focus();
}

// ===========================
// ON PAGE LOAD
// ===========================
window.addEventListener("load", function() {
  loadNotes();
  updateDisplay();  // show the timer right away
});
