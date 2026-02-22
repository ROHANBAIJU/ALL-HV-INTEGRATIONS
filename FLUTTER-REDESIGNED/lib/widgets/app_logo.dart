import 'package:flutter/material.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// APP LOGO WIDGET
/// ═══════════════════════════════════════════════════════════════════════════

class AppLogo extends StatelessWidget {
  final double? size;
  final Color? textColor;
  final bool showSubtitle;
  
  const AppLogo({
    super.key,
    this.size,
    this.textColor,
    this.showSubtitle = true,
  });

  @override
  Widget build(BuildContext context) {
    final displaySize = size ?? 48.0;
    final color = textColor ?? Colors.white;
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo container with gradient background
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: displaySize * 0.4,
            vertical: displaySize * 0.25,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.deepPurple.shade700,
                Colors.deepPurple.shade500,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.deepPurple.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Main title
              Text(
                'RB HYPER',
                style: TextStyle(
                  fontSize: displaySize * 0.6,
                  fontWeight: FontWeight.w900,
                  color: color,
                  letterSpacing: 2,
                  height: 1.0,
                ),
              ),
              SizedBox(height: displaySize * 0.05),
              // Subtitle
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: displaySize * 0.2,
                  vertical: displaySize * 0.08,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'FLUTTER SDK',
                  style: TextStyle(
                    fontSize: displaySize * 0.35,
                    fontWeight: FontWeight.w700,
                    color: color,
                    letterSpacing: 3,
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Optional tagline
        if (showSubtitle) ...[
          SizedBox(height: displaySize * 0.25),
          Text(
            'Unified KYC Solution',
            style: TextStyle(
              fontSize: displaySize * 0.25,
              fontWeight: FontWeight.w500,
              color: color.withOpacity(0.8),
              letterSpacing: 1,
            ),
          ),
        ],
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════════════════════
/// APP LOGO ICON (Compact version for AppBar)
/// ═══════════════════════════════════════════════════════════════════════════

class AppLogoIcon extends StatelessWidget {
  final double height;
  final Color? textColor;
  
  const AppLogoIcon({
    super.key,
    this.height = 40,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = textColor ?? Colors.white;
    
    return Container(
      height: height,
      padding: EdgeInsets.symmetric(
        horizontal: height * 0.3,
        vertical: height * 0.15,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.deepPurple.shade600,
            Colors.deepPurple.shade400,
          ],
        ),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'RB',
            style: TextStyle(
              fontSize: height * 0.35,
              fontWeight: FontWeight.w900,
              color: color,
              letterSpacing: 1,
              height: 1.0,
            ),
          ),
          Text(
            'HYPER',
            style: TextStyle(
              fontSize: height * 0.25,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 1,
              height: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}
