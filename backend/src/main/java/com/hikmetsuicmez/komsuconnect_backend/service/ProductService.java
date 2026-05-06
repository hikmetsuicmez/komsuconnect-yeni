package com.hikmetsuicmez.komsuconnect_backend.service;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.entity.BusinessProfile;
import com.hikmetsuicmez.komsuconnect_backend.entity.Product;
import com.hikmetsuicmez.komsuconnect_backend.exception.BusinessProfileNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ForbiddenException;
import com.hikmetsuicmez.komsuconnect_backend.exception.ProductNotFoundException;
import com.hikmetsuicmez.komsuconnect_backend.mapper.ProductMapper;
import com.hikmetsuicmez.komsuconnect_backend.repository.BusinessProfileRepository;
import com.hikmetsuicmez.komsuconnect_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public List<ProductResponse> getProducts(UUID businessId) {
        if (!businessProfileRepository.existsById(businessId)) {
            throw new BusinessProfileNotFoundException("Business profile not found");
        }
        return productMapper.toResponseList(productRepository.findByBusinessProfileId(businessId));
    }

    @Transactional
    public ProductResponse addProduct(UUID businessId, CreateProductRequest request, String email) {
        BusinessProfile profile = getProfileAndVerifyOwner(businessId, email);

        Product product = Product.builder()
                .businessProfile(profile)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .available(request.isAvailable())
                .build();

        productRepository.save(product);
        log.info("Product '{}' added to business {}", request.getName(), businessId);
        return productMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(UUID businessId, UUID productId, UpdateProductRequest request, String email) {
        getProfileAndVerifyOwner(businessId, email);

        Product product = findProductOrThrow(productId);
        verifyProductBelongsToBusiness(product, businessId);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setAvailable(request.getAvailable());

        return productMapper.toResponse(product);
    }

    @Transactional
    public void deleteProduct(UUID businessId, UUID productId, String email) {
        getProfileAndVerifyOwner(businessId, email);

        Product product = findProductOrThrow(productId);
        verifyProductBelongsToBusiness(product, businessId);

        productRepository.delete(product);
        log.info("Product {} deleted from business {}", productId, businessId);
    }

    private BusinessProfile getProfileAndVerifyOwner(UUID businessId, String email) {
        BusinessProfile profile = businessProfileRepository.findById(businessId)
                .orElseThrow(() -> new BusinessProfileNotFoundException("Business profile not found"));
        if (!profile.getUser().getEmail().equals(email)) {
            throw new ForbiddenException("You do not own this business profile");
        }
        return profile;
    }

    private Product findProductOrThrow(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found"));
    }

    private void verifyProductBelongsToBusiness(Product product, UUID businessId) {
        if (!product.getBusinessProfile().getId().equals(businessId)) {
            throw new ForbiddenException("Product does not belong to this business");
        }
    }
}
