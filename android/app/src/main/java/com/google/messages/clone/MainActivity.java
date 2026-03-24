package com.google.messages.clone;

import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

       
        registerPlugin(SMSPlugin.class);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            // Handle back button press
            getBridge().getWebView().evaluateJavascript(
                "window.handleBackButton && window.handleBackButton();",
                null
            );
            return true; // Prevent default behavior (app closing)
        }
        return super.onKeyDown(keyCode, event);
    }
}
