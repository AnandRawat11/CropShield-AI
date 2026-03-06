#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure python is available (prefer python3)
if command_exists python3; then
    PYTHON_CMD=python3
elif command_exists python; then
    PYTHON_CMD=python
else
    echo "Error: Python is not installed."
    exit 1
fi


# Function to kill process on a specific port
kill_port() {
    PORT=$1
    echo "Checking port $PORT..."
    PIDS=$(lsof -ti :$PORT)
    if [ -n "$PIDS" ]; then
        echo "Killing process(es) on port $PORT (PIDS: $PIDS)..."
        echo "$PIDS" | xargs kill -9
        sleep 1
    fi
}

# Cleanup existing processes
echo "Cleaning up ports..."
kill_port 8000
kill_port 5001
kill_port 5173
echo "Ports cleaned."

echo "Using Python: $PYTHON_CMD"

# Start AI API
echo "--------------------------------------------------"
echo "Starting AI API..."
echo "--------------------------------------------------"
cd ai-api || exit
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi
source venv/bin/activate
echo "Installing dependencies..."
pip install -r requirements.txt
uvicorn app:app --reload --port 8000 &
AI_PID=$!
cd ..

# Start Server
echo "--------------------------------------------------"
echo "Starting Server..."
echo "--------------------------------------------------"
cd server || exit
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

echo "Starting Server in dev mode..."
npm run dev &
SERVER_PID=$!
cd ..

# Start Client
echo "--------------------------------------------------"
echo "Starting Client..."
echo "--------------------------------------------------"
cd client || exit
if [ ! -d "node_modules" ]; then
    echo "Installing client dependencies..."
    npm install
fi
npm run dev -- --host &
CLIENT_PID=$!
cd ..

echo "--------------------------------------------------"
echo "All services started!"
echo "AI API running on port 8000"
echo "Server running on port 5001"
echo "Client running on port 5173 (default)"
echo "Press Ctrl+C to stop all services."
echo "--------------------------------------------------"

# Trap SIGINT to kill all processes
trap "kill $AI_PID $SERVER_PID $CLIENT_PID; exit" SIGINT

wait
