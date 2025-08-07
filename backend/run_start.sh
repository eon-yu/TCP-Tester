#!/bin/bash
# Start backend server
cd "$(dirname "$0")"
GO111MODULE=on go run main.go
