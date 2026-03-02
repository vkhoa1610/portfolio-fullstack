package com.example.my_java_app.controller;

import com.example.my_java_app.service.FunctionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * GET /api/v1/users/me/functions
 * Returns the list of function IDs granted to the current authenticated user.
 * Used by the frontend to filter which UI elements to render.
 */
@RestController
@RequestMapping("/api/v1/users/me")
public class UserFunctionController extends BaseController {

    private final FunctionService functionService;

    public UserFunctionController(FunctionService functionService) {
        this.functionService = functionService;
    }

    @GetMapping("/functions")
    public ResponseEntity<List<Integer>> getMyFunctions(HttpServletRequest request) {
        String cognitoSub = (String) request.getAttribute("cognitoSub");
        List<Integer> functionIds = functionService.getFunctionIdsForUser(cognitoSub);
        return ok(functionIds);
    }
}
