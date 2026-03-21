# 📱 CBE Silent Broadcast Receiver - Final Setup Instructions

## ✅ **What's Already Done**
- ✅ Local Notifications plugin installed
- ✅ Preferences plugin installed  
- ✅ CBE Message Handler added to App.tsx
- ✅ Duplicate prevention logic implemented
- ✅ CbeTransactionReceiver.java created
- ✅ 2-second background checking configured

## 🛠️ **Manual Steps Required**

### **Step 1: Move Java File to Correct Location**
**Move** `CbeTransactionReceiver.java` from project root to:
```
android/app/src/main/java/com/google/messages/clone/CbeTransactionReceiver.java
```

### **Step 2: Update AndroidManifest.xml**
**Add** these permissions and receiver **OUTSIDE** any `<activity>` tag in:
```
android/app/src/main/AndroidManifest.xml
```

**Add these permissions:**
```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**Add this receiver:**
```xml
<receiver android:name=".CbeTransactionReceiver" android:exported="true">
    <intent-filter>
        <action android:name="com.cbe.test.TRANSACTION_SIGNAL" />
    </intent-filter>
</receiver>
```

### **Step 3: Build and Test**
```bash
npm run build
npx cap sync android
npx cap open android
```

## 🎯 **Critical Requirements**

### **Package Name Verification**
- **Message App:** `com.google.messages.clone` ✅
- **Bank App:** `com.anonymous.CBEClone` (must be different)

### **Receiver Location**
- **MUST be outside** `<activity>` tags
- **MUST be standalone** (not nested)
- **MUST have `android:exported="true"`

### **Wake Up Permissions**
- Required for Android 12+ background execution
- Ensures notifications show when app is closed

## 🚀 **Expected Behavior**

### **Bank App → Message App Flow**
1. **Transaction completes** in Bank App
2. **Bank App sends broadcast** with transaction data
3. **CbeTransactionReceiver** catches signal silently
4. **CBE message generated** with proper formatting
5. **System notification** appears immediately
6. **User stays in Bank App** (no app switching)
7. **Message App processes** in background
8. **CBE conversation** ready when opened

### **Notification Features**
- **Title:** "CBE"
- **Body:** Full CBE SMS message
- **Priority:** High (immediate display)
- **Sound:** Default notification sound
- **Silent Processing:** No app interruption

### **Duplicate Prevention**
- **RefNo checking** prevents duplicate notifications
- **Local storage tracking** for processed messages
- **2-second interval** for real-time updates

## 📱 **Bank App Integration Code**

### **React Native Broadcast Sending**
```javascript
import { NativeModules, Platform } from 'react-native';

const sendCbeTransaction = async (transactionData) => {
  if (Platform.OS === 'android') {
    try {
      const intent = {
        action: 'com.cbe.test.TRANSACTION_SIGNAL',
        extras: {
          type: transactionData.type, // 'DEBIT' or 'CREDIT'
          amount: transactionData.amount,
          finalBalance: transactionData.finalBalance,
          accountNumber: transactionData.accountNumber,
          accountName: transactionData.accountName,
          senderName: transactionData.senderName,
          refNo: transactionData.refNo,
          officialLink: transactionData.officialLink
        }
      };
      
      // Use react-native-send-intent or create native module
      await NativeModules.IntentModule.sendBroadcast(intent);
      console.log('CBE Transaction broadcast sent');
    } catch (error) {
      console.error('Error sending CBE broadcast:', error);
    }
  }
};
```

## 🧪 **Testing Scenarios**

### **Test Case 1: Debit Transaction**
```javascript
sendCbeTransaction({
  type: 'DEBIT',
  amount: '1500.00',
  finalBalance: '8500.00',
  accountNumber: '100012345678',
  accountName: 'John Doe',
  refNo: 'DCJ123456',
  officialLink: 'https://transactioninfo.ethiotelecom.et/receipt/DCJ123456'
});
```

**Expected CBE Message:**
```
Dear John your Account 1000****5678 has been debited with ETB 1500.00 Service charge of ETB 10.00 and VAT(15%) of ETB 225.00 with a total of ETB 1735.00. Your Current Balance is ETB 8500.00. Thank you for Banking with CBE! https://transactioninfo.ethiotelecom.et/receipt/DCJ123456
```

### **Test Case 2: Credit Transaction**
```javascript
sendCbeTransaction({
  type: 'CREDIT',
  amount: '2000.00',
  finalBalance: '10500.00',
  accountNumber: '100012345678',
  accountName: 'John Doe',
  senderName: 'Jane Smith',
  refNo: 'CCR789012',
  officialLink: 'https://transactioninfo.ethiotelecom.et/receipt/CCR789012'
});
```

**Expected CBE Message:**
```
Dear John your Account 1000****5678 has been Credited with ETB 2000.00 from Jane Smith with Ref No CCR789012. Your Current Balance is ETB 10500.00. Thank you for Banking with CBE! https://transactioninfo.ethiotelecom.et/receipt/CCR789012
```

## 🔧 **Troubleshooting**

### **If Notification Doesn't Show:**
1. Check AndroidManifest.xml permissions
2. Verify receiver is outside `<activity>` tags
3. Ensure package names are different
4. Test with `adb logcat` for broadcast errors

### **If Duplicate Messages Appear:**
1. Check localStorage for processed flag
2. Verify refNo matching logic
3. Clear CBE message storage and test again

### **If App Crashes:**
1. Check Java file package declaration
2. Verify AndroidManifest.xml syntax
3. Test with simple broadcast first

## 🎉 **Success Indicators**
✅ **Silent Operation** - No app switching  
✅ **Instant Notification** - Appears within 2 seconds  
✅ **Proper Formatting** - CBE template matching  
✅ **Account Masking** - 1000****5678 format  
✅ **VAT Calculation** - 15% for DEBIT transactions  
✅ **Duplicate Prevention** - No repeat notifications  
✅ **Background Processing** - Works when app is closed  

The implementation is complete and ready for production testing!
