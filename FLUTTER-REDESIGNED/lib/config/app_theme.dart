import 'package:flutter/material.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// APP THEME CONFIGURATION
/// ═══════════════════════════════════════════════════════════════════════════

class AppTheme {
  // ═══════════════════════════════════════════════════════════════════════════
  // COLOR PALETTE - Vibrant & Modern
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Primary Colors
  static const Color primaryPurple = Color(0xFF6C5CE7);
  static const Color primaryDeep = Color(0xFF5848C2);
  static const Color primaryLight = Color(0xFF8B7CFF);
  
  // Accent Colors
  static const Color accentOrange = Color(0xFFFF8A65);
  static const Color accentPink = Color(0xFFFF6B9D);
  static const Color accentCyan = Color(0xFF00D9FF);
  
  // Status Colors
  static const Color successGreen = Color(0xFF00E676);
  static const Color warningAmber = Color(0xFFFFAB00);
  static const Color errorRed = Color(0xFFFF5252);
  static const Color infoBlue = Color(0xFF448AFF);
  
  // Neutral Colors
  static const Color backgroundDark = Color(0xFF1A1A2E);
  static const Color backgroundCard = Color(0xFF16213E);
  static const Color backgroundLight = Color(0xFF0F3460);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textGray = Color(0xFFB4B4B4);
  static const Color borderGray = Color(0xFF2D3748);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GRADIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryPurple, primaryDeep],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient accentGradient = LinearGradient(
    colors: [accentOrange, accentPink],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF00E676), Color(0xFF00C853)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // ═══════════════════════════════════════════════════════════════════════════
  // THEME DATA
  // ═══════════════════════════════════════════════════════════════════════════
  
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: primaryPurple,
        secondary: accentOrange,
        surface: backgroundCard,
        background: backgroundDark,
        error: errorRed,
      ),
      
      // App Bar Theme
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundCard,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textWhite,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: IconThemeData(color: textWhite),
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        color: backgroundCard,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryPurple,
          foregroundColor: textWhite,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
      ),
      
      // Outlined Button Theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryPurple,
          side: const BorderSide(color: primaryPurple, width: 2),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryPurple, width: 2),
        ),
        labelStyle: const TextStyle(color: textGray),
        hintStyle: const TextStyle(color: textGray),
      ),
      
      // Text Theme
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: textWhite,
          fontSize: 32,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: TextStyle(
          color: textWhite,
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
        headlineSmall: TextStyle(
          color: textWhite,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        bodyLarge: TextStyle(
          color: textWhite,
          fontSize: 16,
        ),
        bodyMedium: TextStyle(
          color: textGray,
          fontSize: 14,
        ),
        bodySmall: TextStyle(
          color: textGray,
          fontSize: 12,
        ),
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(
        color: textWhite,
        size: 24,
      ),
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'auto_approved':
      case 'approved':
      case 'success':
        return successGreen;
      case 'auto_declined':
      case 'declined':
      case 'error':
        return errorRed;
      case 'needs_review':
      case 'review':
      case 'pending':
        return warningAmber;
      case 'user_cancelled':
      case 'cancelled':
        return textGray;
      default:
        return infoBlue;
    }
  }
  
  static IconData getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'auto_approved':
      case 'approved':
      case 'success':
        return Icons.check_circle;
      case 'auto_declined':
      case 'declined':
      case 'error':
        return Icons.cancel;
      case 'needs_review':
      case 'review':
      case 'pending':
        return Icons.pending;
      case 'user_cancelled':
      case 'cancelled':
        return Icons.block;
      default:
        return Icons.info;
    }
  }
}
