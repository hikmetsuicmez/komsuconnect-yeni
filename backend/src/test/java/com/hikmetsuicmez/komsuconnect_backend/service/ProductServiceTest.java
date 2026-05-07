package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import com.hikmetsuicmez.komsuconnect_backend.entity.Role;
import com.hikmetsuicmez.komsuconnect_backend.entity.User;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ProductNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private BusinessProfileRepository businessProfileRepository;
    @Mock private ProductMapper productMapper;

    @InjectMocks private ProductService productService;

    private User buildUser(String email) {
        return User.builder()
                .email(email)
                .password("encoded")
                .fullName("Owner")
                .role(Role.BUSINESS)
                .build();
    }

    private BusinessProfile buildProfile(UUID id, User user) {
        return BusinessProfile.builder()
                .id(id)
                .user(user)
                .businessName("Test Business")
                .build();
    }

    @Test
    void getProducts_withValidBusinessId_returnsProducts() {
        UUID businessId = UUID.randomUUID();
        BusinessProfile profile = buildProfile(businessId, buildUser("owner@example.com"));
        Product product = Product.builder()
                .id(UUID.randomUUID())
                .businessProfile(profile)
                .name("Ekmek")
                .price(BigDecimal.valueOf(5.0))
                .build();
        ProductResponse productResponse = ProductResponse.builder()
                .id(product.getId())
                .name("Ekmek")
                .price(BigDecimal.valueOf(5.0))
                .build();

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(profile));
        when(productRepository.findByBusinessProfileId(businessId)).thenReturn(List.of(product));
        when(productMapper.toResponseList(List.of(product))).thenReturn(List.of(productResponse));

        List<ProductResponse> result = productService.getProducts(businessId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Ekmek");
    }

    @Test
    void getProducts_withNonExistingBusiness_throwsNotFoundException() {
        UUID businessId = UUID.randomUUID();
        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProducts(businessId))
                .isInstanceOf(BusinessProfileNotFoundException.class);
    }

    @Test
    void addProduct_withValidRequest_returnsProduct() {
        UUID businessId = UUID.randomUUID();
        String ownerEmail = "owner@example.com";
        User user = buildUser(ownerEmail);
        BusinessProfile profile = buildProfile(businessId, user);

        CreateProductRequest request = new CreateProductRequest();
        request.setName("Süt");
        request.setPrice(BigDecimal.valueOf(15.0));
        request.setAvailable(true);

        ProductResponse expected = ProductResponse.builder()
                .name("Süt")
                .price(BigDecimal.valueOf(15.0))
                .build();

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(profile));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productMapper.toResponse(any(Product.class))).thenReturn(expected);

        ProductResponse result = productService.addProduct(businessId, request, ownerEmail);

        assertThat(result.getName()).isEqualTo("Süt");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void addProduct_withWrongOwner_throwsForbiddenException() {
        UUID businessId = UUID.randomUUID();
        User owner = buildUser("owner@example.com");
        BusinessProfile profile = buildProfile(businessId, owner);

        CreateProductRequest request = new CreateProductRequest();
        request.setName("Süt");
        request.setPrice(BigDecimal.valueOf(15.0));

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> productService.addProduct(businessId, request, "other@example.com"))
                .isInstanceOf(ForbiddenException.class);

        verify(productRepository, never()).save(any());
    }

    @Test
    void deleteProduct_withProductNotBelongingToBusiness_throwsNotFoundException() {
        UUID businessId = UUID.randomUUID();
        UUID otherBusinessId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        String ownerEmail = "owner@example.com";

        User user = buildUser(ownerEmail);
        BusinessProfile targetBusiness = buildProfile(businessId, user);
        BusinessProfile otherBusiness = buildProfile(otherBusinessId, buildUser("other@example.com"));

        Product product = Product.builder()
                .id(productId)
                .businessProfile(otherBusiness)
                .name("Yabancı Ürün")
                .price(BigDecimal.valueOf(10.0))
                .build();

        when(businessProfileRepository.findById(businessId)).thenReturn(Optional.of(targetBusiness));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.deleteProduct(businessId, productId, ownerEmail))
                .isInstanceOf(ProductNotFoundException.class);

        verify(productRepository, never()).delete(any());
    }
}
