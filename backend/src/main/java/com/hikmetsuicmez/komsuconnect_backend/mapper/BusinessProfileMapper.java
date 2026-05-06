package com.hikmetsuicmez.komsuconnect_backend.mapper;

import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BusinessProfileMapper {

    @Mapping(source = "user.id", target = "userId")
    BusinessProfileResponse toResponse(BusinessProfile businessProfile);

    List<BusinessProfileResponse> toResponseList(List<BusinessProfile> businessProfiles);
}
