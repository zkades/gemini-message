package com.google.messages.clone;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class CbeTransactionReceiver extends BroadcastReceiver {
    private static final String TAG = "CbeTransactionReceiver";
    private static final String PREFS_NAME = "CBE_Messages";
    
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
                
                // Save to local storage
                saveCbeMessage(context, cbeMessage, type, amount, finalBalance);
                
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
            double amountVal = Double.parseDouble(amount);
            double vat = amountVal * 0.15;
            double serviceCharge = 10.00;
            double total = amountVal + vat + serviceCharge;
            
            return String.format(
                "Dear %s your Account %s has been debited with ETB %.2f Service charge of ETB 10.00 and VAT(15%%) of ETB %.2f with a total of ETB %.2f. Your Current Balance is ETB %s. Thank you for Banking with CBE! %s",
                firstName, maskedAccount, amountVal, vat, total, finalBalance, officialLink
            );
        } else if ("CREDIT".equalsIgnoreCase(type)) {
            return String.format(
                "Dear %s your Account %s has been Credited with ETB %s from %s with Ref No %s. Your Current Balance is ETB %s. Thank you for Banking with CBE! %s",
                firstName, maskedAccount, amount, senderName, refNo, finalBalance, officialLink
            );
        }
        
        return "";
    }
    
    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 8) {
            return accountNumber;
        }
        
        int firstFour = Integer.parseInt(accountNumber.substring(0, 4));
        String lastFour = accountNumber.substring(accountNumber.length() - 4);
        return String.format("%d****%s", firstFour, lastFour);
    }
    
    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "Customer";
        }
        
        String[] names = fullName.trim().split("\\s+");
        return names[0];
    }
    
    private void saveCbeMessage(Context context, String message, String type, String amount, String balance) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        // Get existing messages
        String existingMessages = prefs.getString("messages", "[]");
        
        // Create new message entry
        String newMessage = String.format(
            "{\"id\":\"cbe_%d\",\"text\":\"%s\",\"sender\":\"CBE\",\"type\":\"%s\",\"amount\":\"%s\",\"balance\":\"%s\",\"timestamp\":%d,\"processed\":false}",
            System.currentTimeMillis(),
            message.replace("\"", "\\\""),
            type, amount, balance, System.currentTimeMillis()
        );
        
        // Add to existing messages
        if (existingMessages.equals("[]")) {
            existingMessages = "[" + newMessage + "]";
        } else {
            existingMessages = existingMessages.substring(0, existingMessages.length() - 1) + "," + newMessage + "]";
        }
        
        // Save back
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("messages", existingMessages);
        editor.apply();
    }
    
    private void triggerNotification(Context context, String message) {
        // Save for immediate processing when app opens
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("last_cbe_message", message);
        editor.putLong("last_cbe_time", System.currentTimeMillis());
        editor.putString("pending_notification", message);
        editor.putLong("notification_time", System.currentTimeMillis());
        editor.apply();
    }
}
