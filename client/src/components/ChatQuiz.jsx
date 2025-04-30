import { useState } from 'react';
import '../styles/ChatQuiz.css';

function ChatQuiz({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { text: "Welcome to the Quiz Chat! Select a programming topic and difficulty level to get started.", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isQuizMode, setIsQuizMode] = useState(false);

  const programmingTopics = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 
    'HTML/CSS', 'Data Structures', 'Algorithms', 'Database'
  ];
  
  const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      let botResponse = "Thanks for your question! Our team will get back to you shortly.";
      
      if (isQuizMode) {
        botResponse = `Here's a ${difficulty} level question about ${topic}: 
        ${generateQuizQuestion(topic, difficulty)}`;
      }
      
      setMessages([
        ...newMessages,
        { text: botResponse, sender: 'bot' }
      ]);
    }, 1000);
  };

  const handleStartQuiz = () => {
    if (!topic || !difficulty) {
      setMessages([
        ...messages,
        { text: "Please select both a topic and difficulty level to start the quiz.", sender: 'bot' }
      ]);
      return;
    }

    setIsQuizMode(true);
    setMessages([
      ...messages,
      { 
        text: `Quiz mode activated! You selected ${topic} with ${difficulty} difficulty. Ask for a question to begin!`, 
        sender: 'bot' 
      }
    ]);
  };

  // Simple function to generate a mock quiz question based on topic and difficulty
  const generateQuizQuestion = (topic, difficulty) => {
    const questions = {
      JavaScript: {
        Beginner: "What is the difference between let, const, and var in JavaScript?",
        Intermediate: "Explain how closures work in JavaScript and provide an example.",
        Advanced: "Describe the event loop in JavaScript and how asynchronous operations are handled."
      },
      Python: {
        Beginner: "What is the difference between a list and a tuple in Python?",
        Intermediate: "Explain list comprehensions and provide an example of when to use them.",
        Advanced: "How does Python's Global Interpreter Lock (GIL) affect multithreaded applications?"
      }
      // Questions for other topics would go here in a real implementation
    };

    // Return a question if available for the selected topic/difficulty, otherwise a generic question
    return questions[topic]?.[difficulty] || 
      `What do you know about ${topic} at a ${difficulty} level? (This is a placeholder question)`;
  };

  if (!isOpen) return null;

  return (
    <div className="chat-quiz-container">
      <div className="chat-quiz-header">
        <h3>Programming Quiz Chat</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {!isQuizMode && (
        <div className="quiz-options">
          <div className="select-container">
            <label htmlFor="topic-select">Select Topic:</label>
            <select 
              id="topic-select"
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              className="quiz-select"
            >
              <option value="">-- Select a Topic --</option>
              {programmingTopics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          <div className="select-container">
            <label htmlFor="difficulty-select">Select Difficulty:</label>
            <select 
              id="difficulty-select"
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="quiz-select"
            >
              <option value="">-- Select Difficulty --</option>
              {difficultyLevels.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="start-quiz-button" 
            onClick={handleStartQuiz}
          >
            Start Quiz
          </button>
        </div>
      )}
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isQuizMode ? "Type your answer or ask for a new question..." : "Type your question here..."}
          className="chat-input"
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
}

export default ChatQuiz;