package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileDetailResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.service.BusinessProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessProfileService businessProfileService;

    @GetMapping
    public ResponseEntity<List<BusinessProfileResponse>> getAllBusinesses(
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(businessProfileService.getAllBusinesses(city));
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(businessProfileService.getCities());
    }

    @GetMapping("/me")
    public ResponseEntity<BusinessProfileResponse> getMyBusinessProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(businessProfileService.getMyBusinessProfile(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessProfileDetailResponse> getBusinessById(@PathVariable UUID id) {
        return ResponseEntity.ok(businessProfileService.getBusinessById(id));
    }

    @PostMapping
    public ResponseEntity<BusinessProfileResponse> createBusinessProfile(
            @Valid @RequestBody CreateBusinessProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(businessProfileService.createBusinessProfile(request, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusinessProfileResponse> updateBusinessProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBusinessProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                businessProfileService.updateBusinessProfile(id, request, userDetails.getUsername()));
    }
}
