package com.example.my_java_app.exception;

public class ApiException extends RuntimeException {
    public ApiException(String message) {
        super(message);
    }
}
