package com.rb.sdktester.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Light color scheme for the app
 */
private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = White,
    primaryContainer = PrimaryLight,
    onPrimaryContainer = PrimaryDark,
    
    secondary = Accent,
    onSecondary = Black,
    secondaryContainer = InfoLight,
    onSecondaryContainer = InfoDark,
    
    tertiary = Warning,
    onTertiary = White,
    tertiaryContainer = WarningLight,
    onTertiaryContainer = WarningDark,
    
    error = Error,
    onError = White,
    errorContainer = ErrorLight,
    onErrorContainer = ErrorDark,
    
    background = BackgroundLight,
    onBackground = TextPrimary,
    surface = SurfaceLight,
    onSurface = TextPrimary,
    surfaceVariant = Grey100,
    onSurfaceVariant = TextSecondary,
    
    outline = Grey400,
    outlineVariant = Grey300
)

/**
 * Dark color scheme for the app (if needed in future)
 */
private val DarkColorScheme = darkColorScheme(
    primary = PrimaryLight,
    onPrimary = PrimaryDark,
    primaryContainer = PrimaryDark,
    onPrimaryContainer = PrimaryLight,
    
    secondary = Accent,
    onSecondary = Black,
    secondaryContainer = InfoDark,
    onSecondaryContainer = InfoLight,
    
    tertiary = WarningLight,
    onTertiary = WarningDark,
    tertiaryContainer = WarningDark,
    onTertiaryContainer = WarningLight,
    
    error = ErrorLight,
    onError = ErrorDark,
    errorContainer = ErrorDark,
    onErrorContainer = ErrorLight,
    
    background = BackgroundDark,
    onBackground = White,
    surface = SurfaceDark,
    onSurface = White,
    surfaceVariant = Grey800,
    onSurfaceVariant = Grey400,
    
    outline = Grey600,
    outlineVariant = Grey700
)

/**
 * Main theme composable for the app
 * 
 * Applies Material 3 design system with custom color scheme and typography.
 * Handles system bars (status bar, navigation bar) appearance.
 * 
 * @param darkTheme Whether to use dark theme (defaults to system preference)
 * @param content The composable content to wrap with the theme
 */
@Composable
fun RbAndroidSdkTesterTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        DarkColorScheme
    } else {
        LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
