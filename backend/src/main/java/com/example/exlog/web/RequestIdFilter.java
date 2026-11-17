package com.example.exlog.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/** Adds a request id to MDC (so every log line carries it) and logs one line per request. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String MDC_KEY = "requestId";
    public static final String HEADER = "X-Request-Id";

    private static final Logger log = LoggerFactory.getLogger(RequestIdFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String id = req.getHeader(HEADER);
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString().substring(0, 8);
        }
        MDC.put(MDC_KEY, id);
        MDC.put("method", req.getMethod());
        MDC.put("path", req.getRequestURI());
        res.setHeader(HEADER, id);

        long start = System.currentTimeMillis();
        try {
            chain.doFilter(req, res);
        } finally {
            // Don't flood the log with the log viewer's own polling
            if (!req.getRequestURI().startsWith("/api/logs")) {
                MDC.put("status", String.valueOf(res.getStatus()));
                MDC.put("durationMs", String.valueOf(System.currentTimeMillis() - start));
                log.info("{} {} completed with {}", req.getMethod(), req.getRequestURI(), res.getStatus());
            }
            MDC.clear();
        }
    }
}
