package com.example.exlog.logging;

import com.example.exlog.crypto.EncryptedPayload;
import com.example.exlog.crypto.LogCryptoService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    private final LogCryptoService crypto;
    private final ObjectMapper mapper;

    public LogController(LogCryptoService crypto, ObjectMapper mapper) {
        this.crypto = crypto;
        this.mapper = mapper;
    }

    /** Structured logs as JSON, newest first. */
    @GetMapping
    public List<Map<String, Object>> logs(@RequestParam(defaultValue = "TRACE") String level,
                                          @RequestParam(defaultValue = "100") int limit) {
        return LogStore.query(level, clamp(limit));
    }

    /** The same logs, serialised to JSON and encrypted with AES-256-GCM. */
    @GetMapping("/encrypted")
    public EncryptedPayload encrypted(@RequestParam(defaultValue = "TRACE") String level,
                                      @RequestParam(defaultValue = "100") int limit) throws JsonProcessingException {
        String json = mapper.writeValueAsString(LogStore.query(level, clamp(limit)));
        return crypto.encrypt(json);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear() {
        LogStore.clear();
    }

    private static int clamp(int limit) {
        return Math.max(1, Math.min(limit, 500));
    }
}
