const axios = require('axios');
const logger = require('../utils/logger');

class WatsonXService {
  constructor() {
    // Read lazily so dotenv has time to load
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  get apiKey() { return process.env.WATSONX_API_KEY; }
  get projectId() { return process.env.WATSONX_PROJECT_ID; }
  get baseUrl() { return process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com'; }
  get modelId() { return process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-chat-v2'; }
  get instructModelId() { return process.env.WATSONX_INSTRUCT_MODEL || 'ibm/granite-13b-instruct-v2'; }

  async getAccessToken() {
    if (!this.apiKey || this.apiKey === 'your_ibm_watsonx_api_key') {
      throw new Error('WATSONX_API_KEY not configured in .env');
    }
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    try {
      const response = await axios.post(
        'https://iam.cloud.ibm.com/identity/token',
        new URLSearchParams({ grant_type: 'urn:ibm:params:oauth:grant-type:apikey', apikey: this.apiKey }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
      );
      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken;
    } catch (error) {
      const msg = error.response?.data?.errorMessage || error.message;
      logger.error(`WatsonX token error: ${msg}`);
      throw new Error(`IBM watsonx.ai auth failed: ${msg}`);
    }
  }

  async generateText(prompt, options = {}) {
    try {
      const token = await this.getAccessToken();
      const modelId = options.model || this.modelId;
      
      const decodingMethod = options.decodingMethod || 'greedy';
      const payload = {
        model_id: modelId,
        input: prompt,
        parameters: {
          decoding_method: decodingMethod,
          max_new_tokens: options.maxTokens || 1500,
          // min_new_tokens only valid for sample decoding
          ...(decodingMethod === 'sample' && { min_new_tokens: options.minTokens || 1 }),
          ...(decodingMethod === 'sample' && { temperature: options.temperature || 0.7 }),
          ...(decodingMethod === 'sample' && { top_k: options.topK || 50 }),
          ...(decodingMethod === 'sample' && { top_p: options.topP || 0.95 }),
          repetition_penalty: options.repetitionPenalty || 1.1,
          stop_sequences: options.stopSequences || [],
        },
        project_id: this.projectId,
      };

      const response = await axios.post(
        `${this.baseUrl}/ml/v1/text/generation?version=2023-05-29`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 90000,
        }
      );

      const result = response.data?.results?.[0];
      if (!result) throw new Error('No result from watsonx.ai');
      
      return {
        text: result.generated_text?.trim() || '',
        tokensUsed: result.generated_token_count || 0,
        stopReason: result.stop_reason,
        model: modelId,
      };
    } catch (error) {
      const errMsg = error.response?.data?.errors?.[0]?.message
        || error.response?.data?.message
        || error.message;
      logger.error(`WatsonX generation error: ${errMsg}`);
      // Use fallback in development so app never breaks
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using development fallback response');
        return this._developmentFallback(prompt, options);
      }
      throw new Error(`AI generation failed: ${errMsg}`);
    }
  }

  async generateChat(messages, systemPrompt = '', options = {}) {
    const formattedPrompt = this._formatChatPrompt(messages, systemPrompt);
    return this.generateText(formattedPrompt, { ...options, maxTokens: options.maxTokens || 2000 });
  }

  _formatChatPrompt(messages, systemPrompt) {
    let prompt = '';
    if (systemPrompt) {
      prompt += `<|system|>\n${systemPrompt}\n<|end_of_text|>\n`;
    }
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `<|user|>\n${msg.content}\n<|end_of_text|>\n`;
      } else if (msg.role === 'assistant') {
        prompt += `<|assistant|>\n${msg.content}\n<|end_of_text|>\n`;
      }
    }
    prompt += `<|assistant|>\n`;
    return prompt;
  }

  // === Agentic AI Methods ===

