package kh.toklok.util;

import java.util.regex.Pattern;

public class InputSanitizer {

    private static final Pattern SCRIPT_TAG = Pattern.compile("<script[^>]*>[^<]*</script>", Pattern.CASE_INSENSITIVE);
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern JAVASCRIPT_PROTOCOL = Pattern.compile("javascript:\\s*", Pattern.CASE_INSENSITIVE);
    private static final Pattern ON_EVENT = Pattern.compile("\\s+on\\w+\\s*=\\s*\"[^\"]*\"", Pattern.CASE_INSENSITIVE);

    public static String sanitize(String input) {
        if (input == null) return null;
        String s = input;
        s = SCRIPT_TAG.matcher(s).replaceAll("");
        s = HTML_TAG.matcher(s).replaceAll("");
        s = JAVASCRIPT_PROTOCOL.matcher(s).replaceAll("");
        s = ON_EVENT.matcher(s).replaceAll("");
        return s.trim();
    }
}
