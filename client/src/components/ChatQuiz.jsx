import { useState, useEffect, useRef } from 'react';
import '../styles/ChatQuiz.css';
import axios from 'axios';

function ChatQuiz({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { text: "Welcome to the Interactive Quiz! Select a topic and difficulty level to get started.", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const messagesEndRef = useRef(null);

  const difficultyLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' }, 
    { value: 'hard', label: 'Hard' },
    { value: 'expert', label: 'Expert' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateQuiz = async () => {
    if (!topic) {
      addBotMessage("Please enter a topic first.");
      return;
    }

    setIsLoading(true);
    addBotMessage(`Generating a ${difficulty} level quiz about ${topic}...`);

    try {
      const response = await axios.post('https://ip.dhronz.space/gemini/generate-quiz', {
        topic,
        difficulty,
        numberOfQuestions: 5
      });

      const quizData = response.data.data;
      setCurrentQuiz(quizData);
      
      addBotMessage(`Quiz generated! I've prepared ${quizData.questionCount} questions about ${topic}.`);
      showQuestion(0);
      setUserAnswers({});
    } catch (error) {
      console.error('Error generating quiz:', error);
      addBotMessage("Sorry, I had trouble generating the quiz. Please try again or try a different topic.");
    } finally {
      setIsLoading(false);
    }
  };

  const showQuestion = (index) => {
    if (!currentQuiz || index >= currentQuiz.quiz.length) return;

    const question = currentQuiz.quiz[index];
    setCurrentQuestion({ ...question, index });
    
    const questionText = `
Question ${index + 1}/${currentQuiz.quiz.length}: ${question.question}
A: ${question.options.A}
B: ${question.options.B}
C: ${question.options.C}
D: ${question.options.D}

Type your answer (A, B, C, or D) or type "hint" if you need help.`;

    addBotMessage(questionText);
  };

  const submitAnswer = async (answer) => {
    if (!currentQuestion) return;
    
    const questionIndex = currentQuestion.index;
    
    const newUserAnswers = { ...userAnswers };
    newUserAnswers[questionIndex] = answer;
    setUserAnswers(newUserAnswers);

    addUserMessage(answer);
    setIsLoading(true);
    
    try {
      const response = await axios.post('https://ip.dhronz.space/gemini/check-answers', {
        quizId: currentQuiz.quizId,
        answers: [answer],
        questionIndices: [questionIndex]
      });
      
      const result = response.data.data.results[0];
      
      if (result.isCorrect) {
        addBotMessage(`✅ Correct! ${result.explanation}`);
      } else {
        addBotMessage(`❌ Not quite. The correct answer is ${result.correctAnswer}: ${result.correctOption}. 
${result.explanation}`);
      }
      
      if (questionIndex === currentQuiz.quiz.length - 1) {
        checkAllAnswers();
      } else {
        setTimeout(() => {
          showQuestion(questionIndex + 1);
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      addBotMessage("Sorry, I had trouble checking your answer. Let's continue with the next question.");
      showQuestion(questionIndex + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const getHint = async () => {
    if (!currentQuestion) return;
    
    setIsLoading(true);
    addUserMessage("hint");
    
    try {
      const response = await axios.post('https://ip.dhronz.space/gemini/get-hint', {
        quizId: currentQuiz.quizId,
        questionIndex: currentQuestion.index
      });
      
      addBotMessage(`Hint: ${response.data.data.hint}`);
    } catch (error) {
      console.error('Error getting hint:', error);
      addBotMessage("Sorry, I couldn't generate a hint right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllAnswers = async () => {
    if (!currentQuiz) return;
    
    setIsLoading(true);
    addBotMessage("Calculating your final results...");
    
    try {
      const answersArray = Object.keys(userAnswers).map(index => userAnswers[index]);
      
      const response = await axios.post('https://ip.dhronz.space/gemini/check-answers', {
        quizId: currentQuiz.quizId,
        answers: answersArray
      });
      
      const results = response.data.data;
      
      addBotMessage(`
📊 Quiz Results
Score: ${results.score}%
Correct: ${results.correctCount}/${results.totalQuestions}
${results.performanceMessage}

Would you like to try another quiz? Enter a new topic to begin.`);
      
      setCurrentQuiz(null);
      setCurrentQuestion(null);
    } catch (error) {
      console.error('Error checking all answers:', error);
      addBotMessage("Sorry, I had trouble calculating your final score.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    const userInput = inputText.trim();
    setInputText('');
    
    if (currentQuestion) {
      if (userInput.toLowerCase() === 'hint') {
        await getHint();
      } else if (/^[abcd]$/i.test(userInput)) {
        await submitAnswer(userInput.toUpperCase());
      } else {
        addUserMessage(userInput);
        addBotMessage("Please answer with A, B, C, or D, or type 'hint' for a clue.");
      }
    } else if (currentQuiz) {
      addUserMessage(userInput);
      addBotMessage("Let me know when you're ready for the next question.");
    } else if (userInput.toLowerCase().includes('quiz')) {
      addUserMessage(userInput);
      if (topic) {
        generateQuiz();
      } else {
        addBotMessage("What topic would you like a quiz on?");
      }
    } else {
      addUserMessage(userInput);
      setTopic(userInput);
      addBotMessage(`Great! I can create a quiz about "${userInput}". Click the "Generate Quiz" button when you're ready.`);
    }
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: 'user' }]);
  };

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: 'bot' }]);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-quiz-container">
      <div className="chat-quiz-header">
        <div className="header-content">
          <i className="fas fa-brain quiz-icon"></i>
          <h3>Interactive Quiz</h3>
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="quiz-options">
        <div className="select-container">
          <label htmlFor="topic-input">Topic:</label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter quiz topic"
            className="topic-input"
          />
        </div>
        
        <div className="select-container">
          <label htmlFor="difficulty-select">Difficulty:</label>
          <select 
            id="difficulty-select"
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="quiz-select"
          >
            {difficultyLevels.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="start-quiz-button" 
          onClick={generateQuiz}
          disabled={isLoading || !topic}
        >
          {isLoading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <pre>{message.text}</pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={currentQuestion ? "Type A, B, C, D or 'hint'..." : "Type a topic for a quiz..."}
          className="chat-input"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
        </button>
      </form>
    </div>
  );
}

export default ChatQuiz;