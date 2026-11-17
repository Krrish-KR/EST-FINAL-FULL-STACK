package com.example.exlog.web;

import com.example.exlog.exception.BusinessException;
import com.example.exlog.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoints whose only job is to fail in different ways, so the global handler
 * and the structured logs can be exercised from the UI.
 */
@RestController
@RequestMapping("/api/test")
public class ErrorTestController {

    private static final Logger log = LoggerFactory.getLogger(ErrorTestController.class);

    @GetMapping("/ok")
    public Map<String, String> ok() {
        log.info("Health check endpoint called");
        log.debug("Debug message from the ok endpoint");
        return Map.of("status", "ok");
    }

    @GetMapping("/errors/{type}")
    public Map<String, String> trigger(@PathVariable String type) {
        log.debug("Triggering error type '{}'", type);
        switch (type) {
            case "not-found" -> throw new ResourceNotFoundException("User", 42);
            case "business" -> throw new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_FUNDS",
                    "Account balance is too low for this transfer");
            case "unauthorized" -> throw new BusinessException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED",
                    "Authentication is required");
            case "forbidden" -> throw new BusinessException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You do not have access to this resource");
            case "conflict" -> throw new BusinessException(HttpStatus.CONFLICT, "DUPLICATE_EMAIL",
                    "A user with this email already exists");
            case "timeout" -> throw new BusinessException(HttpStatus.GATEWAY_TIMEOUT, "UPSTREAM_TIMEOUT",
                    "Payment provider did not respond in time");
            case "illegal-argument" -> throw new IllegalArgumentException("Page size must be between 1 and 100");
            case "null-pointer" -> {
                String value = null;
                return Map.of("length", String.valueOf(value.length()));
            }
            case "arithmetic" -> {
                int zero = 0;
                return Map.of("result", String.valueOf(10 / zero));
            }
            case "array-index" -> {
                int[] items = new int[3];
                return Map.of("item", String.valueOf(items[5]));
            }
            case "class-cast" -> {
                Object o = "text";
                return Map.of("number", String.valueOf((Integer) o));
            }
            case "number-format" -> {
                return Map.of("number", String.valueOf(Integer.parseInt("not-a-number")));
            }
            case "unsupported" -> throw new UnsupportedOperationException("This operation is not implemented");
            case "nested" -> {
                try {
                    Integer.parseInt("x");
                } catch (NumberFormatException e) {
                    throw new IllegalStateException("Failed to load configuration",
                            new RuntimeException("Root cause: invalid port value", e));
                }
            }
            case "runtime" -> throw new RuntimeException("Something unexpected went wrong");
            default -> throw new ResourceNotFoundException("ErrorType", type);
        }
        return Map.of("status", "no error");
    }

    @PostMapping("/validate")
    public Map<String, String> validate(@Valid @RequestBody UserRequest request) {
        log.info("User {} created", request.email());
        return Map.of("status", "created", "email", request.email());
    }

    @GetMapping("/number/{n}")
    public Map<String, Integer> number(@PathVariable int n) {
        return Map.of("number", n);
    }
}
