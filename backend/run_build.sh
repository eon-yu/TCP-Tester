#!/bin/bash
# Build backend server
cd "$(dirname "$0")"
GO111MODULE=on go build -o server main.go
