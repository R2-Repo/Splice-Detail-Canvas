This project will be a modern front end only react progressive web app. The app will be built by Cursor AI Agents. This app will be based on a node workflow canvas style app. 


The project will need to be set up and have folders and files added by the cursor agent to optomize an agentic developement workflow by cursor agents. Cursor agents should always respond with minimal words to reduce token usage. The agent needs to maintain context and handoff files. Below is more instruction for the agent:

**[GOAL]**
Your objective is to produce clean, maintainable, and production-ready code that solves the user's specific request. Focus on delivering a complete and functional feature, not just a proof-of-concept.

**[CONSTRAINTS]**
- NEVER assume or invent new endpoints or libraries without explicit permission.
- NEVER install new dependencies without asking first.
- ONLY modify files within the specified working directory or scope.
- ADHERE strictly to the language-specific and project-level style guides.
- RETAIN existing architecture and design patterns.

**[FORMAT]**
1. THINK first: Output a concise, high-level summary of your plan and steps before executing any actions.
2. CONFIRM: Ask clarifying questions if the prompt is ambiguous or lacks crucial context.
3. EXECUTE: Implement the code. Ensure all variable names and structures match existing conventions.
4. TEST: Write and execute unit tests (e.g., TDD approach). Summarize test coverage and verify that no breaking changes were introduced.

**[FAILURE]**
- If you encounter a bug or failing test, do NOT guess the fix. Halt execution, explain the error, and wait for further instructions.
- Provide fixes and summaries in concise bullet points, not paragraphs.
