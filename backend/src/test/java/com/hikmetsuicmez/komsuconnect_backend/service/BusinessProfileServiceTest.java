package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateBusinessProfileRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileDetailResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.BusinessProfileResponse;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessCategory;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.Role;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileAlreadyExistsException;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.BusinessProfileMapper;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessProfileServiceTest {

    @Mock private BusinessProfileRepository businessProfileRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusinessProfileMapper businessProfileMapper;
    @Mock private ProductRepository productRepository;
    @Mock private ProductMapper productMapper;

    @InjectMocks private BusinessProfileService businessProfileService;

    private User buildUser(String email) {
        return User.builder()
                .email(email)
                .password("encoded")
                .fullName("Test User")
                .role(Role.BUSINESS)
                .build();
    }

    private BusinessProfile buildProfile(UUID id, User user) {
        return BusinessProfile.builder()
                .id(id)
                .user(user)
                .businessName("Test Business")
                .city("Istanbul")
                .build();
    }

    @Test
    void getAllBusinesses_withNoCity_returnsAllWithProductCount() {
        UUID profileId = UUID.randomUUID();
        User user = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, user);
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(profileId);

        when(businessProfileRepository.findAllFiltered(null, null)).thenReturn(List.of(profile));
        when(businessProfileMapper.toResponse(profile)).thenReturn(response);
        List<Object[]> productCounts = new java.util.ArrayList<>();
        productCounts.add(new Object[]{profileId, 3L});
        when(productRepository.findProductCountsByBusinessProfile()).thenReturn(productCounts);

        List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProductCount()).isEqualTo(3L);
        verify(businessProfileRepository).findAllFiltered(null, null);
    }

    @Test
    void getAllBusinesses_withCity_returnsFilteredBusinesses() {
        UUID profileId = UUID.randomUUID();
        User user = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, user);
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(profileId);

        when(businessProfileRepository.findAllFiltered("Istanbul", null)).thenReturn(List.of(profile));
        when(businessProfileMapper.toResponse(profile)).thenReturn(response);
        when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

        List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses("Istanbul", null);

        assertThat(result).hasSize(1);
        verify(businessProfileRepository).findAllFiltered("Istanbul", null);
    }

    @Test
    void getAllBusinesses_withCategory_returnsFilteredByCategory() {
        UUID profileId = UUID.randomUUID();
        User user = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, user);
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(profileId);

        when(businessProfileRepository.findAllFiltered(null, BusinessCategory.BAKERY)).thenReturn(List.of(profile));
        when(businessProfileMapper.toResponse(profile)).thenReturn(response);
        when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

        List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses(null, BusinessCategory.BAKERY);

        assertThat(result).hasSize(1);
        verify(businessProfileRepository).findAllFiltered(null, BusinessCategory.BAKERY);
    }

    @Test
    void getAllBusinesses_withCityAndCategory_returnsFiltered() {
        UUID profileId = UUID.randomUUID();
        User user = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, user);
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(profileId);

        when(businessProfileRepository.findAllFiltered("Istanbul", BusinessCategory.CAFE)).thenReturn(List.of(profile));
        when(businessProfileMapper.toResponse(profile)).thenReturn(response);
        when(productRepository.findProductCountsByBusinessProfile()).thenReturn(List.of());

        List<BusinessProfileResponse> result = businessProfileService.getAllBusinesses("Istanbul", BusinessCategory.CAFE);

        assertThat(result).hasSize(1);
        verify(businessProfileRepository).findAllFiltered("Istanbul", BusinessCategory.CAFE);
    }

    @Test
    void getBusinessById_withExistingId_returnsDetailResponse() {
        UUID profileId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("owner@example.com")
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();
        BusinessProfile profile = buildProfile(profileId, user);

        ProductResponse productResponse = ProductResponse.builder()
                .id(UUID.randomUUID())
                .name("Test Product")
                .price(BigDecimal.valueOf(10.0))
                .build();

        when(businessProfileRepository.findByIdWithUser(profileId)).thenReturn(Optional.of(profile));
        when(productRepository.findByBusinessProfileId(profileId)).thenReturn(List.of());
        when(productMapper.toResponseList(List.of())).thenReturn(List.of(productResponse));

        BusinessProfileDetailResponse result = businessProfileService.getBusinessById(profileId);

        assertThat(result.getId()).isEqualTo(profileId);
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getBusinessName()).isEqualTo("Test Business");
        assertThat(result.getProducts()).hasSize(1);
        assertThat(result.getProductCount()).isEqualTo(1L);
    }

    @Test
    void getBusinessById_withNonExistingId_throwsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(businessProfileRepository.findByIdWithUser(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> businessProfileService.getBusinessById(id))
                .isInstanceOf(BusinessProfileNotFoundException.class);
    }

    @Test
    void createBusinessProfile_withValidRequest_returnsCreatedProfile() {
        String email = "owner@example.com";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();

        CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
        request.setBusinessName("My Shop");
        request.setCity("Ankara");
        request.setPhone("0500000000");

        BusinessProfileResponse expected = new BusinessProfileResponse();
        expected.setBusinessName("My Shop");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(false);
        when(businessProfileRepository.save(any(BusinessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(businessProfileMapper.toResponse(any(BusinessProfile.class))).thenReturn(expected);

        BusinessProfileResponse result = businessProfileService.createBusinessProfile(request, email);

        assertThat(result.getBusinessName()).isEqualTo("My Shop");
        verify(businessProfileRepository).save(any(BusinessProfile.class));
    }

    @Test
    void createBusinessProfile_withDuplicateProfile_throwsAlreadyExistsException() {
        String email = "owner@example.com";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(true);

        CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
        request.setBusinessName("My Shop");

        assertThatThrownBy(() -> businessProfileService.createBusinessProfile(request, email))
                .isInstanceOf(BusinessProfileAlreadyExistsException.class);

        verify(businessProfileRepository, never()).save(any());
    }

    @Test
    void updateBusinessProfile_withWrongOwner_throwsForbiddenException() {
        UUID profileId = UUID.randomUUID();
        User owner = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(profileId, owner);

        when(businessProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        UpdateBusinessProfileRequest request = new UpdateBusinessProfileRequest();
        request.setBusinessName("Updated");

        assertThatThrownBy(() -> businessProfileService.updateBusinessProfile(profileId, request, "other@example.com"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getCities_returnsDistinctCities() {
        when(businessProfileRepository.findDistinctCities())
                .thenReturn(List.of("Ankara", "Istanbul", "Izmir"));

        List<String> cities = businessProfileService.getCities();

        assertThat(cities).containsExactly("Ankara", "Istanbul", "Izmir");
    }

    @Test
    void createBusinessProfile_withNullCategory_defaultsToOther() {
        String email = "owner@example.com";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();

        CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
        request.setBusinessName("My Shop");
        request.setPhone("0500000000");
        // category intentionally left null

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(false);
        when(businessProfileRepository.save(any(BusinessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(businessProfileMapper.toResponse(any(BusinessProfile.class))).thenReturn(new BusinessProfileResponse());

        businessProfileService.createBusinessProfile(request, email);

        verify(businessProfileRepository).save(argThat(p -> p.getCategory() == BusinessCategory.OTHER));
    }

    @Test
    void createBusinessProfile_withExplicitCategory_setsCategory() {
        String email = "owner@example.com";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();

        CreateBusinessProfileRequest request = new CreateBusinessProfileRequest();
        request.setBusinessName("My Bakery");
        request.setPhone("0500000000");
        request.setCategory(BusinessCategory.BAKERY);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(businessProfileRepository.existsByUserId(user.getId())).thenReturn(false);
        when(businessProfileRepository.save(any(BusinessProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(businessProfileMapper.toResponse(any(BusinessProfile.class))).thenReturn(new BusinessProfileResponse());

        businessProfileService.createBusinessProfile(request, email);

        verify(businessProfileRepository).save(argThat(p -> p.getCategory() == BusinessCategory.BAKERY));
    }
}
