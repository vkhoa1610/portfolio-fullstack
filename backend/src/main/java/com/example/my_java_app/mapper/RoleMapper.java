package com.example.my_java_app.mapper;

import com.example.my_java_app.entity.RoleEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RoleMapper {
    /**
     * Lấy danh sách roles của user thông qua bảng user_roles.
     * JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_sub = cognitoSub
     */
    List<RoleEntity> findRolesByUserSub(@Param("cognitoSub") String cognitoSub);
}
