package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.ScreenConfigEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ScreenConfigMapper {

    ScreenConfigEntity findActiveByScreenKey(@Param("screenKey") String screenKey);

    Integer findMaxVersionByScreenKey(@Param("screenKey") String screenKey);

    void insertVersion(ScreenConfigEntity entity);

    void deactivatePreviousVersions(@Param("screenKey") String screenKey,
                                    @Param("currentVersion") int currentVersion);
}
