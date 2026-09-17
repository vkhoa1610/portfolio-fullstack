package com.example.my_java_app.service;

import com.example.my_java_app.dto.request.UserRequestDto;
import com.example.my_java_app.dto.response.UserResponseDto;
import com.example.my_java_app.entity.UserEntity;
import com.example.my_java_app.exception.ApiException;
import com.example.my_java_app.exception.NotFoundException;
import com.example.my_java_app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    // Lấy toàn bộ user
    @Transactional(readOnly = true)
    public List<UserResponseDto> getAll() {
        List<UserEntity> users = repository.findAll();

        if (users == null || users.isEmpty()) {
            throw new NotFoundException("No users found in database");
        }

        return users.stream()
                .map(u -> new UserResponseDto(u.getId(), u.getName(), u.getEmail()))
                .collect(Collectors.toList());
    }

    // Lấy user theo id
    @Transactional(readOnly = true)
    public UserResponseDto getById(String id) {
        if (id == null || id.isEmpty()) {
            throw new ApiException("User ID cannot be null or empty");
        }

        UserEntity user = repository.findById(id);
        if (user == null) {
            throw new NotFoundException("User not found with ID: " + id);
        }
        return new UserResponseDto(user.getId(), user.getName(), user.getEmail());
    }

    // Tạo user mới
    public void create(UserRequestDto dto) {
        if (dto.getName() == null || dto.getName().isEmpty()) {
            throw new ApiException("User name is required");
        }

        if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
            throw new ApiException("Email is required");
        }

        boolean exists = repository.findAll().stream()
        .anyMatch(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(dto.getEmail()));


        if (exists) {
            throw new ApiException("Email already exists: " + dto.getEmail());
        }

        UserEntity user = new UserEntity();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        repository.save(user);
    }

    // Tạo user mới
    public void update(String id, UserRequestDto dto) {
        if (id == null || id.isEmpty()) {
            throw new ApiException("User ID cannot be null or empty");
        }

        UserEntity user = repository.findById(id);
        if (user == null) {
            throw new NotFoundException("User not found, cannot update");
        }

        if (dto.getName() == null || dto.getName().isEmpty()) {
            throw new ApiException("User name is required");
        }

        if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
            throw new ApiException("Email is required");
        }
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        repository.save(user);
    }
}
