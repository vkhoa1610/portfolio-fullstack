package com.example.my_java_app.mapper;

import com.example.my_java_app.dto.response.UserFunctionStatusDto;
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

    List<UserFunctionStatusDto> findAllFunctionsWithStateForUser(@Param("cognitoSub") String cognitoSub);
}
