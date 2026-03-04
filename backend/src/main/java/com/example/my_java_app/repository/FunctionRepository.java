package com.example.my_java_app.repository;

import com.example.my_java_app.dto.response.UserFunctionStatusDto;
import com.example.my_java_app.mapper.FunctionMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class FunctionRepository {

    private final FunctionMapper functionMapper;

    public FunctionRepository(FunctionMapper functionMapper) {
        this.functionMapper = functionMapper;
    }

    public List<Integer> findFunctionIdsByUserSub(String cognitoSub) {
        return functionMapper.findFunctionIdsByUserSub(cognitoSub);
    }

    public Integer findFunctionIdByKey(String functionKey) {
        return functionMapper.findFunctionIdByKey(functionKey);
    }

    public void grantFunction(String cognitoSub, int functionId, String grantedBy) {
        functionMapper.grantFunction(cognitoSub, functionId, grantedBy);
    }

    public void revokeFunction(String cognitoSub, int functionId) {
        functionMapper.revokeFunction(cognitoSub, functionId);
    }

    public List<UserFunctionStatusDto> findAllWithStateForUser(String cognitoSub) {
        return functionMapper.findAllFunctionsWithStateForUser(cognitoSub);
    }
}
