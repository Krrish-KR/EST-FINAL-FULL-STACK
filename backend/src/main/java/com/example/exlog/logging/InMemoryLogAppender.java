package com.example.exlog.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.AppenderBase;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** Logback appender that turns each event into a JSON-friendly map and stores it in {@link LogStore}. */
public class InMemoryLogAppender extends AppenderBase<ILoggingEvent> {

    private static final int MAX_STACK_CHARS = 4000;

    @Override
    protected void append(ILoggingEvent event) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("timestamp", Instant.ofEpochMilli(event.getTimeStamp()).toString());
        m.put("level", event.getLevel().toString());
        m.put("logger", event.getLoggerName());
        m.put("thread", event.getThreadName());
        m.put("message", event.getFormattedMessage());

        Map<String, String> mdc = event.getMDCPropertyMap();
        if (mdc != null && !mdc.isEmpty()) {
            m.put("mdc", new LinkedHashMap<>(mdc));
        }
        if (event.getThrowableProxy() != null) {
            String stack = ThrowableProxyUtil.asString(event.getThrowableProxy());
            if (stack.length() > MAX_STACK_CHARS) {
                stack = stack.substring(0, MAX_STACK_CHARS) + "\n... (truncated)";
            }
            m.put("stackTrace", stack);
        }
        LogStore.add(m);
    }
}
