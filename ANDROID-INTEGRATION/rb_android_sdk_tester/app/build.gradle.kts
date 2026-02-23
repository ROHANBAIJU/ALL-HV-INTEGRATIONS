plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.rb.sdktester"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.rb.sdktester"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // Development (local) backend URL - physical device on same WiFi
        // Change the IP to your computer's local IP (run ipconfig to find it)
        buildConfigField("String", "DEV_BASE_URL", "\"http://192.168.0.105:3000\"")

        // Production backend URL - Vercel deployment
        buildConfigField("String", "PROD_BASE_URL", "\"https://unified-backend-for-all-sdks-p1bb4tasc.vercel.app\"")

        // Default active URL (app starts in Development mode; switchable at runtime)
        buildConfigField("String", "API_BASE_URL", "\"http://192.168.0.105:3000\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Release builds default to Production
            buildConfigField("String", "API_BASE_URL", "\"https://unified-backend-for-all-sdks-p1bb4tasc.vercel.app\"")
        }
        debug {
            isMinifyEnabled = false
            // Debug builds start on local dev server; user can toggle to Production at runtime
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true  // Enable BuildConfig generation
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)

    // Networking - Retrofit & OkHttp for backend API communication
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging.interceptor)

    // JSON parsing
    implementation(libs.gson)

    // HyperVerge SDK - The main SDK for KYC verification
    implementation(libs.hyperkyc) {
        isTransitive = true
        // Optional: Exclude unused modules to reduce app size
        // exclude(group = "co.hyperverge", module = "hypersnap-pdf")
        // exclude(group = "co.hyperverge", module = "face-detection-preview-frame")
        // exclude(group = "co.hyperverge", module = "hyperdocdetect")
    }

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
