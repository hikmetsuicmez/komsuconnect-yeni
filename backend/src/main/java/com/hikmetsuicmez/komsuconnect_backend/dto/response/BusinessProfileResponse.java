package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
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
    private BusinessCategory category;
    private String neighborhood;
    private String workingHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long productCount;
}
