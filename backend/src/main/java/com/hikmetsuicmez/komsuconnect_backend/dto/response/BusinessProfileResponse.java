package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessProfileResponse {
    private UUID id;
    private UUID userId;
    private String businessName;
    private String description;
    private String address;
    private String city;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long productCount;
}
