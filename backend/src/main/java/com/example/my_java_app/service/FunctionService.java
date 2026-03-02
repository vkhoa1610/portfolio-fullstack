package com.example.my_java_app.service;

import com.example.my_java_app.exception.ApiException;
import com.example.my_java_app.exception.ForbiddenException;
import com.example.my_java_app.repository.FunctionRepository;
import com.example.my_java_app.repository.SystemAdminRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FunctionService {

    private final FunctionRepository functionRepository;
    private final SystemAdminRepository systemAdminRepository;

    public FunctionService(FunctionRepository functionRepository,
                           SystemAdminRepository systemAdminRepository) {
        this.functionRepository = functionRepository;
        this.systemAdminRepository = systemAdminRepository;
    }

    /** Returns all function IDs granted to the user (for UI rendering). */
    public List<Integer> getFunctionIdsForUser(String cognitoSub) {
        return functionRepository.findFunctionIdsByUserSub(cognitoSub);
    }

    /** Grant a function to a user. Only system admins may call this. */
    public void grantFunction(String adminSub, String targetSub, String functionKey) {
        requireAdmin(adminSub);
        Integer functionId = functionRepository.findFunctionIdByKey(functionKey);
        if (functionId == null) {
            throw new ApiException("Function not found: " + functionKey);
        }
        functionRepository.grantFunction(targetSub, functionId, adminSub);
    }

    /** Revoke a function from a user. Only system admins may call this. */
    public void revokeFunction(String adminSub, String targetSub, String functionKey) {
        requireAdmin(adminSub);
        Integer functionId = functionRepository.findFunctionIdByKey(functionKey);
        if (functionId == null) {
            throw new ApiException("Function not found: " + functionKey);
        }
        functionRepository.revokeFunction(targetSub, functionId);
    }

    private void requireAdmin(String cognitoSub) {
        if (systemAdminRepository.findBySub(cognitoSub).isEmpty()) {
            throw new ForbiddenException("Caller is not a system admin");
        }
    }
}
