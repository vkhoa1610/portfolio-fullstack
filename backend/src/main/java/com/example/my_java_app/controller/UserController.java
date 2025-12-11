package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.UserRequestDto;
import com.example.my_java_app.dto.response.UserResponseDto;
import com.example.my_java_app.service.UserService;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ok(service.getAll());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable("userId") String userId) {
        UserResponseDto user = service.getById(userId);
        return ok(user);
    }

    @PostMapping
    public ResponseEntity<String> createUser(@Valid @RequestBody UserRequestDto request) {
        service.create(request);
        return created("User created successfully");
    }

    @PutMapping("/{userId}")
    public ResponseEntity<String> updateUser(@Valid @PathVariable("userId")  String userId, @RequestBody UserRequestDto request) {
        service.update(userId,request);
        return created("Update user successfully");
    }
}
