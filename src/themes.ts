export const puzzleThemes: Record<string, { name: string; desc: string }> = {
  advancedPawn: {
    name: "Advanced pawn",
    desc: "One of your pawns is deep into the opponent position, maybe threatening to promote.",
  },
  advantage: {
    name: "Advantage",
    desc: "Seize your chance to get a decisive advantage. (200cp ≤ eval ≤ 600cp)",
  },
  anastasiaMate: {
    name: "Anastasia's mate",
    desc: "A knight and rook or queen team up to trap the opposing king between the side of the board and a friendly piece.",
  },
  arabianMate: {
    name: "Arabian mate",
    desc: "A knight and a rook team up to trap the opposing king on a corner of the board.",
  },
  attackingF2F7: {
    name: "Attacking f2 or f7",
    desc: "An attack focusing on the f2 or f7 pawn, such as in the fried liver opening.",
  },
  attraction: {
    name: "Attraction",
    desc: "An exchange or sacrifice encouraging or forcing an opponent piece to a square that allows a follow-up tactic.",
  },
  backRankMate: {
    name: "Back rank mate",
    desc: "Checkmate the king on the home rank, when it is trapped there by its own pieces.",
  },
  bishopEndgame: {
    name: "Bishop endgame",
    desc: "An endgame with only bishops and pawns.",
  },
  bodenMate: {
    name: "Boden's mate",
    desc: "Two attacking bishops on criss-crossing diagonals deliver mate to a king obstructed by friendly pieces.",
  },
  castling: {
    name: "Castling",
    desc: "Bring the king to safety, and deploy the rook for attack.",
  },
  capturingDefender: {
    name: "Capture the defender",
    desc: "Removing a piece that is critical to defence of another piece, allowing the now undefended piece to be captured on a following move.",
  },
  crushing: {
    name: "Crushing",
    desc: "Spot the opponent blunder to obtain a crushing advantage. (eval ≥ 600cp)",
  },
  doubleBishopMate: {
    name: "Double bishop mate",
    desc: "Two attacking bishops on adjacent diagonals deliver mate to a king obstructed by friendly pieces.",
  },
  dovetailMate: {
    name: "Dovetail mate",
    desc: "A queen delivers mate to an adjacent king, whose only two escape squares are obstructed by friendly pieces.",
  },
  equality: {
    name: "Equality",
    desc: "Come back from a losing position, and secure a draw or a balanced position. (eval ≤ 200cp)",
  },
  kingsideAttack: {
    name: "Kingside attack",
    desc: "An attack of the opponent's king, after they castled on the king side.",
  },
  clearance: {
    name: "Clearance",
    desc: "A move, often with tempo, that clears a square, file or diagonal for a follow-up tactical idea.",
  },
  defensiveMove: {
    name: "Defensive move",
    desc: "A precise move or sequence of moves that is needed to avoid losing material or another advantage.",
  },
  deflection: {
    name: "Deflection",
    desc: 'A move that distracts an opponent piece from another duty that it performs, such as guarding a key square. Sometimes also called "overloading".',
  },
  discoveredAttack: {
    name: "Discovered attack",
    desc: "Moving a piece (such as a knight), that previously blocked an attack by a long range piece (such as a rook), out of the way of that piece.",
  },
  doubleCheck: {
    name: "Double check",
    desc: "Checking with two pieces at once, as a result of a discovered attack where both the moving piece and the unveiled piece attack the opponent's king.",
  },
  endgame: {
    name: "Endgame",
    desc: "A tactic during the last phase of the game.",
  },
  enPassant: {
    name: "En passant",
    desc: "A tactic involving the en passant rule, where a pawn can capture an opponent pawn that has bypassed it using its initial two-square move.",
  },
  exposedKing: {
    name: "Exposed king",
    desc: "A tactic involving a king with few defenders around it, often leading to checkmate.",
  },
  fork: {
    name: "Fork",
    desc: "A move where the moved piece attacks two opponent pieces at once.",
  },
  hangingPiece: {
    name: "Hanging piece",
    desc: "A tactic involving an opponent piece being undefended or insufficiently defended and free to capture.",
  },
  hookMate: {
    name: "Hook mate",
    desc: "Checkmate with a rook, knight, and pawn along with one enemy pawn to limit the enemy king's escape.",
  },
  interference: {
    name: "Interference",
    desc: "Moving a piece between two opponent pieces to leave one or both opponent pieces undefended, such as a knight on a defended square between two rooks.",
  },
  intermezzo: {
    name: "Intermezzo",
    desc: 'Instead of playing the expected move, first interpose another move posing an immediate threat that the opponent must answer. Also known as "Zwischenzug" or "In between".',
  },
  killBoxMate: {
    name: "Kill box mate",
    desc: 'A rook is next to the enemy king and supported by a queen that also blocks the king\'s escape squares. The rook and the queen catch the enemy king in a 3 by 3 "kill box".',
  },
  vukovicMate: {
    name: "Vukovic mate",
    desc: "A rook and knight team up to mate the king. The rook delivers mate while supported by a third piece, and the knight is used to block the king's escape squares.",
  },
  knightEndgame: {
    name: "Knight endgame",
    desc: "An endgame with only knights and pawns.",
  },
  long: {
    name: "Long puzzle",
    desc: "Three moves to win.",
  },
  master: {
    name: "Master games",
    desc: "Puzzles from games played by titled players.",
  },
  masterVsMaster: {
    name: "Master vs Master games",
    desc: "Puzzles from games between two titled players.",
  },
  mate: {
    name: "Checkmate",
    desc: "Win the game with style.",
  },
  mateIn1: {
    name: "Mate in 1",
    desc: "Deliver checkmate in one move.",
  },
  mateIn2: {
    name: "Mate in 2",
    desc: "Deliver checkmate in two moves.",
  },
  mateIn3: {
    name: "Mate in 3",
    desc: "Deliver checkmate in three moves.",
  },
  mateIn4: {
    name: "Mate in 4",
    desc: "Deliver checkmate in four moves.",
  },
  mateIn5: {
    name: "Mate in 5 or more",
    desc: "Figure out a long mating sequence.",
  },
  middlegame: {
    name: "Middlegame",
    desc: "A tactic during the second phase of the game.",
  },
  oneMove: {
    name: "One-move puzzle",
    desc: "A puzzle that is only one move long.",
  },
  opening: {
    name: "Opening",
    desc: "A tactic during the first phase of the game.",
  },
  pawnEndgame: {
    name: "Pawn endgame",
    desc: "An endgame with only pawns.",
  },
  pin: {
    name: "Pin",
    desc: "A tactic involving pins, where a piece is unable to move without revealing an attack on a higher value piece.",
  },
  promotion: {
    name: "Promotion",
    desc: "Promote one of your pawn to a queen or minor piece.",
  },
  queenEndgame: {
    name: "Queen endgame",
    desc: "An endgame with only queens and pawns.",
  },
  queenRookEndgame: {
    name: "Queen and Rook",
    desc: "An endgame with only queens, rooks and pawns.",
  },
  queensideAttack: {
    name: "Queenside attack",
    desc: "An attack of the opponent's king, after they castled on the queen side.",
  },
  quietMove: {
    name: "Quiet move",
    desc: "A move that does neither make a check or capture, nor an immediate threat to capture, but does prepare a more hidden unavoidable threat for a later move.",
  },
  rookEndgame: {
    name: "Rook endgame",
    desc: "An endgame with only rooks and pawns.",
  },
  sacrifice: {
    name: "Sacrifice",
    desc: "A tactic involving giving up material in the short-term, to gain an advantage again after a forced sequence of moves.",
  },
  short: {
    name: "Short puzzle",
    desc: "Two moves to win.",
  },
  skewer: {
    name: "Skewer",
    desc: "A motif involving a high value piece being attacked, moving out the way, and allowing a lower value piece behind it to be captured or attacked, the inverse of a pin.",
  },
  smotheredMate: {
    name: "Smothered mate",
    desc: "A checkmate delivered by a knight in which the mated king is unable to move because it is surrounded (or smothered) by its own pieces.",
  },
  superGM: {
    name: "Super GM games",
    desc: "Puzzles from games played by the best players in the world.",
  },
  trappedPiece: {
    name: "Trapped piece",
    desc: "A piece is unable to escape capture as it has limited moves.",
  },
  underPromotion: {
    name: "Underpromotion",
    desc: "Promotion to a knight, bishop, or rook.",
  },
  veryLong: {
    name: "Very long puzzle",
    desc: "Four moves or more to win.",
  },
  xRayAttack: {
    name: "X-Ray attack",
    desc: "A piece attacks or defends a square, through an enemy piece.",
  },
  zugzwang: {
    name: "Zugzwang",
    desc: "The opponent is limited in the moves they can make, and all moves worsen their position.",
  },
};

