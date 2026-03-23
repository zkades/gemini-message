package com.google.messages.clone;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class CbeTransactionReceiver extends BroadcastReceiver {
    private static final String TAG = "CbeTransactionReceiver";
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_MESSAGES = "messages";
    private static final String KEY_PENDING_NOTIFICATION = "pending_notification";
    private static final String KEY_NOTIFICATION_TIME = "notification_time";
    private static final String KEY_LAST_CBE_MESSAGE = "last_cbe_message";
    private static final String KEY_LAST_CBE_TIME = "last_cbe_time";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            if ("com.cbe.test.TRANSACTION_SIGNAL".equals(intent.getAction())) {
                Log.d(TAG, "CBE Transaction signal received");
                
                // Extract transaction data
                String type = intent.getStringExtra("type");
                String amount = intent.getStringExtra("amount");
                String finalBalance = intent.getStringExtra("finalBalance");
                String accountNumber = intent.getStringExtra("accountNumber");
                String accountName = intent.getStringExtra("accountName");
                String senderName = intent.getStringExtra("senderName");
                String refNo = intent.getStringExtra("refNo");
                String officialLink = intent.getStringExtra("officialLink");
                
                // Generate CBE SMS message
                String cbeMessage = generateCbeMessage(
                    type, amount, finalBalance, accountNumber, 
                    accountName, senderName, refNo, officialLink
                );
                if (cbeMessage == null || cbeMessage.trim().isEmpty()) {
                    cbeMessage = "CBE transaction received.";
                }
                
                // Save to local storage
                saveCbeMessage(context, cbeMessage, type, amount, finalBalance, refNo);
                
                // Trigger system notification
                triggerNotification(context, cbeMessage);
                
                Log.d(TAG, "CBE Message generated: " + cbeMessage);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing CBE transaction", e);
        }
    }
    
    private String generateCbeMessage(String type, String amount, String finalBalance, 
                                 String accountNumber, String accountName, 
                                 String senderName, String refNo, String officialLink) {
        
        // Mask account number (100012345678 -> 1000****5678)
        String maskedAccount = maskAccountNumber(accountNumber);
        
        // Extract first name from account name
        String firstName = extractFirstName(accountName);
        
        if ("DEBIT".equalsIgnoreCase(type)) {
            // Calculate VAT (15%) and Service Charge (ETB 10.00)
            Double amountVal = safeParseDouble(amount);
            if (amountVal == null) {
                return String.format(
                    "Dear %s your Account %s has been debited with ETB %s. Your Current Balance is ETB %s. Thank you for Banking with CBE! %s",
                    firstName, maskedAccount, safeString(amount, "0.00"), safeString(finalBalance, "0.00"), safeString(officialLink, "")
                );
            }

            double vat = amountVal * 0.15;
            double serviceCharge = 10.00;
            double total = amountVal + vat + serviceCharge;

            return String.format(
                "Dear %s your Account %s has been debited with ETB %.2f Service charge of ETB 10.00 and VAT(15%%) of ETB %.2f with a total of ETB %.2f. Your Current Balance is ETB %s. Thank you for Banking with CBE! %s",
                firstName, maskedAccount, amountVal, vat, total, safeString(finalBalance, "0.00"), safeString(officialLink, "")
            );
        } else if ("CREDIT".equalsIgnoreCase(type)) {
            return String.format(
                "Dear %s your Account %s has been Credited with ETB %s from %s with Ref No %s. Your Current Balance is ETB %s. Thank you for Banking with CBE! %s",
                firstName, maskedAccount, safeString(amount, "0.00"), safeString(senderName, "Unknown"), safeString(refNo, "N/A"), safeString(finalBalance, "0.00"), safeString(officialLink, "")
            );
        }
        
        return "";
    }
    
    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 8) {
            return accountNumber;
        }
        
        String firstFour = accountNumber.substring(0, 4);
        String lastFour = accountNumber.substring(accountNumber.length() - 4);
        return String.format("%s****%s", firstFour, lastFour);
    }
    
    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "Customer";
        }
        
        String[] names = fullName.trim().split("\\s+");
        return names[0];
    }
    
    private void saveCbeMessage(Context context, String message, String type, String amount, String balance, String refNo) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        // Get existing messages
        String existingMessages = prefs.getString(KEY_MESSAGES, "[]");
        long now = System.currentTimeMillis();

        try {
            org.json.JSONArray array;
            try {
                array = new org.json.JSONArray(existingMessages);
            } catch (Exception e) {
                array = new org.json.JSONArray();
            }

            org.json.JSONObject obj = new org.json.JSONObject();
            obj.put("id", "cbe_" + now);
            obj.put("text", message);
            obj.put("sender", "them");
            obj.put("type", safeString(type, "UNKNOWN"));
            obj.put("amount", safeString(amount, "0.00"));
            obj.put("balance", safeString(balance, "0.00"));
            obj.put("timestamp", now);
            obj.put("processed", false);
            obj.put("refNo", safeString(refNo, ""));
            array.put(obj);

            SharedPreferences.Editor editor = prefs.edit();
            editor.putString(KEY_MESSAGES, array.toString());
            editor.apply();
        } catch (Exception e) {
            Log.e(TAG, "Failed to save CBE message JSON", e);
        }
    }
    
    private void triggerNotification(Context context, String message) {
        // Save for immediate processing when app opens
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        String now = String.valueOf(System.currentTimeMillis());
        editor.putString(KEY_LAST_CBE_MESSAGE, message);
        editor.putString(KEY_LAST_CBE_TIME, now);
        editor.putString(KEY_PENDING_NOTIFICATION, message);
        editor.putString(KEY_NOTIFICATION_TIME, now);
        editor.apply();
    }

    private String safeString(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private Double safeParseDouble(String value) {
        if (value == null) return null;
        try {
            return Double.parseDouble(value);
        } catch (Exception e) {
            return null;
        }
    }
}
