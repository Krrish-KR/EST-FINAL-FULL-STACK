package com.example.exlog.logging;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/** Thread-safe, size-capped ring buffer of structured log events. */
public final class LogStore {

    private static final int MAX = 500;
    private static final ConcurrentLinkedDeque<Map<String, Object>> EVENTS = new ConcurrentLinkedDeque<>();
    private static final AtomicLong SEQ = new AtomicLong();

    private LogStore() {}

    public static void add(Map<String, Object> event) {
        event.put("id", SEQ.incrementAndGet());
        EVENTS.addLast(event);
        while (EVENTS.size() > MAX) {
            EVENTS.pollFirst();
        }
    }

    /** Newest first, optional minimum level filter, capped by limit. */
    public static List<Map<String, Object>> query(String level, int limit) {
        int min = rank(level);
        List<Map<String, Object>> out = new ArrayList<>();
        var it = EVENTS.descendingIterator();
        while (it.hasNext() && out.size() < limit) {
            Map<String, Object> e = it.next();
            if (rank(String.valueOf(e.get("level"))) >= min) {
                out.add(e);
            }
        }
        return out;
    }

    public static void clear() {
        EVENTS.clear();
    }

    private static int rank(String level) {
        if (level == null) return 0;
        return switch (level.toUpperCase()) {
            case "DEBUG" -> 1;
            case "INFO" -> 2;
            case "WARN" -> 3;
            case "ERROR" -> 4;
            default -> 0;
        };
    }
}
