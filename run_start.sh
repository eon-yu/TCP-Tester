#!/bin/bash
# Start backend and frontend services
(
  cd backend && ./run_start.sh &
)
(
  cd frontend && ./run_start.sh &
)
wait
