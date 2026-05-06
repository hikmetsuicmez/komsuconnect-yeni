package com.hikmetsuicmez.komsuconnect_backend.controller;

import com.hikmetsuicmez.komsuconnect_backend.dto.request.CreateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.request.UpdateProductRequest;
import com.hikmetsuicmez.komsuconnect_backend.dto.response.ProductResponse;
import com.hikmetsuicmez.komsuconnect_backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProducts(@PathVariable UUID businessId) {
        return ResponseEntity.ok(productService.getProducts(businessId));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> addProduct(
            @PathVariable UUID businessId,
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.addProduct(businessId, request, userDetails.getUsername()));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                productService.updateProduct(businessId, productId, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @AuthenticationPrincipal UserDetails userDetails) {
        productService.deleteProduct(businessId, productId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
