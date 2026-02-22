import javax.net.ssl.*
import java.security.cert.X509Certificate
import java.security.SecureRandom

// Disable SSL verification (ONLY for development with Zscaler issues)
println("⚠️  WARNING: Disabling SSL verification for Gradle dependencies")

try {
    val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
        override fun getAcceptedIssuers(): Array<X509Certificate>? = null
        override fun checkClientTrusted(certs: Array<X509Certificate>, authType: String) {}
        override fun checkServerTrusted(certs: Array<X509Certificate>, authType: String) {}
    })

    val sslContext = SSLContext.getInstance("TLS")
    sslContext.init(null, trustAllCerts, SecureRandom())
    HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)
    HttpsURLConnection.setDefaultHostnameVerifier { _, _ -> true }
    
    println("✅ SSL verification disabled successfully")
} catch (e: Exception) {
    println("❌ Failed to disable SSL: ${e.message}")
}
