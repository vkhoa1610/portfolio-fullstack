package com.example.my_java_app.repository;

import com.example.my_java_app.entity.ScreenConfigEntity;
import com.example.my_java_app.mapper.ScreenConfigMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class ScreenConfigRepository {

    private final ScreenConfigMapper screenConfigMapper;

    public ScreenConfigRepository(ScreenConfigMapper screenConfigMapper) {
        this.screenConfigMapper = screenConfigMapper;
    }

    public Optional<ScreenConfigEntity> findActive(String screenKey) {
        return Optional.ofNullable(screenConfigMapper.findActiveByScreenKey(screenKey));
    }

    public int getNextVersion(String screenKey) {
        Integer max = screenConfigMapper.findMaxVersionByScreenKey(screenKey);
        return (max == null ? 0 : max) + 1;
    }

    public void saveNewVersion(ScreenConfigEntity entity) {
        screenConfigMapper.insertVersion(entity);
        screenConfigMapper.deactivatePreviousVersions(entity.getScreenKey(), entity.getVersion());
    }
}
