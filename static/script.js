

document.getElementById('audio-processing-tab').addEventListener('click', function() {
    document.getElementById('audio-processing-section').style.display = 'block';
    document.getElementById('speech-to-text-section').style.display = 'none';
});
document.getElementById('speech-to-text-tab').addEventListener('click', function() {
    document.getElementById('audio-processing-section').style.display = 'none';
    document.getElementById('speech-to-text-section').style.display = 'block';
});
// Audio Processing Logic
document.getElementById('transcribe-btn').addEventListener('click', function() {
    processAudio('transcribe');
});
document.getElementById('analyze-btn').addEventListener('click', function() {
    processAudio('analyze');
});
document.getElementById('identify-speakers-btn').addEventListener('click', function() {
    processAudio('identify_speakers');
});
function processAudio(action) {
    const fileInput = document.getElementById('audio-file');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please upload an audio file.');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);
    const loadingSection = document.getElementById('loading-section');
    loadingSection.style.display = 'block';
    fetch('/process', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        loadingSection.style.display = 'none';
        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }
        if (action === 'transcribe') {
            const transcriptionSection = document.getElementById('transcription-section');
            const transcriptionContent = document.getElementById('transcription-content');
            transcriptionSection.style.display = 'block';
            transcriptionContent.innerHTML = `<p>${data.result}</p>`;
        }
        if (action === 'analyze') {
            const analysisSection = document.getElementById('analysis-section');
            const analysisContent = document.getElementById('analysis-content');
            analysisSection.style.display = 'block';
            let highlightsHtml = '<ul>';
            data.highlights.forEach(highlight => {
                highlightsHtml += `<li><strong>Highlight:</strong> ${highlight[0]} | <strong>Count:</strong> ${highlight[1]} | <strong>Rank:</strong> ${highlight[2]}</li>`;
            });
            highlightsHtml += '</ul>';
            analysisContent.innerHTML = highlightsHtml;
        }
        if (action === 'identify_speakers') {
            const speakersSection = document.getElementById('speakers-section');
            const speakersContent = document.getElementById('speakers-content');
            speakersSection.style.display = 'block';
            let speakersHtml = '<ul>';
            data.speakers.forEach(speaker => {
                speakersHtml += `<li><strong>Speaker ${speaker.speaker}:</strong> ${speaker.text}</li>`;
            });
            speakersHtml += '</ul>';
            speakersContent.innerHTML = speakersHtml;
        }
    })
    .catch(error => {
        loadingSection.style.display = 'none';
        console.error('Error:', error);
    });
}
// Speech to Text Logic
try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
} catch (e) {
    console.error(e);
    document.querySelector('.no-browser-support').style.display = 'block';
    document.querySelector('.app').style.display = 'none';
}
var noteTextarea = document.getElementById('note-textarea');
var instructions = document.getElementById('recording-instructions');
var notesList = document.getElementById('notes');
var noteContent = '';
// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);
recognition.continuous = true;
recognition.onresult = function(event) {
    var current = event.resultIndex;
    var transcript = event.results[current][0].transcript;
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
    if (!mobileRepeatBug) {
        noteContent += transcript;
        noteTextarea.value = noteContent;
    }
};
recognition.onstart = function() {
    instructions.textContent = 'Voice recognition activated. Try speaking into the microphone.';
};
recognition.onspeechend = function() {
    instructions.textContent = 'You were quiet for a while so voice recognition turned itself off.';
};
recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
        instructions.textContent = 'No speech was detected. Try again.';
    }
};
document.getElementById('start-record-btn').addEventListener('click', function() {
    if (noteContent.length) {
        noteContent += ' ';
    }
    recognition.start();
});
document.getElementById('pause-record-btn').addEventListener('click', function() {
    recognition.stop();
    instructions.textContent = 'Voice recognition paused.';
});
noteTextarea.addEventListener('input', function() {
    noteContent = this.value;
});
document.getElementById('save-note-btn').addEventListener('click', function() {
    recognition.stop();
    if (!noteContent.length) {
        instructions.textContent = 'Could not save empty note. Please add a message to your note.';
    } else {
        saveNote(new Date().toLocaleString(), noteContent);
        noteContent = '';
        renderNotes(getAllNotes());
        noteTextarea.value = '';
        instructions.textContent = 'Note saved successfully.';
    }
});
notesList.addEventListener('click', function(e) {
    e.preventDefault();
    var target = e.target;
    if (target.classList.contains('listen-note')) {
        var content = target.closest('.note').querySelector('.content').textContent;
        readOutLoud(content);
    }
    if (target.classList.contains('delete-note')) {
        var dateTime = target.closest('.note').querySelector('.date').textContent;
        deleteNote(dateTime);
        target.closest('.note').remove();
    }
});
function readOutLoud(message) {
    var speech = new SpeechSynthesisUtterance();
    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 3;
    window.speechSynthesis.speak(speech);
}
function renderNotes(notes) {
    var html = '';
    if (notes.length) {
        notes.forEach(function(note) {
            html += `<li class="note">
            <p class="header">
                <span class="date">${note.date}</span>
                <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
                <a href="#" class="delete-note" title="Delete">Delete</a>
            </p>
            <p class="content">${note.content}</p>
            </li>`;
        });
    } else {
        html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
    }
    notesList.innerHTML = html;
}
function saveNote(dateTime, content) {
    localStorage.setItem('note-' + dateTime, content);
}
function getAllNotes() {
    var notes = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.substring(0, 5) === 'note-') {
            notes.push({
                date: key.replace('note-', ''),
                content: localStorage.getItem(localStorage.key(i))
            });
        }
    }
    return notes;
}
function deleteNote(dateTime) {
    localStorage.removeItem('note-' + dateTime);
}