export type ThemeKey = keyof typeof puzzleThemes;

export interface PuzzleTheme {
  key: ThemeKey;
  name: string;
  desc: string;
}

const themeKeyByCateg: Record<string, ThemeKey[]> = {
  phases: [
    "opening",
    "middlegame",
    "endgame",
    "rookEndgame",
    "bishopEndgame",
    "pawnEndgame",
    "knightEndgame",
    "queenEndgame",
    "queenRookEndgame",
  ],
  motifs: [
    "advancedPawn",
    "attackingF2F7",
    "capturingDefender",
    "discoveredAttack",
    "doubleCheck",
    "exposedKing",
    "fork",
    "hangingPiece",
    "kingsideAttack",
    "pin",
    "queensideAttack",
    "sacrifice",
    "skewer",
    "trappedPiece",
  ],
  advanced: [
    "attraction",
    "clearance",
    "defensiveMove",
    "deflection",
    "interference",
    "intermezzo",
    "quietMove",
    "xRayAttack",
    "zugzwang",
  ],
  mates: [
    "mate",
    "mateIn1",
    "mateIn2",
    "mateIn3",
    "mateIn4",
    "mateIn5",
    "anastasiaMate",
    "arabianMate",
    "backRankMate",
    "bodenMate",
    "doubleBishopMate",
    "dovetailMate",
    "hookMate",
    "killBoxMate",
    "vukovicMate",
    "smotheredMate",
  ],
  specialMoves: ["castling", "enPassant", "promotion", "underPromotion"],
  goals: ["equality", "advantage", "crushing", "mate"],
  lengths: ["oneMove", "short", "long", "veryLong"],
  origin: ["master", "masterVsMaster", "superGM"],
};

export const themeByCateg: Record<string, PuzzleTheme[]> = Object.fromEntries(
  Object.entries(themeKeyByCateg).map(([categ, themeKeys]) => [
    categ,
    themeKeys.map((k) => ({ key: k, ...puzzleThemes[k] })),
  ]),
);
