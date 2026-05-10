package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBusinessProfileRequest {

    @NotBlank
    private String businessName;

    private String description;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(min = 7, max = 20)
    private String phone;

    private BusinessCategory category;

    @Size(max = 100)
    private String neighborhood;

    @Size(max = 100)
    private String workingHours;
}
