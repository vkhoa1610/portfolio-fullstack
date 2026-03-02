package com.example.my_java_app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FunctionMapper {

    List<Integer> findFunctionIdsByUserSub(@Param("cognitoSub") String cognitoSub);

    Integer findFunctionIdByKey(@Param("functionKey") String functionKey);

    void grantFunction(@Param("cognitoSub") String cognitoSub,
                       @Param("functionId") int functionId,
                       @Param("grantedBy") String grantedBy);

    void revokeFunction(@Param("cognitoSub") String cognitoSub,
                        @Param("functionId") int functionId);
}
