@echo off
echo Updating AndroidManifest.xml for CBE Broadcast Receiver...

REM Check if AndroidManifest.xml exists
if not exist "android\app\src\main\AndroidManifest.xml" (
    echo ❌ AndroidManifest.xml not found!
    echo Please run: npx cap sync android
    pause
    exit /b
)

echo.
echo 📋 Adding CBE permissions and receiver to AndroidManifest.xml...

REM Create backup
copy "android\app\src\main\AndroidManifest.xml" "android\app\src\main\AndroidManifest.xml.backup"

REM Read the current manifest and add CBE components
powershell -Command "& {
    $manifestPath = 'android\app\src\main\AndroidManifest.xml';
    $content = Get-Content $manifestPath;
    
    # Check if permissions already exist
    if ($content -notmatch 'SCHEDULE_EXACT_ALARM') {
        Write-Host '🔐 Adding CBE permissions...';
        
        # Add permissions after existing permissions
        $content = $content -replace '(<uses-permission android:name=\"android.permission.RECORD_AUDIO\" />)', '$1
    <uses-permission android:name=\"android.permission.SCHEDULE_EXACT_ALARM\" />
    <uses-permission android:name=\"android.permission.POST_NOTIFICATIONS\" />
    <uses-permission android:name=\"android.permission.RECEIVE_BOOT_COMPLETED\" />
    <uses-permission android:name=\"android.permission.WAKE_LOCK\" />';
    }
    
    # Check if receiver already exists
    if ($content -notmatch 'CbeTransactionReceiver') {
        Write-Host '📻 Adding CBE Broadcast Receiver...';
        
        # Add receiver before closing application tag
        $content = $content -replace '(</application>)', '    <!-- CBE Silent Broadcast Receiver - CRITICAL: Outside activity tags -->
    <receiver android:name=\".CbeTransactionReceiver\" android:exported=\"true\">
        <intent-filter>
            <action android:name=\"com.cbe.test.TRANSACTION_SIGNAL\" />
        </intent-filter>
    </receiver>

</application>';
    }
    
    # Write updated manifest
    Set-Content $manifestPath $content;
    Write-Host '✅ AndroidManifest.xml updated successfully!';
}"

echo.
echo 🎉 CBE Broadcast Receiver setup complete!
echo 📱 Your app can now receive silent CBE transactions!
echo.
echo 📋 Final steps:
echo    1. Commit and push to GitHub
echo    2. Download APK from GitHub Actions
echo    3. Install on phone and test with Bank App
echo.
pause
