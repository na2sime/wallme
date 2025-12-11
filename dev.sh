#!/bin/bash

# WallMe Development Script
# Launches each service in a separate terminal window

echo "🚀 Starting WallMe Development Environment"
echo "=========================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Detected macOS - using Terminal.app"

    # Shared package (must be first)
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/services/shared && pnpm dev"'
    sleep 2

    # Auth Service
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/services/auth-service && pnpm dev"'
    sleep 1

    # Post Service
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/services/post-service && pnpm dev"'
    sleep 1

    # Gateway
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/services/gateway && pnpm dev"'
    sleep 1

    # Web App
    osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/apps/web && pnpm dev"'

    echo "✅ All services launched in separate terminals!"

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Detected Linux"

    # Try different terminal emulators
    if command -v gnome-terminal &> /dev/null; then
        TERMINAL="gnome-terminal --"
    elif command -v konsole &> /dev/null; then
        TERMINAL="konsole -e"
    elif command -v xterm &> /dev/null; then
        TERMINAL="xterm -e"
    else
        echo "❌ No supported terminal found"
        exit 1
    fi

    # Launch services
    $TERMINAL bash -c "cd services/shared && pnpm dev; exec bash" &
    sleep 2
    $TERMINAL bash -c "cd services/auth-service && pnpm dev; exec bash" &
    sleep 1
    $TERMINAL bash -c "cd services/post-service && pnpm dev; exec bash" &
    sleep 1
    $TERMINAL bash -c "cd services/gateway && pnpm dev; exec bash" &
    sleep 1
    $TERMINAL bash -c "cd apps/web && pnpm dev; exec bash" &

    echo "✅ All services launched in separate terminals!"

else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "Please launch services manually in separate terminals:"
    echo ""
    echo "Terminal 1: cd services/shared && pnpm dev"
    echo "Terminal 2: cd services/auth-service && pnpm dev"
    echo "Terminal 3: cd services/post-service && pnpm dev"
    echo "Terminal 4: cd services/gateway && pnpm dev"
    echo "Terminal 5: cd apps/web && pnpm dev"
    exit 1
fi

echo ""
echo "📝 Service URLs:"
echo "  • Web App:      http://localhost:4000"
echo "  • Gateway:      http://localhost:3000"
echo "  • Auth Service: http://localhost:3001"
echo "  • Post Service: http://localhost:3002"
echo ""
echo "To stop all services: Close each terminal window or press Ctrl+C in each"
echo ""
