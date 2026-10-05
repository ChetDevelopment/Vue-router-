package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class BaseRepository {
    protected final JdbcTemplate db;

    public BaseRepository(JdbcTemplate db) {
        this.db = db;
    }

    public List<Map<String, Object>> query(String sql, Object... args) {
        return db.queryForList(sql, args);
    }

    public Map<String, Object> queryOne(String sql, Object... args) {
        var rows = db.queryForList(sql, args);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public int update(String sql, Object... args) {
        return db.update(sql, args);
    }

    public <T> T queryObject(String sql, Class<T> type, Object... args) {
        return db.queryForObject(sql, type, args);
    }
}
