package com.example.my_java_app.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public abstract class BaseController {

    protected <T> ResponseEntity<T> ok(T body) {
        return ResponseEntity.ok(body);
    }

    protected <T> ResponseEntity<T> created(T body) {
        return new ResponseEntity<>(body, HttpStatus.CREATED);
    }

    protected <T> ResponseEntity<T> badRequest(T body) {
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    protected <T> ResponseEntity<T> notFound(T body) {
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }
}

