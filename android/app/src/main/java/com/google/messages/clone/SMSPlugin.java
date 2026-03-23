package com.google.messages.clone;

import android.Manifest;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.provider.Telephony;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;

import org.json.JSONArray;

@CapacitorPlugin(
    name = "SMSPlugin",
    permissions = {
        @Permission(alias = "sms", strings = { Manifest.permission.READ_SMS }),
        @Permission(alias = "contacts", strings = { Manifest.permission.READ_CONTACTS })
    }
)
public class SMSPlugin extends Plugin {

    @PluginMethod
    public void getMessages(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "onSmsPermissionResult");
            return;
        }
        readMessages(call);
    }

    @PluginMethod
    public void getContacts(PluginCall call) {
        if (getPermissionState("contacts") != PermissionState.GRANTED) {
            requestPermissionForAlias("contacts", call, "onContactsPermissionResult");
            return;
        }
        readContacts(call);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject status = new JSObject();
        status.put("permission", getPermissionState("sms").toString());
        status.put("contactsPermission", getPermissionState("contacts").toString());

        String appPackage = getContext().getPackageName();
        String defaultSmsPackage = Telephony.Sms.getDefaultSmsPackage(getContext());
        boolean isDefault = appPackage.equals(defaultSmsPackage);

        status.put("appPackage", appPackage);
        status.put("defaultSmsPackage", defaultSmsPackage == null ? "" : defaultSmsPackage);
        status.put("isDefaultSmsApp", isDefault);
        status.put("smsCount", countSmsRows());
        status.put("contactsCount", countContactsRows());

        call.resolve(status);
    }

    @PermissionCallback
    private void onSmsPermissionResult(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            readMessages(call);
            return;
        }
        call.reject("SMS permission denied");
    }

    @PermissionCallback
    private void onContactsPermissionResult(PluginCall call) {
        if (getPermissionState("contacts") == PermissionState.GRANTED) {
            readContacts(call);
            return;
        }
        call.reject("Contacts permission denied");
    }

    private void readMessages(PluginCall call) {
        int limit = call.getInt("limit", 2000);
        JSONArray messages = new JSONArray();

        Uri uri = Uri.parse("content://sms");
        Cursor cursor = null;

        try {
            cursor = getContext().getContentResolver().query(
                uri,
                null,
                null,
                null,
                "date DESC"
            );

            if (cursor == null) {
                call.reject("Unable to query SMS provider");
                return;
            }

            int idIndex = cursor.getColumnIndex("_id");
            int addressIndex = cursor.getColumnIndex("address");
            int bodyIndex = cursor.getColumnIndex("body");
            int dateIndex = cursor.getColumnIndex("date");
            int typeIndex = cursor.getColumnIndex("type");

            int count = 0;
            while (cursor.moveToNext()) {
                if (count >= limit) break;

                JSObject sms = new JSObject();

                String address = addressIndex >= 0 ? cursor.getString(addressIndex) : "";
                String body = bodyIndex >= 0 ? cursor.getString(bodyIndex) : "";
                long date = dateIndex >= 0 ? cursor.getLong(dateIndex) : 0L;
                int smsType = typeIndex >= 0 ? cursor.getInt(typeIndex) : 1;
                long id = idIndex >= 0 ? cursor.getLong(idIndex) : count;

                sms.put("id", id);
                sms.put("phone", address == null ? "" : address);
                sms.put("text", body == null ? "" : body);
                sms.put("timestamp", date);
                sms.put("type", smsType == 2 ? "sent" : "received");

                messages.put(sms);
                count++;
            }
        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage(), e);
            return;
        } finally {
            if (cursor != null) cursor.close();
        }

        JSObject result = new JSObject();
        result.put("messages", messages);
        result.put("count", messages.length());

        call.resolve(result);
    }

    private void readContacts(PluginCall call) {
        JSONArray contacts = new JSONArray();
        Cursor cursor = null;

        try {
            cursor = getContext().getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[] {
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor == null) {
                call.reject("Unable to query contacts provider");
                return;
            }

            int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
            int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

            while (cursor.moveToNext()) {
                JSObject contact = new JSObject();
                String name = nameIndex >= 0 ? cursor.getString(nameIndex) : "";
                String number = numberIndex >= 0 ? cursor.getString(numberIndex) : "";

                contact.put("name", name == null ? "" : name);
                contact.put("phone", number == null ? "" : number);
                contacts.put(contact);
            }
        } catch (Exception e) {
            call.reject("Failed to read contacts: " + e.getMessage(), e);
            return;
        } finally {
            if (cursor != null) cursor.close();
        }

        JSObject result = new JSObject();
        result.put("contacts", contacts);
        result.put("count", contacts.length());
        call.resolve(result);
    }

    private int countSmsRows() {
        Cursor cursor = null;
        try {
            cursor = getContext().getContentResolver().query(
                Uri.parse("content://sms"),
                new String[] { "_id" },
                null,
                null,
                null
            );
            return cursor == null ? 0 : cursor.getCount();
        } catch (Exception ignored) {
            return -1;
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    private int countContactsRows() {
        Cursor cursor = null;
        try {
            cursor = getContext().getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[] { ContactsContract.CommonDataKinds.Phone._ID },
                null,
                null,
                null
            );
            return cursor == null ? 0 : cursor.getCount();
        } catch (Exception ignored) {
            return -1;
        } finally {
            if (cursor != null) cursor.close();
        }
    }
}