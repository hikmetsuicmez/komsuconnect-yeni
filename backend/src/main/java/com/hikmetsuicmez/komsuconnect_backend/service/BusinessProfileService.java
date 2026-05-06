package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.BusinessProfileMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessProfileService {

    private final BusinessProfileRepository businessProfileRepository;
    private final UserRepository userRepository;
    private final BusinessProfileMapper businessProfileMapper;

    @Transactional(readOnly = true)
    public List<BusinessProfileResponse> getAllBusinesses() {
        return businessProfileMapper.toResponseList(businessProfileRepository.findAll());
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse getBusinessById(UUID id) {
        return businessProfileMapper.toResponse(findProfileOrThrow(id));
    }

    @Transactional
    public BusinessProfileResponse createBusinessProfile(CreateBusinessProfileRequest request, String email) {
        User user = findUserOrThrow(email);

        if (businessProfileRepository.existsByUserId(user.getId())) {
            throw new BusinessProfileAlreadyExistsException("A business profile already exists for this account");
        }

        BusinessProfile profile = BusinessProfile.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .build();

        businessProfileRepository.save(profile);
        log.info("Business profile created for user: {}", email);
        return businessProfileMapper.toResponse(profile);
    }

    @Transactional
    public BusinessProfileResponse updateBusinessProfile(UUID id, UpdateBusinessProfileRequest request, String email) {
        BusinessProfile profile = findProfileOrThrow(id);
        verifyOwner(profile, email);

        profile.setBusinessName(request.getBusinessName());
        profile.setDescription(request.getDescription());
        profile.setAddress(request.getAddress());
        profile.setCity(request.getCity());
        profile.setPhone(request.getPhone());

        return businessProfileMapper.toResponse(profile);
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse getMyBusinessProfile(String email) {
        User user = findUserOrThrow(email);
        BusinessProfile profile = businessProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessProfileNotFoundException("No business profile found for this account"));
        return businessProfileMapper.toResponse(profile);
    }

    private BusinessProfile findProfileOrThrow(UUID id) {
        return businessProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business not found: " + id));
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private void verifyOwner(BusinessProfile profile, String email) {
        if (!profile.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("You do not own this business profile");
        }
    }
}
