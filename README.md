Tic-Tac-Toe Master (Hybrid AI Powered) 🎮

A modern, scalable, and unbeatable Tic-Tac-Toe web application built with React, Tailwind CSS, and Vite.

This project goes beyond standard implementations by featuring a Hybrid AI Engine that switches strategies based on board complexity: it uses the mathematical Minimax Algorithm for unbeatable 3x3 gameplay and Google's Gemini AI for intuitive play on larger grids (4x4 to 6x6).

![minmax](https://github.com/user-attachments/assets/197c04b9-0b28-48d9-b517-4384f63e158e)


🚀 Key Features

Dynamic Grid System: Supports any grid size from 3x3 up to 6x6.

Hybrid AI Architecture:

3x3 Grids: Uses a local Minimax Algorithm (0ms latency, mathematically unbeatable).

4x4+ Grids: Offloads logic to Google Gemini API for strategic pattern recognition without browser lag.

Game Modes:

👤 PvP: Human vs. Human (Hotseat).

🤖 PvAI: Human vs. The Terminator Bot.

Responsive UI: Fully adaptive design using Tailwind CSS.

Smart Feedback: Dynamic victory/defeat screens depending on who won (Trophy for you, Skull for the bot).

🛠️ Tech Stack

Frontend: React.js (Vite)

Styling: Tailwind CSS

Icons: Lucide React

AI Integration: Google Gemini API (via REST)

Algorithm: Minimax (Recursive Backtracking)

🧠 How the AI Works

This project implements a Strategy Pattern to handle AI moves efficiently:

Strategy A: The Minimax Algorithm (3x3)

For standard boards, the game runs a recursive algorithm that simulates every possible future move to find the optimal path.

Pros: Impossible to beat. Instant execution.

Cons: Computationally expensive ($O(b^d)$) for larger boards.

Strategy B: Large Language Model (4x4+)

For larger grids (where Minimax would freeze the browser), the game sends a serialized representation of the board to the Gemini Flash model.

Prompt Engineering: The AI is prompted to analyze the grid as a 1D array and return the single best integer index to block or win.

Pros: Handles complex patterns "intuitively." Fast response times for large state spaces.
