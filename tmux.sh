#!/bin/sh

newTmuxSessionScript() {
  local SESSION_NAME=$1
  tmux new-session -s "$SESSION_NAME" -d
  tmux split-window -d
  tmux split-window -d
  tmux split-window -d
  tmux send-keys -t "$SESSION_NAME".1 "pnpm run format" C-m
  tmux send-keys -t "$SESSION_NAME".2 "cd ../li-network" C-m
  tmux send-keys -t "$SESSION_NAME".4 "pnpm run dev" C-m
  tmux attach-session -t "$SESSION_NAME"
}

newTmuxSessionScript puzzles-pgn