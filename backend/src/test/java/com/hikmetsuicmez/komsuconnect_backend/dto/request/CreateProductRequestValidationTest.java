package com.hikmetsuicmez.komsuconnect_backend.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CreateProductRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void imageUrl_withInvalidFormat_failsValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl("not-a-valid-url");

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }

    @Test
    void imageUrl_withValidHttpsUrl_passesValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl("https://example.com/image.png");

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }

    @Test
    void imageUrl_withNull_passesValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl(null);

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }

    @Test
    void imageUrl_withPrefixOnlyUrl_failsValidation() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Test Ürün");
        request.setPrice(BigDecimal.valueOf(10.0));
        request.setImageUrl("https://");

        Set<ConstraintViolation<CreateProductRequest>> violations = validator.validate(request);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("imageUrl"));
    }
}
