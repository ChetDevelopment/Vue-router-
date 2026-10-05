package kh.toklok.dto;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

public class DtoUtils {

    public static boolean toBool(Object val) {
        if (val instanceof Boolean) return (Boolean) val;
        if (val instanceof Number) return ((Number) val).intValue() != 0;
        if (val instanceof String) return "true".equalsIgnoreCase((String) val) || "1".equals(val);
        return false;
    }

    public static int toInt(Object val) {
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (NumberFormatException e) { return 0; }
        }
        return 0;
    }

    public static String formatTimestamp(Object val) {
        if (val instanceof Timestamp) {
            return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format((Timestamp) val);
        }
        if (val instanceof String) return (String) val;
        return val != null ? val.toString() : null;
    }

    public static List<String> parseMediaUrls(Object val) {
        List<String> result = new ArrayList<>();
        if (val instanceof String) {
            String s = (String) val;
            if (s.startsWith("[") && s.endsWith("]")) {
                s = s.substring(1, s.length() - 1);
                for (String part : s.split(",")) {
                    String trimmed = part.trim();
                    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
                        trimmed = trimmed.substring(1, trimmed.length() - 1);
                    }
                    if (!trimmed.isEmpty()) result.add(trimmed);
                }
            } else {
                result.add(s);
            }
        }
        return result;
    }
}
