@echo off
echo Moving CbeTransactionReceiver.java to correct Android location...

REM Create directory if it doesn't exist
if not exist "android\app\src\main\java\com\google\messages\clone" (
    echo Creating directory structure...
    mkdir "android\app\src\main\java\com\google\messages\clone"
)

REM Move the Java file
if exist "CbeTransactionReceiver.java" (
    echo Moving CbeTransactionReceiver.java...
    move "CbeTransactionReceiver.java" "android\app\src\main\java\com\google\messages\clone\CbeTransactionReceiver.java"
    echo ✅ Java file moved successfully!
) else (
    echo ❌ CbeTransactionReceiver.java not found in project root
    echo Please make sure the file exists in the project directory
)

echo.
echo 📱 CBE Receiver is now in correct Android location!
echo 📋 Next: Update AndroidManifest.xml
pause
