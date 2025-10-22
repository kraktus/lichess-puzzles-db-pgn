export type Theme =
  | "advancedPawn"
  | "advantage"
  | "anastasiaMate"
  | "arabianMate"
  | "attackingF2F7"
  | "attraction"
  | "backRankMate"
  | "bishopEndgame"
  | "bodenMate"
  | "castling"
  | "capturingDefender"
  | "crushing"
  | "doubleBishopMate"
  | "dovetailMate"
  | "equality"
  | "kingsideAttack"
  | "clearance"
  | "defensiveMove"
  | "deflection"
  | "discoveredAttack"
  | "doubleCheck"
  | "endgame"
  | "enPassant"
  | "exposedKing"
  | "fork"
  | "hangingPiece"
  | "hookMate"
  | "interference"
  | "intermezzo"
  | "killBoxMate"
  | "vukovicMate"
  | "knightEndgame"
  | "long"
  | "master"
  | "masterVsMaster"
  | "mate"
  | "mateIn1"
  | "mateIn2"
  | "mateIn3"
  | "mateIn4"
  | "mateIn5"
  | "middlegame"
  | "oneMove"
  | "opening"
  | "pawnEndgame"
  | "pin"
  | "promotion"
  | "queenEndgame"
  | "queenRookEndgame"
  | "queensideAttack"
  | "quietMove"
  | "rookEndgame"
  | "sacrifice"
  | "short"
  | "skewer"
  | "smotheredMate"
  | "superGM"
  | "trappedPiece"
  | "underPromotion"
  | "veryLong"
  | "xRayAttack"
  | "zugzwang"
  | "playerGames";

const puzzleCategories: Record<string, Theme[]> = {
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