  async assessSkills(userProfile, answers) {
    const prompt = `<|system|>
You are an expert AI skill assessor for LearnMate AI. Analyze the student's responses and provide a detailed skill assessment. Be specific, accurate, and encouraging.
<|end_of_text|>
<|user|>
Student Profile:
- Name: ${userProfile.name}
- Current Skills: ${userProfile.currentSkills?.join(', ') || 'None specified'}
- Career Goal: ${userProfile.careerGoal || 'Not specified'}
- Experience: ${userProfile.yearsOfExperience || 0} years

Assessment Answers: ${JSON.stringify(answers, null, 2)}

Provide a JSON response with this EXACT structure:
{
  "overallScore": <number 0-100>,
  "skillResults": [
    {"skill": "<skill name>", "score": <0-100>, "level": "<novice|beginner|intermediate|advanced|expert>", "recommendation": "<specific advice>"}
  ],
  "strengthAreas": ["<strength1>", "<strength2>"],
  "weakAreas": ["<weakness1>", "<weakness2>"],
  "aiAnalysis": "<2-3 paragraph detailed analysis>",
  "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
}
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 2000, temperature: 0.3 });
    return this._parseJSON(result.text) || this._defaultAssessmentResult();
  }

  async generateRoadmap(userProfile, assessmentResults) {
    const prompt = `<|system|>
You are LearnMate AI's expert curriculum designer and career coach. Create a detailed, personalized learning roadmap that will transform this student into a professional in their target role. Be specific with timelines, resources, and projects.
<|end_of_text|>
<|user|>
Student Profile:
- Name: ${userProfile.name}
- Target Role: ${userProfile.targetRole || userProfile.careerGoal}
- Current Skills: ${userProfile.currentSkills?.join(', ') || 'Beginner'}
- Learning Hours/Day: ${userProfile.learningPreferences?.studyHoursPerDay || 2}
- Learning Style: ${userProfile.learningPreferences?.preferredStyle || 'mixed'}
- Experience: ${userProfile.yearsOfExperience || 0} years
- Education: ${userProfile.education || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Technology'}

Skill Assessment Results: ${JSON.stringify(assessmentResults?.skillResults?.slice(0, 5) || [], null, 2)}

Create a comprehensive learning roadmap as JSON:
{
  "title": "<roadmap title>",
  "description": "<overview>",
  "estimatedDuration": <weeks>,
  "estimatedCompletionDate": "<ISO date>",
  "aiReasoning": "<why this roadmap suits this student>",
  "phases": [
    {
      "phaseNumber": 1,
      "title": "<phase title>",
      "description": "<phase overview>",
      "duration": <weeks>,
      "skills": ["<skill1>", "<skill2>"],
      "courses": [
        {
          "title": "<course title>",
          "platform": "<Coursera|Udemy|YouTube|freeCodeCamp|edX|Khan Academy>",
          "url": "<course url>",
          "duration": <hours>,
          "isPrimary": true,
          "order": 1
        }
      ],
      "projects": [
        {
          "title": "<project name>",
          "description": "<what to build>",
          "difficulty": "<beginner|intermediate|advanced>",
          "skills": ["<skill>"],
          "estimatedHours": <number>
        }
      ],
      "milestones": [
        {"title": "<milestone>", "description": "<description>"}
      ]
    }
  ]
}

Create 4-6 phases with real course recommendations. Focus on practical skills and projects.
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 4000, temperature: 0.4 });
    return this._parseJSON(result.text) || this._defaultRoadmap(userProfile);
  }

  async getCoachResponse(messages, userContext, agentState) {
    const systemPrompt = `You are LearnMate AI, an expert Agentic AI Learning Coach. Your role is to autonomously guide students through their personalized learning journey.

Student Context:
- Name: ${userContext.name}
- Career Goal: ${userContext.careerGoal || 'Not set yet'}
- Current Level: ${userContext.currentRole || 'Student'}
- Target Role: ${userContext.targetRole || 'To be determined'}
- Skills: ${userContext.currentSkills?.join(', ') || 'Assessing...'}
- Study Hours/Day: ${userContext.learningPreferences?.studyHoursPerDay || 2}
- XP Points: ${userContext.xpPoints || 0}
- Learning Streak: ${userContext.streak?.current || 0} days

Current Agent State: ${agentState?.currentPhase || 'greeting'}
Collected Info: ${JSON.stringify(agentState?.collectedInfo || {}, null, 2)}

Your behavior rules:
1. ALWAYS be personalized - use the student's name and reference their specific goals
2. Ask follow-up questions to better understand needs before making recommendations
3. If goal/career not set, ask about it
4. Proactively suggest next learning steps without waiting to be asked
5. Detect patterns in questions to identify knowledge gaps
6. Provide specific, actionable recommendations with real resources
7. Celebrate progress and maintain motivation
8. Adapt difficulty based on their level
9. Always explain WHY you recommend something
10. Guide them through a complete learning journey autonomously

Respond naturally and conversationally. Be encouraging, specific, and genuinely helpful.`;

    return this.generateChat(messages, systemPrompt, { maxTokens: 1500, temperature: 0.8 });
  }

  async generateStudyPlan(userProfile, roadmap, weekNumber = 1) {
    const prompt = `<|system|>
You are a study planning expert AI. Create a detailed, realistic study plan.
<|end_of_text|>
<|user|>
Student: ${userProfile.name}
Available Hours/Day: ${userProfile.learningPreferences?.studyHoursPerDay || 2}
Preferred Time: ${userProfile.learningPreferences?.preferredTime || 'flexible'}
Current Phase: ${roadmap?.phases?.[0]?.title || 'Phase 1'}
Week Number: ${weekNumber}

Create a weekly study plan as JSON:
{
  "weekNumber": ${weekNumber},
  "weeklyGoal": "<main goal for this week>",
  "totalHours": <number>,
  "days": [
    {
      "day": "Monday",
      "date": "<date>",
      "tasks": [
        {
          "time": "09:00",
          "duration": 60,
          "title": "<task title>",
          "description": "<what to do>",
          "type": "video|reading|practice|project|quiz",
          "resource": "<resource name>",
          "priority": "high|medium|low"
        }
      ],
      "totalMinutes": <number>,
      "focusArea": "<main topic>"
    }
  ],
  "weeklyMilestones": ["<milestone1>", "<milestone2>"],
  "motivationalTip": "<personalized tip>"
}
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 3000, temperature: 0.5 });
    return this._parseJSON(result.text) || this._defaultStudyPlan(userProfile, weekNumber);
  }

  async analyzeResume(resumeText, targetRole) {
    const prompt = `<|system|>
You are an expert career counselor and resume analyst. Provide detailed, actionable resume gap analysis.
<|end_of_text|>
<|user|>
Target Role: ${targetRole}
Resume Content: ${resumeText.substring(0, 3000)}

Analyze this resume and provide a JSON response:
{
  "overallScore": <0-100>,
  "careerReadinessScore": <0-100>,
  "presentSkills": ["<skill1>"],
  "missingSkills": ["<skill1>"],
  "strengthAreas": ["<strength>"],
  "gapAreas": ["<gap>"],
  "recommendations": [
    {
      "category": "<Technical Skills|Soft Skills|Experience|Education|Certifications>",
      "issue": "<what's missing>",
      "action": "<specific action to take>",
      "priority": "<high|medium|low>",
      "timeToAddress": "<e.g., 2-4 weeks>"
    }
  ],
  "estimatedTimeToReady": "<e.g., 3-6 months>",
  "topCertifications": ["<certification1>"],
  "summary": "<2 paragraph professional analysis>"
}
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 2000, temperature: 0.3 });
    return this._parseJSON(result.text) || { overallScore: 50, recommendations: [], summary: 'Analysis pending' };
  }

  async generateInterviewPrep(role, skills, experienceLevel) {
    const prompt = `<|system|>
You are an expert technical interviewer and career coach for ${role} positions.
<|end_of_text|>
<|user|>
Role: ${role}
Skills: ${skills?.join(', ')}
Experience Level: ${experienceLevel || 'junior'}

Generate interview preparation content as JSON:
{
  "commonQuestions": [
    {
      "category": "<Behavioral|Technical|System Design|Culture>",
      "question": "<interview question>",
      "keyPoints": ["<point1>", "<point2>"],
      "sampleAnswer": "<framework for answering>",
      "difficulty": "<easy|medium|hard>"
    }
  ],
  "technicalTopics": ["<topic1>"],
  "studyResources": ["<resource1>"],
  "preparationPlan": "<week by week plan>",
  "salaryRange": "<range for the role>",
  "tipOfTheDay": "<interview tip>",
  "redFlags": ["<what to avoid>"],
  "questionsToAsk": ["<question to ask interviewer>"]
}

Include 8-10 questions across different categories.
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 3000, temperature: 0.5 });
    return this._parseJSON(result.text) || { commonQuestions: [], technicalTopics: [], preparationPlan: '' };
  }

  async generateLearningInsights(progressData, userProfile) {
    const prompt = `<|system|>
You are an expert learning analytics AI. Generate personalized insights based on learning data.
<|end_of_text|>
<|user|>
Student: ${userProfile.name}
Learning Data: ${JSON.stringify(progressData, null, 2)}

Generate personalized insights as JSON:
{
  "productivityScore": <0-100>,
  "learningVelocity": "<increasing|decreasing|stable>",
  "bestStudyTime": "<morning|afternoon|evening>",
  "strongestSubject": "<subject>",
  "needsAttention": "<subject needing focus>",
  "weeklyInsight": "<2-3 sentence insight>",
  "recommendations": ["<action1>", "<action2>", "<action3>"],
  "motivationalMessage": "<personalized motivation>",
  "predictedCompletionDate": "<date>",
  "improvementAreas": ["<area1>"],
  "achievements": ["<recent achievement>"],
  "nextMilestone": "<what to achieve next>"
}
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 1500, temperature: 0.6 });
    return this._parseJSON(result.text) || this._defaultInsights();
  }

  async predictCareerPath(userProfile, assessmentResults) {
    const prompt = `<|system|>
You are an expert career advisor AI with knowledge of industry trends and career paths.
<|end_of_text|>
<|user|>
Profile:
- Current Skills: ${userProfile.currentSkills?.join(', ')}
- Interests: ${userProfile.interests?.join(', ')}
- Education: ${userProfile.education}
- Experience: ${userProfile.yearsOfExperience} years
- Assessment Score: ${assessmentResults?.overallScore || 0}/100

Generate career predictions as JSON:
{
  "primaryCareerPath": {
    "role": "<role>",
    "probability": <0-100>,
    "averageSalary": "<range>",
    "timeToReady": "<months>",
    "demandTrend": "<growing|stable|declining>",
    "description": "<why this role suits them>"
  },
  "alternativeCareerPaths": [
    {
      "role": "<role>",
      "probability": <0-100>,
      "averageSalary": "<range>",
      "timeToReady": "<months>",
      "description": "<brief description>"
    }
  ],
  "keySkillsNeeded": ["<skill>"],
  "industryTrends": "<relevant trends>",
  "careerReadinessScore": <0-100>,
  "nextSteps": ["<step1>", "<step2>", "<step3>"]
}
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 2000, temperature: 0.4 });
    return this._parseJSON(result.text) || this._defaultCareerPrediction(userProfile);
  }

  async generateProjectRecommendations(skills, level, completedProjects = []) {
    const prompt = `<|system|>
You are a software project mentor recommending hands-on projects for skill development.
<|end_of_text|>
<|user|>
Skills: ${skills?.join(', ')}
Level: ${level}
Completed Projects: ${completedProjects?.join(', ') || 'None yet'}

Recommend 5 projects as JSON array:
[
  {
    "title": "<project name>",
    "description": "<what to build and why>",
    "difficulty": "<beginner|intermediate|advanced>",
    "estimatedHours": <number>,
    "skills": ["<required skill>"],
    "outcomes": ["<what they'll learn>"],
    "techStack": ["<technology>"],
    "githubTopics": ["<topic>"],
    "resources": ["<resource>"],
    "portfolioValue": "<high|medium|low>",
    "industryRelevance": "<high|medium|low>"
  }
]
<|end_of_text|>
<|assistant|>`;

    const result = await this.generateText(prompt, { maxTokens: 2500, temperature: 0.6 });
    return this._parseJSON(result.text) || [];
  }

  _parseJSON(text) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch {
      // Try to extract code block
      const codeMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (codeMatch) {
        try {
          return JSON.parse(codeMatch[1]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  _developmentFallback(prompt, options) {
    logger.warn('Using development fallback for AI');
    const p = prompt.toLowerCase();

    // Return structured JSON for assessment questions
    if (p.includes('assessment') || p.includes('questions') || p.includes('json array')) {
      const domain = (prompt.match(/Domain:\s*([^\n]+)/)?.[1] || 'Programming').trim();
      return { text: JSON.stringify(this._getDefaultQuestions(domain)), tokensUsed: 0, model: 'fallback' };
    }

    // Return structured JSON for roadmap
    if (p.includes('roadmap') || p.includes('phases') || p.includes('learning path')) {
      const role = (prompt.match(/Target Role:\s*([^\n]+)/)?.[1] || 'Software Developer').trim();
      return { text: JSON.stringify(this._defaultRoadmap({ targetRole: role })), tokensUsed: 0, model: 'fallback' };
    }

    // Return structured JSON for study plan
    if (p.includes('study plan') || p.includes('weekly') || p.includes('monday')) {
      return { text: JSON.stringify(this._defaultStudyPlan({ learningPreferences: { studyHoursPerDay: 2 } }, 1)), tokensUsed: 0, model: 'fallback' };
    }

    // Return structured JSON for insights
    if (p.includes('insights') || p.includes('productivity') || p.includes('learning data')) {
      return { text: JSON.stringify(this._defaultInsights()), tokensUsed: 0, model: 'fallback' };
    }

    // Return structured JSON for career
    if (p.includes('career') || p.includes('salary') || p.includes('prediction')) {
      return { text: JSON.stringify(this._defaultCareerPrediction({ targetRole: 'Software Developer' })), tokensUsed: 0, model: 'fallback' };
    }

    // Return structured JSON for resume
    if (p.includes('resume') || p.includes('skill gap') || p.includes('overall score')) {
      return { text: JSON.stringify({ overallScore: 65, careerReadinessScore: 60, presentSkills: ['JavaScript', 'HTML', 'CSS'], missingSkills: ['React', 'Node.js', 'SQL'], strengthAreas: ['Frontend basics'], gapAreas: ['Backend development', 'Databases'], recommendations: [{ category: 'Technical Skills', issue: 'Missing backend skills', action: 'Learn Node.js and Express.js', priority: 'high', timeToAddress: '4-6 weeks' }], estimatedTimeToReady: '3-6 months', topCertifications: ['AWS Certified Developer', 'Meta Front-End Developer'], summary: 'Good foundational skills. Focus on full-stack development to reach your target role.' }), tokensUsed: 0, model: 'fallback' };
    }

    // Return structured JSON for interview prep
    if (p.includes('interview') || p.includes('question') || p.includes('salary range')) {
      return { text: JSON.stringify({ commonQuestions: [{ category: 'Technical', question: 'What is the difference between null and undefined in JavaScript?', keyPoints: ['null is intentional absence', 'undefined means not yet assigned'], sampleAnswer: 'null is explicitly assigned to indicate no value, while undefined means the variable has been declared but not assigned.', difficulty: 'easy' }, { category: 'Behavioral', question: 'Tell me about a challenging project you worked on.', keyPoints: ['Use STAR method', 'Show problem solving'], sampleAnswer: 'Use the STAR method: Situation, Task, Action, Result.', difficulty: 'medium' }, { category: 'Technical', question: 'Explain how React hooks work.', keyPoints: ['useState for state', 'useEffect for side effects', 'Rules of hooks'], sampleAnswer: 'Hooks let you use state and lifecycle features in functional components.', difficulty: 'medium' }], technicalTopics: ['JavaScript ES6+', 'React Hooks', 'REST APIs', 'Git'], preparationPlan: 'Week 1: Review fundamentals. Week 2: Practice coding. Week 3: Mock interviews.', salaryRange: '$60,000 - $90,000', tipOfTheDay: 'Research the company before the interview and prepare 3 thoughtful questions to ask.', questionsToAsk: ['What does success look like in this role?', 'How does the team handle code reviews?'] }), tokensUsed: 0, model: 'fallback' };
    }

    // Default chat response
    return {
      text: `👋 I'm your LearnMate AI Coach! I'm currently running in **demo mode** while IBM watsonx.ai credentials are being configured.\n\nI can still help you:\n- 📊 **Take a skill assessment** — Go to Assessment page\n- 🗺️ **Generate your roadmap** — Go to Roadmap page  \n- 📅 **Create a study plan** — Go to Study Planner\n- 🎯 **Set learning goals** — Go to Achievements\n\nTo enable full IBM Granite AI:\n1. Go to [dataplatform.cloud.ibm.com](https://dataplatform.cloud.ibm.com)\n2. Create a new project\n3. Copy Project ID and API key to your .env file`,
      tokensUsed: 0,
      model: 'fallback',
    };
  }

  _getDefaultQuestions(domain) {
    const banks = {
      'Web Development': [
        { question: 'What does HTML stand for?', type: 'multiple-choice', options: ['A) HyperText Markup Language', 'B) High Tech Modern Language', 'C) Home Tool Markup Language', 'D) Hyperlink Text Mode Language'], correctAnswer: 'A', skillArea: 'HTML', difficulty: 'easy', points: 1, explanation: 'HTML = HyperText Markup Language, the standard markup language for web pages.' },
        { question: 'Which CSS property is used to change text color?', type: 'multiple-choice', options: ['A) text-color', 'B) font-color', 'C) color', 'D) text-style'], correctAnswer: 'C', skillArea: 'CSS', difficulty: 'easy', points: 1, explanation: 'The "color" property sets the color of text in CSS.' },
        { question: 'What is the correct way to declare a JavaScript variable?', type: 'multiple-choice', options: ['A) variable x = 5', 'B) var x = 5', 'C) x = var 5', 'D) declare x = 5'], correctAnswer: 'B', skillArea: 'JavaScript', difficulty: 'easy', points: 1, explanation: 'var, let, and const are used to declare variables in JavaScript.' },
        { question: 'What does CSS stand for?', type: 'multiple-choice', options: ['A) Computer Style Sheets', 'B) Creative Style Sheets', 'C) Cascading Style Sheets', 'D) Colorful Style Sheets'], correctAnswer: 'C', skillArea: 'CSS', difficulty: 'easy', points: 1, explanation: 'CSS = Cascading Style Sheets.' },
        { question: 'Which HTML tag is used for the largest heading?', type: 'multiple-choice', options: ['A) <h6>', 'B) <heading>', 'C) <head>', 'D) <h1>'], correctAnswer: 'D', skillArea: 'HTML', difficulty: 'easy', points: 1, explanation: '<h1> defines the largest heading in HTML.' },
        { question: 'What is the purpose of the JavaScript "async/await" syntax?', type: 'multiple-choice', options: ['A) To write synchronous code', 'B) To handle asynchronous operations more cleanly', 'C) To speed up code execution', 'D) To declare variables'], correctAnswer: 'B', skillArea: 'JavaScript', difficulty: 'medium', points: 2, explanation: 'async/await makes asynchronous code look and behave like synchronous code.' },
        { question: 'What is the CSS Box Model?', type: 'multiple-choice', options: ['A) A 3D modeling tool', 'B) A layout model describing element spacing with margin, border, padding, content', 'C) A JavaScript library', 'D) A color system'], correctAnswer: 'B', skillArea: 'CSS', difficulty: 'medium', points: 2, explanation: 'The Box Model describes how elements are sized with content, padding, border, and margin.' },
        { question: 'What is "hoisting" in JavaScript?', type: 'multiple-choice', options: ['A) Moving elements up in the DOM', 'B) JavaScript moving declarations to the top of scope before execution', 'C) A CSS animation technique', 'D) A React concept'], correctAnswer: 'B', skillArea: 'JavaScript', difficulty: 'medium', points: 2, explanation: 'Hoisting moves variable and function declarations to the top of their scope.' },
        { question: 'What is the difference between == and === in JavaScript?', type: 'multiple-choice', options: ['A) No difference', 'B) == checks value only, === checks value and type', 'C) === is faster', 'D) == is used for objects only'], correctAnswer: 'B', skillArea: 'JavaScript', difficulty: 'medium', points: 2, explanation: '== does type coercion while === checks both value and type strictly.' },
        { question: 'What is a RESTful API?', type: 'multiple-choice', options: ['A) A type of database', 'B) An architectural style for web services using HTTP methods', 'C) A JavaScript framework', 'D) A CSS technique'], correctAnswer: 'B', skillArea: 'APIs', difficulty: 'hard', points: 3, explanation: 'REST (Representational State Transfer) is an architectural style using HTTP verbs (GET, POST, PUT, DELETE).' },
      ],
      'Data Science': [
        { question: 'What is a pandas DataFrame?', type: 'multiple-choice', options: ['A) A type of database', 'B) A 2D labeled data structure in Python', 'C) A machine learning model', 'D) A visualization tool'], correctAnswer: 'B', skillArea: 'Pandas', difficulty: 'easy', points: 1, explanation: 'A DataFrame is a 2D labeled data structure with rows and columns, like a spreadsheet.' },
        { question: 'What does "overfitting" mean in machine learning?', type: 'multiple-choice', options: ['A) Model performs well on training data but poorly on new data', 'B) Model is too simple', 'C) Model trains too slowly', 'D) Model uses too much memory'], correctAnswer: 'A', skillArea: 'Machine Learning', difficulty: 'medium', points: 2, explanation: 'Overfitting occurs when a model memorizes training data but fails to generalize.' },
        { question: 'What is the purpose of train/test split?', type: 'multiple-choice', options: ['A) Speed up training', 'B) Evaluate model performance on unseen data', 'C) Reduce dataset size', 'D) Fix missing values'], correctAnswer: 'B', skillArea: 'Machine Learning', difficulty: 'easy', points: 1, explanation: 'We split data to train on one part and evaluate on another to check generalization.' },
        { question: 'What is NumPy used for?', type: 'multiple-choice', options: ['A) Web development', 'B) Numerical computing with arrays', 'C) Database management', 'D) UI design'], correctAnswer: 'B', skillArea: 'NumPy', difficulty: 'easy', points: 1, explanation: 'NumPy provides fast numerical operations on multi-dimensional arrays.' },
        { question: 'What is a confusion matrix?', type: 'multiple-choice', options: ['A) A type of neural network', 'B) A table showing actual vs predicted classification results', 'C) A data cleaning technique', 'D) A type of chart'], correctAnswer: 'B', skillArea: 'Machine Learning', difficulty: 'medium', points: 2, explanation: 'A confusion matrix shows TP, TN, FP, FN for classification model evaluation.' },
        { question: 'What does SQL stand for?', type: 'multiple-choice', options: ['A) Structured Query Language', 'B) Simple Query Logic', 'C) System Query Layer', 'D) Standard Query List'], correctAnswer: 'A', skillArea: 'SQL', difficulty: 'easy', points: 1, explanation: 'SQL = Structured Query Language for managing relational databases.' },
        { question: 'What is the difference between supervised and unsupervised learning?', type: 'multiple-choice', options: ['A) Speed of training', 'B) Supervised uses labeled data, unsupervised finds patterns without labels', 'C) Type of hardware used', 'D) Number of features'], correctAnswer: 'B', skillArea: 'Machine Learning', difficulty: 'medium', points: 2, explanation: 'Supervised learning uses labeled examples; unsupervised finds hidden patterns.' },
        { question: 'What is a neural network?', type: 'multiple-choice', options: ['A) A computer network', 'B) A machine learning model inspired by the human brain with interconnected nodes', 'C) A type of database', 'D) A programming language'], correctAnswer: 'B', skillArea: 'Deep Learning', difficulty: 'medium', points: 2, explanation: 'Neural networks are layers of interconnected nodes that learn patterns from data.' },
        { question: 'What is cross-validation used for?', type: 'multiple-choice', options: ['A) Data visualization', 'B) Robustly estimating model performance using multiple train/test splits', 'C) Feature engineering', 'D) Data collection'], correctAnswer: 'B', skillArea: 'Machine Learning', difficulty: 'hard', points: 3, explanation: 'Cross-validation averages performance across multiple folds for reliable evaluation.' },
        { question: 'What is gradient descent?', type: 'multiple-choice', options: ['A) A data sorting algorithm', 'B) An optimization algorithm that minimizes loss by updating model parameters', 'C) A type of neural network', 'D) A data cleaning method'], correctAnswer: 'B', skillArea: 'Machine Learning', difficulty: 'hard', points: 3, explanation: 'Gradient descent iteratively updates parameters to minimize the loss function.' },
      ],
    };
    const questions = banks[domain] || banks['Web Development'];
    return questions.slice(0, 10);
  }

  _defaultAssessmentResult() {
    return {
      overallScore: 50,
      skillResults: [{ skill: 'General Knowledge', score: 50, level: 'beginner', recommendation: 'Continue learning fundamentals' }],
      strengthAreas: ['Dedication to learning'],
      weakAreas: ['Technical depth'],
      aiAnalysis: 'Initial assessment complete. Your learning journey begins now!',
      recommendations: ['Start with foundational courses', 'Practice daily', 'Join a learning community'],
    };
  }

  _defaultRoadmap(userProfile) {
    return {
      title: `${userProfile.targetRole || 'Software Developer'} Learning Path`,
      description: 'Your personalized learning journey starts here',
      estimatedDuration: 24,
      aiReasoning: 'This roadmap is tailored to your current skill level and career goals.',
      phases: [
        {
          phaseNumber: 1,
          title: 'Foundation',
          description: 'Build core fundamentals',
          duration: 6,
          skills: ['HTML', 'CSS', 'JavaScript'],
          courses: [{ title: 'Web Development Fundamentals', platform: 'freeCodeCamp', url: 'https://freecodecamp.org', duration: 40, isPrimary: true, order: 1 }],
          projects: [{ title: 'Personal Portfolio Website', description: 'Build a responsive portfolio', difficulty: 'beginner', skills: ['HTML', 'CSS'], estimatedHours: 20 }],
          milestones: [{ title: 'Complete First Project', description: 'Deploy your portfolio' }],
        },
      ],
    };
  }

  _defaultStudyPlan(userProfile, weekNumber) {
    const hours = userProfile.learningPreferences?.studyHoursPerDay || 2;
    const mins = hours * 60;
    const dayPlans = [
      { day: 'Monday',    focusArea: 'Core Concepts',      tasks: [{ time: '09:00', duration: Math.round(mins * 0.6), title: 'Watch Video Lectures', description: 'Study core concepts from your current course', type: 'video', resource: 'Online Course', priority: 'high' }, { time: '10:30', duration: Math.round(mins * 0.4), title: 'Practice Exercises', description: 'Apply what you learned through exercises', type: 'practice', resource: 'Course Exercises', priority: 'medium' }] },
      { day: 'Tuesday',   focusArea: 'Reading & Theory',   tasks: [{ time: '09:00', duration: Math.round(mins * 0.5), title: 'Read Documentation', description: 'Deep dive into official docs and guides', type: 'reading', resource: 'Official Docs', priority: 'high' }, { time: '10:00', duration: Math.round(mins * 0.5), title: 'Take Notes & Review', description: 'Summarize key learnings', type: 'reading', resource: 'Notes', priority: 'medium' }] },
      { day: 'Wednesday', focusArea: 'Hands-on Practice',  tasks: [{ time: '09:00', duration: Math.round(mins), title: 'Build Mini Project', description: 'Apply skills to a small hands-on project', type: 'project', resource: 'Personal Project', priority: 'high' }] },
      { day: 'Thursday',  focusArea: 'Problem Solving',    tasks: [{ time: '09:00', duration: Math.round(mins * 0.5), title: 'Coding Challenges', description: 'Solve coding problems to sharpen skills', type: 'practice', resource: 'LeetCode / HackerRank', priority: 'high' }, { time: '10:00', duration: Math.round(mins * 0.5), title: 'Review Solutions', description: 'Study optimal approaches', type: 'reading', resource: 'Solution Reviews', priority: 'medium' }] },
      { day: 'Friday',    focusArea: 'Assessment & Quiz',  tasks: [{ time: '09:00', duration: Math.round(mins * 0.4), title: 'Weekly Quiz', description: 'Test your knowledge with a self-quiz', type: 'quiz', resource: 'Course Quiz', priority: 'high' }, { time: '10:00', duration: Math.round(mins * 0.6), title: 'Review Weak Areas', description: 'Re-study topics you found difficult', type: 'video', resource: 'Course Videos', priority: 'high' }] },
      { day: 'Saturday',  focusArea: 'Project Work',       tasks: [{ time: '10:00', duration: Math.round(mins * 1.5), title: 'Longer Project Session', description: 'Work on your portfolio or main project', type: 'project', resource: 'Portfolio Project', priority: 'high' }] },
      { day: 'Sunday',    focusArea: 'Rest & Review',      tasks: [{ time: '18:00', duration: 30, title: 'Light Review', description: 'Quick recap of the week\'s learnings', type: 'reading', resource: 'Notes', priority: 'low' }] },
    ];
    return {
      weekNumber,
      weeklyGoal: `Complete Week ${weekNumber} of your learning journey — stay consistent!`,
      totalHours: hours * 5,
      days: dayPlans.map(d => ({ ...d, totalMinutes: d.tasks.reduce((s, t) => s + t.duration, 0) })),
      weeklyMilestones: ['Complete all daily study sessions', 'Finish one hands-on project', 'Score 70%+ on weekly quiz'],
      motivationalTip: 'Consistency beats intensity. Even 30 minutes daily makes a huge difference!',
    };
  }

  _defaultInsights() {
    return {
      productivityScore: 65,
      learningVelocity: 'stable',
      bestStudyTime: 'morning',
      strongestSubject: 'Fundamentals',
      needsAttention: 'Advanced concepts',
      weeklyInsight: 'You are making steady progress. Keep up the great work!',
      recommendations: ['Increase daily study time', 'Practice with projects', 'Review weak areas'],
      motivationalMessage: 'Every expert was once a beginner. Keep going!',
    };
  }

  _defaultCareerPrediction(userProfile) {
    return {
      primaryCareerPath: {
        role: userProfile.targetRole || 'Software Developer',
        probability: 75,
        averageSalary: '$70,000 - $120,000',
        timeToReady: '6-12 months',
        demandTrend: 'growing',
        description: 'Strong match based on your profile',
      },
      alternativeCareerPaths: [],
      keySkillsNeeded: ['JavaScript', 'React', 'Node.js'],
      careerReadinessScore: 50,
      nextSteps: ['Complete current roadmap', 'Build portfolio projects', 'Apply for junior positions'],
    };
  }
}

module.exports = new WatsonXService();
