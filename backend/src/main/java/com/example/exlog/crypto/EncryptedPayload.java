package com.example.exlog.crypto;

/** Everything a client needs (besides the passphrase) to derive the key and decrypt. Binary values are Base64. */
public record EncryptedPayload(
        String algorithm,
        String kdf,
        int iterations,
        String salt,
        String iv,
        String ciphertext) {}
