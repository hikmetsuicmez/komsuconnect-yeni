package com.hikmetsuicmez.komsuconnect_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MeResponse {
    private String email;
    private String fullName;
    private String role;
}
