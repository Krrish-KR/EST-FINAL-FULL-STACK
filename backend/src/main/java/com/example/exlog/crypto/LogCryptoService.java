package com.example.exlog.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption with a key derived from a passphrase via PBKDF2-HMAC-SHA256.
 * A fresh random salt and IV are generated for every response.
 * Ciphertext = encrypted bytes || 16-byte GCM tag, which is the layout the browser's Web Crypto API expects.
 */
@Service
public class LogCryptoService {

    private static final int KEY_BITS = 256;
    private static final int IV_BYTES = 12;
    private static final int SALT_BYTES = 16;
    private static final int TAG_BITS = 128;

    private final SecureRandom random = new SecureRandom();
    private final String secret;
    private final int iterations;

    public LogCryptoService(@Value("${app.logs.secret}") String secret,
                            @Value("${app.logs.pbkdf2-iterations}") int iterations) {
        this.secret = secret;
        this.iterations = iterations;
    }

    public EncryptedPayload encrypt(String plaintext) {
        try {
            byte[] salt = new byte[SALT_BYTES];
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(salt);
            random.nextBytes(iv);

            SecretKey key = deriveKey(secret, salt, iterations);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            Base64.Encoder b64 = Base64.getEncoder();
            return new EncryptedPayload("AES-256-GCM", "PBKDF2-HMAC-SHA256", iterations,
                    b64.encodeToString(salt), b64.encodeToString(iv), b64.encodeToString(encrypted));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Log encryption failed", e);
        }
    }

    private static SecretKey deriveKey(String passphrase, byte[] salt, int iterations) throws GeneralSecurityException {
        SecretKeyFactory f = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] keyBytes = f.generateSecret(new PBEKeySpec(passphrase.toCharArray(), salt, iterations, KEY_BITS)).getEncoded();
        return new SecretKeySpec(keyBytes, "AES");
    }
}
