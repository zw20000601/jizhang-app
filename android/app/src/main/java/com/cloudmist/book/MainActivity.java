package com.cloudmist.book;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "cloud_mist_update";
    private static final String KEY_IGNORED_VERSION = "ignored_version";

    private final ExecutorService updateExecutor = Executors.newSingleThreadExecutor();
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new NativeBridge(), "NativeBridge");

        loadEntry();
        if (BuildConfig.ENABLE_EXTERNAL_UPDATE) {
            checkForAppUpdate();
        }
    }

    private void loadEntry() {
        String remoteUrl = BuildConfig.WEB_APP_URL == null ? "" : BuildConfig.WEB_APP_URL.trim();
        if (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://")) {
            webView.loadUrl(remoteUrl);
        } else {
            webView.loadUrl("file:///android_asset/www/index.html");
        }
    }

    private void checkForAppUpdate() {
        String manifestUrl = BuildConfig.UPDATE_MANIFEST_URL == null ? "" : BuildConfig.UPDATE_MANIFEST_URL.trim();
        if (!(manifestUrl.startsWith("http://") || manifestUrl.startsWith("https://"))) {
            return;
        }

        updateExecutor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(manifestUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(6000);
                connection.setReadTimeout(6000);
                connection.setRequestMethod("GET");
                connection.setUseCaches(false);

                int code = connection.getResponseCode();
                if (code != 200) {
                    return;
                }

                String payload = readAll(connection.getInputStream());
                JSONObject json = new JSONObject(payload);

                int remoteCode = json.optInt("versionCode", BuildConfig.VERSION_CODE);
                String remoteName = json.optString("versionName", "");
                String notes = json.optString("notes", "有新版本可更新");
                String apkUrl = json.optString("apkUrl", "");
                boolean force = json.optBoolean("force", false);

                if (remoteCode <= BuildConfig.VERSION_CODE) {
                    return;
                }

                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                int ignored = prefs.getInt(KEY_IGNORED_VERSION, 0);
                if (!force && ignored == remoteCode) {
                    return;
                }

                runOnUiThread(() -> showUpdateDialog(remoteCode, remoteName, notes, apkUrl, force));
            } catch (Exception ignored) {
                // ignore silently when update server is unavailable
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });
    }

    private void showUpdateDialog(int remoteCode, String remoteName, String notes, String apkUrl, boolean force) {
        StringBuilder message = new StringBuilder();
        message.append("当前版本：").append(BuildConfig.VERSION_NAME)
                .append(" (build ").append(BuildConfig.VERSION_CODE).append(")\n")
                .append("最新版本：")
                .append(remoteName == null || remoteName.isEmpty() ? String.valueOf(remoteCode) : remoteName)
                .append(" (build ").append(remoteCode).append(")\n\n")
                .append(notes == null || notes.isEmpty() ? "有新版本可更新" : notes);

        AlertDialog.Builder builder = new AlertDialog.Builder(this)
                .setTitle(getString(R.string.update_title))
                .setMessage(message.toString())
                .setCancelable(!force)
                .setPositiveButton(R.string.update_now, (dialog, which) -> openUpdateUrl(apkUrl));

        if (!force) {
            builder.setNegativeButton(R.string.update_later, null);
            builder.setNeutralButton(R.string.update_ignore, (dialog, which) -> {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                prefs.edit().putInt(KEY_IGNORED_VERSION, remoteCode).apply();
            });
        }

        builder.show();
    }

    private void openUpdateUrl(String apkUrl) {
        if (apkUrl == null || apkUrl.trim().isEmpty()) {
            Toast.makeText(this, R.string.update_link_missing, Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl.trim()));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, R.string.update_link_missing, Toast.LENGTH_SHORT).show();
        }
    }

    private String readAll(InputStream input) throws Exception {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        updateExecutor.shutdownNow();
        super.onDestroy();
    }

    public static class NativeBridge {
        @JavascriptInterface
        public int getVersionCode() {
            return BuildConfig.VERSION_CODE;
        }

        @JavascriptInterface
        public String getVersionName() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public String getChannel() {
            return BuildConfig.CHANNEL;
        }
    }
}