package com.example.my_java_app.controller;

import com.example.my_java_app.dto.request.CreateSettlementRequestDto;
import com.example.my_java_app.dto.response.CreateSettlementResponseDto;
import com.example.my_java_app.service.SettlementService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SettlementController {

    private final SettlementService service;

    public SettlementController(SettlementService service) {
        this.service = service;
    }

    @PostMapping("/create-settlement")
    public CreateSettlementResponseDto createSettlement(@RequestBody CreateSettlementRequestDto dto) {
        return service.handleCreateSettlement(dto);
    }
}
