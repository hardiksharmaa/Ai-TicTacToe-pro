import React, { useState, useEffect, useCallback } from 'react';
import { User, Cpu, RotateCcw, Settings, Trophy, Skull, X as XIcon, Circle, ChevronLeft } from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const getMinimaxMove = (board, aiSymbol, humanSymbol) => {
  const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
  if (emptyIndices.length === 9) return 4;

  const checkLocalWin = (b, player) => {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8], 
      [0,3,6], [1,4,7], [2,5,8], 
      [0,4,8], [2,4,6]
    ];
    return winPatterns.some(pattern => 
      pattern.every(index => b[index] === player)
    );
  };

  const minimax = (tempBoard, depth, isMaximizing) => {
    if (checkLocalWin(tempBoard, aiSymbol)) return 10 - depth;
    if (checkLocalWin(tempBoard, humanSymbol)) return depth - 10;
    if (!tempBoard.includes(null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = aiSymbol;
          const score = minimax(tempBoard, depth + 1, false);
          tempBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = humanSymbol;
          const score = minimax(tempBoard, depth + 1, true);
          tempBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  let bestMove = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = aiSymbol;
      const score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
};

async function getGeminiMove(board, size, aiSymbol, opponentSymbol) {
  const prompt = `Play Tic-Tac-Toe (${size}x${size}). Board: ${JSON.stringify(board)}. You are '${aiSymbol}', Opponent is '${opponentSymbol}'. Return ONLY integer index (0-${size*size-1}).`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  
  if (!apiKey) throw new Error("No API Key");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) throw new Error("API Error");
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const move = parseInt(text.trim());
  
  if (!isNaN(move) && board[move] === null) return move;
  throw new Error("Invalid AI Move");
}

const SYMBOLS = { X: 'X', O: 'O' };
const MODES = { HUMAN_VS_HUMAN: 'PvP', HUMAN_VS_AI: 'PvAI' };

const checkWin = (board, size, lastIndex, playerSymbol) => {
  if (lastIndex === null) return false;
  const row = Math.floor(lastIndex / size);
  const col = lastIndex % size;

  let rowWin = true; for (let c = 0; c < size; c++) if (board[row * size + c] !== playerSymbol) { rowWin = false; break; }
  if (rowWin) return true;

  let colWin = true; for (let r = 0; r < size; r++) if (board[r * size + col] !== playerSymbol) { colWin = false; break; }
  if (colWin) return true;

  if (row === col) {
    let diagWin = true; for (let i = 0; i < size; i++) if (board[i * size + i] !== playerSymbol) { diagWin = false; break; }
    if (diagWin) return true;
  }

  if (row + col === size - 1) {
    let antiDiagWin = true; for (let i = 0; i < size; i++) if (board[i * size + (size - 1 - i)] !== playerSymbol) { antiDiagWin = false; break; }
    if (antiDiagWin) return true;
  }
  return false;
};

export default function App() {
  const [screen, setScreen] = useState('SETUP');
  const [config, setConfig] = useState({ size: 3, p1Name: 'Player 1', p1Symbol: SYMBOLS.X, mode: MODES.HUMAN_VS_AI });
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState(0);
  const [gameStatus, setGameStatus] = useState('PLAYING');
  const [winner, setWinner] = useState(null);
  const [lastMoveIndex, setLastMoveIndex] = useState(null);

  const players = [
    { name: config.p1Name, symbol: config.p1Symbol, type: 'HUMAN', color: 'text-blue-500' },
    { 
      name: config.mode === MODES.HUMAN_VS_AI ? 'Terminator Bot' : 'Player 2', 
      symbol: config.p1Symbol === SYMBOLS.X ? SYMBOLS.O : SYMBOLS.X, 
      type: config.mode === MODES.HUMAN_VS_AI ? 'AI' : 'HUMAN',
      color: 'text-rose-500'
    }
  ];

  const currentPlayer = players[turn];

  const initGame = () => {
    setBoard(Array(config.size * config.size).fill(null));
    setTurn(0);
    setGameStatus('PLAYING');
    setWinner(null);
    setLastMoveIndex(null);
    setScreen('GAME');
  };

  const handleCellClick = (index) => {
    if (gameStatus !== 'PLAYING' || board[index] !== null) return;
    if (currentPlayer.type === 'AI') return;
    executeMove(index);
  };

  const executeMove = useCallback((index) => {
    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[index] = players[turn].symbol;
      return newBoard;
    });
    setLastMoveIndex(index);
  }, [turn, players]);

  useEffect(() => {
    if (lastMoveIndex === null) return;
    const justMovedPlayer = players[turn];
    
    if (checkWin(board, config.size, lastMoveIndex, justMovedPlayer.symbol)) {
      setGameStatus('WON');
      setWinner(justMovedPlayer);
      return;
    }
    if (!board.includes(null)) {
      setGameStatus('DRAW');
      return;
    }
    setTurn((prev) => (prev === 0 ? 1 : 0));
  }, [board, lastMoveIndex]); 

  useEffect(() => {
    let isCancelled = false;

    if (screen === 'GAME' && gameStatus === 'PLAYING' && players[turn].type === 'AI') {
      const aiPlayer = players[turn];
      const humanPlayer = players[turn === 0 ? 1 : 0];

      const makeMove = async () => {
        try {
          if (config.size === 3) {
            await new Promise(r => setTimeout(r, 500));
            if (isCancelled) return;
            
            const move = getMinimaxMove([...board], aiPlayer.symbol, humanPlayer.symbol);
            if (move !== -1) executeMove(move);
          } 
          else {
            const move = await getGeminiMove(board, config.size, aiPlayer.symbol, humanPlayer.symbol);
            if (!isCancelled) executeMove(move);
          }

        } catch (error) {
          if (isCancelled) return;
          const avail = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
          if (avail.length > 0) executeMove(avail[Math.floor(Math.random() * avail.length)]);
        }
      };

      makeMove();
    }
    return () => { isCancelled = true; };
  }, [turn, gameStatus, screen, board, players, executeMove, config.size]);

  const renderSetup = () => (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Tic Tac Toe Master</h1>
        <p className="text-slate-500">Configure your battleground</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Grid Size (N x N)</label>
        <div className="flex items-center gap-4">
          <input type="range" min="3" max="6" step="1" value={config.size} onChange={(e) => setConfig({...config, size: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          <span className="text-xl font-bold text-indigo-600 w-12 text-center">{config.size}</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Your Name</label>
        <input type="text" value={config.p1Name} onChange={(e) => setConfig({...config, p1Name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setConfig({...config, mode: MODES.HUMAN_VS_AI})} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${config.mode === MODES.HUMAN_VS_AI ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
          <Cpu size={28} className="mb-2" /> <span className="font-semibold">vs AI</span>
        </button>
        <button onClick={() => setConfig({...config, mode: MODES.HUMAN_VS_HUMAN})} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${config.mode === MODES.HUMAN_VS_HUMAN ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>
          <User size={28} className="mb-2" /> <span className="font-semibold">2 Player</span>
        </button>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Choose Side</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setConfig({...config, p1Symbol: SYMBOLS.X})} className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold ${config.p1Symbol === SYMBOLS.X ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><XIcon size={18} className="mr-2"/> Play as X</button>
          <button onClick={() => setConfig({...config, p1Symbol: SYMBOLS.O})} className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold ${config.p1Symbol === SYMBOLS.O ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}><Circle size={18} className="mr-2"/> Play as O</button>
        </div>
      </div>
      <button onClick={initGame} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95">Start Game</button>
    </div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in">
      <div className="w-full flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm mb-8">
        <button onClick={() => setScreen('SETUP')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><ChevronLeft /></button>
        <div className="flex items-center gap-8">
          <div className={`flex flex-col items-center transition-opacity ${turn === 0 ? 'opacity-100 scale-110' : 'opacity-50'}`}>
            <span className={`text-3xl font-black ${players[0].color}`}>{players[0].symbol}</span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{players[0].name}</span>
          </div>
          <div className="text-slate-300 font-light text-2xl">VS</div>
          <div className={`flex flex-col items-center transition-opacity ${turn === 1 ? 'opacity-100 scale-110' : 'opacity-50'}`}>
            <span className={`text-3xl font-black ${players[1].color}`}>{players[1].symbol}</span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{players[1].name}</span>
          </div>
        </div>
        <button onClick={initGame} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><RotateCcw /></button>
      </div>
      <div className="mb-6 text-center h-8">
        {gameStatus === 'PLAYING' ? (
          <span className="text-slate-500 font-medium animate-pulse">{players[turn].type === 'AI' ? 'AI is thinking...' : `Waiting for ${players[turn].name}...`}</span>
        ) : (
          <span className={`text-xl font-bold ${gameStatus === 'DRAW' ? 'text-amber-500' : (winner?.type === 'AI' ? 'text-rose-600' : 'text-green-600')}`}>
            {gameStatus === 'WON' ? (winner?.type === 'AI' ? 'Defeat!' : 'Victory!') : "It's a Draw!"}
          </span>
        )}
      </div>
      <div className="bg-slate-300 gap-[2px] p-[2px] rounded-lg shadow-inner" style={{ display: 'grid', gridTemplateColumns: `repeat(${config.size}, minmax(0, 1fr))`, width: 'min(90vw, 500px)', aspectRatio: '1/1' }}>
        {board.map((cell, idx) => (
          <button key={idx} onClick={() => handleCellClick(idx)} disabled={cell !== null || gameStatus !== 'PLAYING' || (players[turn].type === 'AI')} className={`bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors relative flex items-center justify-center ${cell === SYMBOLS.X ? 'text-blue-500' : 'text-rose-500'} ${lastMoveIndex === idx ? 'bg-yellow-50' : ''}`}>
            {cell && (
              <span className="animate-scale-in absolute inset-0 flex items-center justify-center">
                {cell === 'X' ? <XIcon className="w-3/5 h-3/5" strokeWidth={2.5} /> : <Circle className="w-1/2 h-1/2" strokeWidth={3} />}
              </span>
            )}
          </button>
        ))}
      </div>
      {gameStatus !== 'PLAYING' && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-6 max-w-xs w-full transform scale-100">
            {gameStatus === 'WON' ? (
              winner?.type === 'AI' ? (
                <div className="bg-rose-100 p-4 rounded-full text-rose-600 mb-2"><Skull size={48} /></div>
              ) : (
                <div className="bg-green-100 p-4 rounded-full text-green-600 mb-2"><Trophy size={48} /></div>
              )
            ) : (
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-2"><RotateCcw size={48} /></div>
            )}
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">
                {gameStatus === 'WON' ? (winner?.type === 'AI' ? 'Defeat!' : 'Victory!') : 'Draw!'}
              </h2>
              <p className="text-slate-500 mt-1">
                {gameStatus === 'WON' 
                  ? (winner?.type === 'AI' ? 'Terminator Bot Wins.' : `${winner.name} wins!`) 
                  : "No more moves left."}
              </p>
            </div>
            
            <div className="flex gap-3 w-full">
              <button onClick={() => setScreen('SETUP')} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">Menu</button>
              <button onClick={initGame} className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      {screen === 'SETUP' ? renderSetup() : renderGame()}
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes scale-in { from { transform: scale(0); } to { transform: scale(1); } } .animate-fade-in { animation: fade-in 0.4s ease-out forwards; } .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }`}</style>
    </div>
  );
}