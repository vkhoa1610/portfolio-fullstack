package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.SystemAdminEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SystemAdminMapper {

    SystemAdminEntity findBySub(@Param("cognitoSub") String cognitoSub);
}
