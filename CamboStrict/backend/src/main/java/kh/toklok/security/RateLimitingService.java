package kh.toklok.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String key, int capacity, int refillPerMinute) {
        Bucket bucket = buckets.computeIfAbsent(key, k ->
            Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, Refill.greedy(refillPerMinute, Duration.ofMinutes(1))))
                .build()
        );
        return bucket.tryConsume(1);
    }

    public boolean tryConsume(String key) {
        return tryConsume(key, 60, 60);
    }

    public void resetBucket(String key) {
        buckets.remove(key);
    }
}
