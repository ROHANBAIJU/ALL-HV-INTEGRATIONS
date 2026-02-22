import java.net.URI

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        //mavenLocal()
        mavenCentral()
        maven {
            url = URI("https://s3.ap-south-1.amazonaws.com/hvsdk/android/releases")
        }
    }
}

rootProject.name = "testhyperkyccompose"
include(":app")
 