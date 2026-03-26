plugins {
    id("com.android.application")
}

android {
    namespace = "com.cloudmist.book"
    compileSdk = 36
    flavorDimensions += "channel"

    val releaseStoreFile = (project.findProperty("RELEASE_STORE_FILE") as String? ?: "").trim()
    val releaseStorePassword = (project.findProperty("RELEASE_STORE_PASSWORD") as String? ?: "").trim()
    val releaseKeyAlias = (project.findProperty("RELEASE_KEY_ALIAS") as String? ?: "").trim()
    val releaseKeyPassword = (project.findProperty("RELEASE_KEY_PASSWORD") as String? ?: "").trim()
    val hasReleaseSigning = releaseStoreFile.isNotEmpty() &&
            releaseStorePassword.isNotEmpty() &&
            releaseKeyAlias.isNotEmpty() &&
            releaseKeyPassword.isNotEmpty()

    defaultConfig {
        applicationId = "com.cloudmist.book"
        minSdk = 24
        targetSdk = 36
        versionCode = (project.findProperty("APP_VERSION_CODE") as String? ?: "1").toInt()
        versionName = project.findProperty("APP_VERSION_NAME") as String? ?: "1.0.0"

        buildConfigField("String", "WEB_APP_URL", "\"${project.findProperty("WEB_APP_URL") as String? ?: ""}\"")
        buildConfigField(
            "String",
            "UPDATE_MANIFEST_URL",
            "\"${project.findProperty("UPDATE_MANIFEST_URL") as String? ?: ""}\""
        )
        buildConfigField("String", "CHANNEL", "\"unknown\"")
        buildConfigField("boolean", "ENABLE_EXTERNAL_UPDATE", "false")
    }

    productFlavors {
        create("store") {
            dimension = "channel"
            buildConfigField("String", "CHANNEL", "\"store\"")
            buildConfigField("boolean", "ENABLE_EXTERNAL_UPDATE", "false")
        }
        create("direct") {
            dimension = "channel"
            applicationIdSuffix = ".direct"
            versionNameSuffix = "-direct"
            buildConfigField("String", "CHANNEL", "\"direct\"")
            buildConfigField("boolean", "ENABLE_EXTERNAL_UPDATE", "true")
        }
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseStoreFile)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.google.android.material:material:1.12.0")
}
