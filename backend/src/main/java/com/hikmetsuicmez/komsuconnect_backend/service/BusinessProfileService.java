package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileDetailResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.exception.UserNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.BusinessProfileMapper;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessProfileService {

    private final BusinessProfileRepository businessProfileRepository;
    private final UserRepository userRepository;
    private final BusinessProfileMapper businessProfileMapper;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public List<BusinessProfileResponse> getAllBusinesses(String city, BusinessCategory category) {
        List<BusinessProfile> profiles = businessProfileRepository.findAllFiltered(city, category);
        Map<UUID, Long> countMap = buildProductCountMap();

        return profiles.stream()
                .map(bp -> {
                    BusinessProfileResponse response = businessProfileMapper.toResponse(bp);
                    response.setProductCount(countMap.getOrDefault(bp.getId(), 0L));
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BusinessProfileDetailResponse getBusinessById(UUID id) {
        BusinessProfile profile = businessProfileRepository.findByIdWithUser(id)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business profile not found"));
        List<ProductResponse> products = productMapper.toResponseList(
                productRepository.findByBusinessProfileId(id));

        return BusinessProfileDetailResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .businessName(profile.getBusinessName())
                .description(profile.getDescription())
                .address(profile.getAddress())
                .city(profile.getCity())
                .phone(profile.getPhone())
                .category(profile.getCategory())
                .neighborhood(profile.getNeighborhood())
                .workingHours(profile.getWorkingHours())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .productCount(products.size())
                .products(products)
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> getCities() {
        return businessProfileRepository.findDistinctCities();
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
                .category(request.getCategory() != null ? request.getCategory() : BusinessCategory.OTHER)
                .neighborhood(request.getNeighborhood())
                .workingHours(request.getWorkingHours())
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
        profile.setCategory(request.getCategory() != null ? request.getCategory() : profile.getCategory());
        profile.setNeighborhood(request.getNeighborhood());
        profile.setWorkingHours(request.getWorkingHours());

        return businessProfileMapper.toResponse(profile);
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse getMyBusinessProfile(String email) {
        User user = findUserOrThrow(email);
        BusinessProfile profile = businessProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessProfileNotFoundException("No business profile found for this account"));
        BusinessProfileResponse response = businessProfileMapper.toResponse(profile);
        response.setProductCount(productRepository.countByBusinessProfileId(profile.getId()));
        return response;
    }

    private Map<UUID, Long> buildProductCountMap() {
        return productRepository.findProductCountsByBusinessProfile().stream()
                .collect(Collectors.toMap(
                        row -> UUID.fromString(row[0].toString()),
                        row -> ((Number) row[1]).longValue()
                ));
    }

    private BusinessProfile findProfileOrThrow(UUID id) {
        return businessProfileRepository.findById(id)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business profile not found"));
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    private void verifyOwner(BusinessProfile profile, String email) {
        if (!profile.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("You do not own this business profile");
        }
    }
}
