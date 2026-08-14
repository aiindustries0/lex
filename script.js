const messages = document.getElementById('messages');
const emptyState = document.getElementById('emptyState');
const input = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typing = document.getElementById('typing');
const voiceButton = document.getElementById('voiceButton');
const apiKeyInput = document.getElementById('apiKey');
const saveKeyButton = document.getElementById('saveKey');

let waiting = false;
let voiceEnabled = false;
const storedKey = localStorage.getItem('lex-gemini-key');
if (storedKey) apiKeyInput.value = storedKey;

function scrollToLatest() {
  requestAnimationFrame(() => messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' }));
}

function addMessage(text, role) {
  emptyState.hidden = true;
  const row = document.createElement('div');
  row.className = `message ${role}`;
  if (role === 'lex') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'L';
    row.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  messages.appendChild(row);
  scrollToLatest();
}

function setWaiting(value) {
  waiting = value;
  typing.hidden = !value;
  sendButton.disabled = value;
  input.disabled = value;
  if (value) scrollToLatest();
}

function speechSupported() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function preferredVoice() {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const preferred = ['Google US English', 'Samantha', 'Microsoft Zira', 'Karen', 'Moira'];
  return voices.find(voice => preferred.some(name => voice.name.toLowerCase().includes(name.toLowerCase())))
    || voices.find(voice => voice.lang.toLowerCase().startsWith('en'))
    || voices[0]
    || null;
}

function speak(text) {
  if (!voiceEnabled || !speechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = preferredVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = 'en-US';
  utterance.rate = 1.04;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message || waiting) return;
  addMessage(message, 'user');
  input.value = '';
  input.style.height = 'auto';
  setWaiting(true);
  try {
    const payload = { message };
    const key = localStorage.getItem('lex-gemini-key');
    if (key) payload.apiKey = key;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Lex could not answer right now');
    const reply = data.reply || data.text;
    if (!reply) throw new Error('Lex returned an empty reply');
    addMessage(reply, 'lex');
    speak(reply);
  } catch (error) {
    addMessage(`Connection check: ${error.message}`, 'lex');
  } finally {
    setWaiting(false);
    input.focus();
  }
}

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
});
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
sendButton.addEventListener('click', sendMessage);
voiceButton.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  voiceButton.setAttribute('aria-pressed', String(voiceEnabled));
  if (!voiceEnabled && speechSupported()) window.speechSynthesis.cancel();
  if (voiceEnabled && !speechSupported()) {
    addMessage('Voice replies are not supported by this browser', 'lex');
  }
});
saveKeyButton.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) localStorage.setItem('lex-gemini-key', key);
  else localStorage.removeItem('lex-gemini-key');
  saveKeyButton.textContent = 'SAVED';
  setTimeout(() => { saveKeyButton.textContent = 'SAVE'; }, 1400);
});
if (speechSupported()) window.speechSynthesis.onvoiceschanged = () => preferredVoice();
