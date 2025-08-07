#!/bin/bash
# Build backend and frontend
(
  cd backend && ./run_build.sh
)
(
  cd frontend && ./run_build.sh
)
